import { For, Show, createMemo, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Navigation,
  Plus,
  Smartphone,
  Zap,
} from 'lucide-solid';
import { SupplierLayout } from './SupplierLayout.jsx';
import { ORDER_STATUS } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { showToast } from '../../stores/toastStore.js';
import { exportToCsv, formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { sanitizeText } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { TextField } from '../../components/ui/FormControls.jsx';

const DAYS_IN_NOV = Array.from({ length: 30 }, (_, i) => i + 1);

export function SupplierEarningsPage() {
  const navigate = useNavigate();
  const user = () => currentUser();
  const store = createMemo(
    () => platformState.stores.find((s) => s.supplierId === user()?.id) || platformState.stores[0]
  );

  const [periodTab, setPeriodTab] = createSignal('daily');
  const [calendarOpen, setCalendarOpen] = createSignal(true);
  const [calendarMode, setCalendarMode] = createSignal('all');
  const [selectedDay, setSelectedDay] = createSignal(21);
  const [upiModal, setUpiModal] = createSignal(false);
  const [upiInput, setUpiInput] = createSignal(user()?.upiId || '');

  const validOrders = createMemo(() =>
    platformState.orders.filter(
      (o) => o.storeId === store()?.id && o.status !== ORDER_STATUS.CANCELLED
    )
  );

  const filteredOrders = createMemo(() => {
    const mode = calendarMode();
    return validOrders().filter((o) => {
      if (mode === 'all' || mode === 'month') return true;
      const d = new Date(o.createdAt).getDate();
      if (mode === 'today') return d === 20 || d === 21;
      if (mode === 'yesterday') return d === 19;
      if (mode === 'day') return d === selectedDay();
      return true;
    });
  });

  const walletStats = createMemo(() => {
    const orders = validOrders();
    const orderPayable = orders.reduce((s, o) => s + (o.supplierPayable || 0), 0);
    const settledPayouts = platformState.payouts
      .filter((p) => p.recipientId === user()?.id)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const todayOrders = orders.filter((o) => {
      const d = new Date(o.createdAt).getDate();
      return d === 20 || d === 21;
    });
    const todayAmount = todayOrders.reduce((s, o) => s + (o.supplierPayable || 0), 0);

    return {
      availableBalance: orderPayable,
      lifetime: orderPayable + settledPayouts,
      todayAmount,
      todayCount: todayOrders.length,
      weeklyAmount: orderPayable,
      monthlyAmount: orderPayable + settledPayouts,
      completedCount: orders.length,
    };
  });

  const periodAmount = createMemo(() => {
    if (periodTab() === 'weekly') return walletStats().weeklyAmount;
    if (periodTab() === 'monthly') return walletStats().monthlyAmount;
    return walletStats().todayAmount;
  });

  const handleSaveUpi = (e) => {
    e.preventDefault();
    const clean = sanitizeText(upiInput(), 60);
    if (!clean.includes('@')) {
      showToast('Enter a valid UPI ID (e.g. geetafashion@upi).', 'error');
      return;
    }
    platformActions.updateUserProfile(user().id, { upiId: clean });
    setUpiModal(false);
    showToast(`Payout UPI ID (${clean}) saved.`, 'success');
  };

  const handleWithdraw = () => {
    const balance = walletStats().availableBalance;
    if (balance <= 0) {
      showToast('No withdrawable balance available right now.', 'warning');
      return;
    }
    if (!user()?.upiId) {
      setUpiModal(true);
      showToast('Add your UPI ID first to withdraw funds.', 'info');
      return;
    }
    platformActions.requestWithdrawal({
      recipientId: user().id,
      recipientName: store()?.name || user().name,
      recipientRole: user().role,
      amount: balance,
      upiId: user().upiId,
    });
    showToast(`Withdrawal of ${formatCurrency(balance)} initiated to ${user().upiId}.`, 'success');
  };

  const handleDownloadCsv = () => {
    const rows = validOrders().map((o) => ({
      OrderID: o.id,
      Date: o.createdAt,
      Customer: o.customerName,
      Total: o.total,
      Commission: o.platformCommission,
      NetPayable: o.supplierPayable,
      Status: o.status,
    }));
    const ok = exportToCsv(`${store()?.name || 'partner'}-earnings.csv`, rows);
    showToast(ok ? 'Earnings CSV downloaded.' : 'No orders to export.', ok ? 'success' : 'warning');
  };

  return (
    <SupplierLayout title="Partner Earnings & Wallet" hideTopBar={true} fullBleed={true}>
      <div class="min-h-screen bg-[#F4F7FC] pb-10">
        {/* Top Header matching Screenshot 4 */}
        <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E2EBF8] px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/supplier')}
            aria-label="Back"
            class="w-10 h-10 rounded-full bg-[#F4F7FC] hover:bg-[#EBF3FF] text-[#0D1B3E] inline-flex items-center justify-center cursor-pointer transition-all active:scale-90"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
          <h1 class="font-display text-base sm:text-lg font-extrabold text-[#0D1B3E] truncate">
            Partner Earnings &amp; Wallet
          </h1>
          <button
            type="button"
            onClick={handleDownloadCsv}
            title="Download CSV Report"
            class="w-10 h-10 rounded-full bg-[#F4F7FC] hover:bg-[#EBF3FF] text-[#0066FF] inline-flex items-center justify-center cursor-pointer transition-all active:scale-90"
          >
            <Navigation class="w-4 h-4" />
          </button>
        </header>

        <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
          {/* Royal Blue Available Wallet Balance Card matching Screenshot 4 */}
          <section
            class="item-card-reveal banner-glow-sweep relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0066FF] via-[#005CE6] to-[#0047B3] text-white p-5 shadow-[0_10px_28px_rgba(0,102,255,0.28)] space-y-4"
            style={{ '--card-delay': '20ms' }}
          >
            <div class="relative z-10 flex items-start justify-between gap-2">
              <div>
                <p class="text-[11px] font-extrabold uppercase tracking-wider text-white/85">
                  AVAILABLE WALLET BALANCE
                </p>
                <p class="mt-1 font-display text-4xl font-extrabold tabular-nums">
                  {formatCurrency(walletStats().availableBalance)}
                </p>
                <p class="text-xs text-white/80 mt-1 tabular-nums">
                  Withdrawable Real Balance • Total Lifetime: {formatCurrency(walletStats().lifetime)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen((v) => !v)}
                class="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
              >
                <Calendar class="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
            </div>

            {/* Nested Today's Earnings Box */}
            <div class="relative z-10 rounded-2xl bg-white/12 border border-white/15 p-3.5 flex items-center justify-between gap-3">
              <div>
                <p class="text-[10px] font-extrabold uppercase tracking-wider text-white/80">
                  {periodTab() === 'daily'
                    ? "TODAY'S EARNINGS (DAILY)"
                    : periodTab() === 'weekly'
                      ? 'THIS WEEK EARNINGS'
                      : 'THIS MONTH EARNINGS'}
                </p>
                <Show when={periodTab()} keyed>
                  {() => (
                    <p class="price-pop font-display text-xl font-extrabold tabular-nums mt-0.5">
                      {formatCurrency(periodAmount())}
                    </p>
                  )}
                </Show>
              </div>
              <span class="px-3 py-1 rounded-full bg-white/15 text-xs font-bold tabular-nums">
                {walletStats().todayCount} Orders
              </span>
            </div>

            {/* Withdraw Funds & Add UPI ID Buttons */}
            <div class="relative z-10 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleWithdraw}
                class="min-h-[44px] rounded-xl bg-white hover:bg-[#F0F7FF] text-[#0052CC] text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                <Zap class="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                <span>Withdraw Funds</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpiInput(user()?.upiId || '');
                  setUpiModal(true);
                }}
                class="min-h-[44px] rounded-xl bg-white/18 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Plus class="w-4 h-4" />
                <span>{user()?.upiId ? 'Edit UPI ID' : 'Add UPI ID'}</span>
              </button>
            </div>
          </section>

          {/* Payout UPI ID Card */}
          <div
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all duration-300"
            style={{ '--card-delay': '65ms' }}
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#0D1B3E] flex items-center justify-center shrink-0">
                <Smartphone class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <p class="text-[11px] font-medium text-[#64748B]">Payout UPI ID</p>
                <p class="text-sm font-extrabold text-[#0D1B3E] truncate">
                  {user()?.upiId || 'No UPI ID Added Yet'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setUpiInput(user()?.upiId || '');
                setUpiModal(true);
              }}
              class="px-3.5 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0066FF] text-xs font-extrabold cursor-pointer shrink-0 transition-all active:scale-95"
            >
              {user()?.upiId ? 'Change' : 'Add Now'}
            </button>
          </div>

          {/* DAILY | WEEKLY | MONTHLY Segmented Bar */}
          <div
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-1.5 grid grid-cols-3 gap-1"
            style={{ '--card-delay': '95ms' }}
          >
            {[
              { id: 'daily', label: 'DAILY' },
              { id: 'weekly', label: 'WEEKLY' },
              { id: 'monthly', label: 'MONTHLY' },
            ].map((tab) => (
              <button
                type="button"
                onClick={() => setPeriodTab(tab.id)}
                class={`py-2.5 rounded-xl text-xs font-extrabold tracking-wide cursor-pointer transition-all active:scale-95 ${
                  periodTab() === tab.id
                    ? 'bg-[#0066FF] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0D1B3E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Completed Orders Verified Card */}
          <div
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 flex items-center justify-between gap-3"
            style={{ '--card-delay': '125ms' }}
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center">
                <Calendar class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs text-[#64748B]">Completed Orders</p>
                <p class="font-display text-xl font-extrabold text-[#0D1B3E] tabular-nums">
                  {walletStats().completedCount}
                </p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-extrabold inline-flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>Verified</span>
            </span>
          </div>

          {/* Interactive Earnings Calendar matching Screenshot 4 */}
          <section
            class="item-card-reveal bg-white rounded-3xl border border-[#E2EBF8] p-4 sm:p-5 shadow-xs space-y-4"
            style={{ '--card-delay': '155ms' }}
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <Calendar class="w-5 h-5 text-[#DC2626]" />
                <div>
                  <h2 class="font-display text-sm font-extrabold text-[#0D1B3E]">
                    Earnings Calendar
                  </h2>
                  <p class="text-[11px] text-[#64748B]">Filter daily orders &amp; payouts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen((v) => !v)}
                class="px-3 py-1 rounded-full bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0066FF] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <span>{calendarOpen() ? 'Collapse' : 'Expand'}</span>
                <ChevronUp
                  class={`w-3.5 h-3.5 transition-transform duration-300 ${calendarOpen() ? '' : 'rotate-180'}`}
                />
              </button>
            </div>

            <Show when={calendarOpen()}>
              <div class="expand-reveal space-y-4">
                {/* Quick Calendar Filter Chips */}
                <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: 'all', label: 'All in Nov' },
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'month', label: 'Current Month (Nov)' },
                  ].map((chip) => (
                    <button
                      type="button"
                      onClick={() => setCalendarMode(chip.id)}
                      class={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer border transition-all active:scale-95 ${
                        calendarMode() === chip.id
                          ? 'bg-[#0066FF] text-white border-[#0066FF]'
                          : 'bg-white text-[#475569] border-[#DDE6F2]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Month Header */}
                <div class="flex items-center justify-between">
                  <span class="w-8 h-8 rounded-lg bg-[#F1F5F9] inline-flex items-center justify-center text-[#64748B]">
                    <ChevronLeft class="w-4 h-4" />
                  </span>
                  <div class="text-center">
                    <p class="font-display text-sm font-extrabold text-[#0D1B3E]">November 2026</p>
                    <p class="text-[11px] text-[#94A3B8]">Tap a date to filter orders</p>
                  </div>
                  <span class="w-8 h-8 rounded-lg bg-[#F1F5F9] inline-flex items-center justify-center text-[#64748B]">
                    <ChevronRight class="w-4 h-4" />
                  </span>
                </div>

                {/* Days Grid */}
                <div class="grid grid-cols-7 gap-1.5 text-center">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
                    <span
                      class={`text-[11px] font-bold py-1 ${
                        idx === 0 || idx === 6 ? 'text-[#EF4444]' : 'text-[#64748B]'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                  <For each={DAYS_IN_NOV}>
                    {(day) => {
                      const isSelected = () => calendarMode() === 'day' && selectedDay() === day;
                      const isToday = day === 21;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDay(day);
                            setCalendarMode('day');
                          }}
                          class={`h-9 rounded-xl text-xs font-bold tabular-nums cursor-pointer transition-all active:scale-90 ${
                            isSelected()
                              ? 'bg-[#0066FF] text-white shadow-xs scale-105'
                              : isToday
                                ? 'bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D]'
                                : 'hover:bg-[#F1F5F9] text-[#0D1B3E]'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }}
                  </For>
                </div>

                {/* Summary Strip */}
                <div class="p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2EBF8] text-xs">
                  <p class="font-extrabold text-[#0D1B3E]">
                    Showing:{' '}
                    {calendarMode() === 'day'
                      ? `Nov ${selectedDay()}, 2026`
                      : calendarMode() === 'today'
                        ? 'Today'
                        : 'All Time History'}
                  </p>
                  <p class="text-[#64748B] mt-0.5 tabular-nums">
                    Earned:{' '}
                    <span class="font-bold text-[#15803D]">
                      {formatCurrency(
                        filteredOrders().reduce((s, o) => s + (o.supplierPayable || 0), 0)
                      )}
                    </span>{' '}
                    • Orders: <strong>{filteredOrders().length}</strong>
                  </p>
                </div>
              </div>
            </Show>
          </section>

          {/* Completed Orders Breakdown */}
          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-display text-base font-extrabold text-[#0D1B3E]">
                Completed Orders Breakdown
              </h3>
              <button
                type="button"
                onClick={handleDownloadCsv}
                class="text-xs font-bold text-[#0066FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Download class="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div class="space-y-2.5">
              <For each={filteredOrders()}>
                {(o, idx) => (
                  <div
                    class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] p-4 flex items-center justify-between gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    style={{ '--card-delay': `${Math.min(idx() * 45, 300)}ms` }}
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-extrabold text-[#0D1B3E] truncate">
                        {o.id} · {o.customerName}
                      </p>
                      <p class="text-xs text-[#64748B] mt-0.5">{formatDateTime(o.createdAt)}</p>
                    </div>
                    <div class="text-right tabular-nums shrink-0">
                      <p class="text-sm font-extrabold text-[#15803D]">
                        +{formatCurrency(o.supplierPayable)}
                      </p>
                      <p class="text-[11px] text-[#64748B]">
                        Fee: -{formatCurrency(o.platformCommission)}
                      </p>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </section>
        </div>
      </div>

      {/* Add / Edit UPI ID Modal */}
      <Modal
        open={upiModal()}
        onClose={() => setUpiModal(false)}
        title="Link Payout UPI ID"
      >
        <form onSubmit={handleSaveUpi} class="space-y-4">
          <TextField
            label="UPI ID"
            value={upiInput()}
            onInput={(e) => setUpiInput(e.currentTarget.value)}
            placeholder="e.g. geetafashion@okhdfcbank"
          />
          <div class="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setUpiModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save UPI ID</Button>
          </div>
        </form>
      </Modal>
    </SupplierLayout>
  );
}
