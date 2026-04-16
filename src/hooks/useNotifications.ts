"use client";
// Hook para manejar notificaciones en tiempo real (polling simple para MVP)
// En producción, reemplazar con WebSockets o Server-Sent Events
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { Notification } from "@/types";

const POLL_INTERVAL = 30_000; // 30 segundos

export function useNotifications() {
  const { isSignedIn } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(false);

  const fetch = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res  = await window.fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.data || []);
      setUnread(data.noLeidas || 0);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  const markAllRead = useCallback(async () => {
    await window.fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    setUnread(0);
  }, []);

  // Fetch inicial y polling
  useEffect(() => {
    if (!isSignedIn) return;
    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isSignedIn, fetch]);

  return { notifications, unread, loading, refetch: fetch, markAllRead };
}
