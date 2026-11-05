import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { WORKSPACE_FILES } from "@/nexora/files";
import { KeyValue } from "@/nexora/ui";
import { cn } from "@/lib/utils";
import {
  Activity,
  Archive,
  ArrowUpRight,
  BatteryFull,
  Clock3,
  Command,
  Cpu,
  FolderClosed,
  Gauge,
  Maximize2,
  Minus,
  Orbit,
  Radio,
  Settings2,
  ShieldCheck,
  Signal,
  Square,
  Terminal,
  Wifi,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { NexoraWorkspace } from "@/workspace/WorkspaceWindow";

type WindowId = "nexora" | "archive" | "system";

type AuroraWindowState = {
  id: WindowId;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
};

const TITLE_BAR_HEIGHT = 40;
const DOCK_OFFSET = 136;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function initialGeometry(id: WindowId): { x: number; y: number; w: number; h: number } {
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  const compact = vw < 1024;

  if (id === "nexora") {
    const w = compact ? vw - 16 : Math.min(1220, vw - 132);
    const h = compact ? vh - DOCK_OFFSET : Math.min(744, vh - 148);
    return {
      x: Math.round((vw - w) / 2),
      y: compact ? 52 : 58,
      w,
      h,
    };
  }

  const size = id === "archive" ? { w: 700, h: 520 } : { w: 600, h: 470 };
  const w = Math.min(size.w, vw - 32);
  const h = Math.min(size.h, vh - DOCK_OFFSET);
  return { x: Math.round((vw - w) / 2), y: Math.max(56, Math.round((vh - h) / 2)), w, h };
}

function NexoraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nx-mark" x1="4" y1="26" x2="28" y2="6">
          <stop stopColor="#7ee7c7" />
          <stop offset="0.55" stopColor="#a8ecdd" />
          <stop offset="1" stopColor="#e8c37a" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.8 28 9.4v13.2L16 29.2 4 22.6V9.4L16 2.8Z"
        fill="none"
        stroke="url(#nx-mark)"
        strokeWidth="1.2"
      />
      <path
        d="M16 9.2 22 12.6v6.8L16 22.8 10 19.4v-6.8L16 9.2Z"
        fill="none"
        stroke="url(#nx-mark)"
        strokeWidth="0.8"
        opacity="0.7"
      />
      <circle cx="16" cy="16" r="1.7" fill="url(#nx-mark)" />
      <path d="M4.8 15.9h5M22.2 15.9h5" stroke="url(#nx-mark)" strokeWidth="0.7" opacity="0.6" />
    </svg>
  );
}

const ACCENTS = {
  mint: "#7ee7c7",
  amber: "#e8c37a",
  ice: "#9fd8e8",
};

const DOCK_APPS: {
  id: WindowId | "orbit" | "settings" | "terminal";
  name: string;
  icon: typeof Archive;
  live: boolean;
}[] = [
  { id: "archive", name: "ARCHIVE", icon: Archive, live: true },
  { id: "system", name: "SYSTEM", icon: Gauge, live: true },
  { id: "orbit", name: "ORBIT", icon: Orbit, live: false },
  { id: "settings", name: "SETTINGS", icon: Settings2, live: false },
  { id: "terminal", name: "TERMINAL", icon: Terminal, live: false },
];

