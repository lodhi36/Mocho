import { For, Show, createMemo, createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FileText,
  Globe,
  Heart,
  HelpCircle,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Upload,
  User,
  Zap,
} from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser, logout } from '../../stores/authStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { showToast } from '../../stores/toastStore.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { sanitizeText, validateAddressForm } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { TextAreaField, TextField } from '../../components/ui/FormControls.jsx';
import { EmptyState, ImageWithFallback, StatusText } from '../../components/ui/DataDisplay.jsx';

export function CustomerAccountPage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const user = () => currentUser();

  const [darkMode, setDarkMode] = createSignal(false);
  const [language, setLanguage] = createSignal('English');
  const [activeModal, setActiveModal] = createSignal('');

  // Profile Edit state
  const [name, setName] = createSignal(user()?.name || '');
  const [phone, setPhone] = createSignal(user()?.phone || '');
  const [avatarPreview, setAvatarPreview] = createSignal(user()?.avatar || '');

  // Address form
  const [addrForm, setAddrForm] = createSignal({
    label: '',
    line1: '',
    city: 'Bhopal',
    postalCode: '462038',
  });
  const [addrErrors, setAddrErrors] = createSignal({});

  // Support ticket form
  const [subject, setSubject] = createSignal('');
  const [message, setMessage] = createSignal('');

  const myOrdersCount = createMemo(
    () => platformState.orders.filter((o) => o.customerId === user()?.id).length
  );

  const cartItemsCount = createMemo(() =>
    platformState.cart.reduce((sum, item) => sum + (item.qty || 0), 0)
  );

  const defaultAddress = createMemo(
    () =>
      (user()?.addresses || []).find((a) => a.isDefault) ||
      (user()?.addresses || [])[0] ||
      null
  );

  const wishlistProducts = createMemo(() =>
    platformState.products.filter((p) => platformState.wishlist.includes(p.id))
  );

  const myTickets = createMemo(() =>
    platformState.tickets.filter((t) => t.userId === user()?.id)
  );

  const handlePhotoUpload = (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setAvatarPreview(dataUrl);
      platformActions.updateUserProfile(user().id, { avatar: dataUrl });
      showToast('Profile photo updated.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    platformActions.updateUserProfile(user().id, {
      name: sanitizeText(name(), 80),
      phone: sanitizeText(phone(), 25),
    });
    setActiveModal('');
    showToast('Profile information updated.', 'success');
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    const errs = validateAddressForm(addrForm());
    setAddrErrors(errs);
    if (Object.keys(errs).length > 0) return;
    platformActions.addCustomerAddress(user().id, {
      label: sanitizeText(addrForm().label, 40),
      line1: sanitizeText(addrForm().line1, 200),
      city: sanitizeText(addrForm().city, 60),
      postalCode: sanitizeText(addrForm().postalCode, 12),
      lat: geo.coords()?.lat || 23.34459,
      lng: geo.coords()?.lng || 77.40702,
      isDefault: true,
    });
    setAddrForm({ label: '', line1: '', city: 'Bhopal', postalCode: '462038' });
    showToast('Saved delivery address added.', 'success');
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!sanitizeText(subject(), 120) || !sanitizeText(message(), 500)) {
      showToast('Enter both subject and message.', 'error');
      return;
    }
    platformActions.createSupportTicket({
      userId: user().id,
      userName: user().name,
      userRole: user().role,
      subject: sanitizeText(subject(), 120),
      message: sanitizeText(message(), 500),
    });
    setSubject('');
    setMessage('');
    showToast('Support ticket submitted to Ride Hub Helpdesk.', 'success');
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out of Ride Hub.', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <CustomerLayout title="My Profile" hideTopBar={true} fullBleed={true}>
      <div class="min-h-screen bg-[#F4F7FC] pb-10">
        {/* Royal Blue Curved Header matching Ride Hub Profile Screen */}
        <div class="bg-gradient-to-b from-[#0066FF] to-[#0055E6] rounded-b-[32px] px-4 sm:px-6 pt-4 pb-8 shadow-[0_8px_24px_rgba(0,102,255,0.18)]">
          <div class="max-w-2xl mx-auto">
            <div class="flex items-center justify-between gap-2 mb-5">
              <button
                type="button"
                onClick={() => navigate('/customer')}
                class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                <ChevronLeft class="w-4 h-4" />
                <span>Back</span>
              </button>
              <h1 class="font-display text-lg font-extrabold text-white">My Profile</h1>
              <div class="w-16" />
            </div>

            {/* White Elevated Profile Identity Card */}
            <div
              style={{ '--item-delay': '0ms' }}
              class="item-card-reveal relative overflow-hidden bg-white rounded-3xl p-6 shadow-md text-center"
            >
              <div aria-hidden="true" class="banner-glow-sweep opacity-50" />
              <div class="relative inline-block">
                <label class="block w-20 h-20 rounded-full bg-[#EFF6FF] border-2 border-[#BFDBFE] overflow-hidden cursor-pointer mx-auto flex items-center justify-center">
                  <Show
                    when={avatarPreview()}
                    fallback={<User class="w-10 h-10 text-[#0066FF]" />}
                  >
                    <img
                      src={avatarPreview()}
                      alt={user()?.name}
                      class="w-full h-full object-cover"
                    />
                  </Show>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
                <span
                  title="Tap avatar to change photo"
                  class="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-[#0066FF] border-2 border-white flex items-center justify-center text-white"
                >
                  <Upload class="w-3 h-3" />
                </span>
              </div>

              <h2 class="mt-3 font-display text-xl font-extrabold text-[#0D1B3E]">
                {user()?.name}
              </h2>

              <div class="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-[11px] font-extrabold tracking-wide">
                  <ShieldCheck class="w-3.5 h-3.5" />
                  VERIFIED CUSTOMER
                </span>
                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#0066FF] text-[11px] font-extrabold tracking-wide">
                  <Zap class="w-3.5 h-3.5" />
                  RIDE HUB MEMBER
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Sections */}
        <div class="max-w-2xl mx-auto px-4 sm:px-6 mt-4 space-y-4">
          {/* 2-Column Stats Card: Orders Placed | Items in Cart */}
          <div
            style={{ '--item-delay': '60ms' }}
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] shadow-[0_4px_16px_rgba(13,27,62,0.04)] grid grid-cols-2 divide-x divide-[#EBF1FA] py-4"
          >
            <A href="/customer/orders" class="text-center hover:scale-105 transition-transform">
              <p class="font-display text-2xl font-extrabold text-[#0066FF] tabular-nums">
                {myOrdersCount()}
              </p>
              <p class="text-xs font-medium text-[#64748B] mt-0.5">Orders Placed</p>
            </A>
            <A href="/customer/cart" class="text-center hover:scale-105 transition-transform">
              <p class="font-display text-2xl font-extrabold text-[#0066FF] tabular-nums">
                {cartItemsCount()}
              </p>
              <p class="text-xs font-medium text-[#64748B] mt-0.5">Items in Cart</p>
            </A>
          </div>

          {/* Personal Information Card */}
          <section
            style={{ '--item-delay': '110ms' }}
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] shadow-[0_4px_16px_rgba(13,27,62,0.04)] p-4 sm:p-5 space-y-4"
          >
            <h3 class="font-display text-sm font-extrabold text-[#0D1B3E]">
              Personal Information
            </h3>

            <div class="divide-y divide-[#F1F5F9]">
              {/* Mobile Number */}
              <div class="py-3 first:pt-0 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                    <Phone class="w-4 h-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] font-medium text-[#64748B]">Mobile Number</p>
                    <p class="text-sm font-bold text-[#0D1B3E] truncate">
                      {user()?.phone || '+91 98201 44510'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setName(user()?.name || '');
                    setPhone(user()?.phone || '');
                    setActiveModal('editProfile');
                  }}
                  class="px-3.5 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-bold text-[#0066FF] hover:bg-[#DBEAFE] cursor-pointer shrink-0"
                >
                  Edit
                </button>
              </div>

              {/* Email Address */}
              <div class="py-3 flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                  <Mail class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-[11px] font-medium text-[#64748B]">Email Address</p>
                  <p class="text-sm font-bold text-[#0D1B3E] truncate">{user()?.email}</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div class="py-3 last:pb-0 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                    <Crosshair class="w-4 h-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] font-medium text-[#64748B]">Delivery Address</p>
                    <p class="text-sm font-bold text-[#0D1B3E] leading-snug">
                      {geo.liveLocation()?.fullAddress ||
                        defaultAddress()?.line1 ||
                        'Shyampur, Islamnagar, Huzur Tahsil'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/customer/location')}
                  class="px-3.5 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-bold text-[#0066FF] hover:bg-[#DBEAFE] cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          </section>

          {/* Quick Shortcuts & Settings Card */}
          <section
            style={{ '--item-delay': '160ms' }}
            class="item-card-reveal bg-white rounded-2xl border border-[#E2EBF8] shadow-[0_4px_16px_rgba(13,27,62,0.04)] p-4 sm:p-5 space-y-2"
          >
            <h3 class="font-display text-sm font-extrabold text-[#0D1B3E] mb-2">
              Quick Shortcuts & Settings
            </h3>

            <div class="divide-y divide-[#F1F5F9]">
              {/* Dark Mode Toggle */}
              <div class="py-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center">
                    <Moon class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-[#0D1B3E]">Dark Mode</p>
                    <p class="text-xs text-[#64748B]">
                      {darkMode() ? 'Dark theme preview active' : 'Light theme enabled'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={darkMode()}
                  onClick={() => {
                    setDarkMode((v) => !v);
                    showToast(
                      darkMode() ? 'Dark mode enabled.' : 'Light mode enabled.',
                      'info'
                    );
                  }}
                  class={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    darkMode() ? 'bg-[#0066FF]' : 'bg-[#CBD5E1]'
                  }`}
                >
                  <span
                    class={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      darkMode() ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* My Orders */}
              <button
                type="button"
                onClick={() => navigate('/customer/orders')}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center">
                    <ReceiptText class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">My Orders</span>
                </div>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </button>

              {/* My Cart */}
              <button
                type="button"
                onClick={() => navigate('/customer/cart')}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center">
                    <ShoppingCart class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">
                    My Cart ({cartItemsCount()})
                  </span>
                </div>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={() => setActiveModal('wishlist')}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                    <Heart class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">
                    Wishlist ({wishlistProducts().length})
                  </span>
                </div>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </button>

              {/* Saved Delivery Addresses */}
              <button
                type="button"
                onClick={() => setActiveModal('addresses')}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center">
                    <Crosshair class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">Saved Delivery Addresses</span>
                </div>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => navigate('/customer/notifications')}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center">
                    <Bell class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">Notifications</span>
                </div>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </button>

              {/* Change Language */}
              <button
                type="button"
                onClick={() => {
                  const next = language() === 'English' ? 'हिन्दी (Hindi)' : 'English';
                  setLanguage(next);
                  showToast(`App language switched to ${next}.`, 'success');
                }}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#0066FF] flex items-center justify-center">
                    <Globe class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">Change Language</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-[#0066FF]">{language()}</span>
                  <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
                </div>
              </button>

              {/* Help & Support */}
              <button
                type="button"
                onClick={() => setActiveModal('support')}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center">
                    <HelpCircle class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">Help & Support</span>
                </div>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </button>

              {/* Terms & Conditions */}
              <button
                type="button"
                onClick={() => setActiveModal('terms')}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center">
                    <FileText class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">Terms & Conditions</span>
                </div>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </button>

              {/* Privacy Policy */}
              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                class="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F8FAFD] rounded-xl px-1 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center">
                    <ShieldCheck class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-bold text-[#0D1B3E]">Privacy Policy</span>
                </div>
                <ChevronRight class="w-4 h-4 text-[#94A3B8]" />
              </button>
            </div>
          </section>

          {/* Soft Red Log Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            style={{ '--item-delay': '210ms' }}
            class="item-card-reveal w-full min-h-[52px] rounded-2xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] font-display text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.98]"
          >
            <LogOut class="w-4 h-4" />
            <span>Log Out</span>
          </button>

          <p class="text-center text-xs font-medium text-[#94A3B8] pt-1">
            Ride Hub Multi Vendor v2.0 • Customer Edition
          </p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={activeModal() === 'editProfile'}
        onClose={() => setActiveModal('')}
        title="Edit Personal Information"
      >
        <form onSubmit={handleSaveProfile} class="space-y-4">
          <TextField
            label="Full Name"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <TextField
            label="Mobile Number"
            value={phone()}
            onInput={(e) => setPhone(e.currentTarget.value)}
          />
          <TextField label="Email Address" value={user()?.email || ''} disabled />
          <div class="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setActiveModal('')}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Saved Delivery Addresses Modal */}
      <Modal
        open={activeModal() === 'addresses'}
        onClose={() => setActiveModal('')}
        title="Saved Delivery Addresses"
        size="lg"
      >
        <div class="space-y-5">
          <div class="space-y-2.5">
            <For each={user()?.addresses || []}>
              {(addr) => (
                <div class="p-3.5 rounded-xl border border-[#DDE6F2] bg-[#F8FAFD] flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <MapPin class="w-4 h-4 text-[#0066FF]" />
                      <span class="text-sm font-bold text-[#0D1B3E]">{addr.label}</span>
                      <Show when={addr.isDefault}>
                        <StatusText label="Default" tone="info" />
                      </Show>
                    </div>
                    <p class="text-xs text-[#475569] mt-1">
                      {addr.line1}
                    </p>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <Show when={!addr.isDefault}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          platformActions.setDefaultAddress(user().id, addr.id);
                          showToast('Default delivery address updated.', 'success');
                        }}
                      >
                        Set Default
                      </Button>
                    </Show>
                    <button
                      type="button"
                      onClick={() => {
                        platformActions.removeCustomerAddress(user().id, addr.id);
                        showToast('Address removed.', 'info');
                      }}
                      class="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>

          <form onSubmit={handleAddAddress} class="pt-4 border-t border-[#EBF1FA] space-y-3">
            <h4 class="text-sm font-bold text-[#0D1B3E]">Add New Address</h4>
            <TextField
              label="Label"
              value={addrForm().label}
              onInput={(e) => setAddrForm((f) => ({ ...f, label: e.currentTarget.value }))}
              placeholder="Home / Work"
              error={addrErrors().label}
            />
            <TextField
              label="Street / Area"
              value={addrForm().line1}
              onInput={(e) => setAddrForm((f) => ({ ...f, line1: e.currentTarget.value }))}
              placeholder="Shyampur, Islamnagar, Huzur Tahsil"
              error={addrErrors().line1}
            />
            <div class="grid grid-cols-2 gap-3">
              <TextField
                label="City"
                value={addrForm().city}
                onInput={(e) => setAddrForm((f) => ({ ...f, city: e.currentTarget.value }))}
                error={addrErrors().city}
              />
              <TextField
                label="Pincode"
                value={addrForm().postalCode}
                onInput={(e) => setAddrForm((f) => ({ ...f, postalCode: e.currentTarget.value }))}
                error={addrErrors().postalCode}
              />
            </div>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => navigate('/customer/location')}>
                Pick on Map
              </Button>
              <Button type="submit">Save Address</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Wishlist Modal */}
      <Modal
        open={activeModal() === 'wishlist'}
        onClose={() => setActiveModal('')}
        title={`Wishlist (${wishlistProducts().length})`}
        size="lg"
      >
        <Show
          when={wishlistProducts().length > 0}
          fallback={
            <EmptyState
              title="Your wishlist is empty"
              description="Tap the heart icon on any product to save it here."
            />
          }
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <For each={wishlistProducts()}>
              {(prod) => (
                <div class="border border-[#DDE6F2] rounded-xl overflow-hidden flex gap-3 p-3 bg-white">
                  <ImageWithFallback
                    src={prod.images?.[0]}
                    alt={prod.name}
                    class="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-[#0D1B3E] truncate">{prod.name}</p>
                    <p class="text-xs font-bold text-[#0066FF] tabular-nums mt-0.5">
                      {formatCurrency(prod.discountPrice > 0 ? prod.discountPrice : prod.price)}
                    </p>
                    <div class="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const v = prod.variations?.[0] || { label: 'Standard', priceDelta: 0 };
                          const price =
                            (prod.discountPrice > 0 ? prod.discountPrice : prod.price) +
                            (v.priceDelta || 0);
                          platformActions.replaceCartWithItem(prod, v.label, price, 1);
                          showToast(`${prod.name} added to cart.`, 'success');
                        }}
                      >
                        <ShoppingBag class="w-3.5 h-3.5" />
                        Add
                      </Button>
                      <button
                        type="button"
                        onClick={() => platformActions.toggleWishlist(prod.id)}
                        class="text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        open={activeModal() === 'support'}
        onClose={() => setActiveModal('')}
        title="Help & Support"
        size="lg"
      >
        <div class="space-y-5">
          <form onSubmit={handleCreateTicket} class="space-y-3">
            <TextField
              label="Subject"
              value={subject()}
              onInput={(e) => setSubject(e.currentTarget.value)}
              placeholder="Order issue, refund query, or address update"
            />
            <TextAreaField
              label="Message"
              rows={3}
              value={message()}
              onInput={(e) => setMessage(e.currentTarget.value)}
              placeholder="Share your Order ID and how we can help..."
            />
            <Button type="submit" class="w-full">
              Submit Support Ticket
            </Button>
          </form>

          <Show when={myTickets().length > 0}>
            <div class="pt-4 border-t border-[#EBF1FA] space-y-2.5">
              <p class="text-xs font-bold text-[#64748B] uppercase">Recent Tickets</p>
              <For each={myTickets()}>
                {(t) => (
                  <div class="p-3 rounded-xl border border-[#DDE6F2] bg-[#F8FAFD] space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-mono font-bold text-[#0D1B3E]">{t.id}</span>
                      <StatusText
                        label={t.status.replace(/_/g, ' ')}
                        tone={t.status === 'resolved' ? 'success' : 'warning'}
                      />
                    </div>
                    <p class="text-sm font-bold text-[#0D1B3E]">{t.subject}</p>
                    <p class="text-xs text-[#475569]">{t.message}</p>
                    <p class="text-[11px] text-[#94A3B8]">{formatDateTime(t.createdAt)}</p>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Modal>

      {/* Terms / Privacy Modal */}
      <Modal
        open={activeModal() === 'terms' || activeModal() === 'privacy'}
        onClose={() => setActiveModal('')}
        title={activeModal() === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
      >
        <div class="space-y-3 text-sm text-[#475569] leading-relaxed">
          <Show
            when={activeModal() === 'terms'}
            fallback={
              <>
                <p>
                  Ride Hub protects your mobile number, delivery addresses, and order history. GPS
                  coordinates are used solely to connect you with nearby local store partners and
                  guide delivery riders to your doorstep.
                </p>
                <p>
                  You can update or remove saved addresses at any time from your Profile or Location
                  Picker screen.
                </p>
              </>
            }
          >
            <p>
              By placing orders on Ride Hub Multi Vendor v2.0, you agree to provide an accurate
              delivery location and verify order handoff using your 4-digit Delivery OTP.
            </p>
            <p>
              Orders can be cancelled before rider pickup. Eligible prepaid refunds are processed
              automatically back to your source payment method.
            </p>
          </Show>
        </div>
      </Modal>
    </CustomerLayout>
  );
}
