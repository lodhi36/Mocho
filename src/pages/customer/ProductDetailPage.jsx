import { For, Show, createMemo, createSignal } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Star } from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { requestConfirmation, showToast } from '../../stores/toastStore.js';
import { formatCurrency } from '../../utils/formatters.js';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, ImageWithFallback, StatusText } from '../../components/ui/DataDisplay.jsx';

export function ProductDetailPage() {
  const params = useParams();
  const navigate = useNavigate();

  const product = createMemo(() => platformState.products.find((p) => p.id === params.productId));
  const store = createMemo(() =>
    product() ? platformState.stores.find((s) => s.id === product().storeId) : null
  );

  const [selectedVarIndex, setSelectedVarIndex] = createSignal(0);
  const [qty, setQty] = createSignal(1);
  const [tilt, setTilt] = createSignal({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });
  const [pricePulse, setPricePulse] = createSignal(false);
  const [heartPulse, setHeartPulse] = createSignal(false);
  const [addBurstKey, setAddBurstKey] = createSignal(0);
  const [addBtnPulse, setAddBtnPulse] = createSignal(false);

  const triggerPricePop = () => {
    setPricePulse(false);
    requestAnimationFrame(() => {
      setPricePulse(true);
      window.setTimeout(() => setPricePulse(false), 320);
    });
  };

  const handlePhotoMove = (e) => {
    if (e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / Math.max(1, rect.width);
    const py = (e.clientY - rect.top) / Math.max(1, rect.height);
    setTilt({
      rx: (0.5 - py) * 6,
      ry: (px - 0.5) * 6,
      gx: Math.round(px * 100),
      gy: Math.round(py * 100),
      hovering: true,
    });
  };

  const handlePhotoLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });
  };

  const activeVariation = createMemo(() => {
    const vars = product()?.variations || [];
    return vars[selectedVarIndex()] || { label: 'Standard', priceDelta: 0 };
  });

  const unitPrice = createMemo(() => {
    const p = product();
    if (!p) return 0;
    const base = p.discountPrice > 0 ? p.discountPrice : p.price;
    return base + (activeVariation().priceDelta || 0);
  });

  const isSaved = () => product() && platformState.wishlist.includes(product().id);

  const handleAddToCart = async (goToCart = false) => {
    const p = product();
    if (!p || !p.available || p.stock <= 0) return;

    const res = platformActions.addToCart(p, activeVariation().label, unitPrice(), qty());
    if (res.conflictStore) {
      const ok = await requestConfirmation({
        title: 'Replace existing cart?',
        message: 'Your cart contains products from another store. Replace it with this item?',
        confirmLabel: 'Replace Cart',
      });
      if (!ok) return;
      platformActions.replaceCartWithItem(p, activeVariation().label, unitPrice(), qty());
    }
    setAddBurstKey((k) => k + 1);
    setAddBtnPulse(true);
    window.setTimeout(() => setAddBtnPulse(false), 400);
    showToast(`${qty()} × ${p.name} added to cart.`, 'success');
    if (goToCart) navigate('/customer/cart');
  };

  return (
    <CustomerLayout title={product()?.name || 'Product Details'}>
      <Show
        when={product()}
        fallback={
          <EmptyState
            title="Product not found"
            description="This product is no longer available."
            action={
              <A href="/customer">
                <Button>Back to Explore</Button>
              </A>
            }
          />
        }
      >
        {(p) => (
          <div class="space-y-6">
            <A
              href={store() ? `/customer/store/${store().id}` : '/customer'}
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:underline"
            >
              <ArrowLeft class="w-4 h-4" />
              Back to {store()?.name || 'Marketplace'}
            </A>

            {/* Contiguous Animated Purchase Module */}
            <div
              class="item-card-reveal bg-white border border-[#DDE6F2] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-[0_8px_30px_rgba(13,27,62,0.06)]"
              style={{ '--item-delay': '0ms' }}
            >
              <div
                onPointerMove={handlePhotoMove}
                onPointerLeave={handlePhotoLeave}
                class="group relative lg:col-span-6 bg-[#F4F7FC] aspect-[4/3] lg:aspect-auto overflow-hidden"
                style={{
                  transform: tilt().hovering
                    ? `perspective(1000px) rotateX(${tilt().rx}deg) rotateY(${tilt().ry}deg)`
                    : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                  transition: tilt().hovering
                    ? 'transform 120ms ease-out'
                    : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <ImageWithFallback
                  src={p().images?.[0]}
                  alt={p().name}
                  class="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
                />
                <div aria-hidden="true" class="item-shine-layer" />
                <div
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-0 transition-opacity duration-300"
                  style={{
                    opacity: tilt().hovering ? 1 : 0,
                    background: `radial-gradient(circle at ${tilt().gx}% ${tilt().gy}%, rgba(255,255,255,0.26), transparent 55%)`,
                  }}
                />
              </div>

              <div class="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div class="space-y-4">
                  <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6C8A]">
                    <A href={`/customer/store/${store()?.id}`} class="hover:text-[#1D4ED8] font-medium">
                      {store()?.name}
                    </A>
                    <StatusText
                      label={
                        p().available && p().stock > 0
                          ? `In Stock (${p().stock} units)`
                          : 'Out of Stock'
                      }
                      tone={p().available && p().stock > 0 ? 'success' : 'danger'}
                    />
                  </div>

                  <div>
                    <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-[#0D1B3E]">
                      {p().name}
                    </h2>
                    <div class="mt-2 flex items-center gap-3 text-xs text-[#5A6C8A] tabular-nums">
                      <span class="inline-flex items-center gap-1 font-semibold text-[#0D1B3E]">
                        <Star class="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]" />
                        {p().rating}
                      </span>
                      <span>·</span>
                      <span>Est. delivery {store()?.etaMins || 25} mins</span>
                    </div>
                  </div>

                  <div class="flex items-baseline gap-3 tabular-nums">
                    <span
                      class={`font-display text-3xl font-extrabold text-[#0D1B3E] inline-block ${
                        pricePulse() ? 'price-pop' : ''
                      }`}
                    >
                      {formatCurrency(unitPrice())}
                    </span>
                    <Show when={p().discountPrice > 0}>
                      <span class="text-sm text-[#7B8CA8] line-through">
                        {formatCurrency(p().price + (activeVariation().priceDelta || 0))}
                      </span>
                    </Show>
                  </div>

                  <p class="text-sm text-[#4B5C78] leading-relaxed">{p().description}</p>

                  {/* Product Variations */}
                  <Show when={p().variations?.length > 0}>
                    <div class="space-y-2 pt-2">
                      <span class="text-xs font-semibold text-[#0D1B3E]">Select Option</span>
                      <div class="flex flex-wrap gap-2">
                        <For each={p().variations}>
                          {(v, idx) => (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVarIndex(idx());
                                triggerPricePop();
                              }}
                              class={`min-h-[40px] px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 ${
                                selectedVarIndex() === idx()
                                  ? 'bg-[#EBF1FA] border-[#1D4ED8] text-[#1D4ED8] shadow-xs'
                                  : 'bg-white border-[#DDE6F2] text-[#334669] hover:bg-[#F8FAFD]'
                              }`}
                            >
                              {v.label}
                              {v.priceDelta > 0 ? ` (+${formatCurrency(v.priceDelta)})` : ''}
                            </button>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Quantity Stepper */}
                  <div class="flex items-center gap-4 pt-2">
                    <span class="text-xs font-semibold text-[#0D1B3E]">Quantity</span>
                    <div class="inline-flex items-center border border-[#CBD8EC] rounded-xl bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setQty((q) => Math.max(1, q - 1));
                          triggerPricePop();
                        }}
                        aria-label="Decrease quantity"
                        class="w-10 h-10 inline-flex items-center justify-center text-[#334669] hover:bg-[#F4F7FC] active:scale-90 cursor-pointer transition-transform"
                      >
                        <Minus class="w-4 h-4" />
                      </button>
                      <span
                        class={`w-10 text-center text-sm font-extrabold tabular-nums inline-block ${
                          pricePulse() ? 'price-pop' : ''
                        }`}
                      >
                        {qty()}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQty((q) => Math.min(p().stock || 1, q + 1));
                          triggerPricePop();
                        }}
                        aria-label="Increase quantity"
                        class="w-10 h-10 inline-flex items-center justify-center text-[#334669] hover:bg-[#F4F7FC] active:scale-90 cursor-pointer transition-transform"
                      >
                        <Plus class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Actions */}
                <div class="pt-4 border-t border-[#EBF1FA] flex flex-wrap items-center gap-3">
                  <div class="relative flex-1 min-w-[200px]">
                    <Show when={addBurstKey()} keyed>
                      {() => (
                        <span
                          aria-hidden="true"
                          class="float-plus-one pointer-events-none absolute -top-2 left-1/2 z-30 px-2.5 py-0.5 rounded-full bg-[#16A34A] text-white text-xs font-extrabold shadow"
                        >
                          +{qty()}
                        </span>
                      )}
                    </Show>
                    <Button
                      size="lg"
                      class={`w-full transition-transform active:scale-[0.97] ${
                        addBtnPulse() ? 'cart-pop-bounce' : ''
                      }`}
                      disabled={!p().available || p().stock <= 0}
                      onClick={() => handleAddToCart(false)}
                    >
                      <ShoppingBag class="w-4 h-4" />
                      Add to Cart · {formatCurrency(unitPrice() * qty())}
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    variant="secondary"
                    class="transition-transform active:scale-[0.97]"
                    disabled={!p().available || p().stock <= 0}
                    onClick={() => handleAddToCart(true)}
                  >
                    Buy Now
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    aria-label="Save to wishlist"
                    class={`transition-transform active:scale-90 ${
                      heartPulse() ? 'heart-pop' : ''
                    }`}
                    onClick={() => {
                      const wasSaved = isSaved();
                      platformActions.toggleWishlist(p().id);
                      setHeartPulse(true);
                      window.setTimeout(() => setHeartPulse(false), 420);
                      showToast(wasSaved ? 'Removed from wishlist.' : 'Saved to wishlist.', 'info');
                    }}
                  >
                    <Heart
                      class={`w-5 h-5 transition-colors ${
                        isSaved() ? 'fill-[#DC2626] text-[#DC2626]' : ''
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </CustomerLayout>
  );
}
