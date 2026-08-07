"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { languageNames, languages, translations, type Language } from "./translations";

const STORAGE_KEY = "tourmate-language";
const LanguageContext = createContext<{ language: Language; setLanguage: (value: Language) => void }>({
  language: "en",
  setLanguage: () => undefined,
});
const originals = new WeakMap<Node, string>();
const attributeOriginals = new WeakMap<Element, Map<string, string>>();
const languageListeners = new Set<() => void>();
let inMemoryLanguage: Language = "en";

function getSavedLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return languages.includes(stored as Language) ? stored as Language : inMemoryLanguage;
  } catch {
    return inMemoryLanguage;
  }
}

function getServerLanguage(): Language {
  return "en";
}

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveLanguage(value: Language) {
  inMemoryLanguage = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The language still updates for this tab when storage is unavailable.
  }
  languageListeners.forEach((listener) => listener());
}

function LanguageSelector({ language, setLanguage }: { language: Language; setLanguage: (value: Language) => void }) {
  return <label className="language-selector"><span className="language-icon" aria-hidden="true">文</span><span className="language-label">{translations[language].Language}</span><select aria-label={translations[language].Language} value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{languages.map((code) => <option key={code} value={code}>{languageNames[code]}</option>)}</select></label>;
}

function translateTree(root: ParentNode, language: Language) {
  const dictionary = translations[language];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest(".language-selector, .translation-managed, script, style")) continue;
    const current = node.textContent ?? "";
    if (!originals.has(node)) originals.set(node, current);
    const original = originals.get(node) ?? current;
    const clean = original.trim();
    if (!clean || !dictionary[clean]) { if (language === "en" && current !== original) node.textContent = original; continue; }
    node.textContent = original.replace(clean, dictionary[clean]);
  }
  root.querySelectorAll?.<Element>("[placeholder], [aria-label], [title]").forEach((element) => {
    if (element.closest(".language-selector, .translation-managed")) return;
    let saved = attributeOriginals.get(element);
    if (!saved) { saved = new Map(); attributeOriginals.set(element, saved); }
    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      const current = element.getAttribute(attribute); if (current === null) return;
      if (!saved!.has(attribute)) saved!.set(attribute, current);
      const original = saved!.get(attribute)!;
      element.setAttribute(attribute, language === "en" ? original : (dictionary[original] ?? original));
    });
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore uses the English server snapshot for SSR and the first
  // hydration pass, then switches to the saved browser snapshot after hydration.
  const language = useSyncExternalStore(subscribeToLanguage, getSavedLanguage, getServerLanguage);
  const [nav, setNav] = useState<HTMLElement | null>(null);
  const applying = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setNav(document.querySelector<HTMLElement>("header .nav")));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    applying.current = true; translateTree(document.body, language); applying.current = false;
    let pendingFrame: number | null = null;
    const observer = new MutationObserver(() => {
      if (applying.current) return;
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
      pendingFrame = requestAnimationFrame(() => {
        applying.current = true;
        translateTree(document.body, language);
        setNav(document.querySelector<HTMLElement>("header .nav"));
        applying.current = false;
        pendingFrame = null;
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    };
  }, [language]);
  const setLanguage = (value: Language) => saveLanguage(value);
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}{nav && createPortal(<LanguageSelector language={language} setLanguage={setLanguage} />, nav)}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
