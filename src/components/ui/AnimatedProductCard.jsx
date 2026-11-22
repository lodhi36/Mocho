import { Show, createMemo, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import { Heart, Minus, Plus, Star } from 'lucide-solid';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { formatCurrency } from '../../utils/formatters.js';
import { showToast } from '../../stores/toastStore.js';
import { ImageWithFallback } from './DataDisplay.jsx';

/**
 * World-class animated product item card with:
 * - Staggered spring entrance cascade
 * - Subtle 3D perspective tilt + specular light sheen on hover/pointer move
 * - Elastic Wishlist heart pop
 * - Floating "+1" micro-burst & morphing quantity stepper on Add to Cart
 */
export function AnimatedProductCard(props) {
  const item = () => props.item;
  const index = () => props.index || 0;

  const [tilt, setTilt] = createSignal({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });
  const [burstKey, setBurstKey] = createSignal(0);
  const [heartPulse, setHeartPulse] = createSignal(false);
  const [btnPulse, setBtnPulse] = createSignal(false);

  const effectivePrice = createMemo(() => {
    const p = item();
    return p.discountPrice > 0 ? p.discountPrice : p.price;
  });

  const discountPct = createMemo(() => {
    const p = item();
    if (!p.discountPrice || p.discountPrice >= p.price || p.price <= 0) return 0;
    return Math.round(((p.price - p.discountPrice) / p.price) * 100);
  });

  const store = createMemo(() =>
    platformState.stores.find((s) => s.id === item().storeId)
  );

  const cartEntry = createMemo(() => {
    const p = item();
    const defaultVar = p.variations?.[0]?.label || 'Standard';
    return platformState.cart.find(
      (c) => c.productId === p.id && c.variation === defaultVar
    );
  });

  const isSaved = createMemo(() => platformState.wishlist.includes(item().id));

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / Math.max(1, rect.width);
    const py = (e.clientY - rect.top) / Math.max(1, rect.height);
    const ry = (px - 0.5) * 7.5;
    const rx = (0.5 - py) * 7.5;
    setTilt({ rx, ry, gx: Math.round(px * 100), gy: Math.round(py * 100), hovering: true });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });
  };

  const triggerBurst = () => {
    setBurstKey((k) => k + 1);
    setBtnPulse(true);
    window.setTimeout(() => setBtnPulse(false), 380);
  };

  const handleQuickAdd = async () => {
    triggerBurst();
    await props.onAdd?.(item());
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wasSaved = isSaved();
    platformActions.toggleWishlist(item().id);
    setHeartPulse(true);
    window.setTimeout(() => setHeartPulse(false), 420);
    showToast(wasSaved ? 'Removed from wishlist.' : `${item().name} saved to wishlist.`, 'info');
  };

  return (
    <article
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      class="item-card-reveal item-card-interactive group relative bg-white border border-[#E2E8F0] hover:border-[#93C5FD] rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_2px_12px_rgba(13,27,62,0.04)] hover:shadow-[0_14px_30px_rgba(0,102,255,0.12)] transition-shadow duration-300"
      style={{
        '--item-delay': `${Math.min(index(), 10) * 48}ms`,
        transform: tilt().hovering
          ? `perspective(900px) rotateX(${tilt().rx}deg) rotateY(${tilt().ry}deg) translate3d(0, -4px, 0)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)',
        transition: tilt().hovering
          ? 'transform 120ms ease-out, box-shadow 260ms ease, border-color 220ms ease'
          : 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease, border-color 220ms ease',
      }}
    >
      {/* Dynamic Interactive Spotlight Overlay */}
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: tilt().hovering ? 1 : 0,
          background: `radial-gradient(circle at ${tilt().gx}% ${tilt().gy}%, rgba(255,255,255,0.22), transparent 58%)`,
        }}
      />

      <div>
        {/* Product Photo Area with Smooth Zoom, Specular Sheen & Floating Price */}
        <A
          href={`/customer/product/${item().id}`}
          class="relative block aspect-[4/3.8] bg-[#F8FAFD] overflow-hidden"
        >
          <ImageWithFallback
            src={item().images?.[0] || props.fallbackImage}
            alt={item().name}
            class="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-110"
          />

          {/* Diagonal Specular Shine Sweep */}
          <div aria-hidden="true" class="item-shine-layer" />

          {/* Subtle Bottom Scrim for Price Legibility */}
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0D1B3E]/45 via-transparent to-transparent" />

          {/* Top-Left Discount Saving Tag */}
          <Show when={discountPct() >= 5}>
            <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#16A34A] text-white text-[10px] font-extrabold tracking-wide shadow-xs tabular-nums">
              {discountPct()}% OFF
            </span>
          </Show>

          {/* Top-Right Elastic Wishlist Heart */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isSaved() ? 'Remove from wishlist' : 'Save to wishlist'}
            class={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm inline-flex items-center justify-center cursor-pointer transition-transform active:scale-90 ${
              heartPulse() ? 'heart-pop' : ''
            }`}
          >
            <Heart
              class={`w-4 h-4 transition-colors ${
                isSaved() ? 'text-[#DC2626] fill-[#DC2626]' : 'text-[#475569]'
              }`}
            />
          </button>

          {/* Bottom-Left Floating Price Badge */}
          <div class="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <span class="px-2.5 py-1 rounded-lg bg-[#0F172A]/95 text-white text-xs font-extrabold tabular-nums shadow-xs">
              {formatCurrency(effectivePrice())}
            </span>
            <Show when={item().discountPrice > 0 && item().price > item().discountPrice}>
              <span class="px-1.5 py-0.5 rounded-md bg-white/95 text-[#64748B] text-[10px] font-bold line-through tabular-nums">
                {formatCurrency(item().price)}
              </span>
            </Show>
          </div>
        </A>

        {/* Product Title & Store Metadata */}
        <div class="p-3 sm:p-3.5 pb-2">
          <A
            href={`/customer/product/${item().id}`}
            class="block text-sm font-extrabold text-[#0D1B3E] group-hover:text-[#0066FF] line-clamp-2 leading-snug transition-colors"
          >
            {item().name}
          </A>
          <div class="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <span class="truncate">{store()?.name || 'Ride Hub Partner'}</span>
            <Show when={item().rating}>
              <span class="inline-flex items-center gap-0.5 font-bold text-[#0D1B3E] shrink-0 tabular-nums">
                <Star class="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                {item().rating}
              </span>
            </Show>
          </div>
        </div>
      </div>

      {/* Bottom Action Row: Subcategory + Animated "+ ADD" / Morphing Stepper */}
      <div class="px-3 sm:px-3.5 pb-3 pt-1 flex items-center justify-between gap-2 relative">
        <span class="text-xs font-medium text-[#64748B] truncate">
          {item().subcategoryLabel || props.fallbackCategoryName || 'Item'}
        </span>

        <div class="relative shrink-0">
          {/* Floating "+1" Celebration Micro-Burst */}
          <Show when={burstKey()} keyed>
            {() => (
              <span
                aria-hidden="true"
                class="float-plus-one pointer-events-none absolute -top-2 left-1/2 z-30 px-2 py-0.5 rounded-full bg-[#16A34A] text-white text-[10px] font-extrabold shadow"
              >
                +1
              </span>
            )}
          </Show>

          <Show
            when={cartEntry()}
            fallback={
              <button
                type="button"
                disabled={props.disabled || !item().available || item().stock <= 0}
                onClick={handleQuickAdd}
                class={`min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-[#94A3B8] text-white text-xs font-extrabold tracking-wide inline-flex items-center gap-1 whitespace-nowrap cursor-pointer shadow-[0_4px_12px_rgba(0,102,255,0.24)] transition-transform active:scale-90 ${
                  btnPulse() ? 'cart-pop-bounce' : ''
                }`}
              >
                <Plus class="w-3.5 h-3.5" />
                <span>ADD</span>
              </button>
            }
          >
            {(entry) => (
              <div
                class={`inline-flex items-center rounded-xl bg-[#0066FF] text-white overflow-hidden shadow-[0_4px_12px_rgba(0,102,255,0.24)] ${
                  btnPulse() ? 'cart-pop-bounce' : ''
                }`}
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() =>
                    platformActions.updateCartQty(entry().productId, entry().variation, -1)
                  }
                  class="w-8 h-9 inline-flex items-center justify-center hover:bg-[#0052CC] active:scale-90 cursor-pointer transition-transform"
                >
                  <Minus class="w-3.5 h-3.5" />
                </button>
                <span class="w-6 text-center text-xs font-extrabold tabular-nums">
                  {entry().qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => {
                    triggerBurst();
                    platformActions.updateCartQty(entry().productId, entry().variation, 1);
                  }}
                  class="w-8 h-9 inline-flex items-center justify-center hover:bg-[#0052CC] active:scale-90 cursor-pointer transition-transform"
                >
                  <Plus class="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </Show>
        </div>
      </div>
    </article>
  );
}
