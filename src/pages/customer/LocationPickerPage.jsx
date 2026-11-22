import { For, Show, createMemo, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  Briefcase,
  ChevronLeft,
  Clock,
  Crosshair,
  Home,
  Map,
  MapPin,
  Mic,
  Navigation,
  Search,
  Star,
} from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { platformActions } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { setManualOverrideLocation } from '../../stores/locationStore.js';
import { showToast } from '../../stores/toastStore.js';

const PRESET_AREAS = [
  {
    id: 'area-shyampur',
    label: 'SHYAMPUR',
    city: 'Bhopal',
    line1: 'Shyampur, Islamnagar, Huzur Tahsil',
    postalCode: '462038',
    lat: 23.34459,
    lng: 77.40702,
    pinX: 50,
    pinY: 54,
  },
  {
    id: 'area-arwaliya',
    label: 'ARWALIYA',
    city: 'Bhopal',
    line1: 'Arwaliya, Islamnagar, Huzur Tahsil',
    postalCode: '462038',
    lat: 23.33812,
    lng: 77.40145,
    pinX: 38,
    pinY: 62,
  },
  {
    id: 'area-mpnagar',
    label: 'MP NAGAR',
    city: 'Bhopal',
    line1: 'Zone 1, Maharana Pratap Nagar',
    postalCode: '462011',
    lat: 23.23324,
    lng: 77.43432,
    pinX: 66,
    pinY: 44,
  },
  {
    id: 'area-arera',
    label: 'ARERA COLONY',
    city: 'Bhopal',
    line1: 'E-4 Sector, Arera Colony',
    postalCode: '462016',
    lat: 23.21562,
    lng: 77.43018,
    pinX: 58,
    pinY: 70,
  },
];

