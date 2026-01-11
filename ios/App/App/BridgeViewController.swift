import UIKit
import Capacitor
import WebKit

class BridgeViewController: CAPBridgeViewController {

    private func applyBackground() {
        // During orientation changes iOS can briefly show the view/webview background.
        // Force to black to avoid flashing white behind the web content.
        let background = UIColor.black
        view.backgroundColor = background
        if let webView = bridge?.webView {
            webView.isOpaque = false
            webView.backgroundColor = background
            webView.scrollView.isOpaque = false
            webView.scrollView.backgroundColor = background
        }
    }

    /// Disable iOS magnifying glass by removing long-press gestures
    /// Note: We don't use isTextInteractionEnabled=false as it breaks input fields
    private func disableMagnifier() {
        guard let webView = bridge?.webView else { return }

        // Disable long-press gestures on the WebView that trigger the magnifier
        for gestureRecognizer in webView.gestureRecognizers ?? [] {
            if gestureRecognizer is UILongPressGestureRecognizer {
                gestureRecognizer.isEnabled = false
            }
        }

        // Also disable in scrollView subviews (where magnifier can be triggered)
        for subview in webView.scrollView.subviews {
            for gestureRecognizer in subview.gestureRecognizers ?? [] {
                if gestureRecognizer is UILongPressGestureRecognizer {
                    gestureRecognizer.isEnabled = false
                }
            }
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        applyBackground()
        disableMagnifier()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        applyBackground()
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        // Keep background black regardless of appearance changes.
        applyBackground()
    }
}
