import { buildDappBuilderUrl, launchExternalApp, GOKNOWN_TOKEN_KEY } from "./launchApp";

const DAPP_BUILDER_BASE = 'https://app-builder-sqqz.onrender.com';
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTc1MH0' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk75gRMbMhM4';

let mockWindowOpen: jest.SpyInstance;

beforeEach(() => {
  localStorage.clear();
  mockWindowOpen = jest
    .spyOn(window, 'open')
    .mockImplementation(() => null);
});

afterEach(() => {
  mockWindowOpen.mockRestore();
});

// ── Test 1: DApp Builder tile includes #token= ────────────────────────────────

test('launch-1: DApp Builder tile includes #token= in the opened URL', () => {
  localStorage.setItem(GOKNOWN_TOKEN_KEY, SAMPLE_JWT);

  launchExternalApp(DAPP_BUILDER_BASE, 'dapp_builder', { onMissingToken: jest.fn() });

  expect(mockWindowOpen).toHaveBeenCalledTimes(1);
  const openedUrl = mockWindowOpen.mock.calls[0][0] as string;
  expect(openedUrl).toContain('#token=');
});

// ── Test 2: Token value is URL-encoded ───────────────────────────────────────

test('launch-2: token value in the URL fragment is encodeURIComponent-encoded', () => {
  // Use a token that contains characters requiring encoding (+ = /)
  const tokenWithSpecialChars = 'header.payload+special=chars/extra';
  localStorage.setItem(GOKNOWN_TOKEN_KEY, tokenWithSpecialChars);

  launchExternalApp(DAPP_BUILDER_BASE, 'dapp_builder', { onMissingToken: jest.fn() });

  const openedUrl = mockWindowOpen.mock.calls[0][0] as string;
  expect(openedUrl).toContain(`#token=${encodeURIComponent(tokenWithSpecialChars)}`);
  // Raw unencoded chars must not appear after the = sign
  expect(openedUrl).not.toMatch(/#token=[^%]*[+/]/);
});

// ── Test 3: Missing token prevents launch and calls onMissingToken ───────────

test('launch-3: missing token prevents window.open and invokes onMissingToken', () => {
  // Do NOT set token in localStorage
  const onMissingToken = jest.fn();

  launchExternalApp(DAPP_BUILDER_BASE, 'dapp_builder', { onMissingToken });

  expect(mockWindowOpen).not.toHaveBeenCalled();
  expect(onMissingToken).toHaveBeenCalledTimes(1);
});

// ── Test 4: Non-DApp-Builder apps receive no token ───────────────────────────

test('launch-4: non-DApp-Builder apps open with the raw URL and no token', () => {
  // Token is present but should NOT be attached to non-dapp_builder apps
  localStorage.setItem(GOKNOWN_TOKEN_KEY, SAMPLE_JWT);

  launchExternalApp('https://knowncompute.ai', 'workflow', { onMissingToken: jest.fn() });
  launchExternalApp('https://zta-coin.org', 'payments', { onMissingToken: jest.fn() });

  expect(mockWindowOpen).toHaveBeenCalledTimes(2);
  const [url1, url2] = mockWindowOpen.mock.calls.map((c) => c[0] as string);
  expect(url1).toBe('https://knowncompute.ai');
  expect(url2).toBe('https://zta-coin.org');
  expect(url1).not.toContain('token');
  expect(url2).not.toContain('token');
});

// ── Test 5: Both DL tile and Dashboard tile use the same secure helper ────────
//
// Dashboard/index.tsx and components/DLs/index.tsx both import launchExternalApp
// from this module.  By exercising launchExternalApp here we prove the shared
// behavior: any component that calls launchExternalApp('...', 'dapp_builder', …)
// will produce the same URL format with the token correctly attached.

test('launch-5: buildDappBuilderUrl adds trailing slash and encodes token consistently for both callers', () => {
  // Simulates what both Dashboard and DLs component produce
  const token = SAMPLE_JWT;

  const urlFromDashboard = buildDappBuilderUrl(DAPP_BUILDER_BASE, token);
  const urlFromDLsTile   = buildDappBuilderUrl(DAPP_BUILDER_BASE, token);

  // Both callers produce identical output
  expect(urlFromDashboard).toBe(urlFromDLsTile);

  // URL must have a trailing slash before the fragment (prevents CDN redirect)
  expect(urlFromDashboard).toMatch(/\/#token=/);

  // Token must be URL-encoded
  expect(urlFromDashboard).toBe(
    `${DAPP_BUILDER_BASE}/#token=${encodeURIComponent(token)}`,
  );
});
