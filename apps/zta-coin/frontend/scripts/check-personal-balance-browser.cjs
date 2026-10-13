const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { chromium } = require("playwright-core");
const root = path.resolve(__dirname, "../../../..");
const zta = `${root}/apps/zta-coin/frontend`;
const parent = `${root}/frontend`;
const esbuild = require(`${zta}/node_modules/esbuild`);
const out = fs.mkdtempSync(
  path.join(require("node:os").tmpdir(), "zta-browser-validation-")
);
// Fixtures below are local-only; every network request is intercepted or aborted.

async function main() {
  console.log("Bundling frontend components");
  await esbuild.build({
    entryPoints: [`${zta}/src/main.tsx`],
    outfile: `${out}/zta.js`,
    bundle: true,
    platform: "browser",
    format: "iife",
    define: {
      "import.meta.env.VITE_ZTA_API_URL": '"https://api.zta-coin.org"',
      "import.meta.env.VITE_DAPPGENIUS_DASHBOARD_URL":
        '"https://dappgenius.dev"',
      "import.meta.env.VITE_ZTA_HANDOFF_CLIENT_ID": '"zta-web"',
      "import.meta.env.VITE_DAPPGENIUS_AUTHORIZE_URL":
        '"https://dappgenius.dev/zta/authorize"',
      "process.env.NODE_ENV": '"development"',
    },
  });
  await esbuild.build({
    stdin: {
      contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import Page from './src/pages/ZtaAuthorize'; createRoot(document.getElementById('root')).render(<Page />);`,
      resolveDir: parent,
      loader: "tsx",
    },
    outfile: `${out}/parent.js`,
    bundle: true,
    platform: "browser",
    format: "iife",
    define: {
      "process.env.NODE_ENV": '"development"',
      "process.env.REACT_APP_ENVIRONMENT": '"development"',
      "process.env.REACT_APP_DEVELOPMENT_API": '"https://api.dappgenius.dev"',
      "process.env.REACT_APP_STAGING_API": "undefined",
      "process.env.REACT_APP_PRODUCTION_API": "undefined",
      "process.env.REACT_APP_ZTA_HANDOFF_CLIENT_ID": '"zta-web"',
      "process.env.REACT_APP_ZTA_HANDOFF_REDIRECT_URI":
        '"https://zta-coin.org/auth/callback"',
    },
  });
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_EXECUTABLE ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  console.log("Chrome launched");
  try {
    const context = await browser.newContext({
      serviceWorkers: "block",
      viewport: { width: 1440, height: 1000 },
    });
    const failures = [],
      requests = [];
    let redeemCount = 0,
      mode = "ready",
      crossSiteCookie;
    const tx = {
      state: "S".repeat(32),
      codeVerifier: "V".repeat(43),
      clientId: "zta-web",
      redirectUri: "https://zta-coin.org/auth/callback",
      expiresInSeconds: 300,
    };
    const code = "C".repeat(43);
    const challenge = crypto
      .createHash("sha256")
      .update(tx.codeVerifier)
      .digest("base64url");
    await context.route("**/*", async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const headers = await req.allHeaders();
      requests.push({
        url: req.url(),
        origin: headers.origin,
        cookie: headers.cookie,
      });
      const cors = {
        "access-control-allow-origin": headers.origin || "https://zta-coin.org",
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "content-type,authorization",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "cache-control": "no-store",
      };
      const json = (status, body, extra = {}) =>
        route.fulfill({
          status,
          contentType: "application/json",
          headers: { ...cors, ...extra },
          body: JSON.stringify(body),
        });
      try {
        assert(
          !req.url().includes("dgs1_") && !req.url().includes(tx.codeVerifier)
        );
        if (req.method() === "OPTIONS")
          return await route.fulfill({ status: 204, headers: cors });
        if (url.hostname === "api.zta-coin.org") {
          if (url.pathname === "/me/balance") {
            if (headers.origin === "https://dappgenius.dev") {
              crossSiteCookie = headers.cookie || "";
              return await json(401, { error: "Authentication required" });
            }
            assert.equal(headers.origin, "https://zta-coin.org");
            assert.equal(url.search, "");
            if (mode === "unavailable")
              return await json(503, { error: "Balance service unavailable" });
            return headers.cookie?.includes("zta_session=zta1_")
              ? await json(200, {
                  balance: "0.00000000",
                  accountId: "server-derived",
                })
              : await json(401, { error: "Authentication required" });
          }
          if (url.pathname === "/auth/handoff/start") {
            assert.equal(headers.origin, "https://zta-coin.org");
            assert.deepEqual(req.postDataJSON(), {
              client_id: tx.clientId,
              redirect_uri: tx.redirectUri,
            });
            return await json(200, tx, {
              "set-cookie": `zta_handoff_tx=ztat_${"T".repeat(
                43
              )}; Path=/; Secure; HttpOnly; SameSite=Lax`,
            });
          }
          if (url.pathname === "/auth/handoff/redeem") {
            assert.equal(headers.origin, "https://zta-coin.org");
            assert(headers.cookie?.includes("zta_handoff_tx=ztat_"));
            assert.deepEqual(req.postDataJSON(), {
              code,
              client_id: tx.clientId,
              redirect_uri: tx.redirectUri,
              state: tx.state,
              code_verifier: tx.codeVerifier,
            });
            redeemCount++;
            return await route.fulfill({
              status: 204,
              headers: {
                ...cors,
                "set-cookie": `zta_session=zta1_${"A".repeat(
                  43
                )}; Path=/; Secure; HttpOnly; SameSite=Lax`,
              },
            });
          }
          return await json(403, { code: "ZTA_OPERATIONS_DISABLED" });
        }
        if (url.hostname === "api.dappgenius.dev") {
          assert.equal(headers.cookie, undefined);
          if (url.pathname.endsWith("/challenges"))
            return await json(201, { challenge: "H".repeat(43) });
          if (url.pathname.endsWith("/verify")) {
            assert.equal(req.postDataJSON().code, "12345678");
            return await json(200, { token: `dgs1_${"D".repeat(43)}` });
          }
          if (url.pathname.endsWith("/handoff/authorize")) {
            assert.equal(
              headers.authorization,
              `Bearer dgs1_${"D".repeat(43)}`
            );
            assert.deepEqual(req.postDataJSON(), {
              client_id: tx.clientId,
              redirect_uri: tx.redirectUri,
              state: tx.state,
              code_challenge: challenge,
            });
            return await json(201, { code, state: tx.state });
          }
        }
        if (["zta-coin.org", "dappgenius.dev"].includes(url.hostname)) {
          const name = url.hostname === "zta-coin.org" ? "zta" : "parent";
          if (url.pathname === "/bundle.js")
            return await route.fulfill({
              contentType: "text/javascript",
              body: fs.readFileSync(`${out}/${name}.js`),
            });
          if (url.pathname === "/bundle.css")
            return await route.fulfill({
              contentType: "text/css",
              body: fs.readFileSync(`${out}/${name}.css`),
            });
          return await route.fulfill({
            contentType: "text/html",
            body: '<html><head><meta name="referrer" content="no-referrer"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
          });
        }
        throw new Error(`Unexpected network target ${url.hostname}`);
      } catch (error) {
        failures.push(error);
        await route.abort();
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    page.on("console", (message) => {
      if (message.type() === "error") console.log("Browser:", message.text());
    });
    page.on("pageerror", (error) => {
      console.log("Page error:", error.message);
      failures.push(error);
    });
    await page.goto("https://zta-coin.org");
    console.log("Loaded ZTA");
    await page.getByText("Sign in to see your personal ZTA balance.").waitFor();
    await page.getByRole("button", { name: "Sign in with DAppGenius" }).click();
    console.log("Clicked sign in");
    await page.waitForURL(
      (url) =>
        url.origin === "https://dappgenius.dev" &&
        url.pathname === "/zta/authorize"
    );
    await page.getByLabel("Email", { exact: true }).waitFor();
    console.log("Loaded DAppGenius authorization page");
    await page.evaluate(() =>
      fetch("https://api.zta-coin.org/me/balance", {
        credentials: "include",
      }).then((r) => r.status)
    );
    assert.equal(
      crossSiteCookie,
      "",
      "SameSite=Lax transaction cookie must not accompany cross-site fetch"
    );
    await page.getByLabel("Email", { exact: true }).fill("user@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill("local-only-test-password");
    await page.getByRole("button", { name: "Send verification code" }).click();
    await page
      .getByLabel("Eight-digit email verification code")
      .fill("12345678");
    await page
      .getByRole("button", { name: "Verify and continue to ZTA Coin" })
      .click();
    await page.getByText("0.00000000 ZTA", { exact: true }).waitFor();
    assert.equal(page.url(), "https://zta-coin.org/");
    assert.equal(redeemCount, 1, "StrictMode must not replay code redemption");
    assert.equal(
      await page.evaluate(() =>
        sessionStorage.getItem("zta.handoff.transaction")
      ),
      null
    );
    assert.equal(await page.evaluate(() => document.cookie), "");
    await page.screenshot({ path: `${out}/personal-balance-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${out}/personal-balance-mobile.png` });
    mode = "unavailable";
    await page.getByRole("button", { name: "Refresh balance" }).click();
    await page
      .getByText("Your balance is temporarily unavailable. Please try again.")
      .waitFor();
    assert.equal(
      await page.getByText("0.00000000 ZTA", { exact: true }).count(),
      0
    );
    mode = "ready";
    await context.clearCookies();
    await page.getByRole("button", { name: "Refresh balance" }).click();
    await page
      .getByText("Your session expired or is no longer valid. Sign in again.")
      .waitFor();
    if (failures.length) throw failures[0];
    console.log(
      "PASS: Chrome cross-site navigation, Lax-cookie isolation, PKCE challenge, same-site cookie redemption, one-time callback, exact zero balance, unavailable/expired states, desktop/mobile rendering. All network requests intercepted locally."
    );
    console.log("Intercepted requests:", requests.length);
    console.log("Screenshots:", out);
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
