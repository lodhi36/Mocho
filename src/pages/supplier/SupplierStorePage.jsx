import { For, Show, createMemo, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Film,
  Globe,
  LogOut,
  MapPin,
  Moon,
  Phone,
  Save,
  ShieldCheck,
  Tag,
  Upload,
} from 'lucide-solid';
import { SupplierLayout } from './SupplierLayout.jsx';
import { ORDER_STATUS } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser, logout } from '../../stores/authStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { showToast } from '../../stores/toastStore.js';
import { sanitizeText } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SelectField, TextField } from '../../components/ui/FormControls.jsx';
import { ImageWithFallback } from '../../components/ui/DataDisplay.jsx';
import { StoreMiniIcon } from '../../components/ui/FestiveVisuals.jsx';

export function SupplierStorePage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const user = () => currentUser();

  const store = createMemo(
    () => platformState.stores.find((s) => s.supplierId === user()?.id) || platformState.stores[0]
  );

  const [darkMode, setDarkMode] = createSignal(false);
  const [language, setLanguage] = createSignal('English');
  const [editModal, setEditModal] = createSignal(false);
  const [videoModal, setVideoModal] = createSignal(false);
  const [videoJsonText, setVideoJsonText] = createSignal('');
  const [hasVideoJson, setHasVideoJson] = createSignal(false);
  const [showcaseSlots, setShowcaseSlots] = createSignal([
    store()?.banner || '',
    '',
    '',
  ]);

  const [editForm, setEditForm] = createSignal({
    name: store()?.name || '',
    address: store()?.address || '',
    categoryId: store()?.categoryId || 'cat-fashion',
    phone: user()?.phone || '',
  });

  const completedCount = createMemo(
    () =>
      platformState.orders.filter(
        (o) =>
          o.storeId === store()?.id &&
          [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(o.status)
      ).length
  );

  const handleStorePhotoUpload = (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      platformActions.updateStore(store().id, { logo: dataUrl, banner: dataUrl });
      showToast('Store photo updated.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSlotUpload = (idx, e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setShowcaseSlots((prev) => prev.map((v, i) => (i === idx ? dataUrl : v)));
      showToast(`Showcase Slot ${idx + 1} photo loaded.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleLockGps = async () => {
    const loc = await geo.detectLocation();
    if (loc) {
      platformActions.updateStore(store().id, {
        address: loc.fullAddress || store().address,
        locality: loc.area || loc.city || store().locality,
        lat: loc.lat,
        lng: loc.lng,
      });
      showToast(`Permanent Store GPS locked: ${loc.shortAddress || loc.fullAddress}`, 'success');
    } else if (geo.error()) {
      showToast(geo.error(), 'warning');
    }
  };

  const handleSaveDetails = (e) => {
    e.preventDefault();
    const cat = platformState.categories.find((c) => c.id === editForm().categoryId);
    platformActions.updateStore(store().id, {
      name: sanitizeText(editForm().name, 100),
      address: sanitizeText(editForm().address, 220),
      categoryId: editForm().categoryId,
      categoryName: cat?.name || store().categoryName,
    });
    platformActions.updateUserProfile(user().id, {
      phone: sanitizeText(editForm().phone, 25),
    });
    setEditModal(false);
    showToast('Store profile updated.', 'success');
  };

  const handleSaveVideoJson = (e) => {
    e.preventDefault();
    setHasVideoJson(true);
    setVideoModal(false);
    showToast('60 FPS Store Video JSON showcase saved.', 'success');
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out of Store Partner account.', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <SupplierLayout title="Store Profile" hideTopBar={true} fullBleed={true}>
      <div class="min-h-screen bg-[#F4F7FC] pb-12">
        {/* Royal Blue Curved Top Hero matching Screenshot 5 */}
        <div class="bg-gradient-to-b from-[#0066FF] to-[#0055E6] rounded-b-[32px] px-4 sm:px-6 pt-5 pb-12 shadow-[0_8px_24px_rgba(0,102,255,0.22)]">
          <div class="max-w-2xl mx-auto space-y-4">
            {/* Store Photo Showcase Card */}
            <div
              class="item-card-reveal group relative rounded-3xl bg-white p-4 h-44 sm:h-52 overflow-hidden flex flex-col items-center justify-center shadow-md"
              style={{ '--card-delay': '20ms' }}
            >
              <Show
                when={store()?.banner}
                fallback={
                  <div class="text-center space-y-1.5 float-gentle">
                    <StoreMiniIcon />
                    <p class="text-sm font-bold text-[#64748B]">No Store Photo</p>
                    <p class="text-xs text-[#94A3B8]">Tap the camera badge below to add</p>
                  </div>
                }
              >
                <ImageWithFallback
                  src={store()?.banner}
                  alt={store()?.name}
                  class="absolute inset-0 w-full h-full object-cover hero-ken-burns"
                />
                <div class="item-shine-layer" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              </Show>

              <label class="absolute z-10 bottom-3 right-3 px-3.5 py-2 rounded-full bg-white/95 hover:bg-white text-[#0066FF] text-xs font-extrabold inline-flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95">
                <Camera class="w-3.5 h-3.5" />
                <span>Add / Change Photo</span>
                <input type="file" accept="image/*" class="hidden" onChange={handleStorePhotoUpload} />
              </label>
            </div>

            {/* Store Title & Verified Badges */}
            <div class="text-center text-white space-y-2">
              <h1 class="font-display text-2xl font-extrabold">{store()?.name}</h1>
              <div class="flex flex-wrap items-center justify-center gap-2">
                <span class="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-extrabold inline-flex items-center gap-1">
                  <ShieldCheck class="w-3.5 h-3.5" />
                  VERIFIED PARTNER
                </span>
                <span class="px-3 py-1 rounded-full bg-white text-[#0066FF] text-[11px] font-extrabold uppercase">
                  {store()?.categoryName} STORE
                </span>
              </div>
            </div>

            {/* Dual Action Pills: Store Video JSON | Lock Store GPS */}
            <div class="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setVideoModal(true)}
                class="min-h-[42px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
              >
                <Film class="w-4 h-4" />
                <span>Store Video JSON</span>
              </button>
              <button
                type="button"
                onClick={handleLockGps}
                class="min-h-[42px] rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <MapPin class="w-4 h-4" />
                <span>Lock Store GPS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div class="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 space-y-4">
          {/* 3-Column Elevated Status Bar: Online/Inactive | Completed Orders | Category */}
          <div
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] shadow-[0_4px_16px_rgba(13,27,62,0.06)] grid grid-cols-3 divide-x divide-[#F1F5F9] py-4 text-center"
            style={{ '--card-delay': '60ms' }}
          >
            <button
              type="button"
              onClick={() => {
                platformActions.updateStore(store().id, { isOpen: !store().isOpen });
                showToast(
                  !store().isOpen ? 'Store is now Active.' : 'Store set to Inactive.',
                  'info'
                );
              }}
              class="cursor-pointer px-2 transition-transform active:scale-95"
            >
              <p
                class={`text-sm font-extrabold inline-flex items-center gap-1.5 ${
                  store()?.isOpen ? 'text-[#15803D]' : 'text-[#DC2626]'
                }`}
              >
                <span
                  class={`w-2 h-2 rounded-full ${
                    store()?.isOpen ? 'bg-[#22C55E] radar-beacon text-[#22C55E]' : 'bg-[#EF4444]'
                  }`}
                />
                {store()?.isOpen ? 'Online' : 'Inactive'}
              </p>
              <p class="text-[11px] text-[#64748B] mt-0.5">Store Status</p>
            </button>

            <div class="px-2">
              <p class="font-display text-base font-extrabold text-[#0D1B3E] tabular-nums">
                {completedCount()}
              </p>
              <p class="text-[11px] text-[#64748B] mt-0.5">Completed Orders</p>
            </div>

            <div class="px-2">
              <p class="text-sm font-extrabold text-[#0D1B3E] truncate">
                {store()?.categoryName}
              </p>
              <p class="text-[11px] text-[#64748B] mt-0.5">Category</p>
            </div>
          </div>

          {/* Store Details Card */}
          <section
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 sm:p-5 space-y-3 shadow-xs"
            style={{ '--card-delay': '100ms' }}
          >
            <h2 class="font-display text-sm font-extrabold text-[#0D1B3E]">
              {store()?.categoryName} Store Details
            </h2>

            <div class="divide-y divide-[#F1F5F9]">
              <div class="py-3 first:pt-0 flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                  <Briefcase class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-[11px] text-[#64748B]">Store Name</p>
                  <p class="text-sm font-bold text-[#0D1B3E]">{store()?.name}</p>
                </div>
              </div>

              <div class="py-3 flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                  <Phone class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-[11px] text-[#64748B]">Contact Number</p>
                  <p class="text-sm font-bold text-[#0D1B3E]">{user()?.phone}</p>
                </div>
              </div>

              <div class="py-3 flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                    <Crosshair class="w-4 h-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] text-[#64748B]">Live Device / Store Address</p>
                    <p class="text-sm font-bold text-[#0D1B3E] leading-snug">
                      {geo.liveLocation()?.fullAddress || store()?.address}
                    </p>
                    <button
                      type="button"
                      onClick={handleLockGps}
                      class="mt-2 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#0066FF] text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Crosshair class="w-3 h-3" />
                      <span>Fetch Current GPS Location</span>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditForm({
                      name: store()?.name || '',
                      address: store()?.address || '',
                      categoryId: store()?.categoryId || 'cat-fashion',
                      phone: user()?.phone || '',
                    });
                    setEditModal(true);
                  }}
                  class="text-xs font-extrabold text-[#0066FF] hover:underline cursor-pointer shrink-0"
                >
                  Edit
                </button>
              </div>

              <div class="py-3 last:pb-0 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                    <Tag class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-[11px] text-[#64748B]">Store Category</p>
                    <p class="text-sm font-bold text-[#0D1B3E]">{store()?.categoryName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModal(true)}
                  class="text-xs font-extrabold text-[#0066FF] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          </section>

          {/* Store Video JSON (Animation) Card matching Screenshot 5 */}
          <section
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 sm:p-5 space-y-3 shadow-xs"
            style={{ '--card-delay': '140ms' }}
          >
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-display text-sm font-extrabold text-[#0D1B3E] inline-flex items-center gap-1.5">
                <Film class="w-4 h-4 text-[#7C3AED]" />
                <span>Store Video JSON (Animation)</span>
              </h2>
              <span class="px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#7E22CE] text-[10px] font-extrabold">
                60 FPS SHOWCASE
              </span>
            </div>

            <p class="text-xs text-[#64748B] leading-relaxed">
              Showcase your store with an eye-catching 60 FPS animated promotional video JSON banner
              at the top of your customer store menu.
            </p>

            <div class="rounded-2xl border border-dashed border-[#CBD8EC] bg-[#F8FAFD] p-5 text-center space-y-1">
              <Film class="w-7 h-7 text-[#7C3AED] mx-auto float-gentle" />
              <p class="text-xs font-extrabold text-[#0D1B3E]">
                {hasVideoJson() ? 'Lottie JSON Animation Active' : 'No Store Video JSON Added Yet'}
              </p>
              <p class="text-[11px] text-[#64748B]">
                Add a curated animation or paste your custom Lottie JSON to showcase on your store menu.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setVideoModal(true)}
              class="w-full min-h-[44px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Upload class="w-4 h-4" />
              <span>Upload Store Video JSON</span>
            </button>
          </section>

          {/* Store Showcase (3 Photos) Auto-Slider Card matching Screenshot 5 */}
          <section
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 sm:p-5 space-y-3 shadow-xs"
            style={{ '--card-delay': '180ms' }}
          >
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-display text-sm font-extrabold text-[#0D1B3E]">
                Store Showcase (3 Photos)
              </h2>
              <span class="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#0066FF] text-[10px] font-extrabold">
                AUTO-SLIDER
              </span>
            </div>

            <p class="text-xs text-[#64748B]">
              Showcase your store with 3 high-quality views (Front, Inside &amp; Products). These
              auto-slide on the customer store menu.
            </p>

            <div class="grid grid-cols-3 gap-2.5">
              {[
                { idx: 0, label: 'Store Front & Board' },
                { idx: 1, label: 'Inside Store & Ambience' },
                { idx: 2, label: 'Products & Specialties' },
              ].map((slot) => (
                <label class="group cursor-pointer space-y-1.5 text-center">
                  <div class="aspect-square rounded-2xl border border-dashed border-[#CBD8EC] group-hover:border-[#0066FF] bg-[#F8FAFD] overflow-hidden flex flex-col items-center justify-center relative transition-colors">
                    <Show
                      when={showcaseSlots()[slot.idx]}
                      fallback={
                        <div class="text-center p-2">
                          <Camera class="w-5 h-5 text-[#64748B] mx-auto group-hover:scale-110 transition-transform" />
                          <span class="text-[10px] font-bold text-[#64748B] block mt-1">
                            Slot {slot.idx + 1}
                          </span>
                        </div>
                      }
                    >
                      <img
                        src={showcaseSlots()[slot.idx]}
                        alt={slot.label}
                        class="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                      />
                    </Show>
                  </div>
                  <p class="text-[10px] font-bold text-[#475569] leading-tight">{slot.label}</p>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    onChange={(e) => handleSlotUpload(slot.idx, e)}
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                if (showcaseSlots()[0]) {
                  platformActions.updateStore(store().id, { banner: showcaseSlots()[0] });
                }
                showToast('3 Showcase Photos published to your customer storefront.', 'success');
              }}
              class="w-full min-h-[44px] rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Save class="w-4 h-4" />
              <span>Save &amp; Publish 3 Showcase Photos</span>
            </button>
          </section>

          {/* Permanent Store Location Card matching Screenshot 5 */}
          <section
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 sm:p-5 space-y-3 shadow-xs"
            style={{ '--card-delay': '220ms' }}
          >
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-display text-sm font-extrabold text-[#0D1B3E] inline-flex items-center gap-1.5">
                <MapPin class="w-4 h-4 text-[#DC2626]" />
                <span>Permanent Store Location</span>
              </h2>
              <span class="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[10px] font-extrabold inline-flex items-center gap-1">
                <span>LOCKED</span>
                <CheckCircle2 class="w-3 h-3" />
              </span>
            </div>

            <p class="text-xs text-[#64748B]">
              Your physical store coordinates are permanently locked in Ride Hub database. They will
              NEVER change when you travel or re-login.
            </p>

            <div class="rounded-2xl bg-[#F8FAFD] border border-[#E2EBF8] p-3.5">
              <p class="text-xs font-extrabold text-[#0D1B3E]">
                {geo.liveLocation()?.fullAddress || `${store()?.name}, ${store()?.address}`}
              </p>
              <p class="text-[11px] font-mono text-[#64748B] mt-0.5 tabular-nums">
                GPS: {geo.liveLocation()?.lat ?? store()?.lat}, {geo.liveLocation()?.lng ?? store()?.lng}
                {geo.liveLocation()?.accuracy ? ` (± ${geo.liveLocation().accuracy}m)` : ''}
              </p>
              <p class="text-[11px] font-bold text-[#15803D] mt-1 inline-flex items-center gap-1.5">
                <Show when={geo.liveLocation()}>
                  <span class="w-2 h-2 rounded-full bg-[#22C55E] radar-beacon text-[#22C55E]" />
                </Show>
                <span>{geo.liveLocation() ? 'Live Device GPS Active' : 'Saved Store Coordinates'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleLockGps}
              class="w-full min-h-[44px] rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Crosshair class="w-4 h-4" />
              <span>Detect &amp; Lock Permanent Store GPS</span>
            </button>
          </section>

          {/* Store Settings & Actions Card matching Screenshot 5 */}
          <section
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 sm:p-5 shadow-xs divide-y divide-[#F1F5F9]"
            style={{ '--card-delay': '260ms' }}
          >
            <h2 class="font-display text-sm font-extrabold text-[#0D1B3E] pb-3">
              Store Settings &amp; Actions
            </h2>

            <div class="py-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center">
                  <Moon class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-sm font-bold text-[#0D1B3E]">Dark Mode</p>
                  <p class="text-xs text-[#64748B]">
                    {darkMode() ? 'Dark theme preview' : 'Light theme enabled'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode()}
                onClick={() => setDarkMode((v) => !v)}
                class={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${
                  darkMode() ? 'bg-[#0066FF]' : 'bg-[#CBD5E1]'
                }`}
              >
                <span
                  class={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    darkMode() ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <label class="py-3 flex items-center justify-between gap-3 cursor-pointer">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center">
                  <Upload class="w-4 h-4" />
                </div>
                <span class="text-sm font-bold text-[#0D1B3E]">Upload Store Logo / Photo</span>
              </div>
              <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              <input type="file" accept="image/*" class="hidden" onChange={handleStorePhotoUpload} />
            </label>

            <button
              type="button"
              onClick={() => {
                const next = language() === 'English' ? 'हिन्दी (Hindi)' : 'English';
                setLanguage(next);
                showToast(`Partner app language set to ${next}.`, 'success');
              }}
              class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#0066FF] flex items-center justify-center">
                  <Globe class="w-4 h-4" />
                </div>
                <span class="text-sm font-bold text-[#0D1B3E]">Change Language</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-[#0066FF]">{language()}</span>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              class="w-full py-3 pt-3.5 flex items-center justify-between gap-3 text-left cursor-pointer text-[#DC2626]"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                  <LogOut class="w-4 h-4" />
                </div>
                <span class="text-sm font-extrabold">Log Out Store</span>
              </div>
              <ChevronRight class="w-4 h-4" />
            </button>
          </section>
        </div>
      </div>

      {/* Edit Store Details Modal */}
      <Modal
        open={editModal()}
        onClose={() => setEditModal(false)}
        title="Edit Store Details"
      >
        <form onSubmit={handleSaveDetails} class="space-y-4">
          <TextField
            label="Store Name"
            value={editForm().name}
            onInput={(e) => setEditForm((f) => ({ ...f, name: e.currentTarget.value }))}
          />
          <TextField
            label="Contact Number"
            value={editForm().phone}
            onInput={(e) => setEditForm((f) => ({ ...f, phone: e.currentTarget.value }))}
          />
          <SelectField
            label="Store Category"
            value={editForm().categoryId}
            onChange={(e) => setEditForm((f) => ({ ...f, categoryId: e.currentTarget.value }))}
          >
            <For each={platformState.categories}>
              {(cat) => <option value={cat.id}>{cat.name}</option>}
            </For>
          </SelectField>
          <TextField
            label="Store Address"
            value={editForm().address}
            onInput={(e) => setEditForm((f) => ({ ...f, address: e.currentTarget.value }))}
          />
          <div class="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Details</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Store Video JSON Modal */}
      <Modal
        open={videoModal()}
        onClose={() => setVideoModal(false)}
        title="Upload Store Video JSON (Lottie)"
      >
        <form onSubmit={handleSaveVideoJson} class="space-y-4">
          <textarea
            rows={4}
            value={videoJsonText()}
            onInput={(e) => setVideoJsonText(e.currentTarget.value)}
            placeholder='Paste Lottie JSON animation payload or URL...'
            class="w-full p-3 text-xs font-mono border border-[#CBD8EC] rounded-xl focus:outline-none focus:border-[#7C3AED]"
          />
          <div class="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setVideoModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Activate 60 FPS Showcase</Button>
          </div>
        </form>
      </Modal>
    </SupplierLayout>
  );
}
