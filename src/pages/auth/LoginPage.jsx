import { For, Show, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  Bike,
  ChevronRight,
  Package,
  ShoppingCart,
  Store,
  Utensils,
  Wallet,
} from 'lucide-solid';
import { ASSET_IMAGES, ROLE_HOME_ROUTES, ROLES } from '../../constants/config.js';
import { loginAsUser } from '../../stores/authStore.js';
import { showToast } from '../../stores/toastStore.js';
import { ImageWithFallback } from '../../components/ui/DataDisplay.jsx';
import { IndiaFlagIcon, RoleAvatarArt } from '../../components/ui/FestiveVisuals.jsx';
import { AnimatedRoleOnboarding } from '../../components/ui/AnimatedRoleOnboarding.jsx';

const ROLE_CARDS = [
  {
    role: ROLES.CUSTOMER,
    demoUserId: 'cust-1',
    kicker: 'BUYER & USER',
    title: 'Customer',
    avatarKind: 'customer',
    formHeading: 'Customer Welcome',
    formBannerText:
      'Enter your details to browse nearby stores, order fast delivery & track live.',
    highlights: [
      { icon: () => <Utensils class="w-3.5 h-3.5 text-[#64748B]" />, text: 'Food' },
      { icon: () => <ShoppingCart class="w-3.5 h-3.5 text-[#0066FF]" />, text: 'Groceries' },
      { icon: () => <Bike class="w-3.5 h-3.5 text-[#DC2626]" />, text: 'Rides' },
    ],
    subtitle: 'Order · Book · Fast Delivery · Live Tracking',
  },
  {
    role: ROLES.RIDER,
    demoUserId: 'rider-1',
    kicker: 'RIDER & FLEET',
    title: 'Rider / Delivery Partner',
    avatarKind: 'rider',
    formHeading: 'Rider Partner Welcome',
    formBannerText:
      'Set your rider profile & vehicle to go online, accept delivery tasks & earn daily.',
    highlights: [
      { icon: () => <Bike class="w-3.5 h-3.5 text-[#D97706]" />, text: 'Bike & EV' },
      { icon: () => <Package class="w-3.5 h-3.5 text-[#B45309]" />, text: 'Parcel' },
      { icon: () => <Wallet class="w-3.5 h-3.5 text-[#15803D]" />, text: 'Earn Daily' },
    ],
    subtitle: 'Deliver customer orders & earn per delivery',
  },
  {
    role: ROLES.SUPPLIER,
    demoUserId: 'sup-1',
    kicker: 'MERCHANT & STORE',
    title: 'Restaurant / Supplier / Store',
    avatarKind: 'supplier',
    formHeading: 'Store Partner Welcome',
    formBannerText:
      'Enter your store details to manage products, showcase items & receive live orders.',
    highlights: [
      { icon: () => <Utensils class="w-3.5 h-3.5 text-[#64748B]" />, text: 'Food' },
      { icon: () => <ShoppingCart class="w-3.5 h-3.5 text-[#16A34A]" />, text: 'Sabji & Grocery' },
      { icon: () => <Store class="w-3.5 h-3.5 text-[#0066FF]" />, text: 'Stores' },
    ],
    subtitle: 'List Your Store · Manage Orders · Grow Business',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [selectedRoleCard, setSelectedRoleCard] = createSignal(null);

  const handleEnterRoleDashboard = (card) => {
    try {
      const user = loginAsUser(card.demoUserId);
      setSelectedRoleCard(null);
      showToast(`Welcome to Ride Hub, ${user.name}!`, 'success');
      navigate(ROLE_HOME_ROUTES[user.role], { replace: true });
    } catch (err) {
      showToast(err.message || 'Could not open dashboard.', 'error');
    }
  };

  return (
    <Show
      when={!selectedRoleCard()}
      fallback={
        <AnimatedRoleOnboarding
          roleCard={selectedRoleCard()}
          onBack={() => setSelectedRoleCard(null)}
          onContinue={handleEnterRoleDashboard}
        />
      }
    >
      <div class="min-h-screen bg-[#EDF4FF] flex flex-col">
        {/* Royal Blue Curved Hero Header */}
        <section class="bg-gradient-to-b from-[#0058F5] to-[#0066FF] text-white rounded-b-[32px] sm:rounded-b-[42px] shadow-md">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-7 sm:pt-7 sm:pb-9 flex flex-col items-center">
            {/* Rounded Hero Banner Card */}
            <div class="w-full max-w-2xl h-44 sm:h-56 md:h-64 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 relative bg-[#0B1E4A]">
              <ImageWithFallback
                src={ASSET_IMAGES.hero}
                alt="Ride Hub express multi-vendor delivery and local commerce"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#061844]/75 via-[#061844]/15 to-transparent flex items-end justify-between p-4 sm:p-5">
                <div>
                  <p class="text-xs font-semibold text-[#67E8F9] tracking-wide">
                    FAST LOCAL DELIVERY NETWORK
                  </p>
                  <p class="text-sm sm:text-base font-bold text-white mt-0.5">
                    Fashion · Vegetables · Food · Rides &amp; Parcels
                  </p>
                </div>
                <div class="hidden sm:flex items-center gap-1.5 bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-semibold text-white">
                  <Bike class="w-4 h-4 text-[#67E8F9]" />
                  <span>20-min Dispatch</span>
                </div>
              </div>
            </div>

            {/* Centered Title */}
            <h1 class="mt-5 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-center leading-tight">
              Welcome to <span class="text-[#22E4FF]">Ride Hub</span>
            </h1>
            <p class="mt-1.5 text-sm sm:text-base font-medium text-white/90 text-center">
              Select your role to continue
            </p>
          </div>
        </section>

        {/* 3 Role Cards — Each opens the Ride Hub Visme Form */}
        <main class="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between gap-6">
          <div class="space-y-4">
            <For each={ROLE_CARDS}>
              {(card) => (
                <button
                  type="button"
                  onClick={() => setSelectedRoleCard(card)}
                  class="w-full bg-white border border-[#DCE8FA] hover:border-[#0066FF]/60 rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(0,102,255,0.06)] hover:shadow-[0_8px_24px_rgba(0,102,255,0.12)] transition-all duration-150 flex items-center gap-3.5 sm:gap-5 text-left cursor-pointer group"
                >
                  <RoleAvatarArt kind={card.avatarKind} />

                  <div class="flex-1 min-w-0">
                    <span class="inline-block px-2.5 py-0.5 rounded-md bg-[#EBF3FF] text-[#0058F5] text-[10px] sm:text-[11px] font-extrabold tracking-wider">
                      {card.kicker}
                    </span>
                    <h2 class="mt-1 font-display text-lg sm:text-xl font-extrabold text-[#0D1B3E] leading-snug group-hover:text-[#0066FF] transition-colors">
                      {card.title}
                    </h2>

                    <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#334669]">
                      <For each={card.highlights}>
                        {(h, idx) => (
                          <>
                            <span class="inline-flex items-center gap-1">
                              {h.icon()}
                              <span>{h.text}</span>
                            </span>
                            <Show when={idx() < card.highlights.length - 1}>
                              <span class="text-[#CBD5E1]">|</span>
                            </Show>
                          </>
                        )}
                      </For>
                    </div>

                    <p class="mt-1 text-xs text-[#64748B] truncate">{card.subtitle}</p>
                  </div>

                  <div class="w-10 h-10 rounded-full bg-[#0066FF] group-hover:bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:translate-x-0.5">
                    <ChevronRight class="w-5 h-5" />
                  </div>
                </button>
              )}
            </For>
          </div>

          {/* Footer: Proudly Made in India */}
          <footer class="pt-2 pb-4 flex flex-col items-center">
            <div class="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#8CB8FF]/65 text-white shadow-[0_6px_18px_rgba(0,102,255,0.16)]">
              <IndiaFlagIcon class="w-5 h-3.5 rounded-[2px]" />
              <span class="text-xs font-extrabold tracking-widest text-white">
                PROUDLY MADE IN INDIA
              </span>
            </div>
          </footer>
        </main>
      </div>
    </Show>
  );
}
