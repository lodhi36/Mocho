import { createMemo, createSignal } from 'solid-js';
import { Download } from 'lucide-solid';
import { RiderLayout } from './RiderLayout.jsx';
import { ORDER_STATUS } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { showToast } from '../../stores/toastStore.js';
import { exportToCsv, formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { isValidIfsc, sanitizeText } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { StatCard, StatusText } from '../../components/ui/DataDisplay.jsx';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable.jsx';
import { TextField } from '../../components/ui/FormControls.jsx';

export function RiderEarningsPage() {
  const user = () => currentUser();

  const [bankForm, setBankForm] = createSignal({
    accountHolder: user()?.bankDetails?.accountHolder || user()?.name || '',
    bankName: user()?.bankDetails?.bankName || '',
    accountNumber: user()?.bankDetails?.accountNumber || '',
    ifscCode: user()?.bankDetails?.ifscCode || '',
  });

  const deliveredOrders = createMemo(() =>
    platformState.orders.filter(
      (o) =>
        o.riderId === user()?.id &&
        [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(o.status)
    )
  );

  const payouts = createMemo(() =>
    platformState.payouts.filter((p) => p.recipientId === user()?.id)
  );

  const totals = createMemo(() => {
    const sum = deliveredOrders().reduce((s, o) => s + (o.riderEarnings || 0), 0);
    return {
      perDeliveryAvg: deliveredOrders().length ? Math.round(sum / deliveredOrders().length) : 0,
      daily: sum,
      weekly: sum,
      monthly: sum,
    };
  });

  const handleSaveBank = (e) => {
    e.preventDefault();
    if (bankForm().ifscCode && !isValidIfsc(bankForm().ifscCode)) {
      showToast('Enter a valid 11-character IFSC code.', 'error');
      return;
    }
    platformActions.updateUserProfile(user().id, {
      bankDetails: {
        accountHolder: sanitizeText(bankForm().accountHolder, 100),
        bankName: sanitizeText(bankForm().bankName, 80),
        accountNumber: sanitizeText(bankForm().accountNumber, 30),
        ifscCode: sanitizeText(bankForm().ifscCode, 15).toUpperCase(),
      },
    });
    showToast('Payout bank details updated.', 'success');
  };

  const handleExport = () => {
    const rows = deliveredOrders().map((o) => ({
      OrderID: o.id,
      Store: o.storeName,
      DistanceKm: o.distanceKm,
      Earning: o.riderEarnings,
      CompletedAt: o.updatedAt,
    }));
    const ok = exportToCsv('rider-earnings.csv', rows);
    showToast(ok ? 'Earnings CSV downloaded.' : 'No completed deliveries to export.', ok ? 'success' : 'warning');
  };

  const deliveryColumns = [
    { header: 'Order ID', key: 'id', render: (r) => <span class="font-mono text-xs">{r.id}</span> },
    { header: 'Store', key: 'storeName' },
    { header: 'Distance', key: 'distanceKm', align: 'right', render: (r) => `${r.distanceKm} km` },
    {
      header: 'Payout',
      key: 'riderEarnings',
      align: 'right',
      render: (r) => <span class="font-semibold text-[#15803D]">{formatCurrency(r.riderEarnings)}</span>,
    },
    { header: 'Date', key: 'updatedAt', render: (r) => <span class="text-xs font-mono">{formatDateTime(r.updatedAt)}</span> },
  ];

  const payoutColumns = [
    { header: 'Payout ID', key: 'id', render: (r) => <span class="font-mono text-xs">{r.id}</span> },
    { header: 'Cycle', key: 'period' },
    {
      header: 'Amount',
      key: 'amount',
      align: 'right',
      render: (r) => <span class="font-semibold">{formatCurrency(r.amount)}</span>,
    },
    { header: 'Reference', key: 'reference', render: (r) => <span class="font-mono text-xs">{r.reference}</span> },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusText label={r.status} tone={r.status === 'settled' ? 'success' : 'warning'} />
      ),
    },
  ];

  return (
    <RiderLayout title="Rider Earnings & Payouts">
      <div class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-display text-lg font-bold text-[#0D1B3E]">Earnings Overview</h2>
          <Button variant="secondary" onClick={handleExport}>
            <Download class="w-4 h-4" />
            Download Earnings CSV
          </Button>
        </div>

        <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard delay={0} label="Avg. Per Delivery" value={formatCurrency(totals().perDeliveryAvg)} />
          <StatCard delay={50} label="Daily Earnings" value={formatCurrency(totals().daily)} />
          <StatCard delay={100} label="Weekly Earnings" value={formatCurrency(totals().weekly)} />
          <StatCard delay={150} label="Monthly Earnings" value={formatCurrency(totals().monthly)} />
        </section>

        <section class="item-card-reveal space-y-3" style={{ '--card-delay': '120ms' }}>
          <h3 class="font-display text-base font-bold text-[#0D1B3E]">Per-Delivery Breakdown</h3>
          <ResponsiveTable
            columns={deliveryColumns}
            rows={deliveredOrders()}
            emptyTitle="No completed deliveries yet"
          />
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section class="item-card-reveal lg:col-span-7 space-y-3" style={{ '--card-delay': '160ms' }}>
            <h3 class="font-display text-base font-bold text-[#0D1B3E]">Payout History</h3>
            <ResponsiveTable
              columns={payoutColumns}
              rows={payouts()}
              emptyTitle="No payout cycles recorded yet"
            />
          </section>

          <section
            class="item-card-reveal lg:col-span-5 bg-white border border-[#DDE6F2] rounded-xl p-5 space-y-4 shadow-xs hover:shadow-md transition-shadow duration-300"
            style={{ '--card-delay': '200ms' }}
          >
            <h3 class="font-display text-base font-bold text-[#0D1B3E]">Payout Bank Account</h3>
            <form onSubmit={handleSaveBank} class="space-y-3">
              <TextField
                label="Account Holder"
                value={bankForm().accountHolder}
                onInput={(e) => setBankForm((f) => ({ ...f, accountHolder: e.currentTarget.value }))}
              />
              <TextField
                label="Bank Name"
                value={bankForm().bankName}
                onInput={(e) => setBankForm((f) => ({ ...f, bankName: e.currentTarget.value }))}
              />
              <TextField
                label="Account Number"
                value={bankForm().accountNumber}
                onInput={(e) => setBankForm((f) => ({ ...f, accountNumber: e.currentTarget.value }))}
              />
              <TextField
                label="IFSC Code"
                value={bankForm().ifscCode}
                onInput={(e) => setBankForm((f) => ({ ...f, ifscCode: e.currentTarget.value }))}
              />
              <Button type="submit" class="w-full">
                Save Bank Details
              </Button>
            </form>
          </section>
        </div>
      </div>
    </RiderLayout>
  );
}
