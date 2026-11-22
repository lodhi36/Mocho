import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Crosshair,
  Headphones,
  MapPin,
  Mic,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Truck,
  Zap,
} from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { ASSET_IMAGES } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { requestConfirmation, showToast } from '../../stores/toastStore.js';
import { EmptyState, ImageWithFallback } from '../../components/ui/DataDisplay.jsx';
import { MarigoldToran, StoreMiniIcon } from '../../components/ui/FestiveVisuals.jsx';
import { AnimatedProductCard } from '../../components/ui/AnimatedProductCard.jsx';

// Category circular thumbs come directly from category.thumbImage in platformState.categories

export function CustomerHome() {
  const navigate = useNavigate();
  const geo = useGeolocation();

  const [searchQuery, setSearchQuery] = createSignal('');
  const [bannerIndex, setBannerIndex] = createSignal(0);
  const [listening, setListening] = createSignal(false);

  const user = () => currentUser();
  const addresses = createMemo(() => user()?.addresses || []);
  const activeAddress = createMemo(
    () => addresses().find((a) => a.isDefault) || addresses()[0] || null
  );

  const [cartBounce, setCartBounce] = createSignal(false);

  const cartCount = createMemo(() =>
    platformState.cart.reduce((sum, item) => sum + (item.qty || 0), 0)
  );

  let prevCartCount = 0;
  createEffect(() => {
    const count = cartCount();
    if (count !== prevCartCount) {
      prevCartCount = count;
      if (count > 0) {
        setCartBounce(true);
        window.setTimeout(() => setCartBounce(false), 400);
      }
    }
  });

  const unreadNotifs = createMemo(
    () =>
      platformState.notifications.filter(
        (n) => n.targetRole === user()?.role && (!n.userId || n.userId === user()?.id) && !n.read
      ).length
  );

  const activeBanners = createMemo(() => platformState.banners.filter((b) => b.active));
  const currentBanner = createMemo(
    () => activeBanners()[bannerIndex() % Math.max(1, activeBanners().length)]
  );

  const activeCategories = createMemo(() =>
    platformState.categories.filter((c) => c.active)
  );

  const searchResults = createMemo(() => {
    const q = searchQuery().trim().toLowerCase();
    if (!q) return { stores: [], products: [] };
    const stores = platformState.stores.filter(
      (s) =>
        s.isActive &&
        (s.name.toLowerCase().includes(q) ||
          s.categoryName.toLowerCase().includes(q) ||
          (s.locality || '').toLowerCase().includes(q))
    );
    const products = platformState.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.subcategoryLabel || '').toLowerCase().includes(q)
    );
    return { stores, products };
  });

  // Group featured sections matching Screen 2 ("Fashion — Popular Near You", "Beauty — Popular Near You", etc.)
  const popularSections = createMemo(() => {
    const orderedCatIds = [
      'cat-fashion',
      'cat-beauty',
      'cat-vegetables',
      'cat-fruits',
      'cat-toys',
      'cat-food',
      'cat-grocery',
      'cat-pharmacy',
    ];
    return orderedCatIds
      .map((catId) => {
        const cat = platformState.categories.find((c) => c.id === catId);
        const stores = platformState.stores.filter(
          (s) => s.isActive && s.categoryId === catId
        );
        return cat && stores.length > 0 ? { category: cat, stores } : null;
      })
      .filter(Boolean);
  });

  const handleVoiceSearch = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Voice search is not supported in this browser. Type your search directly.', 'info');
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = 'en-IN';
      setListening(true);
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setSearchQuery(transcript);
        setListening(false);
      };
      rec.onerror = () => {
        setListening(false);
        showToast('Could not capture voice input. Try typing instead.', 'warning');
      };
      rec.onend = () => setListening(false);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const handleQuickAdd = async (product) => {
    if (!product.available || product.stock <= 0) {
      showToast('This item is currently out of stock.', 'warning');
      return;
    }
    const v = product.variations?.[0] || { label: 'Standard', priceDelta: 0 };
    const price =
      (product.discountPrice > 0 ? product.discountPrice : product.price) + (v.priceDelta || 0);
    const res = platformActions.addToCart(product, v.label, price, 1);
    if (res.conflictStore) {
      const ok = await requestConfirmation({
        title: 'Start a fresh cart?',
        message: 'Your cart has items from another store. Replace cart with this item?',
        confirmLabel: 'Replace Cart',
      });
      if (ok) {
        platformActions.replaceCartWithItem(product, v.label, price, 1);
        showToast(`${product.name} added to cart.`, 'success');
      }
      return;
    }
    showToast(`${product.name} added to cart.`, 'success');
  };

  return (
    <CustomerLayout title="Ride Hub" hideTopBar={true} fullBleed={true}>
      <div class="bg-white min-h-screen">
        {/* Screen 2 Sticky Top Header: Location + Help + Bell + Cart + Search Row */}
        <header class="sticky top-0 z-30 bg-white border-b border-[#E5EEF9] px-4 sm:px-6 pt-3 pb-3.5 space-y-3">
          <div class="flex items-center justify-between gap-2">
            {/* Real Live Device Location Selector */}
            <button
              type="button"
              onClick={() => navigate('/customer/location')}
              class="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group active:scale-[0.98] transition-transform"
            >
              <div class="relative w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <Show when={geo.liveLocation()}>
                  <span class="radar-beacon absolute top-1 right-1 w-2 h-2 rounded-full bg-[#16A34A] text-[#16A34A]" />
                </Show>
                <MapPin class="w-4 h-4 text-[#DC2626] fill-[#DC2626]/20 transition-transform duration-200 group-hover:scale-110" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1">
                  <span class="font-display text-sm sm:text-base font-extrabold text-[#0D1B3E] group-hover:text-[#0066FF] uppercase tracking-wide truncate max-w-[165px] sm:max-w-[240px]">
                    <Show
                      when={geo.liveLocation()}
                      fallback={
                        geo.loading()
                          ? 'DETECTING GPS...'
                          : activeAddress()?.label || 'ENABLE GPS'
                      }
                    >
                      {(loc) => loc().area || loc().shortAddress || 'LIVE AREA'}
                    </Show>
                  </span>
                  <ChevronDown class="w-4 h-4 text-[#0066FF] shrink-0" />
                </div>
                <p class="text-xs font-medium text-[#475569] truncate max-w-[185px] sm:max-w-xs">
                  <Show
                    when={geo.liveLocation()}
                    fallback={
                      geo.loading()
                        ? 'Fetching your live area address...'
                        : activeAddress()
                        ? activeAddress().line1
                        : 'Tap to allow live GPS location'
                    }
                  >
                    {(loc) => loc().fullAddress || loc().shortAddress || `${loc().lat}, ${loc().lng}`}
                  </Show>
                </p>
              </div>
            </button>

            {/* Right Actions: Help, Notification Bell, Cart */}
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/customer/account')}
                class="h-10 px-3 sm:px-3.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EBF3FF] inline-flex items-center gap-1.5 text-xs font-bold text-[#0D1B3E] cursor-pointer transition-colors"
              >
                <Headphones class="w-3.5 h-3.5 text-[#0D1B3E]" />
                <span>Help</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/customer/notifications')}
                aria-label="Notifications"
                class="relative w-10 h-10 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EBF3FF] inline-flex items-center justify-center text-[#0D1B3E] cursor-pointer transition-all active:scale-90"
              >
                <Bell class="w-4 h-4" />
                <Show when={unreadNotifs() > 0}>
                  <span class="radar-beacon absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#0066FF] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadNotifs()}
                  </span>
                </Show>
              </button>

              <A
                href="/customer/cart"
                aria-label="Cart"
                class={`relative w-10 h-10 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EBF3FF] inline-flex items-center justify-center text-[#0D1B3E] transition-colors ${
                  cartBounce() ? 'cart-pop-bounce' : ''
                }`}
              >
                <ShoppingCart class="w-4 h-4" />
                <Show when={cartCount() > 0}>
                  <span class="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#0066FF] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {cartCount()}
                  </span>
                </Show>
              </A>
            </div>
          </div>

          {/* Search Pill + Voice Mic + GPS Crosshair Button */}
          <div class="flex items-center gap-2.5">
            <div class="relative flex-1 flex items-center rounded-full border-2 border-[#2563EB]/75 bg-white shadow-[0_2px_10px_rgba(37,99,235,0.08)] focus-within:border-[#0066FF]">
              <Search class="w-4 h-4 text-[#0066FF] ml-3.5 shrink-0" />
              <input
                type="search"
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                placeholder="Search fashion, facial & beauty, vegetables, fruits, toys, food..."
                class="w-full min-h-[42px] px-2.5 py-2 text-sm bg-transparent text-[#0D1B3E] placeholder:text-[#94A3B8] focus:outline-none"
              />
              <div class="h-5 w-px bg-[#E2E8F0]" />
              <button
                type="button"
                onClick={handleVoiceSearch}
                aria-label="Voice search"
                class={`w-10 h-10 inline-flex items-center justify-center rounded-full mr-0.5 cursor-pointer transition-colors ${
                  listening() ? 'text-[#0066FF] bg-[#EBF3FF]' : 'text-[#DC2626] hover:bg-[#FEF2F2]'
                }`}
              >
                <Mic class="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={async () => {
                const loc = await geo.detectLocation();
                if (loc?.fullAddress) {
                  showToast(`Live location updated: ${loc.shortAddress || loc.fullAddress}`, 'success');
                }
              }}
              aria-label="Refresh live GPS location"
              title="Refresh live device GPS location"
              class="w-11 h-11 rounded-2xl border border-[#CBD8EC] bg-[#F4F8FF] hover:bg-[#EBF3FF] text-[#0066FF] inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            >
              <Crosshair class={`w-5 h-5 ${geo.loading() ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <Show when={geo.error()}>
            <p class="text-xs text-[#B91C1C]">{geo.error()}</p>
          </Show>
        </header>

        {/* Main Content Body */}
        <div class="px-4 sm:px-6 pt-4 pb-8 space-y-6">
          {/* Live Search Results Overlay when typing */}
          <Show
            when={searchQuery().trim().length > 0}
            fallback={
              <>
                {/* Screen 2 Festive Promotional Banner Carousel */}
                <Show when={currentBanner()}>
                  {(banner) => (
                    <section class="space-y-2">
                      <div
                        onClick={() =>
                          navigate(`/customer/category/${banner().targetSlug || 'fashion'}`)
                        }
                        class="item-card-reveal group relative rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-r from-[#2D0A04] via-[#4A1205] to-[#1A0805] text-white shadow-md hover:shadow-xl min-h-[195px] sm:min-h-[230px] flex flex-col justify-between p-5 sm:p-7 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
                        style={{ '--item-delay': '0ms' }}
                      >
                        <img
                          src={banner().image}
                          alt={banner().title}
                          referrerPolicy="no-referrer"
                          class="hero-ken-burns absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
                        />
                        <div class="absolute inset-0 bg-gradient-to-r from-[#2D0A04]/90 via-[#5B1706]/75 to-[#1F0903]/85" />
                        <div aria-hidden="true" class="banner-glow-sweep" />

                        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div class="max-w-lg">
                            <span class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FDE047]">
                              <Sparkles class="w-3.5 h-3.5" />
                              {banner().badge || 'Ride Hub Festive'}
                            </span>
                            <h2 class="mt-1 font-display text-2xl sm:text-4xl font-extrabold text-[#FEF08A] drop-shadow-xs leading-tight">
                              {banner().title}
                            </h2>
                            <p class="mt-1.5 text-xs sm:text-sm text-[#FED7AA]">
                              {banner().subtitle}
                            </p>
                          </div>

                          <div class="flex items-center gap-3 shrink-0">
                            <div class="px-3.5 py-2 rounded-xl bg-[#DC2626] text-white font-display font-extrabold text-xs sm:text-sm shadow">
                              Ride Hub Express
                            </div>
                          </div>
                        </div>

                        {/* Bottom 4 Trust Feature Strip matching Screenshot 2 */}
                        <div class="relative z-10 mt-5 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-[#FEF9C3]">
                          <span class="inline-flex items-center gap-1.5">
                            <Zap class="w-3.5 h-3.5 text-[#FACC15]" />
                            Great Offers
                          </span>
                          <span class="inline-flex items-center gap-1.5">
                            <Truck class="w-3.5 h-3.5 text-[#FACC15]" />
                            Fast Delivery
                          </span>
                          <span class="inline-flex items-center gap-1.5">
                            <Tag class="w-3.5 h-3.5 text-[#FACC15]" />
                            Best Prices
                          </span>
                          <span class="inline-flex items-center gap-1.5">
                            <ShieldCheck class="w-3.5 h-3.5 text-[#FACC15]" />
                            Trusted Stores
                          </span>
                        </div>
                      </div>

                      {/* Carousel Indicator Dots */}
                      <div class="flex items-center justify-center gap-1.5 pt-1">
                        <For each={activeBanners()}>
                          {(_, idx) => (
                            <button
                              type="button"
                              aria-label={`Banner ${idx() + 1}`}
                              onClick={() => setBannerIndex(idx())}
                              class={`h-1.5 rounded-full transition-all cursor-pointer ${
                                bannerIndex() === idx()
                                  ? 'w-7 bg-[#0066FF]'
                                  : 'w-1.5 bg-[#CBD5E1] hover:bg-[#94A3B8]'
                              }`}
                            />
                          )}
                        </For>
                      </div>

                      {/* Marigold & Mango-Leaf Festive Toran Garland */}
                      <MarigoldToran />
                    </section>
                  )}
                </Show>

                {/* Screen 2 Circular Category Strip with Staggered Cascade & Spring Lift */}
                <section class="pt-1 pb-3 border-b border-[#EBF1FA]">
                  <div class="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-2 no-scrollbar">
                    <For each={activeCategories()}>
                      {(cat, idx) => (
                        <A
                          href={`/customer/category/${cat.slug}`}
                          style={{ '--item-delay': `${Math.min(idx(), 8) * 45}ms` }}
                          class="item-card-reveal flex flex-col items-center gap-2 shrink-0 w-[72px] sm:w-[84px] group transition-transform duration-200 hover:-translate-y-1.5 active:scale-95"
                        >
                          <div
                            class="w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] rounded-full p-[3px] shadow-sm group-hover:shadow-[0_10px_20px_rgba(0,102,255,0.18)] transition-all duration-300 group-hover:scale-108"
                            style={{
                              background: `linear-gradient(135deg, ${cat.ringFrom || '#0066FF'}, ${
                                cat.ringTo || '#22D3EE'
                              })`,
                            }}
                          >
                            <div class="w-full h-full rounded-full overflow-hidden border-2 border-white bg-[#F4F7FC] relative">
                              <ImageWithFallback
                                src={cat.thumbImage || cat.heroImage || ASSET_IMAGES.hero}
                                alt={cat.name}
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D1B3E]/80 to-transparent py-0.5 text-center">
                                <span class="text-[8px] font-bold text-white uppercase tracking-tight">
                                  {cat.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span class="text-xs font-semibold text-[#1E293B] group-hover:text-[#0066FF] text-center truncate w-full transition-colors">
                            {cat.name}
                          </span>
                        </A>
                      )}
                    </For>
                  </div>
                </section>

                {/* Screen 2 Category-Wise "Popular Near You" Store Partner Sections */}
                <div class="space-y-8">
                  <For each={popularSections()}>
                    {(section) => (
                      <section class="space-y-4">
                        <div class="flex items-center justify-between gap-3">
                          <h2 class="font-display text-lg sm:text-xl font-extrabold text-[#0D1B3E]">
                            {section.category.name} — Popular Near You
                          </h2>
                          <A
                            href={`/customer/category/${section.category.slug}`}
                            class="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0066FF] hover:underline whitespace-nowrap shrink-0"
                          >
                            <span>See all</span>
                            <ArrowRight class="w-3.5 h-3.5" />
                          </A>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <For each={section.stores}>
                            {(store, storeIdx) => (
                              <A
                                href={`/customer/store/${store.id}`}
                                style={{ '--item-delay': `${Math.min(storeIdx(), 6) * 55}ms` }}
                                class="item-card-reveal group bg-[#F8FAFD] border border-[#E2EBF8] hover:border-[#0066FF]/60 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98] shadow-[0_2px_10px_rgba(13,27,62,0.04)] hover:shadow-[0_14px_28px_rgba(0,102,255,0.12)]"
                              >
                                {/* Upper Store Partner Showcase matching Screen 2 Geeta Fashion card */}
                                <div class="relative p-4 pt-5 pb-4 flex flex-col items-center justify-center bg-[#F4F7FC] min-h-[168px] overflow-hidden">
                                  <div aria-hidden="true" class="item-shine-layer" />
                                  <span
                                    class={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide text-white ${
                                      store.isOpen ? 'bg-[#10B981]' : 'bg-[#64748B]'
                                    }`}
                                  >
                                    {store.isOpen ? 'ONLINE' : 'CLOSED'}
                                  </span>

                                  <div class="transition-transform duration-300 group-hover:scale-110">
                                    <StoreMiniIcon />
                                  </div>

                                  <p class="mt-2 text-sm font-bold text-[#0D1B3E] text-center">
                                    {store.name}
                                  </p>
                                  <p class="text-xs text-[#64748B]">Store Partner</p>

                                  <div class="mt-3 w-full flex items-center justify-between gap-2">
                                    <span class="px-2.5 py-1 rounded-lg bg-[#1E293B] text-white text-[11px] font-semibold inline-flex items-center gap-1">
                                      <Star class="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
                                      {store.locality || 'Local'}
                                    </span>
                                    <span class="px-2.5 py-1 rounded-lg bg-[#1E293B] text-white text-[11px] font-semibold tabular-nums">
                                      {store.reviewCount > 0
                                        ? `${store.rating} (${store.reviewCount})`
                                        : 'No ratings yet'}
                                    </span>
                                  </div>
                                </div>

                                {/* Bottom Store Info Footer */}
                                <div class="p-4 bg-white flex items-center justify-between gap-2">
                                  <div class="min-w-0">
                                    <h3 class="text-base font-extrabold text-[#0D1B3E] group-hover:text-[#0066FF] truncate transition-colors">
                                      {store.name}
                                    </h3>
                                    <p class="text-xs text-[#64748B] truncate mt-0.5">
                                      {store.locality} · {store.categoryName} · {store.etaMins} min
                                    </p>
                                  </div>
                                  <span class="text-xs font-bold text-[#0066FF] shrink-0 transition-transform duration-200 group-hover:translate-x-1">
                                    Visit →
                                  </span>
                                </div>
                              </A>
                            )}
                          </For>
                        </div>
                      </section>
                    )}
                  </For>
                </div>
              </>
            }
          >
            {/* Instant Search Results */}
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h2 class="font-display text-base font-bold text-[#0D1B3E]">
                  Results for &ldquo;{searchQuery()}&rdquo;
                </h2>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  class="text-xs font-semibold text-[#0066FF] hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>

              <Show
                when={
                  searchResults().stores.length > 0 || searchResults().products.length > 0
                }
                fallback={
                  <EmptyState
                    title="No matching stores or products"
                    description="Try searching for fashion, Geeta Fashion, spinach, sourdough, or toys."
                  />
                }
              >
                <Show when={searchResults().stores.length > 0}>
                  <div class="space-y-3">
                    <h3 class="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                      Stores ({searchResults().stores.length})
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <For each={searchResults().stores}>
                        {(s) => (
                          <A
                            href={`/customer/store/${s.id}`}
                            class="p-3.5 rounded-xl border border-[#DDE6F2] bg-white hover:border-[#0066FF] flex items-center justify-between gap-3"
                          >
                            <div>
                              <p class="text-sm font-bold text-[#0D1B3E]">{s.name}</p>
                              <p class="text-xs text-[#64748B]">
                                {s.locality} · {s.categoryName} · {s.etaMins} min
                              </p>
                            </div>
                            <span class="text-xs font-bold text-[#0066FF]">Open</span>
                          </A>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                <Show when={searchResults().products.length > 0}>
                  <div class="space-y-3">
                    <h3 class="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                      Products ({searchResults().products.length})
                    </h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                      <For each={searchResults().products}>
                        {(p, idx) => (
                          <AnimatedProductCard
                            item={p}
                            index={idx()}
                            onAdd={handleQuickAdd}
                          />
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </CustomerLayout>
  );
}
