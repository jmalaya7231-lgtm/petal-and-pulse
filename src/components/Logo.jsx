export default function Logo({ size = 40, showText = true }) {
  return (
    <div className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="Petal & Pulse logo"
      >
        <g fill="#F8BBD0">
          <ellipse cx="24" cy="12" rx="7" ry="10" />
          <ellipse cx="24" cy="12" rx="7" ry="10" transform="rotate(72 24 24)" />
          <ellipse cx="24" cy="12" rx="7" ry="10" transform="rotate(144 24 24)" />
          <ellipse cx="24" cy="12" rx="7" ry="10" transform="rotate(216 24 24)" />
          <ellipse cx="24" cy="12" rx="7" ry="10" transform="rotate(288 24 24)" />
        </g>
        <circle cx="24" cy="24" r="10" fill="#FFFFFF" />
        <polyline
          points="16,24 20,24 22,19 26,29 28,24 32,24"
          fill="none"
          stroke="#C44578"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div>
          <div className="logo-name">Petal &amp; Pulse</div>
          <div className="logo-tag">Grow with every heartbeat.</div>
        </div>
      )}
    </div>
  );
}