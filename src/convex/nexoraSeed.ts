/**
 * Seed content for the Convex-backed workspace.
 *
 * Kept inside convex/ so the Convex bundler owns it. The guest preview uses a
 * parallel seed in src/nexora/data.ts; both describe the same proposal, and no
 * build or test result is invented in either place.
 */

export const ACTIVE_TASK_CODE = "NX-2041";
export const WORKSPACE_PATH = "/workspaces/nexora-aurora";

const MINUTE = 60_000;

const BEFORE_HUNK = `export const DEFAULT_SPLITS = {
  learning: 0.46,
  files: 0.18,
  output: 0.3,
  code: 0.56,
} as const;`;

const AFTER_HUNK = `${BEFORE_HUNK}

/** Dock-level telemetry surfaced by the Aurora shell. */
export const DOCK_TELEMETRY = {
  slot: "nexora-workspace",
  railItems: ["learning", "engineering"],
  paneMode: "docked",
} as const;`;

export function seedMessages(now: number) {
  return [
    {
      role: "assistant" as const,
      at: now - 7 * MINUTE,
      content:
        "Aurora shell indexed. I can read six workspace files and three knowledge notes. Engineering edits stay read-only until a founder approves a patch — the plan engine can propose, never execute.",
      attachments: [
        {
          name: "aurora-shell.md",
          kind: "file" as const,
          status: "indexed" as const,
          detail: "Workspace notes · 2.4 KB · local index",
        },
        {
          name: "src/nexora/layout.ts",
          kind: "file" as const,
          status: "read-only" as const,
          detail: "Source snapshot · 746 B · not writable",
        },
      ],
    },
    {
      role: "user" as const,
      at: now - 4 * MINUTE,
      content:
        "What can we change safely without touching the window manager?",
      attachments: [],
    },
    {
      role: "assistant" as const,
      at: now - 3 * MINUTE,
      content:
        "Only the ambient telemetry layer and the pane guards. The Aurora window manager, founder auth and audit paths are locked. I prepared NX-2041: add DOCK_TELEMETRY to the shared layout constants and keep the docked split ratios explicit. It is waiting in Proposed Tasks.",
      attachments: [
        {
          name: "src/nexora/layout.ts",
          kind: "file" as const,
          status: "read-only" as const,
          detail: "Diff prepared · 1 hunk · awaiting founder approval",
        },
        {
          name: "Convex functions — authorization",
          kind: "link" as const,
          status: "unverified" as const,
          detail: "External doc · not fetched in this session",
          href: "https://docs.convex.dev/functions/authz",
        },
        {
          name: "CSS overflow — scroll containment",
          kind: "link" as const,
          status: "unverified" as const,
          detail: "External reference · not fetched in this session",
          href: "https://developer.mozilla.org/en-US/docs/Web/CSS/overflow",
        },
      ],
    },
  ];
}

export function seedSources() {
  return [
    {
      title: "src/nexora/layout.ts",
      url: "src/nexora/layout.ts",
      status: "indexed" as const,
      detail: "Read from the workspace snapshot · 746 B · used by NX-2041",
    },
    {
      title: "src/nexora/types.ts",
      url: "src/nexora/types.ts",
      status: "indexed" as const,
      detail: "Read from the workspace snapshot · type definitions only",
    },
    {
      title: "src/convex/nexora.ts",
      url: "src/convex/nexora.ts",
      status: "indexed" as const,
      detail: "Read from the workspace snapshot · approval mutations",
    },
    {
      title: "Convex functions — authorization",
      url: "https://docs.convex.dev/functions/authz",
      status: "unverified" as const,
      detail: "Link supplied by the founder · no network fetch in this session",
    },
    {
      title: "CSS overflow — scroll containment",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/overflow",
      status: "unverified" as const,
      detail: "Link supplied by the founder · no network fetch in this session",
    },
    {
      title: "Aurora runtime attach contract (archived)",
      url: "nexora://contracts/aurora-attach",
      status: "unavailable" as const,
      detail: "Not present in this environment · nothing was read",
    },
  ];
}

export function seedKnowledge(now: number) {
  return [
    {
      title: "Layout law",
      tag: "LAYOUT",
      at: now - 40 * MINUTE,
      body: "One window, two docked layouts. The pane area is exactly window height minus title bar and status bar. Panes never overlap; each pane owns its own scroll container and the composer stays pinned to the conversation floor.",
    },
    {
      title: "Approval separation",
      tag: "AUTH",
      at: now - 31 * MINUTE,
      body: "The plan engine proposes. A signed-in founder approves. Applying is a separate server mutation that re-checks ownership, approval state and the approver identity before writing an audit event.",
    },
    {
      title: "Workspace path",
      tag: "STORAGE",
      at: now - 18 * MINUTE,
      body: "/workspaces/nexora-aurora is the virtual workspace root shown in the status bar. Files in the Code pane are read-only snapshots of this repository; applying a patch updates the in-app buffer only.",
    },
  ];
}

export function seedTasks() {
  return [
    {
      code: ACTIVE_TASK_CODE,
      title: "Add dock telemetry to the Aurora attach contract",
      summary:
        "Expose the single Nexora dock slot and the two-item rail in the shared layout constants, and make the docked split ratios explicit. No window-manager, auth or runtime changes.",
      status: "proposed" as const,
      sentToEngineering: true,
      filePath: "src/nexora/layout.ts",
      before: BEFORE_HUNK,
      after: AFTER_HUNK,
      plan: [
        "Read the shared layout constants and confirm no window-manager import.",
        "Add DOCK_TELEMETRY beside DEFAULT_SPLITS (one additive hunk).",
        "Keep the four-pane Engineering split and Learning split untouched.",
        "Route the proposal to Engineering; execution waits for founder approval.",
      ],
      proposedBy: "NEXORA plan engine",
    },
  ];
}

export function seedAudit(now: number) {
  return [
    {
      actor: "NEXORA SYSTEM",
      action: "workspace.seeded" as const,
      detail: "Workspace linked to the Aurora shell · 6 files indexed",
      at: now - 44 * MINUTE,
    },
    {
      actor: "NEXORA plan engine",
      action: "task.proposed" as const,
      detail: "NX-2041 proposed · additive patch to src/nexora/layout.ts",
      at: now - 9 * MINUTE,
    },
    {
      actor: "Founder",
      action: "task.sent_to_engineering" as const,
      detail: "NX-2041 routed to Engineering for review",
      at: now - 8 * MINUTE,
    },
    {
      actor: "Founder",
      action: "task.applied" as const,
      detail: "NX-2038 applied after approval · audit #A-118 (history)",
      at: now - 26 * 60 * MINUTE,
    },
  ];
}

/** Deterministic plan-engine reply. No external model, no invented results. */
export function planReply(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/\b(build|test|tests|compile|deploy)\b/.test(lower)) {
    return "No build or test runner is attached to this workspace. I will not invent results. The Report tab lists exactly what has been inspected, and the approval path is the only write path available here.";
  }
  if (/\b(approve|apply|execute|run)\b/.test(lower)) {
    return "I can prepare the patch, but I cannot approve or execute it. Approval is a founder action enforced by the server. Open Engineering — the BEFORE and AFTER hunks and the APPLY control live there.";
  }
  return `The only open proposal is ${ACTIVE_TASK_CODE}: add dock telemetry to src/nexora/layout.ts. It is additive and leaves the Aurora window manager untouched. Engineering can show the diff; only a founder can approve it.`;
}
