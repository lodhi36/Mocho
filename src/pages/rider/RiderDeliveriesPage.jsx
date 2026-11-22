import { For, Show, createMemo, createSignal } from 'solid-js';
import { ExternalLink, MapPin, Navigation, Phone, CheckCircle2, XCircle } from 'lucide-solid';
import { RiderLayout } from './RiderLayout.jsx';
import { ORDER_STATUS, ORDER_STATUS_META } from '../../constants/config.js';
import { appMode, platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { platformService } from '../../services/platformService.js';
import { showToast } from '../../stores/toastStore.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, StatusText } from '../../components/ui/DataDisplay.jsx';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable.jsx';

export function RiderDeliveriesPage() {
  const user = () => currentUser();
  const [tab, setTab] = createSignal('active');
  const [rejectedIds, setRejectedIds] = createSignal([]);
  const [otpInputs, setOtpInputs] = createSignal({});

  const availableRequests = createMemo(() =>
    platformState.orders.filter(
      (o) =>
        o.status === ORDER_STATUS.READY_FOR_PICKUP &&
        !o.riderId &&
        !rejectedIds().includes(o.id)
    )
  );

  const activeDeliveries = createMemo(() =>
    platformState.orders.filter(
      (o) =>
        o.riderId === user()?.id &&
        [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP].includes(o.status)
    )
  );

  const historyDeliveries = createMemo(() =>
    platformState.orders.filter(
      (o) =>
        o.riderId === user()?.id &&
        [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(o.status)
    )
  );

  const handleAcceptRequest = async (order) => {
    if (!user()?.isOnline) {
      showToast('Switch your status to ONLINE on the dashboard before accepting deliveries.', 'warning');
      return;
    }
    try {
      await platformActions.updateOrderStatus(order.id, ORDER_STATUS.RIDER_ASSIGNED, {
        rider: user(),
        note: `${user().name} accepted delivery request`,
      });
      showToast(`Delivery ${order.id} assigned to you. Proceed to store pickup.`, 'success');
      setTab('active');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectRequest = (order) => {
    setRejectedIds((prev) => [...prev, order.id]);
    showToast(`Delivery request ${order.id} declined.`, 'info');
  };

  const handleVerifyPickup = async (order) => {
    const entered = String(otpInputs()[`pickup-${order.id}`] || '').trim();
    if (entered !== String(order.pickupOtp)) {
      showToast('Pickup OTP mismatch. Confirm the 4-digit code with the store.', 'error');
      return;
    }
    try {
      await platformActions.updateOrderStatus(order.id, ORDER_STATUS.PICKED_UP, {
        note: `Picked up by ${user().name} (Pickup OTP verified)`,
      });
      showToast(`Order ${order.id} marked Picked Up — proceed to customer drop-off.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleVerifyDelivery = async (order) => {
    const entered = String(otpInputs()[`delivery-${order.id}`] || '').trim();
    if (entered !== String(order.deliveryOtp)) {
      showToast('Delivery OTP mismatch. Ask the customer for their 4-digit Delivery OTP.', 'error');
      return;
    }
    try {
      await platformActions.updateOrderStatus(order.id, ORDER_STATUS.DELIVERED, {
        note: `Delivered to ${order.customerName} (Delivery OTP verified)`,
      });
      showToast(`Order ${order.id} delivered! Earnings ${formatCurrency(order.riderEarnings)} credited.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const historyColumns = [
    { header: 'Order ID', key: 'id', render: (r) => <span class="font-mono text-xs">{r.id}</span> },
    { header: 'Store', key: 'storeName' },
    { header: 'Customer', key: 'customerName' },
    { header: 'Distance', key: 'distanceKm', align: 'right', render: (r) => `${r.distanceKm} km` },
    {
      header: 'Earning',
      key: 'riderEarnings',
      align: 'right',
      render: (r) => <span class="font-semibold text-[#15803D]">{formatCurrency(r.riderEarnings)}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => {
        const meta = ORDER_STATUS_META[r.status] || { label: r.status, tone: 'neutral' };
        return <StatusText label={meta.label} tone={meta.tone} />;
      },
    },
    { header: 'Updated', key: 'updatedAt', render: (r) => <span class="text-xs font-mono">{formatDateTime(r.updatedAt)}</span> },
  ];

  return (
    <RiderLayout title="Delivery Management">
      <div class="space-y-6">
        {/* Tabs */}
        <div class="flex items-center gap-1 p-1 bg-white border border-[#DDE6F2] rounded-xl w-fit max-w-full overflow-x-auto">
          {[
            { id: 'requests', label: `New Requests (${availableRequests().length})` },
            { id: 'active', label: `Active (${activeDeliveries().length})` },
            { id: 'history', label: `History (${historyDeliveries().length})` },
          ].map((t) => (
            <button
              type="button"
              onClick={() => setTab(t.id)}
              class={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-all active:scale-95 ${
                tab() === t.id
                  ? 'bg-[#EBF1FA] text-[#1D4ED8] shadow-xs'
                  : 'text-[#4B5C78] hover:text-[#0D1B3E]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* New Requests */}
        <Show when={tab() === 'requests'}>
          <Show
            when={availableRequests().length > 0}
            fallback={
              <EmptyState
                title="No new delivery requests"
                description="When a supplier marks an order Ready for Pickup, it appears here immediately."
              />
            }
          >
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <For each={availableRequests()}>
                {(order, idx) => (
                  <article
                    class="item-card-reveal bg-white border border-[#DDE6F2] rounded-xl p-5 space-y-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    style={{ '--card-delay': `${Math.min(idx() * 55, 330)}ms` }}
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <span class="font-mono text-xs font-semibold text-[#1D4ED8]">{order.id}</span>
                        <h3 class="text-base font-bold text-[#0D1B3E] mt-0.5">{order.storeName}</h3>
                        <p class="text-xs text-[#5A6C8A] tabular-nums">
                          {order.distanceKm} km · Est. {order.etaMins} mins · {order.items.length} item(s)
                        </p>
                      </div>
                      <div class="text-right tabular-nums">
                        <p class="text-xs text-[#5A6C8A]">Delivery Fee</p>
                        <p class="font-display text-lg font-bold text-[#15803D]">
                          {formatCurrency(order.riderEarnings)}
                        </p>
                      </div>
                    </div>

                    <div class="p-3.5 rounded-lg bg-[#F4F7FC] border border-[#DDE6F2] space-y-2.5 text-xs">
                      <div class="flex items-start gap-2">
                        <MapPin class="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                        <div>
                          <span class="font-semibold text-[#0D1B3E] block">Pickup Location</span>
                          <span class="text-[#4B5C78]">{order.storeAddress}</span>
                        </div>
                      </div>
                      <div class="flex items-start gap-2 pt-2 border-t border-[#DDE6F2]">
                        <Navigation class="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                        <div>
                          <span class="font-semibold text-[#0D1B3E] block">Drop-off Location</span>
                          <span class="text-[#4B5C78]">{order.deliveryAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleRejectRequest(order)}>
                        <XCircle class="w-3.5 h-3.5 text-[#B91C1C]" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleAcceptRequest(order)}>
                        <CheckCircle2 class="w-3.5 h-3.5" />
                        Accept Delivery
                      </Button>
                    </div>
                  </article>
                )}
              </For>
            </div>
          </Show>
        </Show>

        {/* Active Deliveries with Pickup & Delivery OTP */}
        <Show when={tab() === 'active'}>
          <Show
            when={activeDeliveries().length > 0}
            fallback={
              <EmptyState
                title="No active deliveries"
                description="Accept a delivery request to start pickup and drop-off verification."
                action={
                  <Button variant="secondary" onClick={() => setTab('requests')}>
                    View Requests ({availableRequests().length})
                  </Button>
                }
              />
            }
          >
            <div class="space-y-5">
              <For each={activeDeliveries()}>
                {(order, idx) => {
                  const store = () => platformState.stores.find((s) => s.id === order.storeId);
                  const supplier = () => platformState.users.find((u) => u.id === order.supplierId);
                  const isAssigned = () => order.status === ORDER_STATUS.RIDER_ASSIGNED;
                  const navUrl = () =>
                    platformService.buildExternalNavigationUrl({
                      address: isAssigned() ? order.storeAddress : order.deliveryAddress,
                    });

                  return (
                    <article
                      class="item-card-reveal bg-white border border-[#DDE6F2] rounded-xl p-5 sm:p-6 space-y-5 shadow-xs hover:shadow-md transition-shadow duration-300"
                      style={{ '--card-delay': `${Math.min(idx() * 60, 300)}ms` }}
                    >
                      <div class="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#EBF1FA]">
                        <div>
                          <div class="flex items-center gap-2 text-xs">
                            <span class="w-2 h-2 rounded-full bg-[#0066FF] radar-beacon text-[#0066FF]" />
                            <span class="font-mono font-semibold text-[#0D1B3E]">{order.id}</span>
                            <span>·</span>
                            <StatusText
                              label={ORDER_STATUS_META[order.status]?.label}
                              tone="info"
                            />
                          </div>
                          <h3 class="mt-1 font-display text-lg font-bold text-[#0D1B3E]">
                            {order.storeName} → {order.customerName}
                          </h3>
                          <p class="text-xs text-[#5A6C8A] tabular-nums">
                            {order.distanceKm} km · Est. {order.etaMins} mins ·{' '}
                            {order.paymentMethod === 'COD'
                              ? `Collect COD: ${formatCurrency(order.total)}`
                              : 'Prepaid / Online'}
                          </p>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                          <a href={navUrl()} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="secondary">
                              <ExternalLink class="w-3.5 h-3.5" />
                              Navigate ({isAssigned() ? 'Store' : 'Customer'})
                            </Button>
                          </a>
                          <Show when={supplier()?.phone}>
                            <a href={`tel:${supplier().phone}`}>
                              <Button size="sm" variant="ghost">
                                <Phone class="w-3.5 h-3.5" />
                                Supplier
                              </Button>
                            </a>
                          </Show>
                          <a href={`tel:${order.customerPhone}`}>
                            <Button size="sm" variant="ghost">
                              <Phone class="w-3.5 h-3.5" />
                              Customer
                            </Button>
                          </a>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div class="p-4 rounded-xl bg-[#F4F7FC] border border-[#DDE6F2]">
                          <p class="font-semibold text-[#5A6C8A]">1. Store Pickup</p>
                          <p class="mt-1 text-sm font-bold text-[#0D1B3E]">{order.storeName}</p>
                          <p class="text-[#4B5C78] mt-0.5">{order.storeAddress}</p>
                          <Show when={store()?.openTime}>
                            <p class="text-[#5A6C8A] mt-1">
                              Hours: {store().openTime} – {store().closeTime}
                            </p>
                          </Show>
                        </div>
                        <div class="p-4 rounded-xl bg-[#F4F7FC] border border-[#DDE6F2]">
                          <p class="font-semibold text-[#5A6C8A]">2. Customer Drop-off</p>
                          <p class="mt-1 text-sm font-bold text-[#0D1B3E]">{order.customerName}</p>
                          <p class="text-[#4B5C78] mt-0.5">{order.deliveryAddress}</p>
                          <p class="text-[#5A6C8A] mt-1">{order.customerPhone}</p>
                        </div>
                      </div>

                      {/* Step Verification Box */}
                      <Show
                        when={isAssigned()}
                        fallback={
                          <div class="expand-reveal p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div class="flex-1 max-w-sm">
                              <label class="block text-xs font-bold text-[#1E3A8A] mb-1.5">
                                Enter Customer Delivery OTP to Complete Drop-off
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                value={otpInputs()[`delivery-${order.id}`] || ''}
                                onInput={(e) =>
                                  setOtpInputs((prev) => ({
                                    ...prev,
                                    [`delivery-${order.id}`]: e.currentTarget.value,
                                  }))
                                }
                                placeholder="4-digit Delivery OTP"
                                class="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono tracking-widest bg-white border border-[#93C5FD] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                              />
                              <Show when={appMode() === 'demo'}>
                                <p class="mt-1.5 text-[11px] text-[#1E40AF]">
                                  Demo helper: Customer Delivery OTP is{' '}
                                  <strong class="font-mono">{order.deliveryOtp}</strong>
                                </p>
                              </Show>
                            </div>
                            <Button variant="success" onClick={() => handleVerifyDelivery(order)}>
                              Verify OTP & Mark Delivered
                            </Button>
                          </div>
                        }
                      >
                        <div class="expand-reveal p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                          <div class="flex-1 max-w-sm">
                            <label class="block text-xs font-bold text-[#1E3A8A] mb-1.5">
                              Enter Store Pickup OTP to Confirm Collection
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={otpInputs()[`pickup-${order.id}`] || ''}
                              onInput={(e) =>
                                setOtpInputs((prev) => ({
                                  ...prev,
                                  [`pickup-${order.id}`]: e.currentTarget.value,
                                }))
                              }
                              placeholder="4-digit Pickup OTP"
                              class="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono tracking-widest bg-white border border-[#93C5FD] rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                            />
                            <Show when={appMode() === 'demo'}>
                              <p class="mt-1.5 text-[11px] text-[#1E40AF]">
                                Demo helper: Store Pickup OTP is{' '}
                                <strong class="font-mono">{order.pickupOtp}</strong>
                              </p>
                            </Show>
                          </div>
                          <Button onClick={() => handleVerifyPickup(order)}>
                            Verify OTP & Pick Up Order
                          </Button>
                        </div>
                      </Show>
                    </article>
                  );
                }}
              </For>
            </div>
          </Show>
        </Show>

        {/* History */}
        <Show when={tab() === 'history'}>
          <ResponsiveTable
            columns={historyColumns}
            rows={historyDeliveries()}
            emptyTitle="No completed deliveries yet"
            emptyDescription="Completed and cancelled deliveries assigned to you will appear here."
          />
        </Show>
      </div>
    </RiderLayout>
  );
}
