import { For, Show, createMemo, createSignal } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { ArrowLeft, Clock, MapPin, Search, Star } from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { requestConfirmation, showToast } from '../../stores/toastStore.js';
import { formatShortDate } from '../../utils/formatters.js';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, ImageWithFallback, StatusText } from '../../components/ui/DataDisplay.jsx';
import { AnimatedProductCard } from '../../components/ui/AnimatedProductCard.jsx';

export function StoreDetailPage() {
  const params = useParams();
  const [query, setQuery] = createSignal('');

  const store = createMemo(() => platformState.stores.find((s) => s.id === params.storeId));

  const products = createMemo(() => {
    const q = query().trim().toLowerCase();
    return platformState.products.filter((p) => {
      if (p.storeId !== params.storeId) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    });
  });

  const storeReviews = createMemo(() =>
    platformState.reviews.filter((r) => r.storeId === params.storeId && r.status === 'published')
  );

  const handleAdd = async (product) => {
    const firstVar = product.variations?.[0] || { label: 'Standard', priceDelta: 0 };
    const price =
      (product.discountPrice > 0 ? product.discountPrice : product.price) +
      (firstVar.priceDelta || 0);
    const res = platformActions.addToCart(product, firstVar.label, price, 1);
    if (res.conflictStore) {
      const ok = await requestConfirmation({
        title: 'Switch store cart?',
        message: 'Your cart has items from another store. Replace cart with this store?',
        confirmLabel: 'Replace Cart',
      });
      if (ok) {
        platformActions.replaceCartWithItem(product, firstVar.label, price, 1);
        showToast(`${product.name} added to cart.`, 'success');
      }
      return;
    }
    showToast(`${product.name} added to cart.`, 'success');
  };

  return (
    <CustomerLayout title={store()?.name || 'Store Details'}>
      <Show
        when={store()}
        fallback={
          <EmptyState
            title="Store not found"
            description="This store may have been deactivated or removed."
            action={
              <A href="/customer">
                <Button>Return to Marketplace</Button>
              </A>
            }
          />
        }
      >
        {(s) => (
          <div class="space-y-8">
            <A
              href="/customer"
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:underline"
            >
              <ArrowLeft class="w-4 h-4" />
              Back to Stores
            </A>

            {/* Store Overview */}
            <section
              class="item-card-reveal group bg-white border border-[#DDE6F2] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-[0_4px_18px_rgba(13,27,62,0.05)]"
              style={{ '--item-delay': '0ms' }}
            >
              <div class="lg:col-span-5 h-56 lg:h-auto relative overflow-hidden">
                <ImageWithFallback
                  src={s().banner}
                  alt={s().name}
                  class="w-full h-full object-cover hero-ken-burns"
                />
                <div aria-hidden="true" class="item-shine-layer" />
              </div>
              <div class="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-4">
                <div>
                  <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6C8A]">
                    <span>
                      {s().categoryName} · {s().distanceKm} km away · Est. {s().etaMins} mins
                    </span>
                    <StatusText
                      label={s().isOpen ? 'Open for Orders' : 'Currently Closed'}
                      tone={s().isOpen ? 'success' : 'danger'}
                    />
                  </div>
                  <h2 class="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-[#0D1B3E]">
                    {s().name}
                  </h2>
                  <p class="mt-2 text-sm text-[#4B5C78] leading-relaxed">{s().description}</p>
                </div>

                <div class="pt-4 border-t border-[#EBF1FA] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#334669]">
                  <div class="flex items-start gap-2">
                    <MapPin class="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                    <span>{s().address}</span>
                  </div>
                  <div class="flex items-center gap-2 tabular-nums">
                    <Clock class="w-4 h-4 text-[#1D4ED8] shrink-0" />
                    <span>
                      {s().openTime} – {s().closeTime}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 font-semibold tabular-nums">
                    <Star class="w-4 h-4 text-[#D97706] fill-[#D97706] shrink-0" />
                    <span>
                      {s().rating} rating ({s().reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Store Catalog */}
            <section class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 class="font-display text-lg font-bold text-[#0D1B3E]">
                  Store Catalog ({products().length})
                </h3>
                <div class="relative w-full sm:w-72">
                  <Search class="w-4 h-4 text-[#7B8CA8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={query()}
                    onInput={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Filter store items..."
                    class="w-full min-h-[40px] pl-9 pr-3 py-1.5 text-sm bg-white border border-[#CBD8EC] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                <For each={products()}>
                  {(p, idx) => (
                    <AnimatedProductCard
                      item={p}
                      index={idx()}
                      fallbackImage={s().banner}
                      fallbackCategoryName={s().categoryName}
                      disabled={!s().isOpen}
                      onAdd={handleAdd}
                    />
                  )}
                </For>
              </div>
            </section>

            {/* Customer Reviews */}
            <section class="bg-white border border-[#DDE6F2] rounded-xl p-6 space-y-4">
              <h3 class="font-display text-lg font-bold text-[#0D1B3E]">
                Customer Reviews ({storeReviews().length})
              </h3>
              <Show
                when={storeReviews().length > 0}
                fallback={<p class="text-sm text-[#5A6C8A]">No published reviews yet for this store.</p>}
              >
                <div class="divide-y divide-[#EBF1FA]">
                  <For each={storeReviews()}>
                    {(rev) => (
                      <div class="py-3.5 first:pt-0 last:pb-0">
                        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span class="font-semibold text-[#0D1B3E]">
                            {rev.customerName} · {rev.productName}
                          </span>
                          <span class="text-[#5A6C8A] tabular-nums">
                            {rev.rating}/5 · {formatShortDate(rev.createdAt)}
                          </span>
                        </div>
                        <p class="mt-1.5 text-sm text-[#334669]">{rev.comment}</p>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </section>
          </div>
        )}
      </Show>
    </CustomerLayout>
  );
}
