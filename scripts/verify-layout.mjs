import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const OUT = "artifacts";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function intersects(a, b) {
  return (
    Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1
  );
}

async function measurements(page) {
  return page.evaluate(() => {
    const win = document.querySelector('[data-aurora-window="nexora"]');
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        right: r.right,
        bottom: r.bottom,
      };
    };
    const panes = [...document.querySelectorAll("[data-pane]")]
      .filter((el) => win?.contains(el))
      .map((el) => ({
        id: el.getAttribute("data-pane"),
        visible: el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0,
        ...rect(el),
      }));
    return {
      url: location.href,
      title: document.title,
      win: rect(win),
      titleBar: rect(win?.querySelector("[data-window-titlebar]")),
      statusBar: rect(win?.querySelector("[data-window-statusbar]")),
      paneArea: rect(win?.querySelector("[data-pane-area]")),
      panes,
      rail: [...document.querySelectorAll("[data-rail-item]")].map((el) =>
        el.getAttribute("data-rail-item"),
      ),
      nexoraDockEntries: document.querySelectorAll('[data-dock-app="nexora"]').length,
      scroll: {
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
        documentClientHeight: document.documentElement.clientHeight,
      },
    };
  });
}

async function assertBase(page, label) {
  const m = await measurements(page);
  check(`${label}: Nexora window is inside the Aurora desktop`, Boolean(m.win), m.win ? `${Math.round(m.win.width)}×${Math.round(m.win.height)}` : "missing");
  check(`${label}: URL did not navigate to a new page`, m.url === `${BASE}/`, m.url);

  check(`${label}: exactly two rail items`, m.rail.length === 2, m.rail.join(", "));
  check(
    `${label}: exactly one dock entry for NEXORA WORKSPACE`,
    m.nexoraDockEntries === 1,
    `${m.nexoraDockEntries} entries`,
  );

  const heightSum = m.win && m.titleBar && m.statusBar
    ? m.win.height - m.titleBar.height - m.statusBar.height
    : NaN;
  check(
    `${label}: pane area height equals window − title bar − status bar`,
    m.paneArea && Math.abs(m.paneArea.height - heightSum) < 1.01,
    m.paneArea ? `area=${m.paneArea.height.toFixed(2)} expected=${heightSum.toFixed(2)}` : "missing",
  );
  check(
    `${label}: pane area is docked between title bar and status bar`,
    m.paneArea && m.titleBar && m.statusBar &&
      Math.abs(m.paneArea.y - (m.win.y + m.titleBar.height)) < 1.01 &&
      Math.abs(m.paneArea.bottom - m.statusBar.y) < 1.01,
    m.paneArea ? `top=${m.paneArea.y.toFixed(1)} bottom=${m.paneArea.bottom.toFixed(1)}` : "missing",
  );

  const docScroll = m.scroll.documentHeight - m.scroll.documentClientHeight;
  check(
    `${label}: document/window vertical scroll is zero`,
    docScroll <= 1 && m.scroll.scrollY === 0,
    `overflow=${docScroll}px scrollY=${m.scroll.scrollY}`,
  );

  return m;
}

function assertNoIntersections(panes, label) {
  let collision = null;
  for (let i = 0; i < panes.length; i += 1) {
    for (let j = i + 1; j < panes.length; j += 1) {
      if (intersects(panes[i], panes[j])) collision = `${panes[i].id} × ${panes[j].id}`;
    }
  }
  check(`${label}: no two visible panes intersect`, collision === null, collision ?? `${panes.length} panes`);
}

const browser = await chromium.launch();

