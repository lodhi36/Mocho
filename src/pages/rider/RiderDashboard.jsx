import { Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { Bike, CheckCircle2, Clock, IndianRupee, Power } from 'lucide-solid';
import { RiderLayout } from './RiderLayout.jsx';
import { ORDER_STATUS } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { showToast } from '../../stores/toastStore.js';
import { formatCurrency } from '../../utils/formatters.js';
import { Button } from '../../components/ui/Button.jsx';
import { StatCard, StatusText } from '../../components/ui/DataDisplay.jsx';
import { BarChart } from '../../components/ui/SimpleChart.jsx';

export function RiderDashboard() {
  const user = () => currentUser();

  const myOrders = createMemo(() =>
    platformState.orders.filter((o) => o.riderId === user()?.id)
  );

  const openRequests = createMemo(() =>
    platformState.orders.filter(
      (o) => o.status === ORDER_STATUS.READY_FOR_PICKUP && !o.riderId
    )
  );

  const metrics = createMemo(() => {
    const orders = myOrders();
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const todayCount = orders.filter((o) => (o.createdAt || '').startsWith(todayPrefix)).length;
    const completed = orders.filter((o) =>
      [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(o.status)
    );
    const pending = orders.filter((o) =>
      [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP].includes(o.status)
    );
    const earned = completed.reduce((s, o) => s + (o.riderEarnings || 0), 0);
    return {
      todayDeliveries: todayCount,
      completedCount: completed.length,
      pendingCount: pending.length,
      todayEarnings: earned,
      weeklyEarnings: earned,
      monthlyEarnings: earned,
    };
  });

  const activeOrder = createMemo(() =>
    myOrders().find((o) =>
      [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP].includes(o.status)
    )
  );

  const chartData = [
    { label: 'Mon', value: 620, displayValue: '₹620' },
    { label: 'Tue', value: 780, displayValue: '₹780' },
    { label: 'Wed', value: 540, displayValue: '₹540' },
    { label: 'Thu', value: 890, displayValue: '₹890' },
    { label: 'Fri', value: 940, displayValue: '₹940' },
    { label: 'Sat', value: 1120, displayValue: '₹1.1k' },
    { label: 'Today', value: metrics().todayEarnings, displayValue: formatCurrency(metrics().todayEarnings) },
  ];

  const toggleOnline = () => {
    const next = !user()?.isOnline;
    platformActions.updateUserProfile(user().id, { isOnline: next });
    showToast(
      next
        ? 'You are now ONLINE and eligible for nearby delivery requests.'
        : 'You are now OFFLINE. New delivery requests paused.',
      next ? 'success' : 'info'
    );
  };

  return (
    <RiderLayout title="Rider Dashboard">
      <div class="space-y-6">
        {/* Online / Offline Duty Banner */}
        <section
          class="item-card-reveal bg-white border border-[#DDE6F2] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs hover:shadow-md transition-shadow duration-300"
          style={{ '--card-delay': '20ms' }}
        >
          <div>
            <div class="flex flex-wrap items-center gap-2 text-xs text-[#5A6C8A]">
              <span>{user()?.vehicleType}</span>
              <span>·</span>
              <span class="font-mono">{user()?.vehicleNumber}</span>
              <span>·</span>
              <span class="inline-flex items-center gap-1.5">
                <Show when={user()?.isOnline}>
                  <span class="w-2 h-2 rounded-full bg-[#22C55E] radar-beacon text-[#22C55E]" />
                </Show>
                <StatusText
                  label={user()?.isOnline ? 'Online & Dispatch Ready' : 'Offline'}
                  tone={user()?.isOnline ? 'success' : 'neutral'}
                />
              </span>
            </div>
            <h2 class="mt-1 font-display text-xl font-bold text-[#0D1B3E]">
              Welcome back, {user()?.name}
            </h2>
            <p class="text-xs text-[#4B5C78] mt-0.5">
              {openRequests().length} delivery request(s) currently waiting for pickup nearby.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <Button
              variant={user()?.isOnline ? 'success' : 'secondary'}
              onClick={toggleOnline}
            >
              <Power class="w-4 h-4" />
              {user()?.isOnline ? 'Online — Go Offline' : 'Offline — Go Online'}
            </Button>
            <A href="/rider/deliveries">
              <Button>Open Delivery Queue ({openRequests().length})</Button>
            </A>
          </div>
        </section>

        {/* KPI Cards */}
        <section class="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            delay={0}
            label="Today's Deliveries"
            value={metrics().todayDeliveries}
            icon={<Bike class="w-4 h-4" />}
          />
          <StatCard
            delay={45}
            label="Pending / Active"
            value={metrics().pendingCount}
            icon={<Clock class="w-4 h-4" />}
          />
          <StatCard
            delay={90}
            label="Completed"
            value={metrics().completedCount}
            icon={<CheckCircle2 class="w-4 h-4" />}
          />
          <StatCard
            delay={135}
            label="Today's Earnings"
            value={formatCurrency(metrics().todayEarnings)}
            icon={<IndianRupee class="w-4 h-4" />}
          />
          <StatCard delay={180} label="Weekly Earnings" value={formatCurrency(metrics().weeklyEarnings)} />
          <StatCard delay={225} label="Monthly Earnings" value={formatCurrency(metrics().monthlyEarnings)} />
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div class="lg:col-span-7">
            <BarChart
              title="Daily Delivery Payouts"
              subtitle="Per-delivery earnings across the past 7 days"
              summaryValue={formatCurrency(metrics().weeklyEarnings)}
              data={chartData}
            />
          </div>

          {/* Active Assignment Card */}
          <section
            class="item-card-reveal lg:col-span-5 bg-white border border-[#DDE6F2] rounded-xl p-5 space-y-4 shadow-xs hover:shadow-md transition-shadow duration-300"
            style={{ '--card-delay': '140ms' }}
          >
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-display text-base font-bold text-[#0D1B3E]">Current Active Delivery</h3>
              <Show when={activeOrder()}>
                <span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0066FF]">
                  <span class="w-2 h-2 rounded-full bg-[#0066FF] radar-beacon text-[#0066FF]" />
                  <span>Live</span>
                </span>
              </Show>
            </div>
            <Show
              when={activeOrder()}
              fallback={
                <div class="py-8 text-center space-y-3">
                  <p class="text-sm text-[#5A6C8A]">
                    No active delivery in progress right now.
                  </p>
                  <A href="/rider/deliveries">
                    <Button size="sm">View Available Requests</Button>
                  </A>
                </div>
              }
            >
              {(order) => (
                <div class="space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs font-semibold text-[#1D4ED8]">{order().id}</span>
                    <span class="font-bold text-[#15803D] tabular-nums">
                      Payout: {formatCurrency(order().riderEarnings)}
                    </span>
                  </div>
                  <div class="p-3.5 rounded-lg bg-[#F4F7FC] border border-[#DDE6F2] space-y-2 text-xs">
                    <div>
                      <span class="text-[#5A6C8A] block">Pickup From</span>
                      <span class="font-semibold text-[#0D1B3E]">
                        {order().storeName} — {order().storeAddress}
                      </span>
                    </div>
                    <div class="pt-2 border-t border-[#DDE6F2]">
                      <span class="text-[#5A6C8A] block">Deliver To</span>
                      <span class="font-semibold text-[#0D1B3E]">
                        {order().customerName} — {order().deliveryAddress}
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-[#4B5C78] tabular-nums">
                    Distance: {order().distanceKm} km · Est. {order().etaMins} mins
                  </p>
                  <A href="/rider/deliveries" class="block">
                    <Button class="w-full">Open Pickup & Delivery Verification</Button>
                  </A>
                </div>
              )}
            </Show>
          </section>
        </div>
      </div>
    </RiderLayout>
  );
}
