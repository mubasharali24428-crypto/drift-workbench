// Custom inline SVG brand mark: a pulse line on a hairline frame.
export function PulseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="0.5" y="0.5" width="23" height="23" stroke="currentColor" strokeOpacity="0.4" />
      <path
        d="M2 13h5l2-5 3 10 2-5h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