// ── desktop 1440 × 900 ────────────────────────────────────────────────
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => window.localStorage.clear());
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-aurora-window="nexora"]', { timeout: 15000 });
  await page.waitForTimeout(500);

  const base = await assertBase(page, "1440");
  check(
    "1440: Engineering shows Files, Code, AI and Output simultaneously",
    ["files", "code", "ai", "engineering-output"].every((id) =>
      base.panes.some((pane) => pane.id === id && pane.visible),
    ),
    base.panes.map((pane) => pane.id).join(", "),
  );
  assertNoIntersections(base.panes.filter((pane) => pane.visible), "1440 engineering");
  await page.screenshot({ path: `${OUT}/aurora-1440-engineering.png` });

  // window manager: close, reopen through the dock
  await page.click('[data-window-control="close"]');
  await page.waitForSelector('[data-aurora-window="nexora"]', { state: "detached" });
  check("1440: title bar close removes the window", true);
  await page.click('[data-dock-app="nexora"]');
  await page.waitForSelector('[data-aurora-window="nexora"]');
  check("1440: dock entry reopens the app through Aurora WM", true);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/aurora-1440-desktop.png` });

  // minimize / restore / maximize
  await page.click('[data-window-control="minimize"]');
  await page.waitForSelector('[data-aurora-window="nexora"]', { state: "detached" });
  await page.click('[data-dock-app="nexora"]');
  await page.waitForSelector('[data-aurora-window="nexora"]');
  check("1440: minimize then dock restores the same window", true);

  await page.click('[data-window-control="maximize"]');
  await page.waitForTimeout(250);
  const maximized = await measurements(page);
  check(
    "1440: maximize expands the window inside the desktop",
    maximized.win.width > 1380 && maximized.win.bottom < 900,
    `${Math.round(maximized.win.width)}×${Math.round(maximized.win.height)}`,
  );
  await page.click('[data-window-control="maximize"]');
  await page.waitForTimeout(250);

  // drag
  const beforeDrag = await measurements(page);
  const bar = await page.locator('[data-window-titlebar]').boundingBox();
  await page.mouse.move(bar.x + 220, bar.y + 20);
  await page.mouse.down();
  await page.mouse.move(bar.x + 260, bar.y + 45, { steps: 5 });
  await page.mouse.up();
  const afterDrag = await measurements(page);
  check(
    "1440: title bar drag moves the window",
    Math.abs(afterDrag.win.x - beforeDrag.win.x) > 10,
    `${beforeDrag.win.x.toFixed(0)} → ${afterDrag.win.x.toFixed(0)}`,
  );

  // Learning layout
  await page.click('[data-rail-item="learning"]');
  await page.waitForSelector('[data-pane="conversation"]');
  await page.waitForTimeout(300);
  const learning = await measurements(page);
  check(
    "1440: Learning shows conversation and output at once",
    learning.panes.some((p) => p.id === "conversation" && p.visible) &&
      learning.panes.some((p) => p.id === "learning-output" && p.visible),
    learning.panes.map((p) => p.id).join(", "),
  );
  assertNoIntersections(learning.panes.filter((p) => p.visible), "1440 learning");
  await page.screenshot({ path: `${OUT}/aurora-1440-learning.png` });

  // conversation interaction
  await page.fill('textarea[aria-label="Prompt"]', "What is blocked for Learning?");
  await page.click('[data-action="send-prompt"]');
  await page.waitForTimeout(500);
  const messageCount = await page.locator('[data-pane="conversation"]').innerText();
  check(
    "1440: Learning conversation accepts a prompt and replies",
    messageCount.includes("What is blocked for Learning?") &&
      messageCount.includes("cannot approve"),
  );

  // Knowledge persistence (guest local)
  await page.click('[data-pane-tab="knowledge"]');
  await page.waitForTimeout(150);
  const knowledgeBefore = await page.locator('[data-pane="learning-output"]').innerText();
  check("1440: Knowledge tab opens with persisted notes", knowledgeBefore.includes("Layout law"));

  // Engineering approval flow (guest preview)
  await page.click('[data-rail-item="engineering"]');
  await page.waitForSelector('[data-pane="ai"]');
  await page.waitForTimeout(200);
  const applyInitiallyDisabled = await page.locator('[data-action="apply"]').isDisabled();
  check("1440: APPLY is locked before approval", applyInitiallyDisabled);
  await page.click('[data-action="approve"]');
  await page.waitForTimeout(400);
  const applyAfterApproval = await page.locator('[data-action="apply"]').isEnabled();
  check("1440: approval unlocks APPLY", applyAfterApproval);
  await page.click('[data-action="apply"]');
  await page.waitForTimeout(500);
  const codeState = await page.locator('[data-pane="code"]').innerText();
  check(
    "1440: applying updates the in-app code buffer",
    codeState.includes("DOCK_TELEMETRY") && codeState.includes("patched"),
    codeState.slice(0, 60),
  );
  await page.screenshot({ path: `${OUT}/aurora-1440-applied.png` });

  const final = await measurements(page);
  check(
    "1440: Engineering panes still do not intersect after interactions",
    final.panes.length === 4 && !final.panes.some((a, i) =>
      final.panes.some((b, j) => j > i && intersects(a, b)),
    ),
    final.panes.map((p) => p.id).join(", "),
  );

  await context.close();
}

// ── mobile 390 × 844 ──────────────────────────────────────────────────
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => window.localStorage.clear());
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-aurora-window="nexora"]', { timeout: 15000 });
  await page.waitForTimeout(500);

  const base = await assertBase(page, "390");
  check(
    "390: window fits inside the viewport",
    base.win && base.win.x >= 0 && base.win.right <= 390.5 && base.win.bottom <= 844.5,
    base.win ? `x=${base.win.x.toFixed(0)} right=${base.win.right.toFixed(0)} bottom=${base.win.bottom.toFixed(0)}` : "missing",
  );
  check(
    "390: exactly one pane is visible at a time",
    base.panes.filter((pane) => pane.visible).length === 1,
    base.panes.map((pane) => `${pane.id}:${pane.visible}`).join(", "),
  );
  await page.screenshot({ path: `${OUT}/aurora-390-engineering.png` });

  await page.click('[data-pane-tab="output"]');
  await page.waitForTimeout(250);
  const outputPane = await measurements(page);
  check(
    "390: pane tab bar switches Engineering to Output",
    outputPane.panes.filter((p) => p.visible).length === 1 &&
      outputPane.panes.some((p) => p.id === "engineering-output" && p.visible),
    outputPane.panes.filter((p) => p.visible).map((p) => p.id).join(", "),
  );

  await page.click('[data-rail-item="learning"]');
  await page.waitForTimeout(250);
  const learning = await measurements(page);
  check(
    "390: Learning shows one pane with a tab bar",
    learning.panes.filter((p) => p.visible).length === 1 &&
      learning.panes.some((p) => p.id === "conversation" && p.visible),
    learning.panes.map((p) => `${p.id}:${p.visible}`).join(", "),
  );
  await page.screenshot({ path: `${OUT}/aurora-390-learning.png` });

  await page.click('[data-pane-tab="output"]');
  await page.waitForTimeout(250);
  const learningOutput = await measurements(page);
  check(
    "390: pane tab bar switches Learning to Output",
    learningOutput.panes.filter((p) => p.visible).length === 1 &&
      learningOutput.panes.some((p) => p.id === "learning-output" && p.visible),
    learningOutput.panes.filter((p) => p.visible).map((p) => p.id).join(", "),
  );

  const scroll = await measurements(page);
  check(
    "390: no window-level vertical scroll after switching",
    scroll.scroll.documentHeight - scroll.scroll.documentClientHeight <= 1 &&
      scroll.scroll.scrollY === 0,
    `overflow=${scroll.scroll.documentHeight - scroll.scroll.documentClientHeight}`,
  );

  await context.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
fs.writeFileSync(`${OUT}/layout-results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("FAILED:", failed.map((r) => r.name).join(" | "));
  process.exit(1);
}
