export function MarigoldToran() {
  return (
    <div class="w-full overflow-hidden select-none pointer-events-none" aria-hidden="true">
      <svg
        viewBox="0 0 900 108"
        class="w-full h-14 sm:h-20"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mango leaves background */}
        <path
          d="M0 10 Q150 72 300 16 Q450 76 600 16 Q750 72 900 10 L900 32 Q750 92 600 38 Q450 96 300 38 Q150 92 0 32 Z"
          fill="#2E7D32"
        />
        {/* Marigold garland swags */}
        <path
          d="M12 18 Q150 78 295 22 Q450 82 605 22 Q750 78 888 18"
          stroke="#F59E0B"
          stroke-width="20"
          stroke-linecap="round"
          stroke-dasharray="2 22"
        />
        <path
          d="M22 22 Q150 82 295 26 Q450 86 605 26 Q750 82 878 22"
          stroke="#EA580C"
          stroke-width="14"
          stroke-linecap="round"
          stroke-dasharray="1 24"
        />
        {/* Red floral rosettes at peaks */}
        {[24, 300, 450, 600, 876].map((cx, i) => {
          const cy = i === 2 ? 56 : i === 0 || i === 4 ? 20 : 24;
          return (
            <g>
              <circle cx={cx} cy={cy} r="13" fill="#DC2626" />
              <circle cx={cx} cy={cy} r="6" fill="#FACC15" />
            </g>
          );
        })}
        {/* Hanging brass bells */}
        {[95, 225, 450, 675, 805].map((x) => (
          <g>
            <line x1={x} y1="44" x2={x} y2="68" stroke="#D97706" stroke-width="2.5" />
            <path
              d={`M${x - 13} 86 Q${x - 10} 66 ${x} 66 Q${x + 10} 66 ${x + 13} 86 Z`}
              fill="url(#bellGrad)"
            />
            <ellipse cx={x} cy="87" rx="13" ry="3.5" fill="#B45309" />
            <circle cx={x} cy="92" r="3.5" fill="#FDE047" />
          </g>
        ))}
        <defs>
          <linearGradient id="bellGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FDE047" />
            <stop offset="55%" stop-color="#D97706" />
            <stop offset="100%" stop-color="#92400E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function IndiaFlagIcon(props) {
  return (
    <svg
      viewBox="0 0 24 16"
      class={props.class || 'w-5 h-3.5 rounded-[2px] shadow-xs'}
      aria-hidden="true"
    >
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="5.33" width="24" height="5.34" fill="#FFFFFF" />
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="2" fill="none" stroke="#1D4ED8" stroke-width="0.8" />
    </svg>
  );
}

export function RoleAvatarArt(props) {
  const kind = () => props.kind;
  return (
    <div class="w-16 h-16 rounded-full bg-[#F0F6FF] border border-[#DBEAFE] flex items-center justify-center shrink-0 overflow-hidden">
      {kind() === 'customer' && (
        <svg viewBox="0 0 64 64" class="w-14 h-14" aria-hidden="true">
          <ellipse cx="32" cy="54" rx="18" ry="5" fill="#BFDBFE" />
          <path
            d="M32 10 C20 10 14 19 14 29 C14 41 32 54 32 54 C32 54 50 41 50 29 C50 19 44 10 32 10 Z"
            fill="#0066FF"
          />
          <circle cx="32" cy="28" r="12" fill="#FFFFFF" />
          <path d="M23 29 L32 21 L41 29 V36 H23 Z" fill="#22C55E" />
          <path d="M22 29 L32 20 L42 29" stroke="#F59E0B" stroke-width="2.5" fill="none" />
          <rect x="29.5" y="30" width="5" height="6" rx="1" fill="#FEF3C7" />
        </svg>
      )}
      {kind() === 'rider' && (
        <svg viewBox="0 0 64 64" class="w-14 h-14" aria-hidden="true">
          <ellipse cx="32" cy="54" rx="16" ry="4.5" fill="#FECACA" />
          <path
            d="M32 10 C20 10 14 19 14 29 C14 41 32 54 32 54 C32 54 50 41 50 29 C50 19 44 10 32 10 Z"
            fill="#DC2626"
          />
          <circle cx="32" cy="28" r="12" fill="#FFFFFF" />
          <path d="M23 29 L32 21 L41 29 V36 H23 Z" fill="#F59E0B" />
          <path d="M22 29 L32 20 L42 29" stroke="#16A34A" stroke-width="2.5" fill="none" />
          <rect x="29.5" y="30" width="5" height="6" rx="1" fill="#FFFFFF" />
        </svg>
      )}
      {kind() === 'supplier' && (
        <svg viewBox="0 0 64 64" class="w-14 h-14" aria-hidden="true">
          <ellipse cx="32" cy="53" rx="20" ry="5" fill="#E2E8F0" />
          <rect x="14" y="25" width="36" height="25" rx="3" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
          <path d="M12 25 L16 15 H48 L52 25 Z" fill="#DC2626" />
          <path d="M20 15 L18 25 H26 L27 15 Z M35 15 L36 25 H44 L42 15 Z" fill="#FFFFFF" />
          <rect x="26" y="33" width="12" height="17" rx="1.5" fill="#1D4ED8" />
          <rect x="17" y="32" width="6" height="8" rx="1" fill="#93C5FD" />
          <rect x="41" y="32" width="6" height="8" rx="1" fill="#93C5FD" />
        </svg>
      )}
    </div>
  );
}

export function StoreMiniIcon() {
  return (
    <svg viewBox="0 0 64 64" class="w-14 h-14" aria-hidden="true">
      <rect x="12" y="24" width="40" height="28" rx="4" fill="#E0F2FE" stroke="#7DD3FC" stroke-width="1.5" />
      <rect x="10" y="18" width="44" height="9" rx="3" fill="#0284C7" />
      <rect x="16" y="32" width="14" height="12" rx="2" fill="#FFFFFF" />
      <rect x="35" y="32" width="11" height="20" rx="2" fill="#0EA5E9" />
      <rect x="10" y="10" width="16" height="10" rx="2" fill="#EA580C" />
      <text x="18" y="17.5" text-anchor="middle" fill="#FFFFFF" font-size="7" font-weight="800" font-family="sans-serif">
        24
      </text>
    </svg>
  );
}
