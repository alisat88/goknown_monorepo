// Shared helper for launching external apps from the DAppGenius dashboard.
// Every DApp Builder launch path MUST call launchExternalApp so the session
// token is reliably attached.

export const GOKNOWN_TOKEN_KEY = "@GoKnown:token";

/**
 * Build the DApp Builder URL with the session JWT in the URL fragment.
 *
 * The trailing slash before `#` is required: Render's CDN redirects a bare
 * domain (https://app-builder-sqqz.onrender.com) to the root path
 * (https://app-builder-sqqz.onrender.com/).  Browsers drop the URL fragment
 * when following that server-side 301, so the DApp Builder would receive no
 * token.  Appending `/` forces the request directly to the root path, skipping
 * the redirect entirely.
 */
export function buildDappBuilderUrl(baseUrl: string, token: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}#token=${encodeURIComponent(token)}`;
}

export interface ILaunchExternalOptions {
  /** Called when flag === 'dapp_builder' but no session token is in localStorage. */
  onMissingToken(): void;
}

/**
 * Open an external app in a new tab.
 *
 * For DApp Builder (flag === 'dapp_builder') the session JWT is read from
 * localStorage and appended as a URL fragment.  If no token is present,
 * onMissingToken is called and the window is NOT opened.
 *
 * All other external apps are opened without a token.
 *
 * The token is never placed in query parameters, logs, React state,
 * error messages, or analytics.
 */
export function launchExternalApp(
  externalUrl: string,
  flag: string,
  options: ILaunchExternalOptions
): void {
  if (flag === "dapp_builder") {
    const token = localStorage.getItem(GOKNOWN_TOKEN_KEY);
    if (!token) {
      options.onMissingToken();
      return;
    }
    window.open(
      buildDappBuilderUrl(externalUrl, token),
      "_blank",
      "noopener,noreferrer"
    );
  } else {
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  }
}
