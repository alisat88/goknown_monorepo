import { useEffect, useRef } from "react";

import api from "../services/api";
import { useAuth } from "./auth";
import { useSocket } from "./socket";

// Socket events invalidate badges; the database supplies the actual counts.
export default function useMessengerUnread() {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const latest = useRef({ user, updateUser });
  latest.current = { user, updateUser };
  useEffect(() => {
    if (!user?.sync_id) return;
    let disposed = false;
    let revision = 0;
    const refresh = async () => {
      revision += 1;
      const request = revision;
      try {
        const { data } = await api.get("/conversations/unread");
        if (disposed || request !== revision) return;
        const { current } = latest;
        if (
          current.user.unread !== data.unread ||
          JSON.stringify(current.user.conversations) !==
            JSON.stringify(data.conversations)
        ) {
          current.updateUser({ ...current.user, ...data });
        }
      } catch {
        /* Keep the last known counts during a temporary connection failure. */
      }
    };
    refresh();
    socket.on("connect", refresh);
    socket.on("conversationsChanged", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      disposed = true;
      socket.off("connect", refresh);
      socket.off("conversationsChanged", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [socket, user?.sync_id]);
}
