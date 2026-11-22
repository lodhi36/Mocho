import { Show, createMemo } from 'solid-js';
import { ROLES } from '../../constants/config.js';

/**
 * Interactive 3D-shaded animated Ride Hub Mascot Character.
 * Reacts smoothly in real time to:
 *  - role (Customer shopper / Rider helmeted courier / Supplier merchant)
 *  - mood ('idle' | 'watching' | 'happy' | 'celebrating')
 *  - lookX / lookY (eye & head tracking toward pointer or typed text)
 *  - speech (dynamic dialogue bubble)
 */
export function RideHubCharacter(props) {
  const role = () => props.role || ROLES.CUSTOMER;
  const mood = () => props.mood || 'idle';

  // Clamp subtle eye & head offsets for natural 60fps compositor transforms
  const eyeX = createMemo(() => Math.max(-5.5, Math.min(5.5, props.lookX || 0)));
  const eyeY = createMemo(() => Math.max(-3.5, Math.min(4.5, props.lookY || 0)));
  const headX = createMemo(() => eyeX() * 0.45);
  const headY = createMemo(() => eyeY() * 0.35);
  const headTilt = createMemo(() => {
    if (mood() === 'celebrating') return -4;
    if (mood() === 'watching') return eyeX() * 0.65;
    return eyeX() * 0.35;
  });

  const palette = createMemo(() => {
    if (role() === ROLES.RIDER) {
      return {
        outfitMain: '#0EA5E9',
        outfitDark: '#0369A1',
        accent: '#FACC15',
        auraFrom: '#38BDF8',
        auraTo: '#0066FF',
        badgeText: 'EXPRESS',
      };
    }
    if (role() === ROLES.SUPPLIER) {
      return {
        outfitMain: '#10B981',
        outfitDark: '#047857',
        accent: '#FDE047',
        auraFrom: '#34D399',
        auraTo: '#0066FF',
        badgeText: 'PARTNER',
      };
    }
    return {
      outfitMain: '#2563EB',
      outfitDark: '#1D4ED8',
      accent: '#22E4FF',
      auraFrom: '#60A5FA',
      auraTo: '#0066FF',
      badgeText: 'RIDE HUB',
    };
  });

  const isCelebrating = () => mood() === 'celebrating';
  const isWatching = () => mood() === 'watching';
  const isHappy = () => mood() === 'happy';

  return (
    <div class="relative flex flex-col items-center select-none">
      {/* Dynamic Interactive Speech Bubble */}
      <Show when={props.speech}>
        <div
          class="char-speech relative mb-2 px-4 py-2 rounded-2xl bg-white text-[#0D1B3E] text-xs sm:text-sm font-bold shadow-[0_10px_28px_rgba(6,24,68,0.22)] border border-white/80 max-w-[270px] text-center"
        >
          <span>{props.speech}</span>
          <span
            aria-hidden="true"
            class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rotate-45 rounded-[2px]"
          />
        </div>
      </Show>

      {/* Main 3D-Shaded Interactive Vector Stage */}
      <div class="relative w-[240px] h-[240px] sm:w-[276px] sm:h-[276px] flex items-center justify-center">
        <svg
          viewBox="0 0 280 280"
          class={`w-full h-full overflow-visible ${isCelebrating() ? 'char-celebrate' : 'char-breathe'}`}
          role="img"
          aria-label="Interactive Ride Hub character"
        >
          <defs>
            {/* Ambient Stage Halo */}
            <radialGradient id="rhAura" cx="50%" cy="45%" r="52%">
              <stop offset="0%" stop-color={palette().auraFrom} stop-opacity="0.45" />
              <stop offset="68%" stop-color={palette().auraTo} stop-opacity="0.14" />
              <stop offset="100%" stop-color={palette().auraTo} stop-opacity="0" />
            </radialGradient>

            {/* 3D Skin Shading */}
            <radialGradient id="rhSkin" cx="38%" cy="32%" r="68%">
              <stop offset="0%" stop-color="#FFE0C2" />
              <stop offset="62%" stop-color="#F6B98E" />
              <stop offset="100%" stop-color="#DC9161" />
            </radialGradient>

            {/* Hair / Dark Navy Shading */}
            <linearGradient id="rhHair" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1E293B" />
              <stop offset="100%" stop-color="#0B132B" />
            </linearGradient>

            {/* Role Outfit 3D Gradient */}
            <linearGradient id="rhOutfit" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stop-color={palette().outfitMain} />
              <stop offset="100%" stop-color={palette().outfitDark} />
            </linearGradient>

            {/* Helmet Gloss Gradient */}
            <linearGradient id="rhHelmet" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stop-color="#38BDF8" />
              <stop offset="50%" stop-color="#0066FF" />
              <stop offset="100%" stop-color="#003EB3" />
            </linearGradient>

            {/* Cardboard Parcel Box */}
            <linearGradient id="rhBox" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FDE68A" />
              <stop offset="100%" stop-color="#D97706" />
            </linearGradient>

            {/* Shopping Bag */}
            <linearGradient id="rhBag" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#60A5FA" />
              <stop offset="100%" stop-color="#1D4ED8" />
            </linearGradient>

            {/* Soft Ground Shadow */}
            <radialGradient id="rhShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#061844" stop-opacity="0.34" />
              <stop offset="100%" stop-color="#061844" stop-opacity="0" />
            </radialGradient>
          </defs>

          {/* Soft Backdrop Stage Rings */}
          <circle cx="140" cy="144" r="112" fill="url(#rhAura)" class="char-ring" />
          <circle
            cx="140"
            cy="144"
            r="96"
            fill="none"
            stroke="#FFFFFF"
            stroke-opacity="0.18"
            stroke-width="1.5"
            stroke-dasharray="6 8"
          />

          {/* Ground Shadow */}
          <ellipse cx="140" cy="256" rx="74" ry="12" fill="url(#rhShadow)" />

          {/* Celebration Confetti Particles */}
          <Show when={isCelebrating()}>
            <g>
              <circle
                cx="76"
                cy="92"
                r="5"
                fill="#FACC15"
                class="char-confetti"
                style={{ '--tx': '-34px', '--ty': '-46px' }}
              />
              <rect
                x="200"
                y="88"
                width="9"
                height="9"
                rx="2"
                fill="#22E4FF"
                class="char-confetti"
                style={{ '--tx': '38px', '--ty': '-52px', 'animation-delay': '0.1s' }}
              />
              <circle
                cx="140"
                cy="58"
                r="5.5"
                fill="#4ADE80"
                class="char-confetti"
                style={{ '--tx': '4px', '--ty': '-48px', 'animation-delay': '0.18s' }}
              />
              <rect
                x="96"
                y="72"
                width="8"
                height="8"
                rx="2"
                fill="#FB7185"
                class="char-confetti"
                style={{ '--tx': '-28px', '--ty': '-40px', 'animation-delay': '0.08s' }}
              />
              <circle
                cx="188"
                cy="74"
                r="4.5"
                fill="#FDE047"
                class="char-confetti"
                style={{ '--tx': '26px', '--ty': '-38px', 'animation-delay': '0.22s' }}
              />
            </g>
          </Show>

          {/* ================= TORSO & SHOULDERS ================= */}
          <g>
            {/* Torso base */}
            <path
              d="M78 248 C78 198 100 174 140 174 C180 174 202 198 202 248 C202 254 196 258 190 258 L90 258 C84 258 78 254 78 248 Z"
              fill="url(#rhOutfit)"
            />

            {/* Crisp White Collar / Inner Tee */}
            <path d="M122 175 L140 198 L158 175 Z" fill="#FFFFFF" />

            {/* Role-specific Outfit Details */}
            <Show when={role() === ROLES.RIDER}>
              {/* High-visibility reflective chest stripes */}
              <rect x="86" y="216" width="108" height="8" rx="4" fill="#FACC15" fill-opacity="0.92" />
              <rect x="89" y="229" width="102" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.7" />
            </Show>

            <Show when={role() === ROLES.SUPPLIER}>
              {/* Merchant Apron Overlay */}
              <path
                d="M104 188 L176 188 L184 258 L96 258 Z"
                fill="#FFFFFF"
                fill-opacity="0.95"
              />
              <rect x="116" y="214" width="48" height="24" rx="8" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="2" />
              <circle cx="140" cy="226" r="5" fill="#0066FF" />
            </Show>

            <Show when={role() === ROLES.CUSTOMER}>
              {/* Clean Jacket Zip & Ride Hub Chest Emblem */}
              <line x1="140" y1="198" x2="140" y2="256" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2.5" />
              <rect x="150" y="205" width="28" height="12" rx="6" fill="#FFFFFF" fill-opacity="0.22" />
            </Show>

            {/* Neck */}
            <rect x="128" y="156" width="24" height="24" rx="10" fill="url(#rhSkin)" />
            <path d="M128 164 Q140 172 152 164 L152 158 L128 158 Z" fill="#C97F52" fill-opacity="0.32" />
          </g>

          {/* ================= LEFT ARM & FLOATING ROLE PROP ================= */}
          <g class="char-float-prop">
            {/* Left arm */}
            <path
              d="M84 198 C62 204 54 220 62 234 C68 244 82 242 90 232"
              fill="none"
              stroke="url(#rhOutfit)"
              stroke-width="18"
              stroke-linecap="round"
            />
            <circle cx="64" cy="230" r="10.5" fill="url(#rhSkin)" />

            {/* Customer Shopping Bag */}
            <Show when={role() === ROLES.CUSTOMER}>
              <g transform="translate(26, 174)">
                <path
                  d="M14 18 C14 6 34 6 34 18"
                  fill="none"
                  stroke="#FFFFFF"
                  stroke-width="3.5"
                  stroke-linecap="round"
                />
                <rect x="4" y="16" width="40" height="44" rx="10" fill="url(#rhBag)" stroke="#FFFFFF" stroke-width="2.5" />
                <circle cx="24" cy="38" r="8" fill="#22E4FF" fill-opacity="0.9" />
                <path d="M21 38 L23.5 40.5 L28 35.5" fill="none" stroke="#061844" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </g>
            </Show>

            {/* Rider Express Delivery Parcel */}
            <Show when={role() === ROLES.RIDER}>
              <g transform="translate(22, 178)">
                <rect x="4" y="12" width="46" height="40" rx="8" fill="url(#rhBox)" stroke="#FFFFFF" stroke-width="2.5" />
                <line x1="4" y1="26" x2="50" y2="26" stroke="#B45309" stroke-width="2.5" />
                <rect x="22" y="12" width="10" height="16" rx="2" fill="#FFFBEB" fill-opacity="0.9" />
                <rect x="12" y="34" width="16" height="6" rx="3" fill="#0066FF" />
              </g>
            </Show>

            {/* Supplier Storefront Order Tablet */}
            <Show when={role() === ROLES.SUPPLIER}>
              <g transform="translate(24, 176)">
                <rect x="4" y="10" width="42" height="48" rx="9" fill="#0F172A" stroke="#FFFFFF" stroke-width="2.5" />
                <rect x="9" y="16" width="32" height="34" rx="5" fill="#EFF6FF" />
                <rect x="13" y="21" width="24" height="5" rx="2.5" fill="#0066FF" />
                <rect x="13" y="30" width="16" height="4" rx="2" fill="#10B981" />
                <rect x="13" y="38" width="20" height="4" rx="2" fill="#94A3B8" />
              </g>
            </Show>
          </g>

          {/* ================= RIGHT WAVING / CELEBRATING ARM ================= */}
          <g
            class={isCelebrating() ? '' : 'char-wave'}
            style={{
              transform: isCelebrating() ? 'rotate(-36deg)' : undefined,
              'transform-origin': '200px 190px',
              transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <path
              d="M196 196 C216 184 228 164 224 142"
              fill="none"
              stroke="url(#rhOutfit)"
              stroke-width="18"
              stroke-linecap="round"
            />
            {/* Friendly Hand */}
            <circle cx="224" cy="136" r="12" fill="url(#rhSkin)" />
            {/* Little fingers wave silhouette */}
            <circle cx="215" cy="126" r="4" fill="url(#rhSkin)" />
            <circle cx="223" cy="123" r="4.2" fill="url(#rhSkin)" />
            <circle cx="231" cy="126" r="4" fill="url(#rhSkin)" />
            <circle cx="235" cy="133" r="3.5" fill="url(#rhSkin)" />
          </g>

          {/* ================= HEAD GROUP (REACTIVE PARALLAX + TILT) ================= */}
          <g
            style={{
              transform: `translate3d(${headX()}px, ${headY()}px, 0) rotate(${headTilt()}deg)`,
              'transform-origin': '140px 128px',
              transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Ears */}
            <circle cx="88" cy="116" r="11" fill="url(#rhSkin)" />
            <circle cx="192" cy="116" r="11" fill="url(#rhSkin)" />
            <circle cx="89" cy="116" r="5" fill="#D98B5F" fill-opacity="0.35" />
            <circle cx="191" cy="116" r="5" fill="#D98B5F" fill-opacity="0.35" />

            {/* Head Sphere (Soft 3D Shading) */}
            <rect x="92" y="64" width="96" height="100" rx="46" fill="url(#rhSkin)" />

            {/* Soft Cheek Blush */}
            <ellipse cx="110" cy="128" rx="9" ry="5" fill="#FB7185" fill-opacity="0.32" />
            <ellipse cx="170" cy="128" rx="9" ry="5" fill="#FB7185" fill-opacity="0.32" />

            {/* Hair OR Rider Helmet */}
            <Show
              when={role() === ROLES.RIDER}
              fallback={
                <g>
                  {/* Stylish Modern Hair */}
                  <path
                    d="M89 102 C88 64 114 50 142 50 C172 50 192 66 191 102 C184 86 172 80 156 80 C138 80 124 87 110 86 C100 86 94 92 89 102 Z"
                    fill="url(#rhHair)"
                  />
                  {/* Hair Highlight Sheen */}
                  <path
                    d="M116 62 C132 56 154 57 168 65"
                    fill="none"
                    stroke="#60A5FA"
                    stroke-opacity="0.35"
                    stroke-width="4"
                    stroke-linecap="round"
                  />
                  {/* Supplier Cap Accent */}
                  <Show when={role() === ROLES.SUPPLIER}>
                    <path
                      d="M94 82 C102 52 178 52 186 82 Z"
                      fill="#059669"
                    />
                    <path
                      d="M88 82 Q140 72 194 82"
                      fill="none"
                      stroke="#047857"
                      stroke-width="7"
                      stroke-linecap="round"
                    />
                    <circle cx="140" cy="68" r="6" fill="#FDE047" />
                  </Show>
                </g>
              }
            >
              {/* Sleek Ride Hub Express Helmet with Raised Visor */}
              <g>
                <path
                  d="M86 106 C84 56 112 42 140 42 C168 42 196 56 194 106 C184 88 166 80 140 80 C114 80 96 88 86 106 Z"
                  fill="url(#rhHelmet)"
                />
                {/* Raised Tinted Visor Band */}
                <path
                  d="M96 76 C110 60 170 60 184 76 C170 84 110 84 96 76 Z"
                  fill="#0B1E4A"
                  fill-opacity="0.82"
                  stroke="#67E8F9"
                  stroke-width="2"
                />
                {/* Helmet Gloss Reflection */}
                <path
                  d="M112 54 Q140 46 164 54"
                  fill="none"
                  stroke="#FFFFFF"
                  stroke-opacity="0.55"
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </g>
            </Show>

            {/* Eyebrows (Expressive lift on watching/happy) */}
            <path
              d={
                isWatching()
                  ? 'M108 97 Q119 91 129 96'
                  : isCelebrating() || isHappy()
                  ? 'M108 95 Q119 89 129 95'
                  : 'M109 98 Q119 94 129 98'
              }
              fill="none"
              stroke="#1E293B"
              stroke-width="3.6"
              stroke-linecap="round"
            />
            <path
              d={
                isWatching()
                  ? 'M151 96 Q161 91 172 97'
                  : isCelebrating() || isHappy()
                  ? 'M151 95 Q161 89 172 95'
                  : 'M151 98 Q161 94 171 98'
              }
              fill="none"
              stroke="#1E293B"
              stroke-width="3.6"
              stroke-linecap="round"
            />

            {/* EYES: Celebrating curved happy arcs OR Reactive Tracking Pupils with Blink */}
            <Show
              when={!isCelebrating()}
              fallback={
                <g>
                  <path
                    d="M109 116 Q119 105 129 116"
                    fill="none"
                    stroke="#0F172A"
                    stroke-width="4.2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M151 116 Q161 105 171 116"
                    fill="none"
                    stroke="#0F172A"
                    stroke-width="4.2"
                    stroke-linecap="round"
                  />
                </g>
              }
            >
              <g class="char-blink">
                {/* Left Eye White */}
                <ellipse cx="119" cy="115" rx="10.5" ry="11.5" fill="#FFFFFF" />
                {/* Right Eye White */}
                <ellipse cx="161" cy="115" rx="10.5" ry="11.5" fill="#FFFFFF" />

                {/* Tracking Pupils + Sparkle Catchlights */}
                <g
                  style={{
                    transform: `translate3d(${eyeX()}px, ${eyeY()}px, 0)`,
                    transition: 'transform 110ms ease-out',
                  }}
                >
                  <circle cx="119" cy="115" r="5.6" fill="#0F172A" />
                  <circle cx="121.2" cy="112.6" r="2.1" fill="#FFFFFF" />

                  <circle cx="161" cy="115" r="5.6" fill="#0F172A" />
                  <circle cx="163.2" cy="112.6" r="2.1" fill="#FFFFFF" />
                </g>
              </g>
            </Show>

            {/* Cute Soft Nose */}
            <path
              d="M138 122 Q140 128 143 126"
              fill="none"
              stroke="#C97F52"
              stroke-width="2.6"
              stroke-linecap="round"
            />

            {/* Expressive Mouth */}
            <Show
              when={isCelebrating()}
              fallback={
                <Show
                  when={isHappy()}
                  fallback={
                    <path
                      d={
                        isWatching()
                          ? 'M129 140 Q140 147 151 140'
                          : 'M126 138 Q140 149 154 138'
                      }
                      fill="none"
                      stroke="#7C2D12"
                      stroke-width="3.6"
                      stroke-linecap="round"
                    />
                  }
                >
                  {/* Big Warm Smile */}
                  <path
                    d="M124 136 Q140 153 156 136 Z"
                    fill="#991B1B"
                    stroke="#7C2D12"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />
                  <path d="M128 137 Q140 141 152 137" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
                </Show>
              }
            >
              {/* Joyful Open Laugh */}
              <path
                d="M122 135 Q140 156 158 135 Z"
                fill="#991B1B"
                stroke="#7C2D12"
                stroke-width="2"
                stroke-linejoin="round"
              />
              <path d="M126 136 Q140 141 154 136" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" />
              <ellipse cx="140" cy="147" rx="7" ry="4" fill="#FB7185" />
            </Show>
          </g>
        </svg>
      </div>
    </div>
  );
}
