import SwiftUI

// Minimal host app for the RotatorUITests XCUITest bundle. It has no job of
// its own — see scripts/ux-loop/sim-rotate/RotatorUITests/RotatorUITests.swift
// and scripts/ux-loop/README-rotate.md (if present) for why: setting
// `XCUIDevice.shared.orientation` from inside a UI test rotates the
// SIMULATED DEVICE (SpringBoard), not just this host app, so the host can be
// as empty as Xcode allows.
@main
struct RotatorApp: App {
    var body: some Scene {
        WindowGroup {
            Text("Rotator")
        }
    }
}
