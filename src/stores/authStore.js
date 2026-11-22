import { createSignal } from 'solid-js';
import { ASSET_IMAGES, ROLES } from '../constants/config.js';
import { platformActions, platformState } from './platformStore.js';

const SESSION_KEY = 'portway_session_user_id';

function loadInitialSessionId() {
  try {
    return localStorage.getItem(SESSION_KEY) || '';
  } catch {
    return '';
  }
}

const [sessionUserId, setSessionUserId] = createSignal(loadInitialSessionId());

export function currentUser() {
  const id = sessionUserId();
  if (!id) return null;
  return platformState.users.find((u) => u.id === id) || null;
}

export function isAuthenticated() {
  return Boolean(currentUser());
}

export function loginAsUser(userId) {
  const user = platformState.users.find((u) => u.id === userId);
  if (!user) throw new Error('Account not found.');
  if (user.status === 'inactive' || user.status === 'rejected') {
    throw new Error('This account is currently deactivated or rejected. Contact support.');
  }
  setSessionUserId(user.id);
  try {
    localStorage.setItem(SESSION_KEY, user.id);
  } catch {
    // ignore
  }
  return user;
}

export function loginByIdentifierAndRole(identifier, role) {
  const needle = String(identifier || '').trim().toLowerCase();
  const digits = needle.replace(/\D/g, '');
  const matched = platformState.users.find((u) => {
    if (role && u.role !== role) return false;
    const emailMatch = u.email.toLowerCase() === needle;
    const phoneDigits = (u.phone || '').replace(/\D/g, '');
    const phoneMatch = digits.length >= 10 && phoneDigits.endsWith(digits.slice(-10));
    return emailMatch || phoneMatch;
  });

  if (!matched) {
    throw new Error(
      `No ${role ? role.toLowerCase() : ''} account found matching "${identifier}". Try one of the demo accounts or register a new profile.`
    );
  }
  return loginAsUser(matched.id);
}

export function registerAccount(payload) {
  const existing = platformState.users.find(
    (u) => u.email.toLowerCase() === payload.email.toLowerCase()
  );
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const nowDate = new Date().toISOString().slice(0, 10);
  const id = `${payload.role.toLowerCase()}-${Date.now()}`;

  if (payload.role === ROLES.CUSTOMER) {
    const newUser = {
      id,
      role: ROLES.CUSTOMER,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      avatar: '',
      status: 'active',
      joinedAt: nowDate,
      addresses: payload.address
        ? [
            {
              id: `addr-${Date.now()}`,
              label: 'Home',
              line1: payload.address,
              city: payload.city || 'Bengaluru',
              postalCode: payload.postalCode || '560001',
              lat: 12.9716,
              lng: 77.5946,
              isDefault: true,
            },
          ]
        : [],
    };
    platformActions.registerNewUser(newUser);
    return loginAsUser(newUser.id);
  }

  if (payload.role === ROLES.SUPPLIER) {
    const storeId = `store-${Date.now()}`;
    const cat =
      platformState.categories.find((c) => c.id === payload.categoryId) ||
      platformState.categories[0];
    const newSupplier = {
      id,
      role: ROLES.SUPPLIER,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      avatar: '',
      storeId,
      status: 'pending',
      documentsVerified: false,
      joinedAt: nowDate,
      bankDetails: {
        accountHolder: payload.accountHolder || payload.storeName,
        bankName: payload.bankName || '',
        accountNumber: payload.accountNumber || '',
        ifscCode: payload.ifscCode || '',
      },
    };
    const newStore = {
      id: storeId,
      supplierId: id,
      name: payload.storeName,
      categoryId: cat.id,
      categoryName: cat.name,
      description: payload.storeDescription || 'Local partner store on Ride Hub.',
      logo: ASSET_IMAGES.freshMarket,
      banner: ASSET_IMAGES.freshMarket,
      address: payload.storeAddress,
      lat: 12.9716,
      lng: 77.5946,
      distanceKm: 2.2,
      etaMins: 25,
      openTime: payload.openTime || '08:00',
      closeTime: payload.closeTime || '21:00',
      isOpen: true,
      isActive: true,
      rating: 4.5,
      reviewCount: 0,
    };
    platformActions.registerNewUser(newSupplier, newStore);
    return loginAsUser(newSupplier.id);
  }

  if (payload.role === ROLES.RIDER) {
    const newRider = {
      id,
      role: ROLES.RIDER,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      avatar: '',
      status: 'pending',
      isOnline: false,
      isActive: true,
      rating: 5.0,
      totalDeliveries: 0,
      vehicleType: payload.vehicleType || 'Motorcycle',
      vehicleNumber: payload.vehicleNumber || '',
      address: payload.address || '',
      documents: {
        aadhaarNumber: payload.aadhaarNumber || '',
        panNumber: payload.panNumber || '',
        drivingLicence: payload.drivingLicence || '',
        verificationStatus: 'pending',
      },
      bankDetails: {
        accountHolder: payload.name,
        bankName: payload.bankName || '',
        accountNumber: payload.accountNumber || '',
        ifscCode: payload.ifscCode || '',
      },
      joinedAt: nowDate,
    };
    platformActions.registerNewUser(newRider);
    return loginAsUser(newRider.id);
  }

  throw new Error('Unsupported role selected.');
}

export function logout() {
  setSessionUserId('');
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('portway_auth_token');
  } catch {
    // ignore
  }
}

export { sessionUserId };
