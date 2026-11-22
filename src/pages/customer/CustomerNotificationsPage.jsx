import { For, Show, createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { ArrowLeft, Bell, CheckCheck, Trash2 } from 'lucide-solid';
import { CustomerLayout } from './CustomerLayout.jsx';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { showToast } from '../../stores/toastStore.js';
import { formatDateTime } from '../../utils/formatters.js';

export function CustomerNotificationsPage() {
  const navigate = useNavigate();
  const user = () => currentUser();

  const items = createMemo(() =>
    platformState.notifications.filter(
      (n) => n.targetRole === user()?.role && (!n.userId || n.userId === user()?.id)
    )
  );

  const handleMarkAllRead = () => {
    platformActions.markAllNotificationsRead(user().role, user().id);
    showToast('All notifications marked as read.', 'success');
  };

  const handleClearAll = () => {
    platformActions.clearNotifications(user().role, user().id);
    showToast('Notifications cleared.', 'info');
  };

  return (
    <CustomerLayout title="Notifications" hideTopBar={true} fullBleed={true}>
      <div class="min-h-screen bg-[#F8FAFD]">
        {/* Sticky Top Header matching Screenshot 9 */}
        <header class="sticky top-0 z-30 bg-white border-b border-[#E2EBF8] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2">
          <div class="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              class="w-9 h-9 rounded-full hover:bg-[#F1F5F9] text-[#0D1B3E] inline-flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            <h1 class="font-display text-lg font-extrabold text-[#0D1B3E] truncate">
              Notifications
            </h1>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMarkAllRead}
              class="px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-bold text-[#0066FF] hover:bg-[#DBEAFE] cursor-pointer transition-colors"
            >
              Mark Read
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              class="px-3 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2] inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </header>

        <div class="max-w-2xl mx-auto divide-y divide-[#E2EBF8] bg-white border-b border-[#E2EBF8]">
          <Show
            when={items().length > 0}
            fallback={
              <div class="item-card-reveal py-16 px-6 text-center space-y-2">
                <div class="float-gentle w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#0066FF] mx-auto flex items-center justify-center shadow-xs">
                  <CheckCheck class="w-7 h-7" />
                </div>
                <p class="font-display text-base font-extrabold text-[#0D1B3E]">
                  You&apos;re all caught up
                </p>
                <p class="text-xs text-[#64748B]">
                  Order updates, rider assignments, and exclusive offers will appear here.
                </p>
              </div>
            }
          >
            <For each={items()}>
              {(n, idx) => (
                <button
                  type="button"
                  onClick={() => platformActions.markNotificationRead(n.id)}
                  style={{ '--item-delay': `${Math.min(idx(), 10) * 45}ms` }}
                  class={`item-card-reveal w-full px-4 sm:px-6 py-4 flex items-start gap-3.5 text-left cursor-pointer transition-all duration-200 active:scale-[0.99] ${
                    n.read ? 'bg-white hover:bg-[#F8FAFD]' : 'bg-[#F0F7FF] hover:bg-[#E6F0FF]'
                  }`}
                >
                  <div
                    class={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                      n.read ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#DBEAFE] text-[#0066FF]'
                    }`}
                  >
                    <Bell class="w-5 h-5" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <p class="text-sm font-extrabold text-[#0D1B3E] leading-snug">{n.title}</p>
                      <Show when={!n.read}>
                        <span class="radar-beacon w-2.5 h-2.5 rounded-full bg-[#0066FF] text-[#0066FF] mt-1 shrink-0" />
                      </Show>
                    </div>
                    <p class="text-xs text-[#475569] mt-1 leading-relaxed">{n.body}</p>
                    <p class="text-[11px] font-mono text-[#94A3B8] mt-1.5">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              )}
            </For>
          </Show>
        </div>
      </div>
    </CustomerLayout>
  );
}
