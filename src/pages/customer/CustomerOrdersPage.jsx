import { For, Show, createMemo, createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Crosshair,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Star,
  User,
  XCircle,
} from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { ORDER_STATUS } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { requestConfirmation, showToast } from '../../stores/toastStore.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { sanitizeText } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/DataDisplay.jsx';
import { OrderLifecycleTracker } from '../../components/ui/OrderLifecycleTracker.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { TextAreaField } from '../../components/ui/FormControls.jsx';

const MONTHS = ['ALL', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY_CARDS = [
  { key: 'ALL', label: 'ALL', dayName: '', num: '' },
  { key: '17', label: 'NOV', dayName: 'TUE', num: '17' },
  { key: '18', label: 'NOV', dayName: 'WED', num: '18' },
  { key: '19', label: 'NOV', dayName: 'THU', num: '19' },
  { key: '20', label: 'NOV', dayName: 'FRI', num: '20' },
  { key: '21', label: 'NOV', dayName: 'SAT', num: '21' },
];

export function CustomerOrdersPage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = createSignal('ALL');
  const [selectedDay, setSelectedDay] = createSignal('ALL');
  const [statusFilter, setStatusFilter] = createSignal('all');
  const [expandedOrderId, setExpandedOrderId] = createSignal('');
  const [reviewOrder, setReviewOrder] = createSignal(null);
  const [rating, setRating] = createSignal(5);
  const [comment, setComment] = createSignal('');

  const user = () => currentUser();

  const myOrders = createMemo(() => {
    const uid = user()?.id;
    const month = selectedMonth();
    const day = selectedDay();
    const status = statusFilter();

    return platformState.orders.filter((o) => {
      if (o.customerId !== uid) return false;
      const dt = new Date(o.createdAt);
      if (month !== 'ALL') {
        const mName = dt.toLocaleString('en-US', { month: 'short' });
        if (mName.toLowerCase() !== month.toLowerCase()) return false;
      }
      if (day !== 'ALL') {
        if (String(dt.getDate()) !== day) return false;
      }
      if (status === 'active') {
        return o.status !== ORDER_STATUS.COMPLETED && o.status !== ORDER_STATUS.CANCELLED;
      }
      if (status === 'completed') return o.status === ORDER_STATUS.COMPLETED;
      if (status === 'cancelled') return o.status === ORDER_STATUS.CANCELLED;
      return true;
    });
  });

  const handleCancelOrder = async (order) => {
    const ok = await requestConfirmation({
      title: `Cancel Order ${order.id}?`,
      message:
        'You can cancel orders before rider pickup. Online payments will automatically initiate a refund request.',
      confirmLabel: 'Cancel Order',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await platformActions.updateOrderStatus(order.id, ORDER_STATUS.CANCELLED, {
        cancelReason: 'Cancelled By: You - Ordered by mistake',
        note: 'Cancelled by customer',
      });
      showToast(`Order ${order.id} cancelled.`, 'warning');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmReceipt = async (order) => {
    try {
      await platformActions.updateOrderStatus(order.id, ORDER_STATUS.COMPLETED, {
        note: 'Customer confirmed receipt — Order Completed',
      });
      showToast(`Order ${order.id} marked Completed.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReorder = (order) => {
    const ok = platformActions.reorderToCart(order);
    if (!ok) {
      showToast('Items from this order are currently unavailable.', 'warning');
      return;
    }
    showToast('Order items loaded into your cart.', 'success');
    navigate('/customer/cart');
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const order = reviewOrder();
    if (!order) return;
    platformActions.addReview({
      orderId: order.id,
      storeId: order.storeId,
      storeName: order.storeName,
      productId: order.items[0]?.productId || '',
      productName: order.items[0]?.name || order.storeName,
      customerId: user().id,
      customerName: user().name,
      riderId: order.riderId,
      rating: rating(),
      comment: sanitizeText(comment(), 400) || 'Smooth delivery experience.',
    });
    setReviewOrder(null);
    setComment('');
    setRating(5);
    showToast('Thank you! Your review has been published.', 'success');
  };

  const getBadgeStyle = (status) => {
    if (status === ORDER_STATUS.CANCELLED) return 'bg-[#FEE2E2] text-[#DC2626]';
    if (status === ORDER_STATUS.COMPLETED || status === ORDER_STATUS.DELIVERED) {
      return 'bg-[#DCFCE7] text-[#15803D]';
    }
    return 'bg-[#DBEAFE] text-[#0066FF]';
  };

  return (
    <CustomerLayout title="My Orders" hideTopBar={true} fullBleed={true}>
      <div class="min-h-screen bg-[#F4F7FC] pb-10">
        {/* Sticky Top Header matching Screenshot 7 */}
        <header class="sticky top-0 z-30 bg-white border-b border-[#EBF1FA] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/customer')}
              aria-label="Back"
              class="w-10 h-10 rounded-full bg-[#F4F7FC] hover:bg-[#EBF3FF] text-[#0D1B3E] inline-flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>
            <h1 class="font-display text-lg sm:text-xl font-extrabold text-[#0D1B3E]">
              My Orders
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedMonth('ALL');
              setSelectedDay('ALL');
              setStatusFilter('all');
              showToast('Order list refreshed.', 'info');
            }}
            aria-label="Refresh orders"
            class="w-10 h-10 rounded-full bg-[#F4F7FC] hover:bg-[#EBF3FF] text-[#0D1B3E] inline-flex items-center justify-center cursor-pointer"
          >
            <Navigation class="w-4 h-4" />
          </button>
        </header>

        <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
          {/* Month Pill Filter Row (ALL, Jan, Feb, Mar...) */}
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <For each={MONTHS}>
              {(m) => (
                <button
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  class={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    selectedMonth() === m
                      ? 'bg-[#0066FF] text-white shadow-xs'
                      : 'bg-[#E9EFF8] text-[#475569] hover:bg-[#DBEAFE]'
                  }`}
                >
                  {m}
                </button>
              )}
            </For>
          </div>

          {/* Date Cards Selector Row (ALL + Day tiles) */}
          <div class="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            <For each={DAY_CARDS}>
              {(d, idx) => {
                const active = () => selectedDay() === d.key;
                return (
                  <button
                    type="button"
                    onClick={() => setSelectedDay(d.key)}
                    style={{ '--item-delay': `${idx() * 35}ms` }}
                    class={`item-card-reveal min-w-[66px] h-[72px] rounded-2xl flex flex-col items-center justify-center shrink-0 cursor-pointer border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                      active()
                        ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-sm'
                        : 'bg-white text-[#0D1B3E] border-[#E2E8F0] hover:border-[#0066FF]/50'
                    }`}
                  >
                    <Show
                      when={d.key !== 'ALL'}
                      fallback={<span class="text-xs font-extrabold">ALL</span>}
                    >
                      <span
                        class={`text-[9px] font-bold uppercase ${
                          active() ? 'text-white/80' : 'text-[#64748B]'
                        }`}
                      >
                        {d.label}
                      </span>
                      <span
                        class={`text-[10px] font-bold ${
                          active() ? 'text-white/90' : 'text-[#475569]'
                        }`}
                      >
                        {d.dayName}
                      </span>
                      <span class="text-sm font-extrabold tabular-nums mt-0.5">{d.num}</span>
                    </Show>
                  </button>
                );
              }}
            </For>
          </div>

          {/* Status Pill Tabs: ALL | ACTIVE | COMPLETED | CANCELLED */}
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'ALL' },
              { id: 'active', label: 'ACTIVE' },
              { id: 'completed', label: 'COMPLETED' },
              { id: 'cancelled', label: 'CANCELLED' },
            ].map((tab) => (
              <button
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                class={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 ${
                  statusFilter() === tab.id
                    ? 'bg-[#0066FF] text-white shadow-xs'
                    : 'bg-[#E9EFF8] text-[#475569] hover:bg-[#DBEAFE]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <Show
            when={myOrders().length > 0}
            fallback={
              <EmptyState
                title="No orders found"
                description="Try clearing the date/status filter or place a new order from local stores."
                action={
                  <A href="/customer">
                    <Button>Browse Stores</Button>
                  </A>
                }
              />
            }
          >
            <div class="space-y-4">
              <For each={myOrders()}>
                {(order, idx) => {
                  const isExpanded = () => expandedOrderId() === order.id;
                  const canCancel = () =>
                    [
                      ORDER_STATUS.PLACED,
                      ORDER_STATUS.ACCEPTED,
                      ORDER_STATUS.PREPARING,
                      ORDER_STATUS.READY_FOR_PICKUP,
                    ].includes(order.status);
                  const isActiveOrder = () =>
                    order.status !== ORDER_STATUS.COMPLETED &&
                    order.status !== ORDER_STATUS.CANCELLED;

                  return (
                    <article
                      style={{ '--item-delay': `${Math.min(idx(), 8) * 55}ms` }}
                      class="item-card-reveal bg-white border border-[#E2EBF8] hover:border-[#93C5FD] rounded-3xl p-4 sm:p-5 shadow-[0_4px_16px_rgba(13,27,62,0.04)] hover:shadow-[0_12px_26px_rgba(0,102,255,0.09)] transition-all duration-300 space-y-3"
                    >
                      {/* Header Row: Store Name + Order ID + Status Pill */}
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <h3 class="font-display text-base font-extrabold text-[#0D1B3E] truncate">
                            {order.storeName}
                          </h3>
                          <p class="text-[11px] font-mono text-[#64748B] truncate">
                            ID: {order.id}
                          </p>
                        </div>
                        <span
                          class={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide shrink-0 inline-flex items-center gap-1.5 ${getBadgeStyle(
                            order.status
                          )}`}
                        >
                          <Show when={isActiveOrder()}>
                            <span class="radar-beacon w-1.5 h-1.5 rounded-full bg-[#0066FF] text-[#0066FF]" />
                          </Show>
                          <span>{order.status.replace(/_/g, ' ')}</span>
                        </span>
                      </div>

                      {/* Soft Red Cancellation Banner when Cancelled */}
                      <Show when={order.status === ORDER_STATUS.CANCELLED}>
                        <div class="px-3 py-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#DC2626] flex items-center gap-2">
                          <XCircle class="w-4 h-4 shrink-0" />
                          <span>{order.cancelReason || 'Cancelled By: You - Ordered by mistake'}</span>
                        </div>
                      </Show>

                      {/* Timestamp */}
                      <div class="flex items-center gap-1.5 text-xs font-medium text-[#475569]">
                        <Calendar class="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>{formatDateTime(order.createdAt)}</span>
                      </div>

                      {/* Item Summary Box */}
                      <div class="px-3 py-2 rounded-xl bg-[#F8FAFD] border border-[#EBF1FA] space-y-1">
                        <For each={order.items}>
                          {(it) => (
                            <div class="flex items-center justify-between gap-2 text-xs font-semibold text-[#0D1B3E]">
                              <span class="inline-flex items-center gap-1.5 truncate">
                                <Package class="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                                <span class="truncate">
                                  {it.name} × {it.qty}
                                </span>
                              </span>
                              <span class="tabular-nums text-[#475569] shrink-0">
                                {formatCurrency(it.unitPrice * it.qty)}
                              </span>
                            </div>
                          )}
                        </For>
                      </div>

                      {/* Delivery Location + Bold Price */}
                      <div class="space-y-1">
                        <p class="text-xs text-[#475569] flex items-center gap-1.5">
                          <Crosshair class="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                          <span class="truncate">{order.deliveryAddress}</span>
                        </p>
                        <p class="font-display text-base font-extrabold text-[#0D1B3E] tabular-nums">
                          {formatCurrency(order.total)}
                        </p>
                      </div>

                      {/* Assigned Bar */}
                      <div class="px-3 py-2 rounded-xl bg-[#EFF6FF] text-xs font-bold text-[#0D1B3E] flex items-center gap-2">
                        <User class="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>
                          Assigned: {order.riderName ? `${order.riderName} (${order.storeName})` : order.storeName}
                        </span>
                      </div>

                      {/* Action Footer Row */}
                      <div class="pt-1 flex flex-wrap items-center justify-between gap-2">
                        <div class="flex flex-wrap items-center gap-2">
                          <Show when={order.status === ORDER_STATUS.DELIVERED}>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleConfirmReceipt(order)}
                            >
                              <CheckCircle2 class="w-3.5 h-3.5" />
                              Confirm Receipt
                            </Button>
                          </Show>
                          <Show when={canCancel()}>
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order)}
                              class="px-3 py-1.5 rounded-xl bg-[#FEF2F2] text-[#DC2626] text-xs font-bold cursor-pointer hover:bg-[#FEE2E2]"
                            >
                              Cancel
                            </button>
                          </Show>
                          <Show when={order.status === ORDER_STATUS.COMPLETED && !order.rated}>
                            <button
                              type="button"
                              onClick={() => setReviewOrder(order)}
                              class="px-3 py-1.5 rounded-xl bg-[#FEF3C7] text-[#B45309] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Star class="w-3.5 h-3.5" />
                              Rate
                            </button>
                          </Show>
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            class="px-3 py-1.5 rounded-xl bg-[#F1F5F9] text-[#334155] text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-[#E2E8F0]"
                          >
                            <RefreshCw class="w-3 h-3" />
                            Reorder
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId(isExpanded() ? '' : order.id)
                          }
                          class="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95"
                        >
                          <span>{isExpanded() ? 'Hide Tracker' : 'Track Order'}</span>
                          <ArrowRight class="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Expandable Live Lifecycle Tracker + Rider & Delivery OTP */}
                      <Show when={isExpanded()}>
                        <div class="expand-reveal pt-4 mt-2 border-t border-[#EBF1FA] space-y-4">
                          <OrderLifecycleTracker
                            status={order.status}
                            cancelReason={order.cancelReason}
                            timeline={order.timeline}
                            showTimeline={true}
                          />

                          <Show when={order.riderName && order.status !== ORDER_STATUS.CANCELLED}>
                            <div class="p-3.5 rounded-2xl bg-[#F4F7FC] border border-[#DDE6F2] flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p class="text-[11px] text-[#64748B]">Delivery Partner</p>
                                <p class="text-sm font-bold text-[#0D1B3E]">
                                  {order.riderName} · {order.riderPhone}
                                </p>
                              </div>
                              <div class="flex items-center gap-2">
                                <Show
                                  when={
                                    order.status === ORDER_STATUS.PICKED_UP ||
                                    order.status === ORDER_STATUS.RIDER_ASSIGNED
                                  }
                                >
                                  <div class="px-3 py-1.5 rounded-xl bg-white border border-[#CBD8EC] text-right">
                                    <span class="block text-[10px] text-[#64748B]">Delivery OTP</span>
                                    <span class="font-mono text-sm font-extrabold text-[#0066FF] tracking-widest">
                                      {order.deliveryOtp}
                                    </span>
                                  </div>
                                </Show>
                                <a
                                  href={`tel:${order.riderPhone}`}
                                  class="w-9 h-9 rounded-full bg-[#DCFCE7] text-[#15803D] inline-flex items-center justify-center"
                                >
                                  <Phone class="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </Show>
                        </div>
                      </Show>
                    </article>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        open={Boolean(reviewOrder())}
        onClose={() => setReviewOrder(null)}
        title={`Rate Order ${reviewOrder()?.id || ''}`}
      >
        <form onSubmit={handleSubmitReview} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[#0D1B3E] mb-2">Overall Rating</label>
            <div class="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  onClick={() => setRating(n)}
                  class={`w-10 h-10 rounded-lg border inline-flex items-center justify-center cursor-pointer ${
                    n <= rating()
                      ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]'
                      : 'bg-white border-[#DDE6F2] text-[#7B8CA8]'
                  }`}
                >
                  <Star class={`w-4 h-4 ${n <= rating() ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>
          <TextAreaField
            label="Your Review"
            rows={3}
            value={comment()}
            onInput={(e) => setComment(e.currentTarget.value)}
            placeholder="Share product quality and delivery feedback..."
          />
          <div class="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReviewOrder(null)}>
              Cancel
            </Button>
            <Button type="submit">Submit Review</Button>
          </div>
        </form>
      </Modal>
    </CustomerLayout>
  );
}
