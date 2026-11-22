import { Show } from 'solid-js';
import {
  Crosshair,
  LayoutDashboard,
  MapPin,
  Navigation2,
  ShieldCheck,
  Wallet,
} from 'lucide-solid';
import { DashboardLayout } from '../../layouts/DashboardLayout.jsx';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { showToast } from '../../stores/toastStore.js';

export const RIDER_NAV = [
  {
    href: '/rider',
    label: 'Dashboard',
    shortLabel: 'Home',
    exact: true,
    icon: () => <LayoutDashboard class="w-4 h-4" />,
  },
  {
    href: '/rider/deliveries',
    label: 'Delivery Tasks',
    shortLabel: 'Tasks',
    exact: false,
    icon: () => <Navigation2 class="w-4 h-4" />,
  },
  {
    href: '/rider/earnings',
    label: 'Earnings & Payouts',
    shortLabel: 'Earnings',
    exact: false,
    icon: () => <Wallet class="w-4 h-4" />,
  },
  {
    href: '/rider/profile',
    label: 'Profile, KYC & Support',
    shortLabel: 'Profile',
    exact: false,
    icon: () => <ShieldCheck class="w-4 h-4" />,
  },
];

export function RiderLayout(props) {
  const geo = useGeolocation();

  const handleRefreshGps = async () => {
    const loc = await geo.detectLocation();
    if (loc) {
      showToast(`Rider live GPS updated: ${loc.shortAddress || loc.fullAddress}`, 'success');
    } else if (geo.error()) {
      showToast(geo.error(), 'warning');
    }
  };

  return (
    <DashboardLayout navItems={RIDER_NAV} title={props.title || 'Delivery Partner Portal'}>
      {/* Live Real Device GPS Location Bar at Top of Every Rider Screen */}
      <div class="mb-5 bg-white border border-[#DCE8FA] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-[0_2px_10px_rgba(0,102,255,0.05)]">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
            <MapPin class="w-4 h-4 text-[#DC2626] fill-[#DC2626]/20" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-display text-xs sm:text-sm font-extrabold text-[#0D1B3E] uppercase tracking-wide truncate">
                <Show
                  when={geo.liveLocation()}
                  fallback={geo.loading() ? 'DETECTING LIVE GPS...' : 'ENABLE DEVICE GPS'}
                >
                  {(loc) => loc().area || loc().shortAddress || 'LIVE AREA'}
                </Show>
              </span>
              <Show when={geo.liveLocation()}>
                <span class="text-[11px] font-mono text-[#64748B] hidden sm:inline tabular-nums">
                  ({geo.liveLocation().lat}, {geo.liveLocation().lng})
                </span>
              </Show>
            </div>
            <p class="text-xs text-[#475569] truncate">
              <Show
                when={geo.liveLocation()}
                fallback={
                  geo.error() ||
                  (geo.loading()
                    ? 'Fetching your real device location...'
                    : 'Tap Refresh GPS to fetch live rider coordinates')
                }
              >
                {(loc) => loc().fullAddress || loc().shortAddress}
              </Show>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefreshGps}
          class="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0066FF] text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
        >
          <Crosshair class={`w-3.5 h-3.5 ${geo.loading() ? 'animate-spin' : ''}`} />
          <span class="hidden sm:inline">Live GPS</span>
        </button>
      </div>

      {props.children}
    </DashboardLayout>
  );
}
