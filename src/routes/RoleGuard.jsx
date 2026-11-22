import { Show, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { ROLE_HOME_ROUTES, ROLE_LABELS } from '../constants/config.js';
import { currentUser } from '../stores/authStore.js';
import { showToast } from '../stores/toastStore.js';

export function RoleGuard(props) {
  const navigate = useNavigate();

  createEffect(() => {
    const user = currentUser();
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (props.allowedRole && user.role !== props.allowedRole) {
      showToast(
        `Access restricted to ${ROLE_LABELS[props.allowedRole]} accounts. Redirected to your dashboard.`,
        'warning'
      );
      navigate(ROLE_HOME_ROUTES[user.role] || '/login', { replace: true });
    }
  });

  const authorized = () => {
    const user = currentUser();
    if (!user) return false;
    return !props.allowedRole || user.role === props.allowedRole;
  };

  return <Show when={authorized()}>{props.children}</Show>;
}
