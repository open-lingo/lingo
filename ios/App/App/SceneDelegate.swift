import UIKit
import Capacitor

/**
 Bridge controller that registers the app's own plugins.

 Capacitor used to discover plugins by scanning the Objective-C runtime for
 `CAPPlugin` subclasses, so simply compiling a plugin into the app target was
 enough. That is no longer true: plugins shipped as SPM/CocoaPods packages are
 registered from the generated package list, and anything defined in the app
 project has to be handed to the bridge explicitly.

 Without this the JS side gets a `registerPlugin` proxy with nothing behind it,
 every call rejects `UNIMPLEMENTED`, and the speaking step reports "speech
 recognition is not yet available" — a plugin that compiles, links, and has all
 its symbols in the binary, but is invisible to the bridge.
 */
/// `@objc` so the storyboard can instantiate it by name — `Main.storyboard`
/// names this class, and Info.plist's `UISceneStoryboardFile` makes UIKit
/// build the root controller from there.
@objc(AppBridgeViewController)
class AppBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SpeechRecognizerPlugin())
        disableTopScrollEdgeEffect()
    }

    /// TestFlight #151 — "the white line at the top of the iPad is still
    /// there" (iPad Air 11" M4, iPadOS 26, landscape, dark theme; every
    /// screen). This is iPadOS 26's automatic scroll-edge effect: UIKit now
    /// draws a soft blur+gradient "scrim" over the top ~24pt safe area of
    /// ANY `UIScrollView` whose content extends under the status bar —
    /// including a `WKWebView`'s own internal scroll view, which is exactly
    /// our case (`viewport-fit=cover` + `pt-safe` are intentional: our own
    /// `bg-surface` is meant to paint under the status bar, not a system
    /// scrim). The effect is documented at
    /// https://developer.apple.com/documentation/uikit/uiscrolledgeeffect
    /// and exposed as `UIScrollView.topEdgeEffect`
    /// (https://developer.apple.com/documentation/uikit/uiscrollview/topedgeeffect).
    ///
    /// It should, in theory, tint itself to match the content underneath —
    /// but there is a still-open Apple bug where WKWebView content isn't
    /// sampled correctly and the effect falls back to a light system
    /// default instead, which is exactly the light band over our dark
    /// theme's near-black background (Apple Developer Forums thread 803917,
    /// "UIScrollEdgeElementContainerInteraction uses wrong mix-in color over
    /// WKWebView on iOS 26.1", https://developer.apple.com/forums/thread/803917;
    /// tracked upstream as WebKit PR https://github.com/WebKit/WebKit/pull/52365).
    /// It reproduces only where our own layout puts a `position: fixed`
    /// element (the `landscapeLg:flex` sidebar `aside`, `src/routes/SidebarNav.tsx`)
    /// directly under the safe area — the likely reason it's landscape-iPad-only:
    /// the iPhone layout and iPad portrait have no such element there, only the
    /// in-flow `sticky` top bar, which the effect samples correctly.
    ///
    /// Disabling the effect on our own webview's scroll view removes the
    /// scrim without touching the real status bar (no `prefersStatusBarHidden`,
    /// no `UIViewControllerBasedStatusBarAppearance` change) — the status bar
    /// text/icons are unaffected, only the system's extra overlay beneath them.
    /// `#available` guards this for iOS < 26, where the API does not exist.
    private func disableTopScrollEdgeEffect() {
        guard let scrollView = webView?.scrollView else { return }
        if #available(iOS 26.0, *) {
            scrollView.topEdgeEffect.isHidden = true
        }
    }

    // Sim orientation forcing used to live here (a Debug-only
    // `SimOrientationOverride` driven by `OL_SIM_ORIENTATION` /
    // `SIMCTL_CHILD_OL_SIM_ORIENTATION`, for `npm run sim:capture --
    // --orientation landscape`). REMOVED 2026-09-16 — confirmed dead on
    // iPadOS 26.5/Xcode 27.0: `UIWindowScene.requestGeometryUpdate` refuses
    // with "The current windowing mode does not allow for programmatic
    // changes to interface orientation" (a platform-level restriction, not
    // a bug here — Apple Developer Forums threads 715358/802210), and
    // neither `setNeedsUpdateOfSupportedInterfaceOrientations()` nor the
    // Detox-style private `UIDevice.current.setValue(_:forKey:
    // "orientation")` KVC fallback had any observable effect either.
    // Real rotation now happens OUTSIDE the app entirely, via an XCUITest
    // that sets `XCUIDevice.shared.orientation` (which rotates the
    // simulated device/SpringBoard, not just a test's own host app) —
    // `scripts/ux-loop/sim-rotate/` + `rotateDevice()` in
    // `scripts/ux-loop/sim-capture.mjs`. See git history for the removed
    // code if a future iPadOS/Xcode combination is worth re-checking.
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = AppBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
