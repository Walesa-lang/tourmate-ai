"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "../i18n/language-context";
import { translations } from "../i18n/translations";
import { getInstallAvailability, isIosSafari, type InstallAvailability } from "@/utils/pwa/install";

const DISMISS_KEY = "tourmate-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaManager() {
  const { language } = useLanguage();
  const t = (value: string) => translations[language][value] ?? value;
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [availability, setAvailability] = useState<InstallAvailability>("hidden");

  useEffect(() => {
    const canRegister = process.env.NODE_ENV === "production"
      || new URLSearchParams(window.location.search).has("pwa-sw-test");
    if (canRegister && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    let hasCapturedPrompt = false;
    const initialFrame = requestAnimationFrame(() => {
      if (hasCapturedPrompt) return;
      const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
      const isLocalTest = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
        && new URLSearchParams(window.location.search).get("pwa-install-test") === "prompt";
      setAvailability(getInstallAvailability({
        isStandalone: isStandalone(),
        isDismissed: dismissed,
        hasPrompt: isLocalTest,
        isIosSafari: isIosSafari(navigator.userAgent),
      }));
    });

    function handleInstallPrompt(event: Event) {
      hasCapturedPrompt = true;
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setInstallEvent(promptEvent);
      setAvailability(getInstallAvailability({
        isStandalone: isStandalone(),
        isDismissed: localStorage.getItem(DISMISS_KEY) === "true",
        hasPrompt: true,
        isIosSafari: false,
      }));
    }

    function handleInstalled() {
      setInstallEvent(null);
      setAvailability("hidden");
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      cancelAnimationFrame(initialFrame);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setAvailability("hidden");
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setAvailability("hidden");
  }

  if (availability === "hidden") return null;

  return (
    <aside className="pwa-install" aria-labelledby="pwa-install-title">
      <Image src="/icons/tourmate-192.png" width="52" height="52" alt="" />
      <div className="pwa-install-copy">
        <h2 id="pwa-install-title">{t("Install TourMate")}</h2>
        <p>{availability === "ios"
          ? t("On iPhone or iPad, tap Share, then Add to Home Screen.")
          : t("Add TourMate AI to your device for quick access to your travel tools.")}</p>
      </div>
      {availability === "prompt" && <button className="button pwa-install-button" type="button" onClick={install}>{t("Install app")}</button>}
      <button className="pwa-dismiss-button" type="button" onClick={dismiss}>{t("Not now")}</button>
    </aside>
  );
}
