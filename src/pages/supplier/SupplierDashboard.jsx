import { For, Show, createMemo, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
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
  Send,
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
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState, ImageWithFallback } from '../../components/ui/DataDisplay.jsx';

export function SupplierDashboard() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const user = () => currentUser();

  const store = createMemo(
    () => platformState.stores.find((s) => s.supplierId === user()?.id) || platformState.stores[0]
  );

  const [statusTab, setStatusTab] = createSignal('packing');
  const [notifOpen, setNotifOpen] = createSignal(false);
  const [ridersModal, setRidersModal] = createSignal(false);
  const [billOrder, setBillOrder] = createSignal(null);
  const [chatOrder, setChatOrder] = createSignal(null);
  const [chatMessage, setChatMessage] = createSignal('');
  const [chatLog, setChatLog] = createSignal([]);

  const storeOrders = createMemo(() =>
    platformState.orders.filter((o) => o.storeId === store()?.id)
  );

  const activeRidersReached = createMemo(() =>
    storeOrders().filter(
      (o) =>
        o.riderId &&
        [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP].includes(o.status)
    )
  );

  const filteredOrders = createMemo(() => {
    const tab = statusTab();
    return storeOrders().filter((o) => {
      if (tab === 'packing') {
        return [ORDER_STATUS.PLACED, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING].includes(
          o.status
        );
      }
      if (tab === 'ready') return o.status === ORDER_STATUS.READY_FOR_PICKUP;
      if (tab === 'out') {
        return [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP].includes(o.status);
      }
      if (tab === 'completed') {
        return [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(o.status);
      }
      return true;
    });
  });

  const handleToggleOnline = () => {
    const s = store();
    if (!s) return;
    platformActions.updateStore(s.id, { isOpen: !s.isOpen });
    showToast(
      !s.isOpen
        ? `${s.name} is now ONLINE and ready to receive orders.`
        : `${s.name} switched to OFFLINE.`,
      !s.isOpen ? 'success' : 'warning'
    );
  };

  const handlePrimaryOrderAction = async (order) => {
    try {
      if (order.status === ORDER_STATUS.PLACED) {
        await platformActions.updateOrderStatus(order.id, ORDER_STATUS.PREPARING, {
          note: `Accepted & packing started at ${store()?.name}`,
        });
        showToast(`Order ${order.id} accepted & moved to Packing.`, 'success');
      } else if (
        order.status === ORDER_STATUS.ACCEPTED ||
        order.status === ORDER_STATUS.PREPARING
      ) {
        await platformActions.updateOrderStatus(order.id, ORDER_STATUS.READY_FOR_PICKUP, {
          note: 'Marked Ready for Rider Pickup',
        });
        showToast(`Order ${order.id} is Ready for Rider Pickup.`, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCancelOrder = async (order) => {
    const ok = await requestConfirmation({
      title: `Cancel Order ${order.id}?`,
      message: 'Customer will be notified immediately and eligible payments will be refunded.',
      confirmLabel: 'Cancel Order',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await platformActions.updateOrderStatus(order.id, ORDER_STATUS.CANCELLED, {
        cancelReason: `Declined by ${store()?.name}`,
        note: 'Cancelled by store partner',
      });
      showToast(`Order ${order.id} cancelled.`, 'warning');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    const txt = chatMessage().trim();
    if (!txt) return;
    setChatLog((prev) => [
      ...prev,
      { id: Date.now(), sender: store()?.name || 'Store', text: txt, at: 'Just now' },
    ]);
    setChatMessage('');
    showToast('Message sent to customer.', 'success');
  };

  return (
    <SupplierLayout
      title={store()?.name || 'Store Home'}
      hideTopBar={true}
      fullBleed={true}
      notificationsOpen={notifOpen}
      onCloseNotifications={() => setNotifOpen(false)}
    >
      <div class="min-h-screen bg-[#F4F7FC] pb-10">
        {/* Royal Blue Curved Store Header matching Screenshots 2 & 6 */}
        <header class="bg-[#0066FF] text-white rounded-b-[28px] px-4 sm:px-6 pt-4 pb-5 shadow-[0_6px_20px_rgba(0,102,255,0.22)]">
          <div class="max-w-3xl mx-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate('/supplier/store')}
              class="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
            >
              <div class="w-10 h-10 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center shrink-0 transition-colors">
                <Briefcase class="w-5 h-5 text-white" />
              </div>
              <div class="min-w-0">
                <h1 class="font-display text-lg font-extrabold leading-tight truncate group-hover:underline">
                  {store()?.name}
                </h1>
                <span class="inline-flex items-center gap-1 text-[11px] text-white/90 group-hover:underline truncate max-w-[180px] sm:max-w-xs">
                  <Crosshair class={`w-3 h-3 shrink-0 ${geo.loading() ? 'animate-spin' : ''}`} />
                  <span class="truncate">
                    {geo.liveLocation()?.fullAddress ||
                      geo.liveLocation()?.shortAddress ||
                      (geo.loading() ? 'Fetching live device location...' : store()?.address)}
                  </span>
                  <ChevronDown class="w-3 h-3 shrink-0" />
                </span>
              </div>
            </button>

            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleOnline}
                class={`px-3 py-1.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 ${
                  store()?.isOpen
                    ? 'bg-[#22C55E] hover:bg-[#16A34A] text-white'
                    : 'bg-[#475569] hover:bg-[#334155] text-white'
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

              <button
                type="button"
                onClick={() => {
                  const first = storeOrders()[0];
                  if (first) {
                    setChatOrder(first);
                    setChatLog([
                      {
                        id: 1,
                        sender: first.customerName,
                        text: 'Hi, please pack my order carefully!',
                        at: '2m ago',
                      },
                    ]);
                  } else {
                    showToast('No active customer chats yet.', 'info');
                  }
                }}
                aria-label="Customer Messages"
                class="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center cursor-pointer transition-all active:scale-90"
              >
                <MessageCircle class="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
          {/* Store Showcase Preview Banner Card */}
          <div
            class="item-card-reveal group rounded-3xl overflow-hidden bg-white border-4 border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow relative h-40 sm:h-48"
            style={{ '--card-delay': '20ms' }}
          >
            <ImageWithFallback
              src={store()?.banner}
              alt={store()?.name}
              class="w-full h-full object-cover hero-ken-burns"
            />
            <div class="item-shine-layer" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#0D1B3E]/70 via-transparent to-transparent flex items-end justify-between p-4">
              <div class="text-white">
                <p class="text-[11px] font-bold uppercase tracking-wider text-[#93C5FD]">
                  {store()?.categoryName} Storefront
                </p>
                <p class="font-display text-base font-extrabold">{store()?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/supplier/store')}
                class="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#0066FF] text-xs font-extrabold cursor-pointer transition-all active:scale-95"
              >
                Edit Showcase
              </button>
            </div>
          </div>

          {/* Riders Reached Card matching Screenshots 2 & 6 */}
          <div
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] shadow-[0_2px_12px_rgba(13,27,62,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-4 flex items-center justify-between gap-3"
            style={{ '--card-delay': '65ms' }}
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                <Bike class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <p class="font-display text-sm font-extrabold text-[#0D1B3E]">
                  Riders Reached: {activeRidersReached().length}
                </p>
                <p class="text-xs text-[#64748B] truncate">
                  {activeRidersReached().length > 0
                    ? `${activeRidersReached()[0].riderName} assigned for pickup`
                    : 'No riders waiting right now'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRidersModal(true)}
              class="px-3.5 py-2 rounded-full bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0066FF] text-xs font-extrabold inline-flex items-center gap-0.5 shrink-0 cursor-pointer transition-all active:scale-95"
            >
              <span>View Riders</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status Filter Pills: Packing | Ready | Out for delivery | Completed */}
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'packing', label: 'Packing' },
              { id: 'ready', label: 'Ready' },
              { id: 'out', label: 'Out for delivery' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                type="button"
                onClick={() => setStatusTab(tab.id)}
                class={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer transition-all active:scale-95 border ${
                  statusTab() === tab.id
                    ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                    : 'bg-white text-[#334155] border-[#DDE6F2] hover:border-[#0066FF]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Green Online Status Banner */}
          <div
            class={`item-card-reveal rounded-full px-4 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold transition-colors ${
              store()?.isOpen
                ? 'bg-[#DCFCE7] text-[#15803D]'
                : 'bg-[#FEF3C7] text-[#B45309]'
            }`}
            style={{ '--card-delay': '105ms' }}
          >
            <span
              class={`w-5 h-5 rounded-full inline-flex items-center justify-center text-white ${
                store()?.isOpen ? 'bg-[#22C55E] radar-beacon text-[#22C55E]' : 'bg-[#F59E0B]'
              }`}
            >
              <Star class="w-3 h-3 fill-current text-white" />
            </span>
            <span>
              {store()?.isOpen
                ? 'Store is ONLINE • Ready to Receive Orders'
                : 'Store is OFFLINE • Tap Online above to accept orders'}
            </span>
          </div>

          {/* Live Order Cards matching Screenshots 2 & 6 */}
          <Show
            when={filteredOrders().length > 0}
            fallback={
              <EmptyState
                title="No orders in this stage"
                description="Switch tabs above or wait for new customer orders to arrive."
              />
            }
          >
            <div class="space-y-4">
              <For each={filteredOrders()}>
                {(order, idx) => (
                  <article
                    class="item-card-reveal bg-white rounded-3xl border border-[#E2EBF8] shadow-[0_4px_16px_rgba(13,27,62,0.05)] hover:shadow-[0_12px_28px_rgba(13,27,62,0.09)] hover:-translate-y-0.5 transition-all duration-300 p-4 sm:p-5 space-y-3.5"
                    style={{ '--card-delay': `${Math.min(idx() * 55, 330)}ms` }}
                  >
                    {/* Order ID + Timestamp + Status Pill */}
                    <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F1F5F9]">
                      <div class="min-w-0">
                        <span class="font-display text-sm font-extrabold text-[#0D1B3E]">
                          #{order.id}
                        </span>
                        <span class="text-xs text-[#64748B] ml-1.5">
                          • {formatDateTime(order.createdAt)}
                        </span>
                      </div>
                      <span class="px-2.5 py-1 rounded-lg border border-[#93C5FD] bg-[#EFF6FF] text-[#0066FF] text-[10px] font-extrabold uppercase shrink-0">
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Customer Info + Call + Bill */}
                    <div class="flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-sm font-extrabold text-[#0D1B3E] truncate">
                          {order.customerName}
                        </p>
                        <p class="text-xs text-[#64748B] truncate mt-0.5">
                          {order.deliveryAddress}
                        </p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <a
                          href={`tel:${order.customerPhone}`}
                          aria-label="Call Customer"
                          class="w-9 h-9 rounded-full bg-[#DCFCE7] text-[#15803D] inline-flex items-center justify-center"
                        >
                          <Phone class="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setBillOrder(order)}
                          class="px-3 py-1.5 rounded-xl border border-[#CBD8EC] bg-[#F8FAFD] hover:bg-[#EFF6FF] text-[#0066FF] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText class="w-3.5 h-3.5" />
                          <span>Bill</span>
                        </button>
                      </div>
                    </div>

                    {/* Item Box */}
                    <div class="px-3.5 py-2.5 rounded-xl bg-[#F8FAFD] border border-[#EBF1FA] space-y-1.5">
                      <For each={order.items}>
                        {(it) => (
                          <div class="flex items-center justify-between gap-2 text-xs font-bold">
                            <span class="inline-flex items-center gap-1.5 text-[#0D1B3E] truncate">
                              <Package class="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                              <span class="truncate">
                                {it.qty}x {it.name}
                              </span>
                            </span>
                            <span class="text-[#15803D] font-extrabold tabular-nums shrink-0">
                              {formatCurrency(it.unitPrice * it.qty)}
                            </span>
                          </div>
                        )}
                      </For>
                    </div>

                    {/* SLA Timer & Rider Status Bar */}
                    <div class="px-3 py-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between gap-2 text-xs font-bold">
                      <span class="inline-flex items-center gap-1.5 text-[#DC2626] tabular-nums">
                        <Clock class="w-3.5 h-3.5" />
                        <span>Est. {order.etaMins || 18}m Prep · OTP {order.pickupOtp}</span>
                      </span>
                      <span class="inline-flex items-center gap-1 text-[#475569]">
                        <Bike class="w-3.5 h-3.5" />
                        <span>{order.riderName || 'Searching Rider...'}</span>
                      </span>
                    </div>

                    {/* Cancel + Mark Order Ready Action Buttons */}
                    <Show
                      when={[
                        ORDER_STATUS.PLACED,
                        ORDER_STATUS.ACCEPTED,
                        ORDER_STATUS.PREPARING,
                      ].includes(order.status)}
                    >
                      <div class="grid grid-cols-12 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order)}
                          class="col-span-5 min-h-[44px] rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <XCircle class="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrimaryOrderAction(order)}
                          class="col-span-7 min-h-[44px] rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                        >
                          <CheckCircle2 class="w-4 h-4" />
                          <span>
                            {order.status === ORDER_STATUS.PLACED
                              ? 'Accept & Pack'
                              : 'Mark Order Ready'}
                          </span>
                        </button>
                      </div>
                    </Show>

                    {/* Chat & Send Photo + Call Customer Row */}
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setChatOrder(order);
                          setChatLog([
                            {
                              id: 1,
                              sender: order.customerName,
                              text: `Hello, checking on order ${order.id}.`,
                              at: 'Just now',
                            },
                          ]);
                        }}
                        class="flex-1 min-h-[42px] rounded-xl border border-[#CBD8EC] bg-[#F8FAFD] hover:bg-[#EFF6FF] text-[#0066FF] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <MessageCircle class="w-4 h-4" />
                        <span>Chat & Send Photo to Customer</span>
                      </button>
                      <a
                        href={`tel:${order.customerPhone}`}
                        class="w-11 h-11 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] inline-flex items-center justify-center shrink-0 transition-all active:scale-90"
                      >
                        <Phone class="w-4 h-4" />
                      </a>
                    </div>
                  </article>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* View Riders Modal */}
      <Modal
        open={ridersModal()}
        onClose={() => setRidersModal(false)}
        title="Riders Assigned & Nearby"
      >
        <div class="space-y-3">
          <For each={platformState.users.filter((u) => u.role === 'RIDER')}>
            {(r) => (
              <div class="p-3.5 rounded-xl border border-[#DDE6F2] flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-[#0D1B3E]">{r.name}</p>
                  <p class="text-xs text-[#64748B]">
                    {r.vehicleType} · {r.vehicleNumber}
                  </p>
                </div>
                <span
                  class={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    r.isOnline ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {r.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            )}
          </For>
        </div>
      </Modal>

      {/* Bill / Invoice Modal */}
      <Modal
        open={Boolean(billOrder())}
        onClose={() => setBillOrder(null)}
        title={`Order Bill · ${billOrder()?.id || ''}`}
      >
        <Show when={billOrder()}>
          {(o) => (
            <div class="space-y-4 text-sm">
              <div class="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#DDE6F2] space-y-1">
                <p class="font-bold text-[#0D1B3E]">{o().customerName}</p>
                <p class="text-xs text-[#64748B]">{o().deliveryAddress}</p>
              </div>
              <div class="divide-y divide-[#EBF1FA]">
                <For each={o().items}>
                  {(it) => (
                    <div class="py-2 flex justify-between text-xs">
                      <span>
                        {it.qty} × {it.name} ({it.variation})
                      </span>
                      <span class="font-bold tabular-nums">
                        {formatCurrency(it.unitPrice * it.qty)}
                      </span>
                    </div>
                  )}
                </For>
              </div>
              <div class="pt-3 border-t border-[#DDE6F2] space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-[#64748B]">Subtotal</span>
                  <span class="font-bold tabular-nums">{formatCurrency(o().subtotal)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[#64748B]">Delivery Fee</span>
                  <span class="font-bold tabular-nums">{formatCurrency(o().deliveryFee)}</span>
                </div>
                <div class="flex justify-between text-sm font-extrabold text-[#0D1B3E] pt-1">
                  <span>Grand Total</span>
                  <span class="tabular-nums">{formatCurrency(o().total)}</span>
                </div>
              </div>
            </div>
          )}
        </Show>
      </Modal>

      {/* Chat & Send Photo Modal */}
      <Modal
        open={Boolean(chatOrder())}
        onClose={() => setChatOrder(null)}
        title={`Chat with ${chatOrder()?.customerName || 'Customer'}`}
      >
        <div class="space-y-3">
          <div class="max-h-56 overflow-y-auto space-y-2 p-3 rounded-xl bg-[#F8FAFD] border border-[#DDE6F2]">
            <For each={chatLog()}>
              {(msg) => (
                <div class="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs">
                  <p class="font-bold text-[#0066FF]">{msg.sender}</p>
                  <p class="text-[#0D1B3E] mt-0.5">{msg.text}</p>
                </div>
              )}
            </For>
          </div>
          <form onSubmit={handleSendChat} class="flex gap-2">
            <input
              type="text"
              value={chatMessage()}
              onInput={(e) => setChatMessage(e.currentTarget.value)}
              placeholder="Type update or packing confirmation..."
              class="flex-1 px-3 py-2 text-sm border border-[#CBD8EC] rounded-xl focus:outline-none focus:border-[#0066FF]"
            />
            <Button type="submit" size="sm">
              <Send class="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Modal>
    </SupplierLayout>
  );
}
