"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Json } from "@/utils/supabase/database.types";
import { useLanguage } from "../i18n/language-context";
import { translations } from "../i18n/translations";

type ItemType = "hotel" | "attraction";
type ToggleResult = "saved" | "removed" | "auth" | "error";
type FavouritesContextValue = {
  isLoading: boolean;
  loadError: boolean;
  savedIds: Set<string>;
  toggle: (itemId: string, snapshot: Json) => Promise<ToggleResult>;
};

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({ children, itemType, returnPath }: { children: React.ReactNode; itemType: ItemType; returnPath: "/hotels" | "/attractions" }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFavourites() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        if (authError || !user) return;

        setUserId(user.id);
        const { data, error } = await supabase
          .from("favourites")
          .select("item_id")
          .eq("user_id", user.id)
          .eq("item_type", itemType);
        if (!active) return;
        setLoadError(Boolean(error));
        if (!error) setSavedIds(new Set(data.map((item) => item.item_id)));
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadFavourites();
    return () => { active = false; };
  }, [itemType, supabase]);

  const toggle = useCallback(async (itemId: string, snapshot: Json): Promise<ToggleResult> => {
    if (!userId) {
      router.push(`/sign-in?redirectTo=${encodeURIComponent(returnPath)}`);
      return "auth";
    }

    if (savedIds.has(itemId)) {
      const { error } = await supabase
        .from("favourites")
        .delete()
        .eq("user_id", userId)
        .eq("item_type", itemType)
        .eq("item_id", itemId);
      if (error) return "error";
      setSavedIds((current) => {
        const next = new Set(current);
        next.delete(itemId);
        return next;
      });
      return "removed";
    }

    const { error } = await supabase.from("favourites").upsert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      item_snapshot: snapshot,
    }, { onConflict: "user_id,item_type,item_id", ignoreDuplicates: true });
    if (error) return "error";
    setSavedIds((current) => new Set(current).add(itemId));
    return "saved";
  }, [itemType, returnPath, router, savedIds, supabase, userId]);

  const value = useMemo(() => ({ isLoading, loadError, savedIds, toggle }), [isLoading, loadError, savedIds, toggle]);
  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function FavouriteButton({ itemId, itemName, snapshot }: { itemId: string; itemName: string; snapshot: Json }) {
  const context = useContext(FavouritesContext);
  const { language } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "removed" | "auth" | "error" | null>(null);

  if (!context) throw new Error("FavouriteButton must be used inside FavouritesProvider.");
  const isSaved = context.savedIds.has(itemId);
  const t = (value: string) => translations[language][value] ?? value;

  async function handleToggle() {
    setIsUpdating(true);
    setFeedback(null);
    const result = await context!.toggle(itemId, snapshot);
    setFeedback(result);
    setIsUpdating(false);
  }

  const label = t(context.isLoading
    ? "Loading favourites…"
    : isUpdating
      ? "Updating favourite…"
      : isSaved
        ? "Remove from favourites"
        : "Add to favourites");

  return (
    <div className="favourite-control translation-managed">
      <button
        className={`favourite-button${isSaved ? " is-saved" : ""}`}
        type="button"
        onClick={handleToggle}
        disabled={context.isLoading || isUpdating}
        aria-pressed={isSaved}
        aria-label={`${label}: ${itemName}`}
        title={label}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.4 13A5.2 5.2 0 0 1 12 5.9 5.2 5.2 0 0 1 19.6 13L12 20.4Z" /></svg>
        <span>{label}</span>
      </button>
      <div className="favourite-feedback" aria-live="polite">
        {context.loadError && !feedback && <span className="is-error">{t("Could not load favourites.")}</span>}
        {feedback === "saved" && <span>{t("Added to favourites.")}</span>}
        {feedback === "removed" && <span>{t("Removed from favourites.")}</span>}
        {feedback === "auth" && <span>{t("Sign in to save favourites. Taking you to sign in…")}</span>}
        {feedback === "error" && <span className="is-error">{t("Could not update this favourite. Please try again.")}</span>}
      </div>
    </div>
  );
}
