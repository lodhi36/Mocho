import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import {
  CreditCard,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Tag,
  Trash2,
  Wallet,
} from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { showToast } from '../../stores/toastStore.js';
import { PAYMENT_METHODS } from '../../constants/config.js';
import { formatCurrency } from '../../utils/formatters.js';
import { sanitizeText, validateAddressForm } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { TextField } from '../../components/ui/FormControls.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState, ImageWithFallback } from '../../components/ui/DataDisplay.jsx';

export function CartCheckoutPage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const user = () => currentUser();

  const addresses = createMemo(() => user()?.addresses || []);
  const [selectedAddressId, setSelectedAddressId] = createSignal(
    geo.liveLocation()
      ? 'live-gps'
      : addresses().find((a) => a.isDefault)?.id || addresses()[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = createSignal('COD');
  const [couponInput, setCouponInput] = createSignal(platformState.appliedCouponCode || '');
  const [placing, setPlacing] = createSignal(false);

  // Add Address Modal
  const [addrModal, setAddrModal] = createSignal(false);
  const [addrForm, setAddrForm] = createSignal({
    label: 'Home',
    line1: '',
    city: 'Bengaluru',
    postalCode: '',
  });
  const [addrErrors, setAddrErrors] = createSignal({});

  const cartStore = createMemo(() => {
    const first = platformState.cart[0];
    return first ? platformState.stores.find((s) => s.id === first.storeId) : null;
  });

  const subtotal = createMemo(() =>
    platformState.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  );

  const activeCoupon = createMemo(() =>
    platformState.coupons.find(
      (c) =>
        c.code === platformState.appliedCouponCode && c.active && subtotal() >= c.minOrder
    )
  );

  const discount = createMemo(() => {
    const c = activeCoupon();
    if (!c) return 0;
    return c.type === 'percent'
      ? Math.min(Math.round((subtotal() * c.value) / 100), c.maxDiscount)
      : c.value;
  });

  const deliveryFee = createMemo(() =>
    subtotal() >= platformState.settings.freeDeliveryAbove
      ? 0
      : platformState.settings.baseDeliveryFee
  );

  const grandTotal = createMemo(() => Math.max(0, subtotal() - discount() + deliveryFee()));

  const [totalPulse, setTotalPulse] = createSignal(false);
  let lastTotal = -1;
  createEffect(() => {
    const val = grandTotal();
    if (lastTotal !== -1 && val !== lastTotal) {
      setTotalPulse(false);
      requestAnimationFrame(() => {
        setTotalPulse(true);
        window.setTimeout(() => setTotalPulse(false), 320);
      });
    }
    lastTotal = val;
  });

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const res = platformActions.applyCoupon(couponInput());
    if (!res.ok) {
      showToast(res.error, 'error');
      return;
    }
    showToast(`Coupon ${res.coupon.code} applied.`, 'success');
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const errs = validateAddressForm(addrForm());
    setAddrErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const coords = geo.coords();
    platformActions.addCustomerAddress(user().id, {
      label: sanitizeText(addrForm().label, 40),
      line1: sanitizeText(addrForm().line1, 200),
      city: sanitizeText(addrForm().city, 60),
      postalCode: sanitizeText(addrForm().postalCode, 12),
      lat: coords?.lat || 12.9716,
      lng: coords?.lng || 77.5946,
      isDefault: true,
    });
    const latest = currentUser()?.addresses?.slice(-1)[0];
    if (latest) setSelectedAddressId(latest.id);
    setAddrModal(false);
    setAddrForm({ label: 'Home', line1: '', city: 'Bengaluru', postalCode: '' });
    showToast('Delivery address saved.', 'success');
  };

  const handlePlaceOrder = async () => {
    const live = geo.liveLocation();
    const chosen =
      addresses().find((a) => a.id === selectedAddressId()) || addresses()[0];

    const fullAddress =
      live?.fullAddress && selectedAddressId() === 'live-gps'
        ? live.fullAddress
        : chosen
        ? chosen.line1
        : live?.fullAddress || '';

    if (!fullAddress) {
      showToast('Please enable live GPS or select a delivery address before placing your order.', 'error');
      setAddrModal(true);
      return;
    }

    setPlacing(true);
    try {
      const { order, paymentNotice } = await platformActions.placeOrder({
        customer: user(),
        deliveryAddress: fullAddress,
        paymentMethod: paymentMethod(),
      });
      showToast(
        paymentNotice
          ? `Order ${order.id} created. ${paymentNotice}`
          : `Order ${order.id} placed successfully. Awaiting store confirmation.`,
        'success',
        5500
      );
      navigate('/customer/orders');
    } catch (err) {
      showToast(err.message || 'Could not place order.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <CustomerLayout title="Cart & Checkout">
      <Show
        when={platformState.cart.length > 0}
        fallback={
          <EmptyState
            title="Your cart is empty"
            description="Browse local stores to add fresh groceries, bakery items, pharmacy goods, or daily essentials."
            action={
              <A href="/customer">
                <Button>Explore Stores</Button>
              </A>
            }
          />
        }
      >
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Cart Items, Address & Payment */}
          <div class="lg:col-span-8 space-y-6">
            {/* Items */}
            <section
              style={{ '--item-delay': '0ms' }}
              class="item-card-reveal bg-white border border-[#DDE6F2] rounded-2xl p-5 space-y-4 shadow-[0_2px_12px_rgba(13,27,62,0.03)]"
            >
              <div class="flex items-center justify-between pb-3 border-b border-[#EBF1FA]">
                <div>
                  <h2 class="font-display text-base font-bold text-[#0D1B3E]">
                    Order from {cartStore()?.name}
                  </h2>
                  <p class="text-xs text-[#5A6C8A] mt-0.5">
                    {platformState.cart.length} line item(s)
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    platformActions.clearCart();
                    showToast('Cart cleared.', 'info');
                  }}
                >
                  Clear Cart
                </Button>
              </div>

              <div class="divide-y divide-[#EBF1FA]">
                <For each={platformState.cart}>
                  {(item, idx) => (
                    <div
                      style={{ '--item-delay': `${Math.min(idx(), 8) * 50}ms` }}
                      class="item-card-reveal group py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div class="flex items-center gap-3.5 min-w-0">
                        <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#DDE6F2] relative">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-[#0D1B3E] truncate">{item.name}</p>
                          <p class="text-xs text-[#5A6C8A] mt-0.5">{item.variation}</p>
                          <p class="text-xs font-semibold text-[#1D4ED8] mt-1 tabular-nums">
                            {formatCurrency(item.unitPrice)} each
                          </p>
                        </div>
                      </div>

                      <div class="flex items-center justify-between sm:justify-end gap-4">
                        <div class="inline-flex items-center border border-[#CBD8EC] rounded-xl overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              platformActions.updateCartQty(item.productId, item.variation, -1)
                            }
                            aria-label="Decrease quantity"
                            class="w-9 h-9 inline-flex items-center justify-center text-[#334669] hover:bg-[#F4F7FC] active:scale-90 transition-transform cursor-pointer"
                          >
                            <Minus class="w-3.5 h-3.5" />
                          </button>
                          <span class="w-8 text-center text-sm font-bold tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              platformActions.updateCartQty(item.productId, item.variation, 1)
                            }
                            aria-label="Increase quantity"
                            class="w-9 h-9 inline-flex items-center justify-center text-[#334669] hover:bg-[#F4F7FC] active:scale-90 transition-transform cursor-pointer"
                          >
                            <Plus class="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span class="text-sm font-bold text-[#0D1B3E] tabular-nums w-20 text-right">
                          {formatCurrency(item.unitPrice * item.qty)}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            platformActions.removeFromCart(item.productId, item.variation)
                          }
                          aria-label="Remove item"
                          class="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#5A6C8A] hover:text-[#B91C1C] hover:bg-[#FEF2F2] active:scale-90 transition-transform cursor-pointer"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </section>

            {/* Delivery Address */}
            <section
              style={{ '--item-delay': '80ms' }}
              class="item-card-reveal bg-white border border-[#DDE6F2] rounded-2xl p-5 space-y-4 shadow-[0_2px_12px_rgba(13,27,62,0.03)]"
            >
              <div class="flex items-center justify-between gap-2">
                <h2 class="font-display text-base font-bold text-[#0D1B3E]">Delivery Address</h2>
                <Button size="sm" variant="secondary" onClick={() => setAddrModal(true)}>
                  + Add New Address
                </Button>
              </div>

              <div class="space-y-3">
                {/* Real Live Device GPS Address Option */}
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedAddressId('live-gps');
                    if (!geo.liveLocation()) {
                      await geo.detectLocation();
                    }
                  }}
                  class={`w-full p-4 rounded-xl border text-left transition-all duration-200 active:scale-[0.99] cursor-pointer ${
                    selectedAddressId() === 'live-gps'
                      ? 'border-[#0066FF] bg-[#EFF6FF] shadow-2xs'
                      : 'border-[#DDE6F2] bg-white hover:bg-[#F8FAFD]'
                  }`}
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex items-center gap-1.5 text-sm font-bold text-[#0D1B3E]">
                      <Navigation class="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>
                        {geo.liveLocation()?.area
                          ? `Live Device GPS — ${geo.liveLocation().area}`
                          : 'Use Live Device GPS Location'}
                      </span>
                    </span>
                    <span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#15803D]">
                      <Show when={geo.liveLocation()}>
                        <span class="radar-beacon w-2 h-2 rounded-full bg-[#22C55E] text-[#22C55E]" />
                      </Show>
                      <span>{geo.loading() ? 'Locating...' : geo.liveLocation() ? 'Live GPS' : 'Tap to fetch'}</span>
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-[#4B5C78] leading-relaxed">
                    {geo.liveLocation()?.fullAddress ||
                      'Tap to detect your current device GPS address for delivery.'}
                  </p>
                </button>

                <Show
                  when={addresses().length > 0}
                  fallback={
                    <Show when={!geo.liveLocation()}>
                      <p class="text-sm text-[#5A6C8A]">
                        No saved addresses. Allow live GPS or add an address to continue checkout.
                      </p>
                    </Show>
                  }
                >
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <For each={addresses()}>
                      {(addr) => (
                        <button
                          type="button"
                          onClick={() => setSelectedAddressId(addr.id)}
                          class={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                            selectedAddressId() === addr.id
                              ? 'border-[#1D4ED8] bg-[#F4F7FC]'
                              : 'border-[#DDE6F2] bg-white hover:bg-[#F8FAFD]'
                          }`}
                        >
                        <div class="flex items-center justify-between gap-2">
                          <span class="inline-flex items-center gap-1.5 text-sm font-bold text-[#0D1B3E]">
                            <MapPin class="w-3.5 h-3.5 text-[#1D4ED8]" />
                            {addr.label}
                          </span>
                          <Show when={addr.isDefault}>
                            <span class="text-xs font-medium text-[#1D4ED8]">Default</span>
                          </Show>
                        </div>
                        <p class="mt-1.5 text-xs text-[#4B5C78] leading-relaxed">
                          {addr.line1}
                        </p>
                      </button>
                    )}
                    </For>
                  </div>
                </Show>
              </div>
            </section>

            {/* Payment Method */}
            <section
              style={{ '--item-delay': '140ms' }}
              class="item-card-reveal bg-white border border-[#DDE6F2] rounded-2xl p-5 space-y-4 shadow-[0_2px_12px_rgba(13,27,62,0.03)]"
            >
              <h2 class="font-display text-base font-bold text-[#0D1B3E]">Payment Method</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Show when={platformState.settings.allowCod}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    class={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                      paymentMethod() === 'COD'
                        ? 'border-[#1D4ED8] bg-[#F4F7FC] shadow-2xs'
                        : 'border-[#DDE6F2] bg-white hover:bg-[#F8FAFD]'
                    }`}
                  >
                    <div class="flex items-center gap-2 text-sm font-bold text-[#0D1B3E]">
                      <Wallet class="w-4 h-4 text-[#1D4ED8]" />
                      {PAYMENT_METHODS.COD.label}
                    </div>
                    <p class="mt-1 text-xs text-[#4B5C78]">{PAYMENT_METHODS.COD.description}</p>
                  </button>
                </Show>

                <Show when={platformState.settings.allowOnlinePayment}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE_GATEWAY')}
                    class={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                      paymentMethod() === 'ONLINE_GATEWAY'
                        ? 'border-[#1D4ED8] bg-[#F4F7FC] shadow-2xs'
                        : 'border-[#DDE6F2] bg-white hover:bg-[#F8FAFD]'
                    }`}
                  >
                    <div class="flex items-center gap-2 text-sm font-bold text-[#0D1B3E]">
                      <CreditCard class="w-4 h-4 text-[#1D4ED8]" />
                      {PAYMENT_METHODS.ONLINE_GATEWAY.label}
                    </div>
                    <p class="mt-1 text-xs text-[#4B5C78]">
                      {PAYMENT_METHODS.ONLINE_GATEWAY.description}
                    </p>
                  </button>
                </Show>
              </div>

              <Show when={paymentMethod() === 'ONLINE_GATEWAY'}>
                <div class="expand-reveal p-3.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E3A8A] leading-relaxed">
                  <strong>Gateway Integration Ready:</strong> No real card charge occurs in Demo
                  Mode. Connect your payment provider SDK key in{' '}
                  <code class="font-mono">VITE_PAYMENT_GATEWAY_PUBLIC_KEY</code> and server webhook
                  for live transactions.
                </div>
              </Show>
            </section>
          </div>

          {/* Right Column: Coupons & Order Summary */}
          <aside
            style={{ '--item-delay': '180ms' }}
            class="item-card-reveal lg:col-span-4 bg-white border border-[#DDE6F2] rounded-2xl p-5 space-y-5 lg:sticky lg:top-24 shadow-[0_4px_20px_rgba(13,27,62,0.05)]"
          >
            <h2 class="font-display text-base font-bold text-[#0D1B3E]">Order Summary</h2>

            <form onSubmit={handleApplyCoupon} class="space-y-2">
              <label class="text-xs font-semibold text-[#4B5C78]">Apply Promo Coupon</label>
              <div class="flex gap-2">
                <input
                  type="text"
                  value={couponInput()}
                  onInput={(e) => setCouponInput(e.currentTarget.value)}
                  placeholder="Try FRESH10 or RIDEHUB50"
                  class="flex-1 min-h-[40px] px-3 py-1.5 text-sm uppercase font-mono bg-white border border-[#CBD8EC] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                />
                <Button type="submit" size="sm" variant="secondary">
                  <Tag class="w-3.5 h-3.5" />
                  Apply
                </Button>
              </div>
              <Show when={activeCoupon()}>
                {(c) => (
                  <div class="expand-reveal flex items-center justify-between text-xs text-[#15803D] font-medium pt-1">
                    <span>Applied {c().code} (-{formatCurrency(discount())})</span>
                    <button
                      type="button"
                      class="underline cursor-pointer"
                      onClick={() => {
                        platformActions.clearCoupon();
                        setCouponInput('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </Show>
            </form>

            <dl class="space-y-2.5 pt-4 border-t border-[#EBF1FA] text-sm">
              <div class="flex justify-between text-[#4B5C78]">
                <dt>Subtotal</dt>
                <dd class="tabular-nums font-medium text-[#0D1B3E]">{formatCurrency(subtotal())}</dd>
              </div>
              <Show when={discount() > 0}>
                <div class="flex justify-between text-[#15803D]">
                  <dt>Coupon Discount</dt>
                  <dd class="tabular-nums font-medium">-{formatCurrency(discount())}</dd>
                </div>
              </Show>
              <div class="flex justify-between text-[#4B5C78]">
                <dt>Delivery Fee</dt>
                <dd class="tabular-nums font-medium text-[#0D1B3E]">
                  {deliveryFee() === 0 ? 'Free' : formatCurrency(deliveryFee())}
                </dd>
              </div>
              <div class="pt-3 border-t border-[#DDE6F2] flex justify-between text-base font-bold text-[#0D1B3E]">
                <dt>Total Payable</dt>
                <dd
                  class={`tabular-nums font-display inline-block ${
                    totalPulse() ? 'price-pop text-[#0066FF]' : ''
                  }`}
                >
                  {formatCurrency(grandTotal())}
                </dd>
              </div>
            </dl>

            <Button size="lg" class="w-full" loading={placing()} onClick={handlePlaceOrder}>
              Place Order · {formatCurrency(grandTotal())}
            </Button>
          </aside>
        </div>
      </Show>

      {/* Add Address Modal */}
      <Modal
        open={addrModal()}
        onClose={() => setAddrModal(false)}
        title="Add Delivery Address"
      >
        <form onSubmit={handleSaveAddress} class="space-y-4">
          <div class="flex items-center justify-between p-3 rounded-lg bg-[#F4F7FC] border border-[#DDE6F2]">
            <div class="text-xs text-[#334669]">
              <Show when={geo.coords()} fallback="Use device GPS to capture coordinates">
                {(c) => `Captured GPS: ${c().lat}, ${c().lng}`}
              </Show>
            </div>
            <Button
              size="sm"
              variant="secondary"
              loading={geo.loading()}
              onClick={() => geo.detectLocation()}
            >
              <Navigation class="w-3.5 h-3.5" />
              Detect GPS
            </Button>
          </div>
          <Show when={geo.error()}>
            <p class="text-xs text-[#B91C1C]">{geo.error()}</p>
          </Show>

          <TextField
            label="Label"
            value={addrForm().label}
            onInput={(e) => setAddrForm((f) => ({ ...f, label: e.currentTarget.value }))}
            placeholder="Home, Office, etc."
            error={addrErrors().label}
          />
          <TextField
            label="Street Address & Landmark"
            value={addrForm().line1}
            onInput={(e) => setAddrForm((f) => ({ ...f, line1: e.currentTarget.value }))}
            placeholder="Flat no., building, street name"
            error={addrErrors().line1}
          />
          <div class="grid grid-cols-2 gap-3">
            <TextField
              label="City"
              value={addrForm().city}
              onInput={(e) => setAddrForm((f) => ({ ...f, city: e.currentTarget.value }))}
              error={addrErrors().city}
            />
            <TextField
              label="Postal Code"
              value={addrForm().postalCode}
              onInput={(e) => setAddrForm((f) => ({ ...f, postalCode: e.currentTarget.value }))}
              placeholder="560038"
              error={addrErrors().postalCode}
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddrModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Address</Button>
          </div>
        </form>
      </Modal>
    </CustomerLayout>
  );
}