export function LocationPickerPage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const user = () => currentUser();

  const [query, setQuery] = createSignal('');
  const [manualArea, setManualArea] = createSignal(null);
  const [pinPos, setPinPos] = createSignal({ x: 50, y: 54 });
  const [mapStyle, setMapStyle] = createSignal('standard');

  const selectedArea = createMemo(() => {
    if (manualArea()) return manualArea();
    const live = geo.liveLocation();
    if (live) {
      return {
        id: 'live-gps',
        label: live.area || live.shortAddress || 'LIVE AREA',
        city: live.city || '',
        line1: live.fullAddress || live.line1 || `${live.lat}, ${live.lng}`,
        postalCode: live.postalCode || '',
        lat: live.lat,
        lng: live.lng,
        isLive: true,
      };
    }
    return PRESET_AREAS[0];
  });

  const filteredAreas = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return [];
    return PRESET_AREAS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.line1.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q)
    );
  });

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(88, Math.max(12, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(84, Math.max(16, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setPinPos({ x, y });
    const baseLat = selectedArea().lat || 23.34459;
    const baseLng = selectedArea().lng || 77.40702;
    const lat = Number((baseLat + (50 - y) * 0.0005).toFixed(5));
    const lng = Number((baseLng + (x - 50) * 0.0005).toFixed(5));
    setManualArea({ ...selectedArea(), lat, lng });
  };

  const handleUseGps = async () => {
    setManualArea(null);
    setPinPos({ x: 50, y: 54 });
    const loc = await geo.detectLocation();
    if (loc) {
      showToast(`Live device GPS locked: ${loc.shortAddress || loc.fullAddress}`, 'success');
    } else if (geo.error()) {
      showToast(geo.error(), 'warning');
    }
  };

  const handleConfirmLocation = () => {
    const area = selectedArea();
    setManualOverrideLocation({
      area: area.label,
      line1: area.line1,
      city: area.city,
      postalCode: area.postalCode,
      shortAddress: area.label,
      fullAddress: area.line1,
      lat: area.lat,
      lng: area.lng,
      isLive: Boolean(area.isLive),
    });

    const existing = (user()?.addresses || []).find(
      (a) => a.line1.toLowerCase() === area.line1.toLowerCase()
    );
    if (existing) {
      platformActions.setDefaultAddress(user().id, existing.id);
    } else {
      platformActions.addCustomerAddress(user().id, {
        label: area.label,
        line1: area.line1,
        city: area.city || 'India',
        postalCode: area.postalCode || '000000',
        lat: area.lat,
        lng: area.lng,
        isDefault: true,
      });
    }
    showToast(`Delivery location updated to ${area.label}.`, 'success');
    navigate('/customer');
  };

  return (
    <CustomerLayout title="Select Delivery Location" hideTopBar={true} fullBleed={true}>
      <div class="min-h-screen bg-white flex flex-col">
        {/* Royal Blue Top Header matching Screenshot 10 */}
        <header class="bg-[#0066FF] text-white px-4 sm:px-6 pt-3.5 pb-5">
          <div class="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              class="w-10 h-10 rounded-full bg-white text-[#0D1B3E] inline-flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>

            <div class="flex-1 min-w-0">
              <h1 class="font-display text-base sm:text-lg font-extrabold leading-tight truncate">
                Select Delivery Location
              </h1>
              <p class="text-[11px] sm:text-xs text-white/85 truncate">
                Drag pin or search to set your delivery address
              </p>
            </div>

            <button
              type="button"
              onClick={handleUseGps}
              aria-label="Detect GPS"
              class="w-10 h-10 rounded-full bg-white text-[#0066FF] inline-flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
            >
              <Crosshair class={`w-5 h-5 ${geo.loading() ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Rounded Search & Quick Shortcut Sheet */}
        <div class="bg-white rounded-t-3xl -mt-3 px-4 sm:px-6 pt-4 pb-3.5 border-b border-[#E2EBF8] relative z-20">
          <div class="max-w-3xl mx-auto space-y-3">
            {/* Search Input */}
            <div class="relative">
              <div class="flex items-center rounded-full border border-[#CBD8EC] bg-[#F8FAFD] focus-within:bg-white focus-within:border-[#0066FF] px-3.5">
                <Search class="w-4 h-4 text-[#64748B] shrink-0" />
                <input
                  type="search"
                  value={query()}
                  onInput={(e) => setQuery(e.currentTarget.value)}
                  placeholder="Search area (e.g. MP Nagar, Arera Colony, Shyampur)..."
                  class="w-full min-h-[42px] px-2.5 text-sm bg-transparent text-[#0D1B3E] placeholder:text-[#94A3B8] focus:outline-none"
                />
                <Mic class="w-4 h-4 text-[#64748B] shrink-0" />
              </div>

              <Show when={filteredAreas().length > 0}>
                <div class="absolute left-0 right-0 top-12 bg-white border border-[#DDE6F2] rounded-2xl shadow-lg overflow-hidden z-30">
                  <For each={filteredAreas()}>
                    {(a) => (
                      <button
                        type="button"
                        onClick={() => {
                          setManualArea(a);
                          setPinPos({ x: a.pinX, y: a.pinY });
                          setQuery('');
                        }}
                        class="w-full px-4 py-3 text-left hover:bg-[#F0F7FF] border-b last:border-b-0 border-[#F1F5F9] cursor-pointer"
                      >
                        <p class="text-sm font-bold text-[#0D1B3E]">{a.label}</p>
                        <p class="text-xs text-[#64748B]">
                          {a.line1}
                        </p>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* 4 Quick Shortcut Cards: Home | Work | Saved | Recent */}
            <div class="grid grid-cols-4 gap-2">
              {[
                {
                  label: 'Home',
                  sub: 'Shyampur',
                  icon: () => <Home class="w-4 h-4 text-[#0066FF]" />,
                  area: PRESET_AREAS[0],
                },
                {
                  label: 'Work',
                  sub: 'Arwaliya',
                  icon: () => <Briefcase class="w-4 h-4 text-[#0066FF]" />,
                  area: PRESET_AREAS[1],
                },
                {
                  label: 'Saved',
                  sub: 'MP Nagar',
                  icon: () => <Star class="w-4 h-4 text-[#0066FF]" />,
                  area: PRESET_AREAS[2],
                },
                {
                  label: 'Recent',
                  sub: 'Arera',
                  icon: () => <Clock class="w-4 h-4 text-[#0066FF]" />,
                  area: PRESET_AREAS[3],
                },
              ].map((card, idx) => (
                <button
                  type="button"
                  onClick={() => {
                    setManualArea(card.area);
                    setPinPos({ x: card.area.pinX, y: card.area.pinY });
                  }}
                  style={{ '--item-delay': `${idx * 45}ms` }}
                  class="item-card-reveal p-2.5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-[#0066FF] hover:-translate-y-0.5 hover:shadow-xs active:scale-95 text-left flex items-center gap-2 cursor-pointer transition-all duration-200"
                >
                  <div class="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    {card.icon()}
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-extrabold text-[#0D1B3E] truncate">{card.label}</p>
                    <p class="text-[10px] text-[#64748B] truncate">{card.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Use Current GPS Button */}
            <button
              type="button"
              onClick={handleUseGps}
              class="w-full min-h-[44px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all duration-200 active:scale-[0.98]"
            >
              <Crosshair class="w-4 h-4" />
              <span>Use my current GPS location</span>
            </button>
          </div>
        </div>

        {/* Interactive Map Canvas matching Screenshot 10 */}
        <div
          onClick={handleMapClick}
          class={`relative flex-1 min-h-[300px] sm:min-h-[360px] overflow-hidden cursor-crosshair select-none ${
            mapStyle() === 'satellite' ? 'bg-[#1E293B]' : 'bg-[#F3F4EE]'
          }`}
        >
          {/* Crisp Stylized Bhopal / Shyampur Road Map SVG */}
          <svg
            viewBox="0 0 800 500"
            class="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Park / Terrain patches */}
            <rect
              x="0"
              y="0"
              width="800"
              height="500"
              fill={mapStyle() === 'satellite' ? '#1E293B' : '#F4F5EF'}
            />
            <path
              d="M0 120 Q180 80 340 150 T720 120 L800 180 L800 0 L0 0 Z"
              fill={mapStyle() === 'satellite' ? '#243447' : '#E7F0DF'}
            />
            <path
              d="M320 40 C370 110 420 190 520 185 C630 180 680 260 760 310"
              fill="none"
              stroke="#93C5FD"
              stroke-width="10"
              stroke-linecap="round"
            />
            {/* Local streets */}
            <g
              stroke={mapStyle() === 'satellite' ? '#334155' : '#FFFFFF'}
              stroke-width="8"
              stroke-linecap="round"
            >
              <path d="M120 0 L190 500" />
              <path d="M400 0 L430 500" />
              <path d="M640 0 L600 500" />
              <path d="M0 160 L800 130" />
              <path d="M0 410 L800 385" />
            </g>
            {/* Bhopal Bypass Highway */}
            <path
              d="M0 325 Q390 295 800 285"
              fill="none"
              stroke="#F59E84"
              stroke-width="14"
            />
            <text
              x="120"
              y="328"
              fill={mapStyle() === 'satellite' ? '#F8FAFC' : '#7C2D12'}
              font-size="15"
              font-weight="700"
            >
              Bypass Road
            </text>
            <text
              x="430"
              y="180"
              fill={mapStyle() === 'satellite' ? '#CBD5E1' : '#64748B'}
              font-size="13"
              font-weight="600"
            >
              {selectedArea().label}
            </text>
          </svg>

          {/* Draggable / Clickable Pulsing Center Pin */}
          <div
            class="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-200"
            style={{ left: `${pinPos().x}%`, top: `${pinPos().y}%` }}
          >
            <div class="relative flex items-center justify-center">
              <span class="absolute w-16 h-16 rounded-full bg-[#0066FF]/20 animate-ping" />
              <span class="relative w-12 h-12 rounded-full bg-[#0066FF]/20 flex items-center justify-center">
                <span class="w-9 h-9 rounded-full bg-[#0066FF] border-2 border-white shadow-lg flex items-center justify-center text-white">
                  <MapPin class="w-5 h-5" />
                </span>
              </span>
            </div>
          </div>

          {/* Floating Right Map Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            class="absolute right-3 top-4 flex flex-col gap-2.5"
          >
            <button
              type="button"
              onClick={() =>
                setMapStyle((s) => (s === 'standard' ? 'satellite' : 'standard'))
              }
              class="w-11 h-11 rounded-2xl bg-white shadow-md border border-[#E2E8F0] flex flex-col items-center justify-center text-[#0D1B3E] cursor-pointer"
            >
              <Map class="w-4 h-4 text-[#0066FF]" />
              <span class="text-[9px] font-bold">Map</span>
            </button>
            <button
              type="button"
              onClick={handleUseGps}
              aria-label="Center pin"
              class="w-11 h-11 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center text-[#DC2626] cursor-pointer"
            >
              <Navigation class="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleUseGps}
              aria-label="Lock GPS"
              class="w-11 h-11 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center text-[#0D1B3E] cursor-pointer"
            >
              <Crosshair class="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Confirm Location Sheet matching Screenshot 10 */}
        <div
          style={{ '--item-delay': '80ms' }}
          class="item-card-reveal bg-white rounded-t-3xl -mt-4 relative z-20 border-t border-[#E2EBF8] px-4 sm:px-6 pt-3 pb-6 shadow-[0_-8px_24px_rgba(13,27,62,0.08)]"
        >
          <div class="max-w-3xl mx-auto space-y-4">
            <div class="w-10 h-1 rounded-full bg-[#CBD5E1] mx-auto" />

            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                  <Crosshair class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <h2 class="font-display text-base font-extrabold text-[#0D1B3E] truncate">
                    {selectedArea().label}
                  </h2>
                  <p class="text-xs text-[#475569] leading-snug">
                    {selectedArea().line1}
                  </p>
                  <p class="text-[11px] font-mono text-[#94A3B8] mt-0.5 tabular-nums">
                    GPS: {selectedArea().lat}, {selectedArea().lng}
                  </p>
                </div>
              </div>

              <span class="px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] text-[11px] font-extrabold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5">
                <span class="radar-beacon w-1.5 h-1.5 rounded-full bg-[#22C55E] text-[#22C55E]" />
                <span>{geo.loading() ? 'Locating...' : 'Live GPS Ready'}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmLocation}
              class="w-full min-h-[50px] rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-display text-sm sm:text-base font-extrabold cursor-pointer shadow-[0_6px_18px_rgba(0,102,255,0.28)] transition-all duration-200 active:scale-[0.98]"
            >
              Update Location & View Stores
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
