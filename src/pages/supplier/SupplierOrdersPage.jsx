import { For, Show, createMemo, createSignal } from 'solid-js';
import {
  Bell,
  Bike,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crosshair,
  FileText,
  MessageCircle,
  Package,
  Phone,
  ReceiptText,
  RefreshCw,
  Star,
  XCircle,
} from 'lucide-solid';
import { SupplierLayout } from './SupplierLayout.jsx';
import { ORDER_STATUS } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { requestConfirmation, showToast } from '../../stores/toastStore.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { EmptyState, ImageWithFallback } from '../../components/ui/DataDisplay.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export function SupplierOrdersPage() {
  const geo = useGeolocation();
  const user = () => currentUser();
  const store = createMemo(
    () => platformState.stores.find((s) => s.supplierId === user()?.id) || platformState.stores[0]
  );

  const [notifOpen, setNotifOpen] = createSignal(false);
  const [billOrder, setBillOrder] = createSignal(null);

  const allOrders = createMemo(() =>
    platformState.orders.filter((o) => o.storeId === store()?.id)
  );

  const activeRiders = createMemo(() =>
    allOrders().filter(
      (o) => o.riderId && [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP].includes(o.status)
    )
  );

  const handleToggleOnline = () => {
    const s = store();
    if (!s) return;
    platformActions.updateStore(s.id, { isOpen: !s.isOpen });
    showToast(
      !s.isOpen ? `${s.name} is ONLINE.` : `${s.name} is OFFLINE.`,
      !s.isOpen ? 'success' : 'warning'
    );
  };

  const handleAdvance = async (order) => {
    try {
      const next =
        order.status === ORDER_STATUS.PLACED
          ? ORDER_STATUS.PREPARING
          : ORDER_STATUS.READY_FOR_PICKUP;
      await platformActions.updateOrderStatus(order.id, next, {
        note: next === ORDER_STATUS.PREPARING ? 'Accepted & preparing' : 'Marked Ready for Pickup',
      });
      showToast(`Order ${order.id} updated to ${next.replace(/_/g, ' ')}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCancel = async (order) => {
    const ok = await requestConfirmation({
      title: `Cancel Order ${order.id}?`,
      message: 'This will notify the customer immediately.',
      confirmLabel: 'Cancel Order',
      tone: 'danger',
    });
    if (!ok) return;
    await platformActions.updateOrderStatus(order.id, ORDER_STATUS.CANCELLED, {
      cancelReason: `Cancelled by ${store()?.name}`,
      note: 'Store declined order',
    });
    showToast(`Order ${order.id} cancelled.`, 'warning');
  };

  return (
    <SupplierLayout
      title="Order History"
      hideTopBar={true}
      fullBleed={true}
      notificationsOpen={notifOpen}
      onCloseNotifications={() => setNotifOpen(false)}
    >
      <div class="min-h-screen bg-[#F4F7FC] pb-10">
        {/* Royal Blue Curved Store Header matching Screenshot 2 */}
        <header class="bg-[#0066FF] text-white rounded-b-[28px] px-4 sm:px-6 pt-4 pb-5 shadow-[0_6px_20px_rgba(0,102,255,0.22)]">
          <div class="max-w-3xl mx-auto flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Briefcase class="w-5 h-5 text-white" />
              </div>
              <div class="min-w-0">
                <h1 class="font-display text-lg font-extrabold leading-tight truncate">
                  {store()?.name}
                </h1>
                <p class="inline-flex items-center gap-1 text-[11px] text-white/90 truncate max-w-[180px] sm:max-w-xs">
                  <Crosshair class={`w-3 h-3 shrink-0 ${geo.loading() ? 'animate-spin' : ''}`} />
                  <span class="truncate">
                    {geo.liveLocation()?.fullAddress ||
                      geo.liveLocation()?.shortAddress ||
                      (geo.loading() ? 'Fetching live device location...' : store()?.address)}
                  </span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleOnline}
                class={`px-3 py-1.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  store()?.isOpen ? 'bg-[#22C55E] text-white' : 'bg-[#475569] text-white'
                }`}
              >
                <span
                  class={`w-2 h-2 rounded-full bg-white ${
                    store()?.isOpen ? 'radar-beacon text-white' : ''
                  }`}
                />
                <span>{store()?.isOpen ? 'Online' : 'Offline'}</span>
                <ChevronDown class="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                aria-label="Notifications"
                class="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center cursor-pointer transition-all active:scale-90"
              >
                <Bell class="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
          {/* Store Banner Preview */}
          <div
            class="item-card-reveal group relative rounded-3xl overflow-hidden bg-white border-4 border-[#E2E8F0] h-36 sm:h-44 shadow-xs"
            style={{ '--card-delay': '20ms' }}
          >
            <ImageWithFallback
              src={store()?.banner}
              alt={store()?.name}
              class="w-full h-full object-cover hero-ken-burns"
            />
            <div class="item-shine-layer" />
          </div>

          {/* Riders Reached Row */}
          <div
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            style={{ '--card-delay': '60ms' }}
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center">
                <Bike class="w-5 h-5" />
              </div>
              <div>
                <p class="font-display text-sm font-extrabold text-[#0D1B3E]">
                  Riders Reached: {activeRiders().length}
                </p>
                <p class="text-xs text-[#64748B]">
                  {activeRiders().length > 0
                    ? `${activeRiders()[0].riderName} on the way`
                    : 'No riders waiting right now'}
                </p>
              </div>
            </div>
            <span class="px-3 py-1.5 rounded-full bg-[#EFF6FF] text-[#0066FF] text-xs font-extrabold inline-flex items-center gap-0.5">
              <span>View Riders</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Order History Summary Card matching Screenshot 2 */}
          <div
            class="item-card-reveal bg-[#F0F7FF] rounded-2xl border border-[#BFDBFE] p-4 flex items-center justify-between gap-3"
            style={{ '--card-delay': '100ms' }}
          >
            <div class="min-w-0">
              <h2 class="font-display text-base font-extrabold text-[#0052CC] inline-flex items-center gap-1.5">
                <ReceiptText class="w-4 h-4" />
                <span>Order History</span>
              </h2>
              <p class="text-xs text-[#475569] mt-0.5">
                All completed, delivered, active and cancelled orders ({allOrders().length})
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Order history synced.', 'success')}
              class="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw class="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Green Online Banner */}
          <div
            class={`item-card-reveal rounded-full px-4 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold transition-colors ${
              store()?.isOpen
                ? 'bg-[#DCFCE7] text-[#15803D]'
                : 'bg-[#FEF3C7] text-[#B45309]'
            }`}
            style={{ '--card-delay': '135ms' }}
          >
            <span
              class={`w-5 h-5 rounded-full inline-flex items-center justify-center ${
                store()?.isOpen ? 'bg-[#22C55E] radar-beacon text-[#22C55E]' : 'bg-[#F59E0B]'
              }`}
            >
              <Star class="w-3 h-3 fill-current text-white" />
            </span>
            <span>Store is {store()?.isOpen ? 'ONLINE' : 'OFFLINE'} • Ready to Receive Orders</span>
          </div>

          {/* All Orders List */}
          <Show
            when={allOrders().length > 0}
            fallback={
              <EmptyState
                title="No order history yet"
                description="All incoming, completed, and cancelled orders appear here."
              />
            }
          >
            <div class="space-y-4">
              <For each={allOrders()}>
                {(order, idx) => (
                  <article
                    class="item-card-reveal bg-white rounded-3xl border border-[#E2EBF8] shadow-[0_4px_16px_rgba(13,27,62,0.04)] hover:shadow-[0_12px_26px_rgba(13,27,62,0.08)] hover:-translate-y-0.5 transition-all duration-300 p-4 sm:p-5 space-y-3"
                    style={{ '--card-delay': `${Math.min(idx() * 50, 320)}ms` }}
                  >
                    <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F1F5F9]">
                      <div class="min-w-0">
                        <span class="font-display text-sm font-extrabold text-[#0D1B3E]">
                          #{order.id}
                        </span>
                        <span class="text-xs text-[#64748B] ml-1.5">
                          • {formatDateTime(order.createdAt)}
                        </span>
                      </div>
                      <span
                        class={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border shrink-0 ${
                          order.status === ORDER_STATUS.CANCELLED
                            ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            : order.status === ORDER_STATUS.COMPLETED ||
                                order.status === ORDER_STATUS.DELIVERED
                              ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                              : 'bg-[#EFF6FF] text-[#0066FF] border-[#93C5FD]'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div class="flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-sm font-extrabold text-[#0D1B3E] truncate">
                          {order.customerName}
                        </p>
                        <p class="text-xs text-[#64748B] truncate">{order.deliveryAddress}</p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <a
                          href={`tel:${order.customerPhone}`}
                          class="w-9 h-9 rounded-full bg-[#DCFCE7] text-[#15803D] inline-flex items-center justify-center"
                        >
                          <Phone class="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setBillOrder(order)}
                          class="px-3 py-1.5 rounded-xl border border-[#CBD8EC] bg-[#F8FAFD] text-[#0066FF] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText class="w-3.5 h-3.5" />
                          <span>Bill</span>
                        </button>
                      </div>
                    </div>

                    <div class="px-3.5 py-2.5 rounded-xl bg-[#F8FAFD] border border-[#EBF1FA] space-y-1">
                      <For each={order.items}>
                        {(it) => (
                          <div class="flex items-center justify-between text-xs font-bold">
                            <span class="inline-flex items-center gap-1.5 text-[#0D1B3E] truncate">
                              <Package class="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                              <span class="truncate">
                                {it.qty}x {it.name}
                              </span>
                            </span>
                            <span class="text-[#15803D] font-extrabold tabular-nums">
                              {formatCurrency(it.unitPrice * it.qty)}
                            </span>
                          </div>
                        )}
                      </For>
                    </div>

                    <Show
                      when={[
                        ORDER_STATUS.PLACED,
                        ORDER_STATUS.ACCEPTED,
                        ORDER_STATUS.PREPARING,
                      ].includes(order.status)}
                    >
                      <div class="px-3 py-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between text-xs font-bold">
                        <span class="inline-flex items-center gap-1 text-[#DC2626]">
                          <Clock class="w-3.5 h-3.5" />
                          <span>Pickup OTP: {order.pickupOtp}</span>
                        </span>
                        <span class="text-[#475569]">{order.riderName || 'Searching Rider...'}</span>
                      </div>

                      <div class="grid grid-cols-12 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleCancel(order)}
                          class="col-span-5 min-h-[42px] rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <XCircle class="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdvance(order)}
                          class="col-span-7 min-h-[42px] rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <CheckCircle2 class="w-4 h-4" />
                          <span>
                            {order.status === ORDER_STATUS.PLACED
                              ? 'Accept Order'
                              : 'Mark Order Ready'}
                          </span>
                        </button>
                      </div>
                    </Show>

                    <div class="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => showToast(`Opened chat with ${order.customerName}.`, 'info')}
                        class="flex-1 min-h-[40px] rounded-xl border border-[#CBD8EC] bg-[#F8FAFD] hover:bg-[#EFF6FF] text-[#0066FF] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <MessageCircle class="w-4 h-4" />
                        <span>Chat & Send Photo to Customer</span>
                      </button>
                    </div>
                  </article>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* Bill Modal */}
      <Modal
        open={Boolean(billOrder())}
        onClose={() => setBillOrder(null)}
        title={`Order Bill · ${billOrder()?.id || ''}`}
      >
        <Show when={billOrder()}>
          {(o) => (
            <div class="space-y-3 text-sm">
              <p class="font-bold text-[#0D1B3E]">{o().customerName}</p>
              <p class="text-xs text-[#64748B]">{o().deliveryAddress}</p>
              <div class="divide-y divide-[#EBF1FA] border-t border-b border-[#EBF1FA]">
                <For each={o().items}>
                  {(it) => (
                    <div class="py-2 flex justify-between text-xs">
                      <span>
                        {it.qty} × {it.name}
                      </span>
                      <span class="font-bold tabular-nums">
                        {formatCurrency(it.unitPrice * it.qty)}
                      </span>
                    </div>
                  )}
                </For>
              </div>
              <div class="flex justify-between font-extrabold text-[#0D1B3E]">
                <span>Total</span>
                <span class="tabular-nums">{formatCurrency(o().total)}</span>
              </div>
            </div>
          )}
        </Show>
      </Modal>
    </SupplierLayout>
  );
}
