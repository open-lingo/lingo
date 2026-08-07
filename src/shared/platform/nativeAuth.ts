/**
 * System-browser plumbing for Auth0 on iOS.
 *
 * OAuth in a native app must NOT run in the app's own webview. Auth0 rejects
 * embedded-webview authorize requests for social connections outright, and
 * Apple's review guidelines treat an in-app credential form for a third-party
 * identity provider as a rejection reason. SFSafariViewController — what
 * `@capacitor/browser` opens on iOS — is the sanctioned surface: it's a real
 * Safari instance, so the user can see the URL bar and the session lands in
 * Safari's cookie jar where Auth0 expects it.
 *
 * Every `@capacitor/*` import here is DYNAMIC. Static imports would pull the
 * Capacitor runtime into the web entry chunk; dynamic ones become their own
 * chunks that the web build emits but never fetches, because every call site
 * is behind `IS_NATIVE`.
 */

/**
 * Hand a URL to SFSafariViewController.
 *
 * `windowName: "_self"` keeps it in the Capacitor-managed browser instance so
 * `closeSystemBrowser()` can dismiss it; the default opens a detached one that
 * the user has to close by hand, stranding them on Auth0's "you may now close
 * this window" page after a successful login.
 */
export async function openInSystemBrowser(url: string): Promise<void> {
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url, windowName: "_self" });
}

/**
 * Dismiss SFSafariViewController after the deep link comes back.
 *
 * Failures are swallowed deliberately. `Browser.close()` is implemented on iOS
 * and web but throws `Not implemented` on Android, and it also throws when
 * there is no browser open — e.g. iOS already dismissed it when the universal
 * link fired. Neither case is worth failing a login over: the auth result has
 * already been handled by the time this runs.
 */
export async function closeSystemBrowser(): Promise<void> {
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    /* no browser open, or the platform has no close — both are fine */
  }
}
