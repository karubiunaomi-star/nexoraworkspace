import { cn } from "@/lib/utils";

/**
 * Nexora Omega emblem — faceted vertical spire inside an Aurora ring with a
 * horizontal ion flare. Decorative; the accessible name is on the svg.
 */
export function NexoraEmblem({
  className,
  title = "Nexora Omega",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="nx-emblem-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A5F3FC" />
          <stop offset="34%" stopColor="#22D3EE" />
          <stop offset="68%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="nx-emblem-blade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="38%" stopColor="#22D3EE" />
          <stop offset="70%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="nx-emblem-core" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ECFEFF" stopOpacity="0.9" />
          <stop offset="42%" stopColor="#67E8F9" stopOpacity="0.65" />
          <stop offset="72%" stopColor="#8B5CF6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#312E81" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="nx-emblem-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#BAF7FF" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#22D3EE" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <filter id="nx-emblem-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* halo + horizontal flare */}
      <ellipse cx="120" cy="120" rx="114" ry="16" fill="url(#nx-emblem-halo)" opacity="0.8" />
      <path
        d="M14 120H226"
        stroke="#22D3EE"
        strokeWidth="2"
        strokeOpacity="0.65"
        filter="url(#nx-emblem-blur)"
      />
      <path d="M42 120H198" stroke="#CFFAFE" strokeWidth="1" strokeOpacity="0.55" />

      {/* orbit ring */}
      <circle
        cx="120"
        cy="120"
        r="88"
        fill="none"
        stroke="url(#nx-emblem-ring)"
        strokeWidth="12"
        strokeOpacity="0.18"
        filter="url(#nx-emblem-blur)"
      />
      <circle
        cx="120"
        cy="120"
        r="88"
        fill="none"
        stroke="url(#nx-emblem-ring)"
        strokeWidth="6"
      />
      <circle
        cx="120"
        cy="120"
        r="88"
        fill="none"
        stroke="#E0F7FF"
        strokeWidth="1"
        strokeOpacity="0.3"
      />

      {/* central faceted spire */}
      <path
        d="M120 16L148 96L144 152L120 226L96 152L92 96Z"
        fill="url(#nx-emblem-blade)"
        stroke="#D8FBFF"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <path d="M120 16L120 226L96 152L92 96Z" fill="#0B1C4A" opacity="0.72" />
      <path
        d="M120 30L136 100L128 164L120 212L112 164L104 100Z"
        fill="url(#nx-emblem-core)"
        opacity="0.9"
      />
      <path d="M120 26L124 104L121 198L118 104Z" fill="#F0FDFF" opacity="0.5" />
      <path
        d="M120 16L148 96L120 120L92 96Z"
        fill="#E0F7FF"
        opacity="0.07"
      />
      <path d="M92 96L120 120L96 152Z" fill="#020617" opacity="0.22" />
      <path d="M148 96L120 120L144 152Z" fill="#22D3EE" opacity="0.14" />
    </svg>
  );
}
