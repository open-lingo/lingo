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
    }
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
