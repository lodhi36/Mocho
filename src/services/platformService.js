import { ENV_CONFIG } from '../constants/config.js';
import { apiClient } from './apiClient.js';

export function getOperatingMode() {
  try {
    const saved = localStorage.getItem('portway_app_mode');
    if (saved === 'demo' || saved === 'production') return saved;
  } catch {
    // ignore storage errors
  }
  return ENV_CONFIG.appMode;
}

export function setOperatingMode(mode) {
  const normalized = mode === 'production' ? 'production' : 'demo';
  try {
    localStorage.setItem('portway_app_mode', normalized);
  } catch {
    // ignore
  }
  return normalized;
}

export const platformService = {
  async requestOtp({ identifier, role }) {
    const mode = getOperatingMode();
    if (mode === 'production') {
      return apiClient.post('/auth/otp/request', { identifier, role });
    }
    // Demo mode explicitly discloses that no real SMS/email OTP is sent
    return {
      mode: 'demo',
      sent: true,
      demoCode: '123456',
      notice:
        'Demo Mode active: No real SMS or email was sent. Enter verification code 123456 to continue.',
    };
  },

  async verifyOtp({ identifier, otp, role }) {
    const mode = getOperatingMode();
    if (mode === 'production') {
      return apiClient.post('/auth/otp/verify', { identifier, otp, role });
    }
    if (String(otp).trim() !== '123456') {
      throw new Error('Invalid demo OTP. Enter 123456 in Demo Mode.');
    }
    return { verified: true, mode: 'demo' };
  },

  async initiateOnlinePayment({ orderId, amount, customer }) {
    const mode = getOperatingMode();
    if (mode === 'production') {
      if (!ENV_CONFIG.paymentGatewayConfigured) {
        throw new Error(
          'Online payment gateway is not configured. Add VITE_PAYMENT_GATEWAY_PUBLIC_KEY and connect /payments/create-session on your backend.'
        );
      }
      return apiClient.post('/payments/create-session', { orderId, amount, customer });
    }
    // Never pretend a real card payment succeeded
    return {
      mode: 'demo',
      gatewayReady: false,
      status: 'awaiting_gateway_integration',
      notice:
        'Online Payment Gateway requires live merchant API credentials. In Demo Mode, orders are recorded as "Payment Pending (Gateway Integration Ready)" — no real charge is processed.',
    };
  },

  async syncOrderStatus(orderId, status, payload = {}) {
    const mode = getOperatingMode();
    if (mode === 'production') {
      return apiClient.patch(`/orders/${encodeURIComponent(orderId)}/status`, {
        status,
        ...payload,
      });
    }
    return { synced: true, mode: 'demo', orderId, status };
  },

  buildExternalNavigationUrl({ lat, lng, address }) {
    if (lat && lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
  },
};
