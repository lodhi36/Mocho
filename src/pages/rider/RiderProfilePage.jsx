import { For, Show, createMemo, createSignal } from 'solid-js';
import { Star, Upload } from 'lucide-solid';
import { RiderLayout } from './RiderLayout.jsx';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { showToast } from '../../stores/toastStore.js';
import { formatShortDate } from '../../utils/formatters.js';
import { isValidPan, sanitizeText } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { SelectField, TextAreaField, TextField } from '../../components/ui/FormControls.jsx';
import { StatusText } from '../../components/ui/DataDisplay.jsx';

export function RiderProfilePage() {
  const user = () => currentUser();

  const [form, setForm] = createSignal({
    name: user()?.name || '',
    phone: user()?.phone || '',
    address: user()?.address || '',
    vehicleType: user()?.vehicleType || 'Electric Scooter',
    vehicleNumber: user()?.vehicleNumber || '',
    aadhaarNumber: user()?.documents?.aadhaarNumber || '',
    panNumber: user()?.documents?.panNumber || '',
    drivingLicence: user()?.documents?.drivingLicence || '',
    avatar: user()?.avatar || '',
  });

  const [subject, setSubject] = createSignal('');
  const [message, setMessage] = createSignal('');

  const myRatings = createMemo(() =>
    platformState.reviews.filter((r) => r.riderId === user()?.id)
  );

  const myTickets = createMemo(() =>
    platformState.tickets.filter((t) => t.userId === user()?.id)
  );

  const handlePhotoUpload = (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      setForm((f) => ({ ...f, avatar: url }));
      platformActions.updateUserProfile(user().id, { avatar: url });
      showToast('Profile photo updated.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const f = form();
    if (f.panNumber && !isValidPan(f.panNumber)) {
      showToast('Enter a valid PAN number (e.g. ABCDE1234F).', 'error');
      return;
    }
    platformActions.updateUserProfile(user().id, {
      name: sanitizeText(f.name, 80),
      phone: sanitizeText(f.phone, 24),
      address: sanitizeText(f.address, 220),
      vehicleType: f.vehicleType,
      vehicleNumber: sanitizeText(f.vehicleNumber, 25).toUpperCase(),
      documents: {
        ...(user()?.documents || {}),
        aadhaarNumber: sanitizeText(f.aadhaarNumber, 20),
        panNumber: sanitizeText(f.panNumber, 15).toUpperCase(),
        drivingLicence: sanitizeText(f.drivingLicence, 30).toUpperCase(),
      },
    });
    showToast('Rider profile and KYC documents saved.', 'success');
  };

  const handleTicket = (e) => {
    e.preventDefault();
    if (!sanitizeText(subject(), 120) || !sanitizeText(message(), 500)) {
      showToast('Please enter both subject and message.', 'error');
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
    showToast('Rider support ticket submitted.', 'success');
  };

  return (
    <RiderLayout title="Rider Profile, Documents & Support">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Profile & KYC Form */}
        <section
          class="item-card-reveal lg:col-span-7 bg-white border border-[#DDE6F2] rounded-xl p-6 space-y-5 shadow-xs hover:shadow-md transition-shadow duration-300"
          style={{ '--card-delay': '20ms' }}
        >
          <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EBF1FA]">
            <div class="flex items-center gap-3.5">
              <div class="w-14 h-14 rounded-full bg-[#EBF1FA] border border-[#CBD8EC] overflow-hidden flex items-center justify-center font-display font-bold text-[#1D4ED8]">
                <Show when={form().avatar} fallback={(user()?.name || 'R').slice(0, 2).toUpperCase()}>
                  <img src={form().avatar} alt={user()?.name} class="w-full h-full object-cover" />
                </Show>
              </div>
              <div>
                <h2 class="font-display text-lg font-bold text-[#0D1B3E]">{user()?.name}</h2>
                <label class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer">
                  <Upload class="w-3.5 h-3.5" />
                  <span>Upload Profile Photo</span>
                  <input type="file" accept="image/*" class="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            <StatusText
              label={
                user()?.documents?.verificationStatus === 'verified'
                  ? 'Documents Verified'
                  : 'Verification Pending'
              }
              tone={user()?.documents?.verificationStatus === 'verified' ? 'success' : 'warning'}
            />
          </div>

          <form onSubmit={handleSaveProfile} class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Full Name"
                value={form().name}
                onInput={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
              />
              <TextField
                label="Mobile Number"
                value={form().phone}
                onInput={(e) => setForm((f) => ({ ...f, phone: e.currentTarget.value }))}
              />
              <SelectField
                label="Vehicle Type"
                value={form().vehicleType}
                onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.currentTarget.value }))}
              >
                <option value="Electric Scooter">Electric Scooter</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Mini Van">Mini Van</option>
              </SelectField>
              <TextField
                label="Vehicle Registration Number"
                value={form().vehicleNumber}
                onInput={(e) => setForm((f) => ({ ...f, vehicleNumber: e.currentTarget.value }))}
              />
            </div>

            <TextField
              label="Residential Address"
              value={form().address}
              onInput={(e) => setForm((f) => ({ ...f, address: e.currentTarget.value }))}
            />

            <div class="pt-4 border-t border-[#EBF1FA] space-y-3">
              <h3 class="text-sm font-bold text-[#0D1B3E]">KYC Documents</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TextField
                  label="Aadhaar Document"
                  value={form().aadhaarNumber}
                  onInput={(e) => setForm((f) => ({ ...f, aadhaarNumber: e.currentTarget.value }))}
                />
                <TextField
                  label="PAN Document"
                  value={form().panNumber}
                  onInput={(e) => setForm((f) => ({ ...f, panNumber: e.currentTarget.value }))}
                />
                <TextField
                  label="Driving Licence"
                  value={form().drivingLicence}
                  onInput={(e) => setForm((f) => ({ ...f, drivingLicence: e.currentTarget.value }))}
                />
              </div>
            </div>

            <Button type="submit">Save Profile & KYC Details</Button>
          </form>
        </section>

        {/* Ratings & Support Column */}
        <div class="lg:col-span-5 space-y-6">
          <section
            class="item-card-reveal bg-white border border-[#DDE6F2] rounded-xl p-5 space-y-4 shadow-xs hover:shadow-md transition-shadow duration-300"
            style={{ '--card-delay': '90ms' }}
          >
            <div class="flex items-center justify-between">
              <h3 class="font-display text-base font-bold text-[#0D1B3E]">Customer Ratings</h3>
              <span class="inline-flex items-center gap-1 text-sm font-bold text-[#0D1B3E] tabular-nums">
                <Star class="w-4 h-4 text-[#D97706] fill-[#D97706]" />
                {user()?.rating || 4.8} / 5
              </span>
            </div>
            <Show
              when={myRatings().length > 0}
              fallback={<p class="text-xs text-[#5A6C8A]">No delivery reviews yet.</p>}
            >
              <div class="divide-y divide-[#EBF1FA]">
                <For each={myRatings()}>
                  {(rev) => (
                    <div class="py-3 first:pt-0 last:pb-0 text-xs">
                      <div class="flex justify-between font-semibold text-[#0D1B3E]">
                        <span>{rev.customerName}</span>
                        <span class="tabular-nums">
                          {rev.rating}/5 · {formatShortDate(rev.createdAt)}
                        </span>
                      </div>
                      <p class="mt-1 text-[#4B5C78]">{rev.comment}</p>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </section>

          <section
            class="item-card-reveal bg-white border border-[#DDE6F2] rounded-xl p-5 space-y-4 shadow-xs hover:shadow-md transition-shadow duration-300"
            style={{ '--card-delay': '150ms' }}
          >
            <h3 class="font-display text-base font-bold text-[#0D1B3E]">Rider Support</h3>
            <form onSubmit={handleTicket} class="space-y-3">
              <TextField
                label="Subject"
                value={subject()}
                onInput={(e) => setSubject(e.currentTarget.value)}
                placeholder="Payout query, delivery assistance..."
              />
              <TextAreaField
                label="Message"
                rows={3}
                value={message()}
                onInput={(e) => setMessage(e.currentTarget.value)}
              />
              <Button size="sm" type="submit" class="w-full">
                Submit Support Request
              </Button>
            </form>

            <Show when={myTickets().length > 0}>
              <div class="pt-3 border-t border-[#EBF1FA] space-y-2">
                <For each={myTickets()}>
                  {(t) => (
                    <div class="p-3 rounded-lg bg-[#F8FAFD] border border-[#EBF1FA] text-xs space-y-1">
                      <div class="flex justify-between">
                        <span class="font-bold text-[#0D1B3E]">{t.subject}</span>
                        <StatusText
                          label={t.status}
                          tone={t.status === 'resolved' ? 'success' : 'warning'}
                        />
                      </div>
                      <Show when={t.reply}>
                        <p class="text-[#1E3A8A]">Reply: {t.reply}</p>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </section>
        </div>
      </div>
    </RiderLayout>
  );
}
