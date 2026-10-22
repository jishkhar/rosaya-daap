type P = { className?: string };
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const InstagramIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="0.8" fill="currentColor" />
  </svg>
);
export const FacebookIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />
  </svg>
);
export const YoutubeIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="2.5" y="5" width="19" height="14" rx="4" />
    <path d="M10 9l5 3-5 3z" fill="currentColor" />
  </svg>
);
