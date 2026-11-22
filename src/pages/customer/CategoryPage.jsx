import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingCart,
  X,
} from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { ASSET_IMAGES } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { requestConfirmation, showToast } from '../../stores/toastStore.js';
import { EmptyState, ImageWithFallback } from '../../components/ui/DataDisplay.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { AnimatedProductCard } from '../../components/ui/AnimatedProductCard.jsx';

export function CategoryPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [selectedSub, setSelectedSub] = createSignal('all');
  const [searchOpen, setSearchOpen] = createSignal(false);
  const [searchText, setSearchText] = createSignal('');

  // Reset subcategory & search filter whenever route category changes
  createEffect(() => {
    void params.slug;
    setSelectedSub('all');
    setSearchText('');
    setSearchOpen(false);
  });

  const category = createMemo(() => {
    const slug = String(params.slug || 'fashion').toLowerCase();
    return (
      platformState.categories.find((c) => c.slug === slug || c.id === slug) ||
      platformState.categories[0]
    );
  });

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

  const filteredItems = createMemo(() => {
    const catId = category()?.id;
    const sub = selectedSub();
    const q = searchText().trim().toLowerCase();

    return platformState.products.filter((p) => {
      if (p.categoryId !== catId) return false;
      if (sub !== 'all' && p.subcategoryId !== sub) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.subcategoryLabel || '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  });

  const handleAdd = async (product) => {
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
        title: 'Switch store in cart?',
        message:
          'Your cart has items from another store partner. Replace cart with this product?',
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
    <CustomerLayout title={category()?.name || 'Category'} hideTopBar={true} fullBleed={true}>
      <div class="bg-white min-h-screen">
        {/* Screen 3 Sticky Header: ONLY Clicked Category Name (< Fashion / < Vegetables / < Beauty) + Search + Cart */}
        <header class="sticky top-0 z-30 bg-white border-b border-[#EBF1FA] px-4 sm:px-6 py-3 space-y-2.5">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/customer')}
                aria-label="Back to Home"
                class="w-10 h-10 rounded-full bg-[#F4F7FC] hover:bg-[#EBF3FF] text-[#0D1B3E] inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <ChevronLeft class="w-5 h-5" />
              </button>
              <h1 class="font-display text-lg sm:text-xl font-extrabold text-[#0D1B3E] truncate">
                {category()?.name}
              </h1>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const next = !searchOpen();
                  setSearchOpen(next);
                  if (!next) setSearchText('');
                }}
                aria-label="Search category items"
                class="w-10 h-10 rounded-full bg-[#F4F7FC] hover:bg-[#EBF3FF] text-[#0D1B3E] inline-flex items-center justify-center cursor-pointer transition-colors"
              >
                <Show when={!searchOpen()} fallback={<X class="w-4 h-4" />}>
                  <Search class="w-4 h-4" />
                </Show>
              </button>

              <A
                href="/customer/cart"
                aria-label="Cart"
                class={`relative w-10 h-10 rounded-full bg-[#F4F7FC] hover:bg-[#EBF3FF] text-[#0D1B3E] inline-flex items-center justify-center transition-colors ${
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

          <Show when={searchOpen()}>
            <div class="relative">
              <Search class="w-4 h-4 text-[#0066FF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchText()}
                onInput={(e) => setSearchText(e.currentTarget.value)}
                placeholder={`Search in ${category()?.name}...`}
                class="w-full min-h-[40px] pl-10 pr-4 py-2 text-sm bg-[#F8FAFD] border border-[#CBD8EC] rounded-xl focus:bg-white focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </Show>
        </header>

        <div class="px-4 sm:px-6 pt-4 pb-10 space-y-6">

          {/* Screen 3 Rounded Category Hero Banner with Category-Specific Image & Ken Burns Motion */}
          <section
            class={`item-card-reveal group rounded-2xl overflow-hidden bg-gradient-to-r ${
              category()?.heroBg || 'from-[#FFF1F2] via-[#FFF7ED] to-[#FCE7F3]'
            } border border-[#E2EBF8] shadow-xs`}
            style={{ '--item-delay': '0ms' }}
          >
            <div class="grid grid-cols-1 md:grid-cols-12 items-stretch">
              <div class="md:col-span-7 relative h-48 sm:h-56 md:h-64 overflow-hidden">
                <ImageWithFallback
                  src={category()?.heroImage || ASSET_IMAGES.fashionBanner}
                  alt={category()?.name}
                  class="w-full h-full object-cover object-top hero-ken-burns"
                />
                <div aria-hidden="true" class="item-shine-layer" />
              </div>
              <div class="md:col-span-5 p-4 sm:p-6 flex flex-col justify-center gap-1.5">
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#0066FF]">
                  Ride Hub · {category()?.name}
                </span>
                <h2 class="font-display text-xl sm:text-2xl font-extrabold text-[#0D1B3E] leading-tight">
                  {category()?.heroHeadline || category()?.name}
                </h2>
                <p class="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  {category()?.tagline}
                </p>
              </div>
            </div>
          </section>

          {/* Screen 3 Subcategories 3-Column Visual Cards with Staggered Reveal & Specular Sheen */}
          <Show when={category()?.subcategories?.length > 0}>
            <section class="space-y-3.5">
              <div class="flex items-end justify-between gap-2">
                <div>
                  <h2 class="font-display text-lg sm:text-xl font-extrabold text-[#0D1B3E]">
                    Categories
                  </h2>
                  <p class="text-xs sm:text-sm text-[#64748B]">
                    Select category to explore subcategories
                  </p>
                </div>

                <Show when={selectedSub() !== 'all'}>
                  <button
                    type="button"
                    onClick={() => setSelectedSub('all')}
                    class="text-xs font-bold text-[#0066FF] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Show All
                  </button>
                </Show>
              </div>

              <div class="grid grid-cols-3 gap-3 sm:gap-5">
                <For each={category().subcategories}>
                  {(sub, idx) => {
                    const active = () => selectedSub() === sub.id;
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedSub(active() ? 'all' : sub.id)}
                        style={{ '--item-delay': `${Math.min(idx(), 8) * 55}ms` }}
                        class={`item-card-reveal group rounded-2xl overflow-hidden bg-white border text-left cursor-pointer shadow-xs hover:shadow-[0_12px_24px_rgba(0,102,255,0.12)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] ${
                          active()
                            ? 'border-[#0066FF] ring-2 ring-[#0066FF]/25'
                            : 'border-[#E2E8F0] hover:border-[#93C5FD]'
                        }`}
                      >
                        <div
                          class={`aspect-[4/4.4] bg-gradient-to-br ${sub.tone} relative overflow-hidden`}
                        >
                          <ImageWithFallback
                            src={sub.image || category()?.heroImage}
                            alt={sub.name}
                            class={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 ${
                              sub.portrait ? 'object-top' : 'object-center'
                            }`}
                          />
                          <div aria-hidden="true" class="item-shine-layer" />
                          <Show when={active()}>
                            <span class="cart-pop-bounce absolute top-2 right-2 w-6 h-6 rounded-full bg-[#0066FF] text-white inline-flex items-center justify-center shadow">
                              <Check class="w-3.5 h-3.5" />
                            </span>
                          </Show>
                        </div>
                        <div class="px-2 py-2.5 sm:py-3 bg-white flex items-center justify-center gap-0.5">
                          <span class="text-xs sm:text-sm font-extrabold text-[#0D1B3E] group-hover:text-[#0066FF] truncate transition-colors">
                            {sub.name}
                          </span>
                          <ChevronRight class="w-4 h-4 text-[#0066FF] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    );
                  }}
                </For>
              </div>
            </section>
          </Show>

          {/* Screen 3 Trending Real Items Product Grid with Real Product Photos, Floating Price & + ADD Button */}
          <section class="space-y-4">
            <div class="flex items-end justify-between gap-2">
              <div>
                <h2 class="font-display text-lg sm:text-xl font-extrabold text-[#0D1B3E]">
                  Trending Real Items
                </h2>
                <p class="text-xs sm:text-sm text-[#64748B]">
                  Authentic products available for instant order
                </p>
              </div>
              <span class="text-xs font-bold text-[#64748B] tabular-nums shrink-0">
                {filteredItems().length} items
              </span>
            </div>

            <Show
              when={filteredItems().length > 0}
              fallback={
                <EmptyState
                  title="No items in this subcategory yet"
                  description="Clear the subcategory filter to see all available items."
                  action={
                    <Button variant="secondary" onClick={() => setSelectedSub('all')}>
                      Show All {category()?.name}
                    </Button>
                  }
                />
              }
            >
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                <For each={filteredItems()}>
                  {(item, idx) => (
                    <AnimatedProductCard
                      item={item}
                      index={idx()}
                      fallbackImage={category()?.heroImage}
                      fallbackCategoryName={category()?.name}
                      onAdd={handleAdd}
                    />
                  )}
                </For>
              </div>
            </Show>
          </section>
        </div>
      </div>
    </CustomerLayout>
  );
}
