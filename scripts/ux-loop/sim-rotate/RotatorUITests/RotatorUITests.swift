import XCTest
import UIKit

/// Standalone rotator for `npm run sim:capture -- --orientation landscape`
/// (scripts/ux-loop/sim-capture.mjs). In-app orientation forcing (a
/// Debug-only `SimOrientationOverride` that used to live in
/// `ios/App/App/SceneDelegate.swift`, since removed) is DEAD on iPadOS
/// 26.5 — `UIWindowScene.requestGeometryUpdate` refuses with "The current
/// windowing mode does not allow for programmatic changes to interface
/// orientation." (verified live 2026-09-16).
///
/// The one documented way around that restriction: setting
/// `XCUIDevice.shared.orientation` from INSIDE an XCUITest rotates the
/// simulated DEVICE (SpringBoard), the same as a physical rotation — not
/// just the test's own host app. Community evidence: fastlane `snapshot`
/// does exactly this; openradar 41005006 ("Simulator window doesn't rotate
/// when setting XCUIDevice.shared.orientation") and Apple Developer Forums
/// threads 12437/53315 both describe the rotation persisting after the test
/// ends. A known quirk (openradar 45094683): the FIRST orientation set after
/// a fresh Simulator boot can silently fail once — hence the belt-and-suspenders
/// re-set below rather than a single one-shot assignment.
///
/// Reads `ROTATE_TO` from the process environment (`landscapeLeft` |
/// `landscapeRight` | `portrait`, default `portrait`) — the harness passes
/// it via `xcodebuild test`'s `TEST_RUNNER_ROTATE_TO=…` env forwarding.
/// MUST be a real process environment variable on the `xcodebuild`
/// invocation itself (`env: {...}` in `rotateDevice()`), NOT a trailing
/// `KEY=value` xcodebuild command-line argument — the latter is a build-
/// setting override that never reaches this process (confirmed live
/// 2026-09-16 by dumping the full environment here and finding it absent).
final class RotatorUITests: XCTestCase {
    func testRotate() throws {
        let raw = ProcessInfo.processInfo.environment["ROTATE_TO"] ?? "portrait"
        let orientation: UIDeviceOrientation
        switch raw {
        case "landscapeLeft": orientation = .landscapeLeft
        case "landscapeRight": orientation = .landscapeRight
        case "portrait": orientation = .portrait
        default:
            XCTFail("unrecognized ROTATE_TO=\(raw); expected landscapeLeft|landscapeRight|portrait")
            return
        }

        let app = XCUIApplication()
        app.launch()

        // Belt-and-suspenders for the known first-rotation-after-boot flake
        // (openradar 45094683) — set twice with a short settle between.
        XCUIDevice.shared.orientation = orientation
        Thread.sleep(forTimeInterval: 1.0)
        XCUIDevice.shared.orientation = orientation
        Thread.sleep(forTimeInterval: 1.5)

        NSLog("[sim-rotate] set XCUIDevice.shared.orientation = %@ (requested ROTATE_TO=%@)", "\(orientation)", raw)
    }
}
