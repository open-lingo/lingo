import Foundation
import Capacitor
import Speech
import AVFoundation

/**
 Native speech recognition for the speaking step, via `SFSpeechRecognizer`.

 WHY THIS IS APP CODE RATHER THAN A DEPENDENCY — `@capacitor-community/speech-recognition`
 ships a podspec but no `Package.swift`, and this project is SPM (`CapApp-SPM`,
 no Podfile). Rather than migrate the whole app to CocoaPods for one plugin, the
 surface we actually need is small enough to own: availability, permissions,
 start/stop, and a stream of partial results.

 The partial-result stream is the point. The web recognizer only reports a
 transcript when it decides the utterance ended, so the mic stays open for a
 beat after the learner has already said the word. Emitting `partialResults`
 lets the JS side score mid-utterance and stop immediately on a match.

 Recognition is attempted ON DEVICE first — offline, private, and free of the
 ~1 minute per-request cap on server recognition — and drops to the server path
 when the local model turns out not to be usable. That fallback is not
 belt-and-braces: `supportsOnDeviceRecognition` reports whether iOS KNOWS a
 model for the locale, not whether it is downloaded, so it can be true while the
 recognizer cannot initialize at all.

 Two behaviours here are ours rather than the framework's, and both were bugs
 before they were features:

  - **Endpointing.** A buffer-backed request never ends itself, so silence has
    to be measured and `endAudio()` called, or the mic stays open and the next
    thing said in the room joins the same utterance.
  - **A per-attempt `AVAudioEngine`.** The engine caches its input format on
    first `inputNode` access, so it must not exist before the record session is
    active.
 */
