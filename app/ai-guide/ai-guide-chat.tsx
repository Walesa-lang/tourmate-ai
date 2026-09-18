"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/language-context";
import { translations } from "../i18n/translations";
import type { AiGuideErrorResponse, AiGuideMessage, AiGuideSuccessResponse } from "@/utils/ai-guide/contracts";

type Message = { id: number; role: "user" | "assistant"; text: string; timestamp: number; emergency?: boolean; error?: boolean };

const WELCOME = "Hi! I’m your TourMate AI guide. Ask about Namibia destinations, sample stays, activities, routes, or general travel preparation. My demo answers are prewritten, so please verify details before travelling.";
const suggestions = ["Ideas for a Namibia route", "Find accommodation", "Recommend attractions", "Travel preparation tips"];
const getTimestamp = () => Date.now();

function ChatIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9h8M8 13h5M12 3a9 9 0 0 0-8 13l-1 5 5-2a9 9 0 1 0 4-16Z" /></svg>;
}

export function AiGuideChat() {
  const { language } = useLanguage();
  const t = (value: string) => translations[language][value] ?? value;
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const messageId = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([{ id: ++messageId.current, role: "assistant", text: t(WELCOME), timestamp: getTimestamp() }]);
    // The welcome message follows the active interface language on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }, [messages, thinking]);

  useEffect(() => () => activeRequestRef.current?.abort(), []);

  async function submitMessage(value: string) {
    const clean = value.trim();
    if (!clean || activeRequestRef.current) return;

    const controller = new AbortController();
    activeRequestRef.current = controller;
    const userMessage: Message = { id: ++messageId.current, role: "user", text: clean, timestamp: getTimestamp() };
    const conversation: AiGuideMessage[] = [...messages, userMessage]
      .slice(-20)
      .map((message) => ({ role: message.role, content: message.text }));
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setThinking(true);
    setAnnouncement(t("TourMate AI is thinking"));

    try {
      const response = await fetch("/api/ai-guide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language, messages: conversation }),
        signal: controller.signal,
      });
      const result = await response.json() as AiGuideSuccessResponse | AiGuideErrorResponse;
      if (!response.ok || !("data" in result)) throw new Error("AI Guide request failed.");

      const reply: Message = {
        id: ++messageId.current,
        role: "assistant",
        text: result.data.message,
        timestamp: getTimestamp(),
        emergency: result.data.emergency,
      };
      setMessages((current) => [...current, reply]);
      setAnnouncement(t("TourMate AI replied"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessages((current) => [...current, {
        id: ++messageId.current,
        role: "assistant",
        text: t("TourMate AI is temporarily unavailable. Please try again in a moment."),
        timestamp: getTimestamp(),
        error: true,
      }]);
      setAnnouncement(t("TourMate AI is temporarily unavailable. Please try again in a moment."));
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setThinking(false);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
  }

  function clearConversation() {
    if (!window.confirm(t("Clear this conversation? This cannot be undone."))) return;
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setThinking(false);
    setDraft("");
    setMessages([{ id: ++messageId.current, role: "assistant", text: t(WELCOME), timestamp: getTimestamp() }]);
    setAnnouncement(t("Conversation cleared"));
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const formatTime = (value: number) => new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : language, { hour: "numeric", minute: "2-digit" }).format(value);

  return (
    <section className="guide-workspace" aria-label={t("Interactive AI guide demo")}>
      <div className="container guide-layout">
        <section className="chat-panel" aria-labelledby="chat-title">
          <header className="chat-header">
            <div className="assistant-avatar" aria-hidden="true"><ChatIcon /></div>
            <div className="chat-heading-copy">
              <h2 id="chat-title">TourMate AI</h2>
              <p><span className="status-dot" aria-hidden="true" />{t("Demo mode")} · Namibia field guide</p>
            </div>
            <button className="clear-chat-button" type="button" onClick={clearConversation} disabled={messages.length <= 1 && !thinking} aria-label={t("Clear conversation")}>{t("Clear conversation")}</button>
          </header>

          <div className="guide-quick-actions" aria-label="Start exploring"><Link href="/explore"><span>01</span> Discover destinations</Link><Link href="/hotels"><span>02</span> Find a sample stay</Link><Link href="/attractions"><span>03</span> Explore activities</Link><button type="button" onClick={() => submitMessage("How should I prepare for a Namibia road trip?")} disabled={thinking}><span>04</span> Road trip tips</button></div>

          <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label={t("Conversation messages")}>
            {messages.map((message) => (
              <article className={`message-row ${message.role === "user" ? "user-message" : "assistant-message"}`} key={message.id}>
                {message.role === "assistant" && <div className="message-avatar" aria-hidden="true">AI</div>}
                <div className="message-content">
                  <div className="message-meta"><span>{message.role === "user" ? t("You") : "TourMate AI"}</span><time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time></div>
                  {message.emergency && <div className="emergency-warning" role="alert"><strong>{t("Emergency warning")}</strong>{t("Contact local emergency authorities now. Do not rely only on TourMate AI.")}</div>}
                  <p role={message.error ? "alert" : undefined}>{message.text}</p>
                </div>
                {message.role === "user" && <div className="message-avatar" aria-hidden="true">{t("You")}</div>}
              </article>
            ))}
            {thinking && (
              <article className="message-row assistant-message thinking-message" aria-label={t("TourMate AI is thinking")}>
                <div className="message-avatar" aria-hidden="true">AI</div>
                <div className="message-content"><span>TourMate AI</span><div className="thinking-bubble"><span /><span /><span /><span className="sr-only">{t("TourMate AI is thinking")}</span></div></div>
              </article>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat-composer">
            <div className="suggestions" aria-label={t("Suggested questions")}>
              {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => submitMessage(t(suggestion))} disabled={thinking}>{t(suggestion)}</button>)}
            </div>
            <form className="message-form" onSubmit={(event) => { event.preventDefault(); submitMessage(draft); }}>
              <label htmlFor="travel-question">{t("Ask TourMate AI about your trip")}</label>
              <div className="message-input-row">
                <textarea ref={inputRef} id="travel-question" name="travelQuestion" rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitMessage(draft); } }} placeholder={t("Ask TourMate AI anything about your trip")} disabled={thinking} aria-describedby="composer-help" />
                <button className="button send-button" type="submit" disabled={!draft.trim() || thinking}>{thinking ? t("Thinking…") : t("Send")}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14" /></svg></button>
              </div>
            </form>
            <p id="composer-help" className="preview-note">{t("Press Enter to send. Use Shift+Enter for a new line.")}</p>
            <p className="demo-privacy-note">{t("Demo only. Messages stay in this browser tab and are not saved to your profile or sent to a live AI.")}</p>
          </div>
        </section>

        <aside className="trip-panel" aria-labelledby="demo-details-title">
          <div className="trip-panel-heading"><span>{t("Demo experience")}</span><h2 id="demo-details-title">{t("What I can help with")}</h2><p>{t("Try a question about your next journey. Demo answers are local, prewritten, and available without API credits.")}</p></div>
          <div className="demo-capabilities">
            {["Trip ideas and routes", "Stays and attractions", "Transport and budgets", "General safety guidance"].map((item, index) => <div className="demo-capability" key={item}><span aria-hidden="true">{index + 1}</span><p>{t(item)}</p></div>)}
          </div>
          <div className="trip-tip"><span aria-hidden="true">✦</span><p><strong>{t("Remember")}</strong>{t("Live availability, prices, opening hours, road conditions, and emergency information are not active in demo mode.")}</p></div>
        </aside>
      </div>
      <p className="sr-only" aria-live="assertive" aria-atomic="true">{announcement}</p>
    </section>
  );
}
