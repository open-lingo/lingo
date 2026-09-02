import UIKit
import Capacitor
import AVFoundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        configureAudioSession()
        return true
    }

    /// Make lesson audio play even when the Ring/Silent switch is set to silent.
    ///
    /// Without an explicit category, iOS puts WKWebView audio in the *ambient*
    /// session, which the hardware silent switch mutes outright — both the
    /// `<audio>` alphabet clips and Web Audio TTS. This is invisible in the
    /// Simulator, which has no silent switch, so it presents as "audio works on
    /// my Mac, phone is silent" and looks like a broken asset path rather than
    /// a session-category problem.
    ///
    /// `.playback` is the correct category here rather than a workaround:
    /// audio IS the content in a language course, so it belongs in the same
    /// class as a music or podcast app, which Apple explicitly exempts from the
    /// silent switch. `.mixWithOthers` is deliberately NOT set — a pronunciation
    /// clip competing at full volume with the user's music helps nobody;
    /// `.duckOthers` gives the clip priority while letting the music continue
    /// quietly underneath and come back afterwards.
    ///
    /// Failures are swallowed on purpose: a session we could not configure must
    /// degrade to "audio might be silenced" and never to "the app did not launch".
    private func configureAudioSession() {
        do {
            // Category only — deliberately NOT `setActive(true)`.
            //
            // Activating here seizes the audio session for the whole lifetime
            // of the app: the learner's music is interrupted the moment Open
            // Lingo launches and never resumes, because nothing ever
            // deactivates. That is the "it takes over my audio" complaint.
            //
            // iOS activates the session implicitly when we actually play a
            // clip, so setting the category is enough to get the behaviour we
            // want (`.playback` = audio is the content, so it ignores the
            // Ring/Silent switch). `.duckOthers` means a lesson clip briefly
            // LOWERS background audio instead of stopping it, and the duck
            // lifts when the session goes inactive again.
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                mode: .default,
                options: [.duckOthers]
            )
        } catch {
            CAPLog.print("[audio] AVAudioSession setup failed: \(error.localizedDescription)")
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
