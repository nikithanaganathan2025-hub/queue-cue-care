import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQc } from "@/lib/qc/store";

/**
 * Shared dashboard header: language toggle, text size, read-aloud and sign out.
 *
 * The read-aloud button label is derived from `lang` + `speaking` state, so it
 * re-renders the moment the language is switched (the old build cached the
 * Hindi label until the button was pressed again).
 */
export function AppHeader({ subtitle, summary }: { subtitle: string; summary?: string }) {
  const { session, signOut, lang, toggleLang, t } = useQc();
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * scale}px`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [scale]);

  // Switching language must stop any narration already running in the old
  // language, otherwise the button and the voice disagree.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [lang]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function handleSpeak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(summary ?? subtitle);
    utter.lang = lang === "hi" ? "hi-IN" : "en-US";
    utter.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(lang === "hi" ? "hi" : "en"));
    if (match) utter.voice = match;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }

  function handleSignOut() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b-4 border-pop bg-primary px-5 py-3 text-primary-foreground">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-2xl font-bold tracking-wide">Queue Cue</h1>
        <span className="text-sm opacity-80">{subtitle}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="flex items-center gap-1 rounded-md bg-secondary px-1.5 py-1">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.85, +(s - 0.1).toFixed(2)))}
            className="rounded border border-border/60 px-2 py-0.5 hover:bg-accent hover:text-accent-foreground"
            aria-label={t("Smaller text", "छोटा टेक्स्ट")}
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            className="rounded border border-border/60 px-2 py-0.5 hover:bg-accent hover:text-accent-foreground"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(1.4, +(s + 0.1).toFixed(2)))}
            className="rounded border border-border/60 px-2 py-0.5 hover:bg-accent hover:text-accent-foreground"
            aria-label={t("Larger text", "बड़ा टेक्स्ट")}
          >
            A+
          </button>
        </div>

        <button
          type="button"
          onClick={toggleLang}
          className="rounded-full bg-card px-3 py-1.5 font-bold text-card-foreground hover:bg-accent"
        >
          {lang === "en" ? "EN → हिंदी" : "हिंदी → EN"}
        </button>

        <button
          type="button"
          onClick={handleSpeak}
          className="rounded-full bg-pop px-3 py-1.5 font-bold text-pop-foreground hover:bg-card hover:text-card-foreground"
        >
          {speaking ? t("Stop reading", "पढ़ना बंद करें") : t("Read aloud", "पढ़कर सुनाएँ")}
        </button>

        {session ? (
          <>
            <span className="hidden opacity-90 sm:inline">{session.name}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-primary-foreground/60 px-3 py-1.5 hover:bg-secondary"
            >
              {t("Sign out", "साइन आउट")}
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
