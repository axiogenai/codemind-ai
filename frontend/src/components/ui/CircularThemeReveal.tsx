"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { useTheme } from "../../context/ThemeContext";

type Theme = "light" | "dark";
type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
    skipTransition: () => void;
  };
};

export interface CircularThemeRevealProps {
  initialTheme?: Theme;
  duration?: number;
  storageKey?: string;
  onThemeChange?: (theme: Theme) => void;
  children?: React.ReactNode;
  className?: string;
}

/** Gravlens' center-out light reveal / edge-in dark reveal, with scoped colors. */
export function CircularThemeReveal({
  initialTheme = "dark",
  duration = 780,
  storageKey = "codemind_theme",
  onThemeChange,
  children,
  className = "",
}: CircularThemeRevealProps) {
  const [theme, setTheme] = React.useState<Theme>(initialTheme);
  const [busy, setBusy] = React.useState(false);
  const locked = React.useRef(false);
  const root = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const transitionName = `circular-theme-${id}`;

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* Storage is optional in sandboxed previews. */
    }
  }, [storageKey]);

  async function toggle() {
    if (locked.current || !root.current) return;
    locked.current = true;
    setBusy(true);
    const next: Theme = theme === "dark" ? "light" : "dark";
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      flushSync(() => setTheme(next));
      try {
        if (storageKey) localStorage.setItem(storageKey, next);
      } catch {}
      onThemeChange?.(next);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as TransitionDocument;
    const surface = root.current;
    const bounds = surface.getBoundingClientRect();
    const radius = Math.hypot(bounds.width / 2, bounds.height / 2);
    const zero = "circle(0px at 50% 50%)";
    const full = `circle(${radius}px at 50% 50%)`;
    const animationDuration = Number.isFinite(duration) ? Math.max(0, duration) : 780;
    try {
      if (doc.startViewTransition && !reduced) {
        const transition = doc.startViewTransition(commit);
        let wave: Animation | undefined;
        // Always restore the live DOM, even if the browser loses a snapshot or stalls.
        const watchdog = window.setTimeout(
          () => transition.skipTransition(),
          animationDuration + 1500
        );
        try {
          await transition.ready;
          wave = document.documentElement.animate(
            { clipPath: next === "light" ? [zero, full] : [full, zero] },
            {
              duration: animationDuration,
              easing: "cubic-bezier(0.4,0,0.2,1)",
              fill: "none",
              pseudoElement: `::view-transition-${
                next === "light" ? "new" : "old"
              }(${transitionName})`,
            }
          );
          await wave.finished;
        } catch {
          /* Failed snapshots still complete the committed theme. */
        } finally {
          transition.skipTransition();
          wave?.cancel();
          window.clearTimeout(watchdog);
        }
        await transition.finished.catch(() => {});
      } else {
        // A direct change avoids blank color overlays in unsupported browsers.
        commit();
      }
    } catch {
      commit();
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <div
      ref={root}
      data-theme={theme}
      className={`ctr-surface ${className}`}
      style={{ viewTransitionName: transitionName }}
    >
      <style>{`
        .ctr-surface { --ctr-bg:#000; --ctr-fg:#fafafa; --ctr-muted:#aaa; --ctr-border:#27272a; --ctr-card:#101012; position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:32px; min-height:100svh; box-sizing:border-box; overflow:hidden; background:var(--ctr-bg); color:var(--ctr-fg); font-family:Inter,system-ui,sans-serif; color-scheme:dark; }
        .ctr-surface[data-theme="light"] { --ctr-bg:#f5f5f7; --ctr-fg:#1d1d1f; --ctr-muted:#6e6e73; --ctr-border:#d8d8dc; --ctr-card:#fff; color-scheme:light; }
        .ctr-toggle { display:flex; flex-shrink:0; align-items:center; justify-content:space-between; width:68px; height:36px; padding:4px; border:0; border-radius:999px; background:var(--ctr-card); color:var(--ctr-fg); cursor:pointer; }
        .ctr-toggle:focus-visible { outline:2px solid var(--ctr-fg); outline-offset:4px; }
        .ctr-toggle:disabled { cursor:wait; }
        .ctr-icon { display:grid; place-items:center; width:26px; height:26px; border-radius:50%; }
        .ctr-icon.active { background:var(--ctr-fg); color:var(--ctr-bg); }
        .ctr-content { padding:0 24px; text-align:center; }
        .ctr-title { color:var(--ctr-fg); font-size:clamp(28px,8vw,104px); font-weight:750; line-height:1.38; letter-spacing:.025em; margin:0; }
        @media(max-width:480px) { .ctr-surface {gap:24px;} .ctr-content {padding:0 16px;} }
        ::view-transition-group(${transitionName}) { animation:none; }
        ::view-transition-old(${transitionName}), ::view-transition-new(${transitionName}) { animation:none; mix-blend-mode:normal; }
        ::view-transition-old(${transitionName}) { z-index:${theme === "light" ? 1 : 2}; }
        ::view-transition-new(${transitionName}) { z-index:${theme === "light" ? 2 : 1}; }
      `}</style>
      <button
        id={`theme-toggle-${id}`}
        className="ctr-toggle"
        type="button"
        role="switch"
        aria-label="Dark mode"
        aria-checked={theme === "dark"}
        disabled={busy}
        onClick={toggle}
      >
        <span
          className={`ctr-icon ${theme === "light" ? "active" : ""}`}
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </svg>
        </span>
        <span
          className={`ctr-icon ${theme === "dark" ? "active" : ""}`}
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
          </svg>
        </span>
      </button>
      {children ?? (
        <main className="ctr-content">
          <h1 className="ctr-title">
            LET THE LIGHT
            <br />
            CHANGE YOUR VIEW.
          </h1>
        </main>
      )}
    </div>
  );
}

export interface CircularThemeToggleProps {
  className?: string;
  disabled?: boolean;
}

/** Standalone Gravlens-style Circular Theme Toggle button connecting to App ThemeContext. */
export function CircularThemeToggle({
  className = "",
  disabled = false,
}: CircularThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`ctr-toggle ${className}`}
      type="button"
      role="switch"
      aria-label="Toggle dark/light theme"
      aria-checked={theme === "dark"}
      disabled={disabled}
      onClick={() => toggleTheme()}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <span
        className={`ctr-icon ${theme === "light" ? "active" : ""}`}
        aria-hidden="true"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </svg>
      </span>
      <span
        className={`ctr-icon ${theme === "dark" ? "active" : ""}`}
        aria-hidden="true"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
        </svg>
      </span>
    </button>
  );
}

export default CircularThemeReveal;
