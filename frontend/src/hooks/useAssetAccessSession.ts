import { useEffect } from "react";
import { v4 as uuid } from "uuid";

import api from "../services/api";
import { IDLE_MS, PreviewSessionTracker } from "./previewSessionTracker";

export default function useAssetAccessSession(
  assetSyncId: string | undefined,
  ready: boolean
) {
  useEffect(() => {
    if (
      process.env.REACT_APP_ACTIVITY_LEDGER_ENABLED !== "true" ||
      !assetSyncId ||
      !ready
    )
      return undefined;
    const { authorization } = api.defaults.headers;
    if (
      typeof authorization !== "string" ||
      !authorization.startsWith("Bearer ")
    )
      return undefined;
    let tracker: PreviewSessionTracker | undefined;
    let blocked = false;
    let lastInput = performance.now();
    let lastTick = performance.now();
    const path = `/me/activity/assets/${encodeURIComponent(
      assetSyncId
    )}/access-sessions`;
    const fail = () => {
      blocked = true;
      // Intentionally no exception, URL, identity or request data in logs.
      console.warn(
        "[activity-ledger] preview capture incomplete; viewing remains available"
      );
    };
    const send = async (
      route: string,
      body: object,
      attempt = 0
    ): Promise<any> => {
      // Sequential retry preserves the exact idempotency key/sequence.
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${api.defaults.baseURL}${route}`, {
          method: "POST",
          keepalive: true,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          if (response.status < 500) blocked = true;
          throw new Error("activity unavailable");
        }
        return await response.json();
      } catch {
        if (!blocked && attempt === 0) return send(route, body, 1);
        throw new Error("activity unavailable");
      } finally {
        window.clearTimeout(timeout);
      }
    };
    const stop = (reason: string, count = true) => {
      tracker?.end(reason, count);
      tracker = undefined;
    };
    const reconcile = () => {
      const now = performance.now();
      if (api.defaults.headers.authorization !== authorization) {
        stop("navigation", false);
        blocked = true;
      }
      if (now - lastTick > 20000 || now < lastTick) {
        stop("sleep", false);
        lastInput = now - IDLE_MS;
      }
      lastTick = now;
      if (document.visibilityState !== "visible") {
        stop("hidden");
        return;
      }
      if (!navigator.onLine) {
        stop("offline", false);
        return;
      }
      if (now - lastInput >= IDLE_MS) {
        stop("idle", false);
        return;
      }
      if (blocked) return;
      if (!tracker)
        tracker = new PreviewSessionTracker(
          path,
          uuid(),
          send,
          () => performance.now(),
          fail
        );
      tracker.heartbeat();
    };
    const input = () => {
      lastInput = performance.now();
      reconcile();
    };
    const pagehide = () => stop("pagehide");
    const offline = () => stop("offline", false);
    const visible = () => {
      if (document.visibilityState === "visible") lastInput = performance.now();
      reconcile();
    };
    const timer = window.setInterval(reconcile, 1000);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("offline", offline);
    window.addEventListener("online", reconcile);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("pageshow", reconcile);
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach((event) =>
      window.addEventListener(event, input, { passive: true })
    );
    reconcile();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", reconcile);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("pageshow", reconcile);
      ["pointerdown", "keydown", "scroll", "touchstart"].forEach((event) =>
        window.removeEventListener(event, input)
      );
      stop("navigation");
    };
  }, [assetSyncId, ready]);
}
