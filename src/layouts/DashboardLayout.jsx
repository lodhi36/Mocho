import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import { A, useLocation, useNavigate } from '@solidjs/router';
import {
  Bell,
  LogOut,
  Menu,
  ShoppingBag,
  X,
  CheckCheck,
  Store,
  Truck,
  User,
} from 'lucide-solid';
import { ROLE_HOME_ROUTES, ROLE_LABELS, ROLES } from '../constants/config.js';
import { currentUser, loginAsUser, logout } from '../stores/authStore.js';
import { appMode, platformActions, platformState } from '../stores/platformStore.js';
import { formatDateTime } from '../utils/formatters.js';
import { showToast } from '../stores/toastStore.js';
import { Button } from '../components/ui/Button.jsx';

export function DashboardLayout(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const [notifOpen, setNotifOpen] = createSignal(false);

  const user = () => currentUser();
  const isCustomer = () => user()?.role === ROLES.CUSTOMER;

  const [cartBounce, setCartBounce] = createSignal(false);

  const cartCount = createMemo(() =>
    platformState.cart.reduce((sum, item) => sum + (item.qty || 0), 0)
  );

  let prevCartCount = 0;
  createEffect(() => {
    const count = cartCount();
    if (count !== prevCartCount) {
      prevCartCount = count;
      if (count > 0) {
        setCartBounce(true);
        window.setTimeout(() => setCartBounce(false), 400);
      }
    }
  });

  const userNotifications = createMemo(() => {
    const u = user();
    if (!u) return [];
    return platformState.notifications.filter(
      (n) => n.targetRole === u.role && (!n.userId || n.userId === u.id)
    );
  });

  const unreadCount = createMemo(
    () => userNotifications().filter((n) => !n.read).length
  );

  const isActive = (href, exact) => {
    if (exact) return location.pathname === href;
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully.', 'info');
    navigate('/login', { replace: true });
  };

  const handleDemoSwitch = (demoId) => {
    try {
      const switched = loginAsUser(demoId);
      setDrawerOpen(false);
      showToast(`Switched to ${switched.name} (${ROLE_LABELS[switched.role]}).`, 'info');
      navigate(ROLE_HOME_ROUTES[switched.role], { replace: true });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const SidebarContent = () => (
    <div class="flex flex-col h-full bg-white">
      <div class="px-5 h-16 flex items-center justify-between border-b border-[#DDE6F2]">
        <A
          href={ROLE_HOME_ROUTES[user()?.role] || '/'}
          class="font-display text-lg font-extrabold tracking-tight text-[#0D1B3E] whitespace-nowrap shrink-0"
        >
          Ride <span class="text-[#0066FF]">Hub</span>
        </A>
        <button
          type="button"
          class="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#4B5C78] hover:bg-[#EBF1FA]"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="px-5 py-4 border-b border-[#EBF1FA]">
        <p class="text-sm font-semibold text-[#0D1B3E] truncate">{user()?.name}</p>
        <p class="text-xs text-[#5A6C8A] truncate mt-0.5">
          {ROLE_LABELS[user()?.role]} · {appMode() === 'demo' ? 'Demo Mode' : 'Live API'}
        </p>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Sidebar Navigation">
        <For each={props.navItems || []}>
          {(item) => {
            const active = () => isActive(item.href, item.exact);
            return (
              <A
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                class={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.98] ${
                  active()
                    ? 'bg-[#EBF1FA] text-[#0066FF] font-semibold shadow-2xs'
                    : 'text-[#334669] hover:bg-[#F4F7FC] hover:text-[#0D1B3E] hover:translate-x-0.5'
                }`}
              >
                <Show when={active()}>
                  <span
                    aria-hidden="true"
                    class="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#0066FF]"
                  />
                </Show>
                <span
                  class={`shrink-0 transition-transform duration-200 ${
                    active() ? 'tab-icon-pop' : 'group-hover:scale-110'
                  }`}
                >
                  {item.icon()}
                </span>
                <span class="truncate">{item.label}</span>
              </A>
            );
          }}
        </For>
      </nav>

      <Show when={appMode() === 'demo'}>
        <div class="px-4 py-3 border-t border-[#EBF1FA] bg-[#F8FAFD]">
          <p class="text-[11px] font-semibold text-[#5A6C8A] mb-2">
            Switch Role (Demo Sync)
          </p>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoSwitch('cust-1')}
              class={`px-2 py-1.5 text-xs font-medium rounded-md border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                user()?.role === ROLES.CUSTOMER
                  ? 'bg-[#0066FF] text-white border-[#0066FF]'
                  : 'bg-white text-[#334669] border-[#DDE6F2] hover:bg-[#EBF1FA]'
              }`}
            >
              <User class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">User</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSwitch('sup-1')}
              class={`px-2 py-1.5 text-xs font-medium rounded-md border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                user()?.role === ROLES.SUPPLIER
                  ? 'bg-[#0066FF] text-white border-[#0066FF]'
                  : 'bg-white text-[#334669] border-[#DDE6F2] hover:bg-[#EBF1FA]'
              }`}
            >
              <Store class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">Store</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSwitch('rider-1')}
              class={`px-2 py-1.5 text-xs font-medium rounded-md border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                user()?.role === ROLES.RIDER
                  ? 'bg-[#0066FF] text-white border-[#0066FF]'
                  : 'bg-white text-[#334669] border-[#DDE6F2] hover:bg-[#EBF1FA]'
              }`}
            >
              <Truck class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">Rider</span>
            </button>
          </div>
        </div>
      </Show>

      <div class="p-3 border-t border-[#DDE6F2]">
        <button
          type="button"
          onClick={handleLogout}
          class="w-full flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 text-sm font-medium text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
        >
          <LogOut class="w-4 h-4" />
          <span>Sign Out / Roles</span>
        </button>
      </div>
    </div>
  );

  return (
    <div class="min-h-screen bg-[#F4F7FC] flex">
      {/* Desktop Sidebar */}
      <aside class="hidden lg:block w-64 shrink-0 border-r border-[#DDE6F2] sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <Show when={drawerOpen()}>
        <div
          class="modal-backdrop-enter fixed inset-0 z-50 lg:hidden bg-[#0D1B3E]/45 backdrop-blur-[2px] flex"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div class="drawer-slide-left w-72 max-w-[84vw] h-full shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      </Show>

      {/* Main Column */}
      <div class="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Default Contextual Top Bar (can be hidden when a page provides its own custom header) */}
        <Show when={!props.hideTopBar}>
          <header class="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 backdrop-blur border-b border-[#DDE6F2] px-4 sm:px-6 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                class="lg:hidden w-10 h-10 -ml-1 inline-flex items-center justify-center rounded-lg text-[#0D1B3E] hover:bg-[#EBF1FA] shrink-0 cursor-pointer"
              >
                <Menu class="w-5 h-5" />
              </button>
              <div class="min-w-0">
                <h1 class="text-sm sm:text-base font-bold text-[#0D1B3E] truncate">
                  {props.title || ROLE_LABELS[user()?.role]}
                </h1>
              </div>
            </div>

            <div class="flex items-center gap-2 sm:gap-3 shrink-0">
              <Show when={isCustomer()}>
                <A
                  href="/customer/cart"
                  class={`relative inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#EBF1FA] text-[#0066FF] hover:bg-[#DCE7F7] text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    cartBounce() ? 'cart-pop-bounce' : ''
                  }`}
                >
                  <ShoppingBag class="w-4 h-4" />
                  <span class="hidden sm:inline">Cart</span>
                  <span class="tabular-nums font-mono text-xs">({cartCount()})</span>
                </A>
              </Show>

              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                class="relative w-10 h-10 inline-flex items-center justify-center rounded-lg border border-[#DDE6F2] bg-white text-[#334669] hover:bg-[#F4F7FC] active:scale-95 transition-transform cursor-pointer"
              >
                <Bell class="w-4 h-4" />
                <Show when={unreadCount() > 0}>
                  <span class="radar-beacon absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0066FF] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount()}
                  </span>
                </Show>
              </button>
            </div>
          </header>
        </Show>

        {/* Notifications Slide-Over */}
        <Show when={notifOpen() || props.notificationsOpen?.()}>
          <div
            class="modal-backdrop-enter fixed inset-0 z-50 bg-[#0D1B3E]/35 backdrop-blur-[2px] flex justify-end"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setNotifOpen(false);
                props.onCloseNotifications?.();
              }
            }}
          >
            <div class="drawer-slide-right w-full max-w-md bg-white h-full border-l border-[#DDE6F2] flex flex-col shadow-2xl">
              <div class="px-5 py-4 border-b border-[#DDE6F2] flex items-center justify-between gap-2">
                <h2 class="text-base font-bold text-[#0D1B3E]">Notifications</h2>
                <div class="flex items-center gap-2">
                  <Show when={unreadCount() > 0}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        platformActions.markAllNotificationsRead(user().role, user().id);
                      }}
                    >
                      <CheckCheck class="w-3.5 h-3.5" />
                      Mark all read
                    </Button>
                  </Show>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      props.onCloseNotifications?.();
                    }}
                    class="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#4B5C78] hover:bg-[#EBF1FA] cursor-pointer"
                    aria-label="Close notifications"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto divide-y divide-[#EBF1FA]">
                <Show
                  when={userNotifications().length > 0}
                  fallback={
                    <div class="p-8 text-center text-sm text-[#5A6C8A]">
                      No notifications yet.
                    </div>
                  }
                >
                  <For each={userNotifications()}>
                    {(notif) => (
                      <div
                        class={`p-4 transition-colors cursor-pointer ${
                          notif.read ? 'bg-white' : 'bg-[#F4F7FC]'
                        }`}
                        onClick={() => platformActions.markNotificationRead(notif.id)}
                      >
                        <div class="flex items-start justify-between gap-2">
                          <p class="text-sm font-semibold text-[#0D1B3E]">{notif.title}</p>
                          <Show when={!notif.read}>
                            <span class="text-[11px] font-semibold text-[#0066FF] shrink-0">
                              New
                            </span>
                          </Show>
                        </div>
                        <p class="text-xs text-[#4B5C78] mt-1 leading-relaxed">{notif.body}</p>
                        <p class="text-[11px] text-[#7B8CA8] mt-1.5 font-mono tabular-nums">
                          {formatDateTime(notif.createdAt)}
                        </p>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </div>
        </Show>

        {/* Animated Page Viewport (triggers smooth spring reveal on every screen) */}
        <main
          class={`flex-1 w-full mx-auto pb-24 lg:pb-10 ${
            props.fullBleed
              ? 'max-w-[1440px]'
              : 'px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px]'
          }`}
        >
          <Show when={location.pathname} keyed>
            {() => <div class="page-enter">{props.children}</div>}
          </Show>
        </main>

        {/* Mobile Bottom Navigation with Active Top Pill Indicator & Spring Icon Pop */}
        <nav
          class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#DDE6F2] safe-bottom shadow-[0_-4px_18px_rgba(13,27,62,0.06)]"
          aria-label="Mobile Navigation"
        >
          {(() => {
            const mobileItems = () => (props.navItems || []).slice(0, 5);
            const gridColsClass = () => {
              const len = mobileItems().length;
              if (len >= 5) return 'grid-cols-5';
              if (len === 3) return 'grid-cols-3';
              return 'grid-cols-4';
            };
            return (
              <div class={`grid ${gridColsClass()}`}>
                <For each={mobileItems()}>
                  {(item) => {
                    const active = () => isActive(item.href, item.exact);
                    const showCartBadge = () =>
                      isCustomer() && item.href === '/customer/cart' && cartCount() > 0;
                    return (
                      <A
                        href={item.href}
                        class={`relative min-h-[56px] flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] sm:text-[11px] font-medium transition-all duration-200 active:scale-90 ${
                          active() ? 'text-[#0066FF] font-bold' : 'text-[#64748B]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          class={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-[#0066FF] transition-transform duration-300 ${
                            active() ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                          }`}
                        />
                        <span
                          class={`relative transition-transform duration-200 ${
                            active() ? 'tab-icon-pop -translate-y-0.5' : ''
                          }`}
                        >
                          {item.icon()}
                          <Show when={showCartBadge()}>
                            <span
                              class={`absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#0066FF] text-white text-[9px] font-bold flex items-center justify-center tabular-nums ${
                                cartBounce() ? 'cart-pop-bounce' : ''
                              }`}
                            >
                              {cartCount()}
                            </span>
                          </Show>
                        </span>
                        <span class="truncate max-w-full leading-tight">
                          {item.shortLabel || item.label}
                        </span>
                      </A>
                    );
                  }}
                </For>
              </div>
            );
          })()}
        </nav>
      </div>
    </div>
  );
}
