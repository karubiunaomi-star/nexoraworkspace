/**
 * Layout law constants for the single Nexora window.
 *
 * The window is split with CSS grid tracks. These limits are the minimum sizes
 * enforced while dragging a divider, and the breakpoint below switches the
 * workspace from the full docked layout to a single pane with a tab bar.
 */

export const AURORA_BREAKPOINT = 1024;

export const PANE_LIMITS = {
  rail: 60,
  learningConversation: 340,
  learningOutput: 340,
  engineeringFiles: 180,
  engineeringCenter: 380,
  engineeringOutput: 300,
  code: 200,
  ai: 220,
} as const;

export const DEFAULT_SPLITS = {
  learning: 0.46,
  files: 0.18,
  output: 0.3,
  code: 0.56,
} as const;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