function WindowTitleBar({
  window,
  active,
  onDragStart,
  onToggleMaximize,
  onMinimize,
  onClose,
}: {
  window: AuroraWindowState;
  active: boolean;
  onDragStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const isNexora = window.id === "nexora";
  const title = isNexora ? "NEXORA WORKSPACE" : window.id === "archive" ? "ARCHIVE" : "SYSTEM";
  return (
    <div
      data-window-titlebar
      onPointerDown={onDragStart}
      onDoubleClick={onToggleMaximize}
      className={cn(
        "flex h-10 shrink-0 select-none items-center justify-between border-b border-[var(--a-line)] px-2.5",
        active ? "bg-white/[0.035]" : "bg-transparent",
      )}
      style={{ height: TITLE_BAR_HEIGHT }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full border border-[#ff8a7a]/40 bg-[#ff8a7a]/25" />
          <span className="size-2 rounded-full border border-[#e8c37a]/40 bg-[#e8c37a]/25" />
          <span className="size-2 rounded-full border border-[#7ee7c7]/40 bg-[#7ee7c7]/25" />
        </div>
        <div className="mx-1 h-4 w-px bg-[var(--a-line)]" />
        {isNexora ? (
          <NexoraMark className="size-4" />
        ) : window.id === "archive" ? (
          <FolderClosed className="size-3.5 text-[var(--a-mint)]/80" />
        ) : (
          <Gauge className="size-3.5 text-[var(--a-mint)]/80" />
        )}
        <span className="truncate font-mono text-[10px] tracking-[0.18em] text-[var(--a-text)]/85 uppercase">
          {title}
        </span>
        {isNexora ? (
          <span className="hidden items-center gap-1.5 rounded-sm border border-[var(--a-line)] px-1.5 py-0.5 font-mono text-[8px] tracking-[0.16em] text-[var(--a-muted)] uppercase sm:inline-flex">
            <span className="size-1 rounded-full bg-[var(--a-mint)]" />
            AURORA WM · 04
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-0.5" onPointerDown={(event) => event.stopPropagation()}>
        <button
          type="button"
          aria-label={`Minimize ${title}`}
          data-window-control="minimize"
          onClick={onMinimize}
          className="aurora-focus flex size-7 items-center justify-center rounded-sm text-[var(--a-muted)] transition-colors hover:bg-white/[0.07] hover:text-[var(--a-text)]"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`${window.maximized ? "Restore" : "Maximize"} ${title}`}
          data-window-control="maximize"
          onClick={onToggleMaximize}
          className="aurora-focus flex size-7 items-center justify-center rounded-sm text-[var(--a-muted)] transition-colors hover:bg-white/[0.07] hover:text-[var(--a-text)]"
        >
          {window.maximized ? <Square className="size-3" /> : <Maximize2 className="size-3.5" />}
        </button>
        <button
          type="button"
          aria-label={`Close ${title}`}
          data-window-control="close"
          onClick={onClose}
          className="aurora-focus flex size-7 items-center justify-center rounded-sm text-[var(--a-muted)] transition-colors hover:bg-[#ff8a7a]/15 hover:text-[#ffb3a8]"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function ArchiveApp() {
  const groups = ["src/nexora", "src/convex", "src/components", "src"];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--a-line)] px-4 py-3">
        <div>
          <p className="aurora-label">Workspace snapshots</p>
          <p className="mt-1 font-mono text-[11px] text-[var(--a-text)]">
            /workspaces/nexora-aurora
          </p>
        </div>
        <span className="rounded-sm border border-[var(--a-line)] px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-[var(--a-muted)] uppercase">
          read only
        </span>
      </div>
      <div className="aurora-scroll flex-1 p-2">
        {groups.map((group) => {
          const files = WORKSPACE_FILES.filter((file) => file.path.startsWith(`${group}/`) && (group !== "src" || file.path.split("/").length === 2));
          if (!files.length) return null;
          return (
            <div key={group} className="mb-3">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <FolderClosed className="size-3 text-[var(--a-amber)]/70" />
                <span className="font-mono text-[10px] text-[var(--a-muted)]">{group}/</span>
              </div>
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] text-[var(--a-text)]/90">
                      {file.path.split("/").pop()}
                    </p>
                    <p className="truncate font-mono text-[9px] text-[var(--a-muted)]">
                      {file.language} · {file.content.length.toLocaleString()} B
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[8px] tracking-[0.14em] text-[var(--a-muted)] uppercase">
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="border-t border-[var(--a-line)] px-4 py-2 font-mono text-[9px] text-[var(--a-muted)]">
        {WORKSPACE_FILES.length} files indexed · no write access
      </div>
    </div>
  );
}

function SystemApp() {
  const { isAuthenticated, user } = useAuth();
  const mode = isAuthenticated ? (user?.isAnonymous ? "Guest founder session" : user?.email ?? "Founder session") : "Public preview";
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--a-line)] px-4 py-3">
        <p className="aurora-label">Aurora system</p>
        <p className="mt-1 font-mono text-[11px] text-[var(--a-text)]">
          One window manager · one Nexora workspace window
        </p>
      </div>
      <div className="aurora-scroll flex-1 px-4 py-2">
        <KeyValue k="Window manager" v="Aurora WM 04" />
        <KeyValue k="Workspace window" v="nexora · single instance" />
        <KeyValue k="Rail items" v="2 · learning / engineering" />
        <KeyValue k="Docked layouts" v="learning 2 · engineering 4" />
        <KeyValue k="Session" v={mode} />
        <KeyValue k="Task store" v="Convex · nexoraTasks" />
        <KeyValue k="Audit" v="Convex · nexoraAudit" />
        <KeyValue k="Build runner" v="not connected" />
        <KeyValue k="Test runner" v="not connected" />
        <div className="mt-4 rounded-sm border border-[var(--a-line)] bg-white/[0.02] p-3">
          <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.16em] text-[var(--a-mint)] uppercase">
            <ShieldCheck className="size-3" /> separation of duties
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--a-muted)]">
            The plan engine proposes. A signed-in founder approves. Applying is a
            separate server mutation that re-checks ownership, approval state and
            approver identity before writing an audit event. No shell access.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuroraDesktop({ initialWindowOpen = true }: { initialWindowOpen?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const [windows, setWindows] = useState<AuroraWindowState[]>(() =>
    initialWindowOpen
      ? [{ id: "nexora", ...initialGeometry("nexora"), minimized: false, maximized: false }]
      : [],
  );
  const [activeId, setActiveId] = useState<WindowId | null>(
    initialWindowOpen ? "nexora" : null,
  );
  const [workspaceIndex, setWorkspaceIndex] = useState(3);
  const [clock, setClock] = useState(() => new Date());
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setWindows((current) =>
        current.map((win) => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          if (win.maximized) return win;
          const w = Math.min(win.w, vw - 16);
          const h = Math.min(win.h, vh - 88);
          return {
            ...win,
            w,
            h,
            x: clamp(win.x, 8, Math.max(8, vw - w - 8)),
            y: clamp(win.y, 48, Math.max(48, vh - h - 84)),
          };
        }),
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!notice) return;
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3200);
    return () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, [notice]);

  const openWindow = useCallback((id: WindowId) => {
    setWindows((current) => {
      const existing = current.find((win) => win.id === id);
      if (existing) {
        return [
          ...current.filter((win) => win.id !== id),
          { ...existing, minimized: false },
        ];
      }
      return [
        ...current,
        { id, ...initialGeometry(id), minimized: false, maximized: false },
      ];
    });
    setActiveId(id);
    if (id === "nexora") setWorkspaceIndex(3);
  }, []);

  const closeWindow = useCallback((id: WindowId) => {
    setWindows((current) => current.filter((win) => win.id !== id));
    setActiveId((current) => (current === id ? null : current));
  }, []);

  const minimizeWindow = useCallback((id: WindowId) => {
    setWindows((current) =>
      current.map((win) => (win.id === id ? { ...win, minimized: true } : win)),
    );
    setActiveId(null);
  }, []);

  const toggleMaximize = useCallback((id: WindowId) => {
    setWindows((current) =>
      current.map((win) =>
        win.id === id ? { ...win, maximized: !win.maximized } : win,
      ),
    );
  }, []);

  const focusWindow = useCallback((id: WindowId) => {
    setWindows((current) => {
      const target = current.find((win) => win.id === id);
      if (!target) return current;
      return [...current.filter((win) => win.id !== id), target];
    });
    setActiveId(id);
  }, []);

  const beginDrag = useCallback(
    (id: WindowId, event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const win = windows.find((item) => item.id === id);
      if (!win || win.maximized) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = win.x;
      const originY = win.y;

      const move = (moveEvent: PointerEvent) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        setWindows((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  x: clamp(originX + moveEvent.clientX - startX, -item.w + 120, vw - 100),
                  y: clamp(originY + moveEvent.clientY - startY, 46, vh - 90),
                }
              : item,
          ),
        );
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [windows],
  );

  const workspaceNames = ["ORBIT", "STUDIO", "LAB", "NEXORA"];

  return (
    <div className="aurora-root dark">
      <div className="aurora-sky">
        <div className="aurora-ribbon aurora-ribbon-one" />
        <div className="aurora-ribbon aurora-ribbon-two" />
        <div className="aurora-stars" />
        <div className="aurora-grid" />
        <div className="aurora-grain" />
      </div>

      {/* ── top bar ─────────────────────────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between gap-3 border-b border-[var(--a-line)] bg-[#040d0f]/55 px-3 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <NexoraMark className="size-5 shrink-0" />
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-mono text-[10px] tracking-[0.26em] text-[var(--a-text)] uppercase">
              Aurora
            </span>
            <span className="hidden font-mono text-[8px] tracking-[0.2em] text-[var(--a-muted)] uppercase sm:inline">
              OS 04
            </span>
          </div>
          <span className="hidden h-3 w-px bg-[var(--a-line)] sm:block" />
          <span className="hidden font-mono text-[8px] tracking-[0.18em] text-[var(--a-mint)]/70 sm:inline">
            NEXORA OMEGA
          </span>
        </div>

        <div className="hidden items-center gap-1 md:flex" role="tablist" aria-label="Aurora virtual workspaces">
          {workspaceNames.map((name, index) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={workspaceIndex === index}
              onClick={() => {
                setWorkspaceIndex(index);
                if (index === 3) openWindow("nexora");
                else setNotice(`Workspace ${String(index + 1).padStart(2, "0")} · ${name} — Nexora stays docked in 04`);
              }}
              className={cn(
                "aurora-focus flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] uppercase transition-colors",
                workspaceIndex === index
                  ? "border-[var(--a-mint)]/30 bg-[var(--a-mint)]/10 text-[var(--a-mint)]"
                  : "border-transparent text-[var(--a-muted)] hover:border-[var(--a-line)] hover:text-[var(--a-text)]",
              )}
            >
              <span className="text-[8px] opacity-70">{String(index + 1).padStart(2, "0")}</span>
              {name}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <div className="hidden items-center gap-2 text-[var(--a-muted)] sm:flex">
            <Signal className="size-3.5" />
            <Wifi className="size-3.5" />
            <Activity className="size-3.5 text-[var(--a-mint)]/80" />
            <span className="h-3 w-px bg-[var(--a-line)]" />
            <span className="font-mono text-[9px] tabular-nums text-[var(--a-text)]/75">
              {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="font-mono text-[8px] tracking-[0.12em] uppercase">UTC</span>
            <BatteryFull className="size-3.5" />
          </div>
          <Link
            to={isAuthenticated ? "/dashboard" : "/auth?returnTo=/dashboard"}
            className="aurora-focus flex items-center gap-2 rounded-sm border border-[var(--a-line)] bg-white/[0.02] py-1 pr-2 pl-1 transition-colors hover:border-[var(--a-mint)]/30"
            aria-label={isAuthenticated ? "Open founder session" : "Sign in as founder"}
          >
            <span className="flex size-5 items-center justify-center rounded-sm bg-[var(--a-mint)]/12 font-mono text-[9px] text-[var(--a-mint)]">
              {isAuthenticated ? (user?.isAnonymous ? "G" : "F") : "·"}
            </span>
            <span className="hidden font-mono text-[8px] tracking-[0.14em] text-[var(--a-text)]/75 uppercase sm:inline">
              {isAuthenticated ? (user?.isAnonymous ? "Guest" : "Founder") : "Sign in"}
            </span>
          </Link>
        </div>
      </header>

      {/* ── left sidebar ────────────────────────────────────────── */}
      <aside className="absolute top-11 bottom-[84px] left-0 z-20 hidden w-[68px] flex-col items-center justify-between border-r border-[var(--a-line)] bg-[#050e10]/45 py-4 backdrop-blur-sm lg:flex">
        <div className="flex flex-col items-center gap-1.5">
          <span className="aurora-label text-[7px]">Apps</span>
          {DOCK_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              title={app.live ? `Open ${app.name}` : `${app.name} is an Aurora system app`}
              onClick={() => {
                if (app.id === "nexora" || !app.live) {
                  setNotice(`${app.name} — not connected in this build`);
                  return;
                }
                openWindow(app.id as WindowId);
              }}
              className="aurora-focus flex size-9 items-center justify-center rounded-sm border border-transparent text-[var(--a-muted)] transition-colors hover:border-[var(--a-line)] hover:bg-white/[0.04] hover:text-[var(--a-text)]"
            >
              <app.icon className="size-4" strokeWidth={1.6} />
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-px bg-gradient-to-b from-transparent via-[var(--a-mint)]/40 to-transparent" />
          <span className="font-mono text-[8px] tracking-[0.3em] text-[var(--a-muted)] [writing-mode:vertical-rl]">
            ORBIT / 04
          </span>
          <Command className="size-3.5 text-[var(--a-muted)]/70" />
        </div>
      </aside>

      {/* ── right sidebar ───────────────────────────────────────── */}
      <aside className="absolute top-11 right-0 bottom-[84px] z-20 hidden w-[68px] flex-col items-center justify-between border-l border-[var(--a-line)] bg-[#050e10]/45 py-4 backdrop-blur-sm lg:flex">
        <div className="flex flex-col items-center gap-3">
          <span className="aurora-label text-[7px]">Sys</span>
          <div className="flex flex-col items-center gap-2">
            {[
              { label: "CPU", value: 28, color: ACCENTS.mint },
              { label: "MEM", value: 46, color: ACCENTS.ice },
              { label: "NET", value: 18, color: ACCENTS.amber },
            ].map((meter) => (
              <div key={meter.label} className="flex flex-col items-center gap-1">
                <div className="relative h-12 w-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                  <span
                    className="absolute bottom-0 w-full rounded-full"
                    style={{ height: `${meter.value}%`, background: meter.color, opacity: 0.7 }}
                  />
                </div>
                <span className="font-mono text-[7px] tracking-[0.1em] text-[var(--a-muted)]">
                  {meter.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Radio className="size-3.5 text-[var(--a-mint)]/70" />
          <span className="font-mono text-[8px] tracking-[0.28em] text-[var(--a-muted)] [writing-mode:vertical-rl]">
            TELEMETRY
          </span>
          <span className="font-mono text-[8px] text-[var(--a-muted)]">
            {String(clock.getDate()).padStart(2, "0")}
          </span>
        </div>
      </aside>

      {/* ── desktop / nucleus ───────────────────────────────────── */}
      <main className="absolute inset-x-0 top-11 bottom-[84px] z-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex size-[min(72vw,640px)] items-center justify-center opacity-80">
            <div className="aurora-nucleus-ring inset-0 border-[var(--a-mint)]/10" />
            <div className="aurora-nucleus-ring inset-[9%]" style={{ borderStyle: "dashed" }} />
            <div className="aurora-nucleus-ring inset-[22%] border-[var(--a-amber)]/15" />
            <div
              className="absolute inset-[30%] rounded-full border border-[var(--a-mint)]/20"
              style={{ animation: "aurora-pulse 6s ease-in-out infinite" }}
            />
            <div
              className="absolute inset-[6%]"
              style={{ animation: "aurora-spin 90s linear infinite" }}
            >
              <svg viewBox="0 0 400 400" className="size-full" aria-hidden="true">
                <circle
                  cx="200"
                  cy="200"
                  r="190"
                  fill="none"
                  stroke="rgba(126,220,201,0.12)"
                  strokeDasharray="1 13"
                />
                <circle cx="200" cy="18" r="2.5" fill="#e8c37a" opacity="0.8" />
                <circle cx="382" cy="200" r="2" fill="#7ee7c7" opacity="0.7" />
                <circle cx="58" cy="290" r="1.8" fill="#9fd8e8" opacity="0.7" />
              </svg>
            </div>
            <div
              className="absolute inset-[14%]"
              style={{ animation: "aurora-spin 60s linear infinite reverse" }}
            >
              <svg viewBox="0 0 400 400" className="size-full" aria-hidden="true">
                <polygon
                  points="200,36 342,118 342,282 200,364 58,282 58,118"
                  fill="none"
                  stroke="rgba(126,220,201,0.16)"
                  strokeWidth="0.8"
                />
                <polygon
                  points="200,92 296,147 296,253 200,308 104,253 104,147"
                  fill="rgba(126,220,201,0.015)"
                  stroke="rgba(232,195,122,0.16)"
                  strokeWidth="0.6"
                />
              </svg>
            </div>
            <div className="absolute size-16 rounded-full bg-[radial-gradient(circle,rgba(126,231,199,0.55),rgba(126,231,199,0.08)_55%,transparent_72%)] blur-[1px]" />
            <div className="absolute size-2 rounded-full bg-[#d9fff4] shadow-[0_0_24px_rgba(126,231,199,0.9)]" />
            <div className="aurora-scan top-1/2" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[16%] flex flex-col items-center text-center">
          <p className="font-mono text-[9px] tracking-[0.5em] text-[var(--a-mint)]/55 uppercase">
            geometric nucleus · online
          </p>
          <h1 className="aurora-display mt-4 text-[clamp(3rem,9vw,7rem)] leading-none text-[#e7f7f2]/90">
            AURORA
          </h1>
          <p className="mt-4 max-w-md px-6 text-[12px] leading-relaxed text-[var(--a-text)]/45">
            One desktop. One workspace window. Learning reads. Engineering proposes.
            A founder decides.
          </p>
          <div className="pointer-events-auto mt-6 flex items-center gap-2">
            <Button
              type="button"
              onClick={() => openWindow("nexora")}
              className="aurora-cta h-8 gap-2 rounded-sm px-4 font-mono text-[9px] tracking-[0.16em] uppercase"
            >
              Open Nexora Workspace
              <ArrowUpRight className="size-3.5" />
            </Button>
            <span className="hidden items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-[var(--a-muted)] uppercase sm:flex">
              <Cpu className="size-3" /> single window
            </span>
          </div>
        </div>

        {/* windows */}
        {windows.map((win, index) => {
          const active = activeId === win.id;
          if (win.minimized) return null;
          const style = win.maximized
            ? {
                left: 8,
                top: 46,
                width: "calc(100vw - 16px)",
                height: "calc(100vh - 136px)",
              }
            : { left: win.x, top: win.y, width: win.w, height: win.h };
          return (
            <section
              key={win.id}
              data-aurora-window={win.id}
              aria-label={`${win.id} window`}
              className={cn(
                "aurora-window aurora-window-enter fixed flex flex-col overflow-hidden rounded-md",
                win.maximized && "aurora-window-max rounded-none",
              )}
              style={{ ...style, zIndex: 40 + index }}
              onPointerDown={() => focusWindow(win.id)}
            >
              <WindowTitleBar
                window={win}
                active={active}
                onDragStart={(event) => beginDrag(win.id, event)}
                onToggleMaximize={() => toggleMaximize(win.id)}
                onMinimize={() => minimizeWindow(win.id)}
                onClose={() => closeWindow(win.id)}
              />
              <div className="min-h-0 flex-1">
                {win.id === "nexora" ? (
                  <NexoraWorkspace isWindowActive={active} />
                ) : win.id === "archive" ? (
                  <ArchiveApp />
                ) : (
                  <SystemApp />
                )}
              </div>
            </section>
          );
        })}

        {notice ? (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-sm border border-[var(--a-line)] bg-[#071517]/95 px-3 py-2 font-mono text-[9px] tracking-[0.08em] text-[var(--a-text)]/80 backdrop-blur">
            {notice}
          </div>
        ) : null}
      </main>

      {/* ── dock ────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex h-[84px] items-end justify-center px-3 pb-3">
        <div className="aurora-dock flex max-w-full items-center gap-1 overflow-x-auto rounded-md px-2 py-1.5">
          {DOCK_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              data-dock-app={app.id}
              title={app.live ? `Open ${app.name}` : `${app.name} · not connected in this build`}
              onClick={() => {
                if (!app.live) {
                  setNotice(`${app.name} — Aurora system app, not connected in this build`);
                  return;
                }
                openWindow(app.id as WindowId);
              }}
              className="aurora-focus group flex w-[52px] shrink-0 flex-col items-center gap-1 rounded-sm px-1 py-1.5 transition-colors hover:bg-white/[0.05]"
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-sm border",
                  app.live
                    ? "border-[var(--a-line)] bg-white/[0.03] text-[var(--a-text)]/80"
                    : "border-transparent text-[var(--a-muted)]/50",
                )}
              >
                <app.icon className="size-4" strokeWidth={1.6} />
              </span>
              <span className="font-mono text-[7px] tracking-[0.1em] text-[var(--a-muted)] uppercase">
                {app.name}
              </span>
            </button>
          ))}

          <span className="mx-1 h-8 w-px shrink-0 bg-[var(--a-line)]" />

          <button
            type="button"
            data-dock-app="nexora"
            onClick={() => openWindow("nexora")}
            className="aurora-focus group flex shrink-0 items-center gap-2.5 rounded-sm border border-[var(--a-mint)]/25 bg-[var(--a-mint)]/[0.07] px-2.5 py-2 transition-colors hover:border-[var(--a-mint)]/45 hover:bg-[var(--a-mint)]/[0.11]"
            aria-label="Open NEXORA WORKSPACE"
          >
            <span className="relative flex size-8 items-center justify-center rounded-sm border border-[var(--a-mint)]/25 bg-[#041012]">
              <NexoraMark className="size-5" />
              {windows.some((win) => win.id === "nexora" && !win.minimized) ? (
                <span className="absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[var(--a-mint)]" />
              ) : null}
            </span>
            <span className="flex flex-col items-start pr-1">
              <span className="font-mono text-[8px] tracking-[0.18em] text-[var(--a-mint)] uppercase">
                Nexora
              </span>
              <span className="font-mono text-[9px] tracking-[0.08em] text-[var(--a-text)]/80 uppercase">
                Workspace
              </span>
            </span>
          </button>

          <span className="mx-1 hidden h-8 w-px shrink-0 bg-[var(--a-line)] sm:block" />
          <div className="hidden shrink-0 flex-col items-end gap-1 pr-1 sm:flex">
            <span className="flex items-center gap-1.5 font-mono text-[7px] tracking-[0.14em] text-[var(--a-muted)] uppercase">
              <span className="size-1 rounded-full bg-[var(--a-mint)]" />
              WM 04
            </span>
            <span className="font-mono text-[7px] tracking-[0.12em] text-[var(--a-muted)]/70 uppercase">
              {windows.length} window{windows.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[6px] left-4 z-20 hidden font-mono text-[7px] tracking-[0.18em] text-[var(--a-muted)]/45 uppercase sm:block">
        AURORA OS 04 · NEXORA OMEGA · {isAuthenticated ? "SECURE SESSION" : "PUBLIC PREVIEW"}
      </div>
      <div className="pointer-events-none absolute right-4 bottom-[6px] z-20 hidden items-center gap-2 font-mono text-[7px] tracking-[0.18em] text-[var(--a-muted)]/45 uppercase sm:flex">
        <Clock3 className="size-2.5" />
        {clock.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}
      </div>
    </div>
  );
}

export default AuroraDesktop;