@objc(SpeechRecognizerPlugin)
public class SpeechRecognizerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SpeechRecognizerPlugin"
    public let jsName = "SpeechRecognizer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private var recognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?

    /// Built fresh for every attempt, and only ONCE THE RECORD SESSION IS ACTIVE.
    ///
    /// `AVAudioEngine` binds `inputNode`'s format the first time that property
    /// is touched and never re-reads it. Touch it while the session is still
    /// `.playback` (or inactive) and the node caches `0 Hz / 2ch` — for the
    /// whole lifetime of the engine. Activating `.playAndRecord` afterwards
    /// does NOT refresh it: the session then reports a live 48 kHz built-in
    /// mic on the input route while the engine still says zero, which reads as
    /// "the microphone is broken" when nothing is wrong with the microphone.
    ///
    /// A long-lived `let audioEngine = AVAudioEngine()` makes that mistake
    /// almost inevitable, because ANY incidental access — a `removeTap` in a
    /// teardown path, a diagnostic log line — is enough to freeze the format,
    /// and it happens once at launch and then persists invisibly. Creating the
    /// engine per attempt makes the ordering impossible to get wrong, and it
    /// also fixes the device-side staleness: a Bluetooth route flip between
    /// two attempts can't leave us holding a format the hardware no longer uses.
    private var audioEngine: AVAudioEngine?

    // MARK: Endpointing

    /// `SFSpeechAudioBufferRecognitionRequest` NEVER ends itself.
    ///
    /// Unlike the one-shot `SFSpeechURLRecognitionRequest`, a buffer request
    /// keeps the task alive until `endAudio()` is called or the server's
    /// ~1-minute cap expires. Nothing about silence stops it. So a learner who
    /// gets the word wrong sits with the mic open indefinitely, and whatever
    /// they say next — or whatever the room says next — is appended to the SAME
    /// transcript. That is how "사과" (wrong) plus a later "거기" became the
    /// single utterance "사과 거기" and scored Perfect.
    ///
    /// Duolingo-style endpointing is therefore ours to implement: finish the
    /// utterance once the transcript stops CHANGING, not once results stop
    /// arriving — the recognizer re-emits an identical partial several times
    /// after speech ends, so "any result" would hold the timer open.
    private var pollTimer: Timer?
    private var startedAt = Date()
    private var lastChangeAt = Date()
    private var lastTranscript = ""
    private var sawSpeech = false
    /// One `stopped` per attempt. Two paths legitimately finish a session —
    /// the UI calling `stop()` on an early match, and the task's own
    /// completion — and on an early match BOTH run. Emitting twice makes the
    /// JS side re-enter its terminal branch, which is how a single utterance
    /// produced two verdicts.
    private var didNotifyStopped = false
    /// Whether the CURRENT task has produced any transcription. Gates the
    /// one-shot on-device → server retry below.
    private var gotResult = false

    /// Silence after speech before we finalize. Long enough to ride out the
    /// gap between syllables of a short Korean word, short enough that the
    /// verdict still feels immediate.
    private let silenceAfterSpeech: TimeInterval = 1.6
    /// Silence when NOTHING has been said yet — the learner is still reading
    /// the prompt, so this is deliberately more patient.
    private let silenceBeforeSpeech: TimeInterval = 8.0
    /// Absolute ceiling, so a noisy room can never hold the mic open.
    private let maxUtterance: TimeInterval = 25.0

    // MARK: - Lifecycle

    /// Watch for the audio server going away.
    ///
    /// `mediaserverd` can die and restart. When it does, every audio object in
    /// this process — session, engine, audio units — is a handle to something
    /// that no longer exists, and iOS says so exactly once, through these
    /// notifications. Ignore them and the next `AVAudioEngine.inputNode` access
    /// talks to a dead RPC endpoint; that call does not fail, it **aborts the
    /// process**:
    ///
    ///     AVAudioEngine.inputNode
    ///       -> AVAudioIONodeImpl::GetInputFormat
    ///         -> AURemoteIO::Cleanup
    ///           -> _ReportRPCTimeout -> abort()   // SIGABRT, uncatchable
    ///
    /// There is no defensive check that survives that — `isInputAvailable` is
    /// true, `inputNumberOfChannels` is 1, the route lists the built-in mic —
    /// because the session is answering from its own state, not the server's.
    /// The only workable strategy is to drop every audio object the moment we
    /// are told the server went away, and rebuild from scratch next attempt.
    override public func load() {
        let center = NotificationCenter.default
        center.addObserver(
            self,
            selector: #selector(handleMediaServicesReset),
            name: AVAudioSession.mediaServicesWereResetNotification,
            object: nil
        )
        center.addObserver(
            self,
            selector: #selector(handleMediaServicesReset),
            name: AVAudioSession.mediaServicesWereLostNotification,
            object: nil
        )
        center.addObserver(
            self,
            selector: #selector(handleInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
    }

    @objc private func handleMediaServicesReset() {
        CAPLog.print("[audio] media services reset — dropping audio objects")
        teardown()
        notifyStopped(error: "audio-reset")
    }

    /// A phone call, a Siri invocation, another app taking the session. The
    /// engine is already stopped by the system; what matters is that our own
    /// state agrees, so the next attempt builds a fresh engine instead of
    /// reusing one whose render resources are gone.
    @objc private func handleInterruption(_ note: Notification) {
        guard
            let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: raw),
            type == .began
        else { return }
        CAPLog.print("[audio] session interrupted — stopping recognition")
        teardown()
        notifyStopped(error: "interrupted")
    }

    // MARK: - Availability

    /// Reports whether this locale is SUPPORTED, not whether it is usable right now.
    ///
    /// `isAvailable` is deliberately not used here: it returns false until the
    /// user has granted speech authorization, so gating support on it created a
    /// chicken-and-egg — the UI decided recognition was unavailable, showed the
    /// "not yet available" fallback, and therefore never called `start`, which
    /// is the only thing that would have asked for permission. The learner
    /// could never grant it.
    ///
    /// A nil recognizer genuinely means "this locale is not supported at all",
    /// which is the question the caller is asking. Authorization is handled in
    /// `start`, and transient unavailability surfaces there as an error.
    @objc func available(_ call: CAPPluginCall) {
        let locale = call.getString("language") ?? "en-US"
        let supported = SFSpeechRecognizer(locale: Locale(identifier: locale)) != nil
        call.resolve(["available": supported])
    }

    // MARK: - Permissions

    /// Both permissions are required: speech authorization AND the microphone.
    /// Reporting only the speech grant would let `start` open an engine that
    /// captures nothing, which presents to the learner as "it just doesn't hear me".
    private func permissionState() -> String {
        let speech = SFSpeechRecognizer.authorizationStatus()
        let mic = AVAudioSession.sharedInstance().recordPermission
        if speech == .authorized && mic == .granted { return "granted" }
        if speech == .denied || speech == .restricted || mic == .denied { return "denied" }
        return "prompt"
    }

    // `override` because CAPPlugin already declares the permissions pair.
    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(["speechRecognition": permissionState()])
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { _ in
            AVAudioSession.sharedInstance().requestRecordPermission { _ in
                DispatchQueue.main.async {
                    call.resolve(["speechRecognition": self.permissionState()])
                }
            }
        }
    }


    // MARK: - Diagnostics

    /// Session + engine state at a named point.
    ///
    /// Kept rather than removed after the "no input format" bug: every failure
    /// in this file is invisible from JS (the step just says the mic did not
    /// hear anything), and the ONE thing that distinguishes them is whether the
    /// session and the engine agree about the input. `CAPLog.print` is silent
    /// unless logging is enabled, so this costs a release build nothing.
    private func logAudioState(_ tag: String) {
        let s = AVAudioSession.sharedInstance()
        // Deliberately does NOT touch `audioEngine.inputNode` when the engine
        // does not exist yet — reading it is what freezes the format, so a
        // diagnostic that reported it eagerly would cause the bug it is meant
        // to observe.
        let fmt = audioEngine?.inputNode.outputFormat(forBus: 0)
        let inputs = (s.availableInputs ?? []).map { $0.portType.rawValue }.joined(separator: ",")
        let route = s.currentRoute.inputs.map { $0.portType.rawValue }.joined(separator: ",")
        let outs = s.currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: ",")
        CAPLog.print("[audio-diag] \(tag) cat=\(s.category.rawValue) mode=\(s.mode.rawValue) inputAvail=\(s.isInputAvailable) sessSR=\(s.sampleRate) sessInCh=\(s.inputNumberOfChannels) availIn=[\(inputs)] routeIn=[\(route)] routeOut=[\(outs)] nodeFmt=\(fmt.map { "\($0.sampleRate)Hz/\($0.channelCount)ch" } ?? "no-engine")")
    }

    // MARK: - Recognition

    @objc func start(_ call: CAPPluginCall) {
        guard permissionState() == "granted" else {
            call.reject("Speech recognition or microphone permission not granted")
            return
        }

        let locale = call.getString("language") ?? "en-US"
        guard let r = SFSpeechRecognizer(locale: Locale(identifier: locale)), r.isAvailable else {
            call.reject("Recognizer unavailable for locale \(locale)")
            return
        }
        recognizer = r

        // A previous attempt may still be winding down; never stack two.
        // Safe to run before the session is configured now that teardown only
        // touches an engine that already exists.
        teardown()

        // The audio session MUST be record-capable and ACTIVE before we touch
        // `inputNode`. Reading `outputFormat(forBus:)` on an inactive session
        // yields a 0 Hz format, and `installTap` then hard-asserts
        // ("required condition is false: format.sampleRate == hwFormat.sampleRate")
        // — an uncatchable crash, not a Swift error.
        //
        // `.defaultToSpeaker` is what keeps this from sounding like a phone
        // call: `.playAndRecord` alone routes output to the RECEIVER (earpiece)
        // at telephony quality. `.allowBluetoothA2DP` keeps good-quality output
        // on headphones instead of falling back to the mono HFP call profile.
        // `.duckOthers` lowers other audio rather than killing it.
        let session = AVAudioSession.sharedInstance()
        do {
            // Bluetooth is the whole story for audio quality here.
            //
            // A2DP (the good stereo profile) is OUTPUT-ONLY. The moment any
            // input is active, Bluetooth MUST fall back to HFP — mono,
            // telephony-grade. That is not a bug we introduced, it is how the
            // radio works, and it is exactly why lesson audio "sounds like a
            // phone call" as soon as the mic opens. The 24000 Hz 1-channel
            // format in the crash log is HFP's fingerprint.
            //
            // iOS 26 added `bluetoothHighQualityRecording`, which lets AirPods
            // record at high quality instead of dropping to HFP. Applied when
            // available; older systems just get the HFP fallback.
            // `.allowBluetooth` is DELIBERATELY ABSENT — it is the option that
            // makes this sound like a phone call. It opts the session into HFP,
            // the hands-free *telephony* profile: mono, ~8–24 kHz, and it takes
            // over OUTPUT as well as input, so the moment the mic opens the
            // learner's headphones drop from stereo music quality to call
            // quality. `1 ch, 24000 Hz` in a log is HFP's fingerprint.
            //
            // Dropping it is not a downgrade. Without HFP, iOS records from the
            // built-in mic and leaves A2DP (the good output profile) intact —
            // which for a pronunciation app is the right trade every time: the
            // phone's mic is better than a headset mic anyway, and the model
            // audio the learner is imitating stays full quality.
            //
            // iOS 26's `.bluetoothHighQualityRecording` is the modern answer for
            // devices that CAN record without dropping to HFP (AirPods), so it
            // is opted into where available.
            var options: AVAudioSession.CategoryOptions = [
                .defaultToSpeaker, .allowBluetoothA2DP, .duckOthers,
            ]
            if #available(iOS 26.0, *) {
                options.insert(.bluetoothHighQualityRecording)
            }
            try session.setCategory(.playAndRecord, mode: .default, options: options)
            try session.setActive(true, options: .notifyOthersOnDeactivation)
            // `.defaultToSpeaker` is only a DEFAULT: it picks the speaker when
            // nothing else claims the route, and `.playAndRecord` otherwise
            // prefers the RECEIVER — the earpiece at the top of the phone, which
            // is quiet and tinny and is the other half of "it sounds like a
            // call". So force the speaker — but ONLY when we are actually on the
            // receiver.
            //
            // Unconditionally overriding would be its own bug: it routes to the
            // BUILT-IN speaker, so a learner wearing headphones would have the
            // lesson yanked out of their AirPods and played out loud. Checking
            // the live route first means we fix the earpiece case and leave
            // every deliberate route (A2DP, wired, CarPlay) alone.
            let onReceiver = session.currentRoute.outputs.contains {
                $0.portType == .builtInReceiver
            }
            if onReceiver {
                try? session.overrideOutputAudioPort(.speaker)
            }
        } catch {
            restorePlaybackSession()
            call.reject("Could not configure audio session: \(error.localizedDescription)")
            return
        }

        // Bail BEFORE touching `inputNode` when there is no capture hardware.
        //
        // This is not defensive padding — merely READING the input node's
        // format initialises AURemoteIO, and if the audio server cannot serve a
        // capture unit that call does not return an error, it **aborts the
        // process** (`_ReportRPCTimeout` → `abort()` → SIGABRT). It is
        // uncatchable: no Swift `do/catch` and no format sanity-check
        // downstream can save you, because control never comes back. The only
        // fix is to not make the call. The iOS Simulator with no input device
        // is the reliable way to hit it.
        logAudioState("after-setActive")
        guard session.isInputAvailable else {
            restorePlaybackSession()
            call.reject("No audio input available on this device")
            return
        }

        // Engine constructed HERE, after `setActive(true)` on `.playAndRecord`,
        // so the very first `inputNode` access sees the real record route.
        let engine = AVAudioEngine()
        audioEngine = engine
        let input = engine.inputNode
        // Validate only — do NOT hand this format to `installTap`.
        //
        // Activating a record-capable session re-routes the audio hardware
        // (notably Bluetooth dropping to HFP), so a format captured here can be
        // stale by the time the tap is installed. That mismatch is fatal:
        //   "Failed to create tap due to format mismatch,
        //    <AVAudioFormat 1 ch, 24000 Hz, Float32>"
        // is an uncaught NSException, not a Swift error — the app dies.
        //
        // Passing `nil` makes the engine use the bus's CURRENT format at tap
        // time, so a route change between here and there can't kill us.
        let probe = input.outputFormat(forBus: 0)
        logAudioState("at-probe")
        guard probe.sampleRate > 0, probe.channelCount > 0 else {
            restorePlaybackSession()
            call.reject("Microphone unavailable (no input format)")
            return
        }
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: nil) { [weak self] buffer, _ in
            self?.request?.append(buffer)
        }

        engine.prepare()
        do {
            try engine.start()
        } catch {
            teardown()
            call.reject("Could not start audio engine: \(error.localizedDescription)")
            return
        }

        startedAt = Date()
        lastChangeAt = startedAt
        lastTranscript = ""
        sawSpeech = false
        startEndpointTimer()
        didNotifyStopped = false

        notifyListeners("listeningState", data: ["status": "started"])

        beginTask(on: r, onDevice: r.supportsOnDeviceRecognition)

        call.resolve()
    }


    /// Starts (or restarts) the recognition task against the already-running
    /// audio engine. The tap appends into `self.request`, so swapping the
    /// request here re-points the live audio stream without reopening the mic.
    ///
    /// WHY THE `onDevice` FALLBACK EXISTS — `supportsOnDeviceRecognition`
    /// answers "is there an on-device model for this locale", NOT "is it
    /// downloaded and usable right now". iOS registers the locale as soon as it
    /// begins fetching the assets, so the flag flips to `true` while the model
    /// is still unusable, and forcing `requiresOnDeviceRecognition` in that
    /// window fails the task instantly with
    ///   `kLSRErrorDomain error 300 — Failed to initialize recognizer`
    /// before a single buffer is transcribed. To the learner that is the worst
    /// possible shape of failure: the mic opens, the UI says "Listening", and
    /// nothing is ever recognised.
    ///
    /// It is genuinely transient and machine-specific — the same simulator
    /// answered `false` (and recognised fine over the server path) minutes
    /// earlier — so it cannot be fixed by a one-time capability check. We ask
    /// for on-device first (offline, private, no ~1-minute server cap) and drop
    /// to server recognition only if the task dies before producing anything.
    private func beginTask(on r: SFSpeechRecognizer, onDevice: Bool) {
        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        req.requiresOnDeviceRecognition = onDevice
        request = req
        gotResult = false
        CAPLog.print("[audio-diag] task locale=\(r.locale.identifier) onDeviceSupported=\(r.supportsOnDeviceRecognition) requiresOnDevice=\(onDevice)")

        task = r.recognitionTask(with: req) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                self.gotResult = true
                let best = result.bestTranscription.formattedString
                // Recognition callbacks arrive on the recognizer's own queue;
                // the endpoint timer reads this state on main. Hop so there is
                // exactly one writer thread for it.
                DispatchQueue.main.async {
                    guard best != self.lastTranscript else { return }
                    self.lastTranscript = best
                    self.lastChangeAt = Date()
                    if !best.isEmpty { self.sawSpeech = true }
                }

                // Every alternative, best-first — the JS matcher scores the
                // whole N-best list, which recovers a lot of near-misses.
                var matches = [best]
                for t in result.transcriptions where t.formattedString != best {
                    matches.append(t.formattedString)
                }
                self.notifyListeners("partialResults", data: ["matches": matches])
            }

            if let error = error {
                let ns = error as NSError
                CAPLog.print("[audio-diag] recognitionTask error: \(error.localizedDescription) | \(ns.domain)#\(ns.code)")

                // Died before transcribing anything while forced on-device →
                // the local model is not actually ready. Retry once over the
                // server path instead of reporting a dead microphone.
                if onDevice && !self.gotResult {
                    self.task?.cancel()
                    DispatchQueue.main.async {
                        // Restart the endpointing clock: the learner has not
                        // had a chance to speak into this task yet.
                        self.startedAt = Date()
                        self.lastChangeAt = self.startedAt
                    }
                    self.beginTask(on: r, onDevice: false)
                    return
                }
            }

            if error != nil || (result?.isFinal ?? false) {
                self.teardown()
                // A task that died without transcribing ANYTHING is not an
                // utterance the learner got wrong — it is a broken recognizer,
                // and the UI has to say so or it will keep asking them to try
                // again against something that cannot work.
                let failed = error != nil && !self.gotResult
                self.notifyStopped(error: failed ? "recognizer-unavailable" : nil)
            }
        }
    }

    /// Polls four times a second on the main run loop. Cheap, and pairing it
    /// with a main-queue hop in the result callback gives the endpointing state
    /// a single writer thread — recognition callbacks otherwise arrive on the
    /// recognizer's own queue.
    private func startEndpointTimer() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.pollTimer?.invalidate()
            self.pollTimer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
                self?.checkEndpoint()
            }
        }
    }

    private func checkEndpoint() {
        guard request != nil else { return }
        let now = Date()
        let idle = now.timeIntervalSince(lastChangeAt)
        let elapsed = now.timeIntervalSince(startedAt)
        let quietLimit = sawSpeech ? silenceAfterSpeech : silenceBeforeSpeech
        guard idle >= quietLimit || elapsed >= maxUtterance else { return }

        // `endAudio()`, NOT `cancel()`. Ending the stream lets the task deliver
        // a final result — cancelling throws away the best transcription we
        // have, which on a near-miss is exactly the text the learner needs to
        // see next to the target.
        pollTimer?.invalidate()
        pollTimer = nil
        audioEngine?.inputNode.removeTap(onBus: 0)
        if audioEngine?.isRunning == true { audioEngine?.stop() }
        request?.endAudio()
    }

    @objc func stop(_ call: CAPPluginCall) {
        teardown()
        notifyStopped(error: nil)
        call.resolve()
    }

    private func notifyStopped(error: String?) {
        guard !didNotifyStopped else { return }
        didNotifyStopped = true
        var payload: [String: Any] = ["status": "stopped"]
        if let error = error { payload["error"] = error }
        notifyListeners("listeningState", data: payload)
    }

    /// Idempotent: `stop` from JS and the task's own completion can both land.
    private func teardown() {
        pollTimer?.invalidate()
        pollTimer = nil
        // Only touch the engine when we actually built one. Reaching for
        // `inputNode` here on a nil-able engine is what used to poison the
        // input format for the rest of the session.
        if let engine = audioEngine {
            if engine.isRunning { engine.stop() }
            engine.inputNode.removeTap(onBus: 0)
            audioEngine = nil
        }
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        restorePlaybackSession()
    }

    /// Put the session back to `.playback` after recording.
    ///
    /// Without this the app stays in `.playAndRecord` for the rest of its life,
    /// and every TTS clip afterwards plays through the recording route — which
    /// is the muffled "phone call" sound. `AppDelegate` sets `.playback` at
    /// launch for the same reason (audio is the content, so it must ignore the
    /// silent switch); this restores that baseline.
    private func restorePlaybackSession() {
        let session = AVAudioSession.sharedInstance()

        // Each step is its own `try?` ON PURPOSE. These were one `do` block, so
        // a throw on the category left the deactivation unreached and the app
        // stuck in `.playAndRecord` — the exact muffled-output state this
        // method exists to undo, reached only on the path where it matters.
        //
        // Back to `.playback`: `.playAndRecord` keeps the session on the
        // recording route, where output is telephony-grade.
        try? session.setCategory(.playback, mode: .default, options: [.duckOthers])

        // DEACTIVATE, not activate. Holding the session active keeps other
        // apps' audio ducked indefinitely; `.notifyOthersOnDeactivation` tells
        // them to come back up to full volume.
        //
        // ⚠️ This also parks WKWebView's AudioContext in WebKit's
        // `"interrupted"` state, and it will NOT come back on its own — the
        // interruption-ended notification WebKit waits for is never posted when
        // the app deactivated its own session. `resumeAudioPlayback()` on the
        // JS side is the other half of this and is not optional: without it,
        // every lesson clip after the first speaking step is silent.
        try? session.setActive(false, options: .notifyOthersOnDeactivation)

        logAudioState("after-restore")
    }
}
