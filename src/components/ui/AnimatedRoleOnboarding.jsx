import { For, Show, createMemo, createSignal } from 'solid-js';
import {
  ArrowRight,
  Bike,
  ChevronLeft,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  User,
} from 'lucide-solid';
import { RideHubCharacter } from './RideHubCharacter.jsx';
import { IndiaFlagIcon } from './FestiveVisuals.jsx';
import { ROLE_LABELS, ROLES } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { sanitizeText } from '../../utils/validators.js';

const VEHICLE_OPTIONS = ['Bike', 'EV Scooter', 'Cycle'];

export function AnimatedRoleOnboarding(props) {
  const geo = useGeolocation();
  const card = () => props.roleCard;
  const role = () => card()?.role || ROLES.CUSTOMER;

  const [fullName, setFullName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [storeName, setStoreName] = createSignal('');
  const [storeCategoryId, setStoreCategoryId] = createSignal('cat-fashion');
  const [vehicleType, setVehicleType] = createSignal('Bike');

  const [activeField, setActiveField] = createSignal('');
  const [pointerOffset, setPointerOffset] = createSignal({ x: 0, y: 0 });
  const [celebrating, setCelebrating] = createSignal(false);

  // Compute reactive character mood based on user interaction
  const characterMood = createMemo(() => {
    if (celebrating()) return 'celebrating';
    if (activeField()) return 'watching';
    if (fullName().trim().length >= 2 || storeName().trim().length >= 2) return 'happy';
    return 'idle';
  });

  // Compute reactive eye tracking (follows typing length when typing, else follows pointer)
  const lookCoords = createMemo(() => {
    const field = activeField();
    if (field) {
      const val =
        field === 'name'
          ? fullName()
          : field === 'phone'
          ? phone()
          : field === 'store'
          ? storeName()
          : '';
      // Sweep eyes smoothly left-to-right as user types
      const x = Math.min(5, -4.2 + val.length * 0.48);
      return { x, y: 3.4 };
    }
    return pointerOffset();
  });

  // Dynamic warm speech line
  const speechLine = createMemo(() => {
    if (celebrating()) {
      return `Welcome aboard! Opening your ${ROLE_LABELS[role()]} dashboard...`;
    }
    if (activeField() === 'store') {
      return storeName().trim()
        ? `${storeName().trim()} sounds awesome!`
        : 'What is your store or restaurant name?';
    }
    if (activeField() === 'name') {
      return fullName().trim()
        ? `Nice to meet you, ${fullName().trim().split(' ')[0]}!`
        : 'Hi there! Tell me your name.';
    }
    if (activeField() === 'phone') {
      return 'Enter your mobile number for live order updates.';
    }
    if (role() === ROLES.RIDER) {
      return 'Namaste Rider! Ready to deliver & earn daily?';
    }
    if (role() === ROLES.SUPPLIER) {
      return 'Namaste Partner! Let’s grow your store on Ride Hub.';
    }
    return 'Namaste! Ready for 20-min doorstep delivery?';
  });

  const handleStagePointerMove = (e) => {
    if (activeField()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 10;
    const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 6;
    setPointerOffset({ x: nx, y: ny });
  };

  const launchDashboard = (applyCustomFields = true) => {
    if (celebrating()) return;
    setActiveField('');
    setCelebrating(true);

    if (applyCustomFields) {
      const cleanName = sanitizeText(fullName(), 80);
      const cleanPhone = sanitizeText(phone(), 24);
      const cleanStore = sanitizeText(storeName(), 90);

      const updates = {};
      if (cleanName) updates.name = cleanName;
      if (cleanPhone) updates.phone = cleanPhone;
      if (role() === ROLES.RIDER) updates.vehicleType = vehicleType();

      if (Object.keys(updates).length > 0) {
        platformActions.updateUserProfile(card().demoUserId, updates);
      }

      if (role() === ROLES.SUPPLIER) {
        const supStore = platformState.stores.find((s) => s.supplierId === card().demoUserId);
        if (supStore) {
          const cat = platformState.categories.find((c) => c.id === storeCategoryId());
          const storeUpdates = {};
          if (cleanStore) storeUpdates.name = cleanStore;
          if (cat) {
            storeUpdates.categoryId = cat.id;
            storeUpdates.categoryName = cat.name;
          }
          if (Object.keys(storeUpdates).length > 0) {
            platformActions.updateStore(supStore.id, storeUpdates);
          }
        }
      }
    }

    window.setTimeout(() => {
      props.onContinue?.(card());
    }, 680);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    launchDashboard(true);
  };

  return (
    <div
      class="min-h-screen bg-[#EDF4FF] flex flex-col"
      onPointerMove={handleStagePointerMove}
    >
      {/* Top Interactive Character Stage */}
      <section class="relative bg-gradient-to-b from-[#004EE8] via-[#0066FF] to-[#0052D9] text-white rounded-b-[36px] sm:rounded-b-[48px] shadow-[0_14px_38px_rgba(0,82,217,0.26)] overflow-hidden">
        {/* Subtle Decorative Ambient Light */}
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-full bg-[#22E4FF]/20 blur-3xl"
        />

        <div class="relative max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-8 sm:pb-10">
          {/* Top Navigation Row */}
          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => props.onBack?.()}
              class="min-h-[42px] px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
              <span>Change Role</span>
            </button>

            <span class="font-display text-base sm:text-lg font-extrabold tracking-tight">
              Ride <span class="text-[#22E4FF]">Hub</span>
            </span>
          </div>

          {/* Interactive Character Centerpiece */}
          <div class="mt-4 flex flex-col items-center">
            <RideHubCharacter
              role={role()}
              mood={characterMood()}
              lookX={lookCoords().x}
              lookY={lookCoords().y}
              speech={speechLine()}
            />

            <h1 class="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-center tracking-tight">
              {card()?.formHeading || `${card()?.title} Entry`}
            </h1>
            <p class="mt-1 text-xs sm:text-sm text-white/85 text-center max-w-md">
              {card()?.formBannerText}
            </p>
          </div>
        </div>
      </section>

      {/* Elevated Clean Entry Form Card */}
      <main class="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 -mt-5 pb-10 relative z-10">
        <form
          onSubmit={handleSubmit}
          class="bg-white border border-[#DCE8FA] rounded-3xl p-5 sm:p-7 shadow-[0_14px_36px_rgba(13,27,62,0.08)] space-y-4"
        >
          {/* Live Device Location Confirmation Line (Unboxed Clean Metadata) */}
          <Show when={geo.liveLocation()}>
            {(loc) => (
              <div class="flex items-center gap-2 text-xs text-[#475569] pb-1 border-b border-[#F1F5F9]">
                <MapPin class="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                <span class="truncate">
                  Live GPS: <strong class="text-[#0D1B3E]">{loc().shortAddress || loc().fullAddress}</strong>
                </span>
              </div>
            )}
          </Show>

          {/* Supplier Store Name & Category */}
          <Show when={role() === ROLES.SUPPLIER}>
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-[#334669]">
                Store / Restaurant Name
              </label>
              <div class="relative flex items-center">
                <Store class="w-4 h-4 text-[#0066FF] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={storeName()}
                  onFocus={() => setActiveField('store')}
                  onBlur={() => setActiveField('')}
                  onInput={(e) => setStoreName(e.currentTarget.value)}
                  placeholder="e.g. Geeta Fashion, Fresh Mart..."
                  class="w-full min-h-[46px] pl-10 pr-4 rounded-2xl border border-[#CBD8EC] bg-[#F8FAFD] focus:bg-white focus:border-[#0066FF] text-sm font-medium text-[#0D1B3E] placeholder:text-[#94A3B8] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-[#334669]">
                Store Category
              </label>
              <select
                value={storeCategoryId()}
                onChange={(e) => setStoreCategoryId(e.currentTarget.value)}
                class="w-full min-h-[46px] px-3.5 rounded-2xl border border-[#CBD8EC] bg-[#F8FAFD] focus:bg-white focus:border-[#0066FF] text-sm font-semibold text-[#0D1B3E] focus:outline-none transition-colors"
              >
                <For each={platformState.categories}>
                  {(cat) => <option value={cat.id}>{cat.name}</option>}
                </For>
              </select>
            </div>
          </Show>

          {/* Full Name */}
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-[#334669]">
              {role() === ROLES.SUPPLIER ? 'Owner Name' : 'Your Name'}
            </label>
            <div class="relative flex items-center">
              <User class="w-4 h-4 text-[#0066FF] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={fullName()}
                onFocus={() => setActiveField('name')}
                onBlur={() => setActiveField('')}
                onInput={(e) => setFullName(e.currentTarget.value)}
                placeholder={
                  role() === ROLES.RIDER
                    ? 'Enter rider full name'
                    : role() === ROLES.SUPPLIER
                    ? 'Enter store owner name'
                    : 'Enter your name'
                }
                class="w-full min-h-[46px] pl-10 pr-4 rounded-2xl border border-[#CBD8EC] bg-[#F8FAFD] focus:bg-white focus:border-[#0066FF] text-sm font-medium text-[#0D1B3E] placeholder:text-[#94A3B8] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-[#334669]">Mobile Number</label>
            <div class="relative flex items-center">
              <Phone class="w-4 h-4 text-[#0066FF] absolute left-3.5 pointer-events-none" />
              <input
                type="tel"
                inputMode="numeric"
                value={phone()}
                onFocus={() => setActiveField('phone')}
                onBlur={() => setActiveField('')}
                onInput={(e) => setPhone(e.currentTarget.value)}
                placeholder="+91 98XXX XXXXX"
                class="w-full min-h-[46px] pl-10 pr-4 rounded-2xl border border-[#CBD8EC] bg-[#F8FAFD] focus:bg-white focus:border-[#0066FF] text-sm font-medium text-[#0D1B3E] placeholder:text-[#94A3B8] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Rider Vehicle Selector */}
          <Show when={role() === ROLES.RIDER}>
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-[#334669]">Delivery Vehicle</label>
              <div class="grid grid-cols-3 gap-2">
                <For each={VEHICLE_OPTIONS}>
                  {(veh) => (
                    <button
                      type="button"
                      onClick={() => setVehicleType(veh)}
                      class={`min-h-[44px] rounded-2xl border text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        vehicleType() === veh
                          ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                          : 'bg-[#F8FAFD] text-[#334669] border-[#CBD8EC] hover:bg-[#EFF6FF]'
                      }`}
                    >
                      <Bike class="w-3.5 h-3.5" />
                      <span>{veh}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Primary Launch CTA */}
          <div class="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={celebrating()}
              class="w-full min-h-[52px] px-6 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-80 text-white font-display text-sm sm:text-base font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_22px_rgba(0,102,255,0.28)] transition-all active:scale-[0.98]"
            >
              <span>
                {celebrating()
                  ? `Launching ${ROLE_LABELS[role()]}...`
                  : `Continue to ${ROLE_LABELS[role()]} Dashboard`}
              </span>
              <ArrowRight class="w-4 h-4" />
            </button>

            <div class="flex items-center justify-center gap-2 text-xs text-[#64748B] pt-1">
              <ShieldCheck class="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Instant access · Live GPS enabled</span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div class="mt-6 flex items-center justify-center gap-2 text-xs text-[#64748B]">
          <IndiaFlagIcon class="w-4 h-3 rounded-[2px]" />
          <span class="font-semibold">Ride Hub · Proudly Made in India</span>
        </div>
      </main>
    </div>
  );
}
