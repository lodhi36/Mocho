import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { ORDER_STATUS, ROLES } from '../constants/config.js';
import {
  DEMO_USERS,
  INITIAL_BANNERS,
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_PAYOUTS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_SETTINGS,
  INITIAL_STORES,
  INITIAL_TICKETS,
} from '../constants/demoData.js';
import { generateOrderId, generateOtpCode } from '../utils/formatters.js';
import { getOperatingMode, setOperatingMode, platformService } from '../services/platformService.js';
import { stripCityStateFromAddress } from './locationStore.js';

const STORAGE_KEY = 'ridehub_platform_state_v6';

function buildInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.stores) && Array.isArray(parsed.orders)) {
        parsed.stores = parsed.stores.map((s) => ({
          ...s,
          address: stripCityStateFromAddress(s.address) || s.locality || s.address,
        }));
        return parsed;
      }
    }
  } catch {
    // fallback to clean seed
  }
  return {
    users: structuredClone(DEMO_USERS),
    categories: structuredClone(INITIAL_CATEGORIES),
    stores: structuredClone(INITIAL_STORES),
    products: structuredClone(INITIAL_PRODUCTS),
    orders: structuredClone(INITIAL_ORDERS),
    coupons: structuredClone(INITIAL_COUPONS),
    banners: structuredClone(INITIAL_BANNERS),
    reviews: structuredClone(INITIAL_REVIEWS),
    tickets: structuredClone(INITIAL_TICKETS),
    payouts: structuredClone(INITIAL_PAYOUTS),
    notifications: structuredClone(INITIAL_NOTIFICATIONS),
    settings: structuredClone(INITIAL_SETTINGS),
    cart: [],
    wishlist: ['prod-1', 'prod-5'],
    appliedCouponCode: '',
  };
}

const [platformState, setPlatformState] = createStore(buildInitialState());
const [appMode, setAppModeSignal] = createSignal(getOperatingMode());

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(platformState));
  } catch {
    // storage quota ignored
  }
}

export function switchAppMode(nextMode) {
  const updated = setOperatingMode(nextMode);
  setAppModeSignal(updated);
  return updated;
}

export function resetDemoData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  setPlatformState({
    users: structuredClone(DEMO_USERS),
    categories: structuredClone(INITIAL_CATEGORIES),
    stores: structuredClone(INITIAL_STORES),
    products: structuredClone(INITIAL_PRODUCTS),
    orders: structuredClone(INITIAL_ORDERS),
    coupons: structuredClone(INITIAL_COUPONS),
    banners: structuredClone(INITIAL_BANNERS),
    reviews: structuredClone(INITIAL_REVIEWS),
    tickets: structuredClone(INITIAL_TICKETS),
    payouts: structuredClone(INITIAL_PAYOUTS),
    notifications: structuredClone(INITIAL_NOTIFICATIONS),
    settings: structuredClone(INITIAL_SETTINGS),
    cart: [],
    wishlist: ['prod-1', 'prod-5'],
    appliedCouponCode: '',
  });
  persistState();
}

function pushNotification({ targetRole, userId = null, title, body }) {
  const next = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    targetRole,
    userId,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  };
  setPlatformState('notifications', (list) => [next, ...list]);
}

export const platformActions = {
  // ---- CART & WISHLIST ----
  addToCart(product, variationLabel, unitPrice, qty = 1) {
    const existingStoreId = platformState.cart[0]?.storeId;
    if (existingStoreId && existingStoreId !== product.storeId) {
      return { conflictStore: true, existingStoreId };
    }
    const existingIdx = platformState.cart.findIndex(
      (item) => item.productId === product.id && item.variation === variationLabel
    );
    if (existingIdx >= 0) {
      setPlatformState('cart', existingIdx, 'qty', (q) => q + qty);
    } else {
      setPlatformState('cart', (prev) => [
        ...prev,
        {
          productId: product.id,
          storeId: product.storeId,
          name: product.name,
          image: product.images?.[0] || '',
          variation: variationLabel,
          unitPrice,
          qty,
        },
      ]);
    }
    persistState();
    return { added: true };
  },

  replaceCartWithItem(product, variationLabel, unitPrice, qty = 1) {
    setPlatformState('cart', [
      {
        productId: product.id,
        storeId: product.storeId,
        name: product.name,
        image: product.images?.[0] || '',
        variation: variationLabel,
        unitPrice,
        qty,
      },
    ]);
    setPlatformState('appliedCouponCode', '');
    persistState();
  },

  updateCartQty(productId, variation, delta) {
    const idx = platformState.cart.findIndex(
      (item) => item.productId === productId && item.variation === variation
    );
    if (idx < 0) return;
    const nextQty = platformState.cart[idx].qty + delta;
    if (nextQty <= 0) {
      setPlatformState('cart', (prev) =>
        prev.filter((item) => !(item.productId === productId && item.variation === variation))
      );
    } else {
      setPlatformState('cart', idx, 'qty', nextQty);
    }
    persistState();
  },

  removeFromCart(productId, variation) {
    setPlatformState('cart', (prev) =>
      prev.filter((item) => !(item.productId === productId && item.variation === variation))
    );
    persistState();
  },

  clearCart() {
    setPlatformState('cart', []);
    setPlatformState('appliedCouponCode', '');
    persistState();
  },

  toggleWishlist(productId) {
    if (platformState.wishlist.includes(productId)) {
      setPlatformState('wishlist', (prev) => prev.filter((id) => id !== productId));
    } else {
      setPlatformState('wishlist', (prev) => [...prev, productId]);
    }
    persistState();
  },

  applyCoupon(code) {
    const normalized = String(code || '').trim().toUpperCase();
    const coupon = platformState.coupons.find((c) => c.code.toUpperCase() === normalized && c.active);
    if (!coupon) {
      return { ok: false, error: 'Coupon code is invalid or inactive.' };
    }
    const subtotal = platformState.cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
    if (subtotal < coupon.minOrder) {
      return {
        ok: false,
        error: `Minimum order of ₹${coupon.minOrder} required for ${coupon.code}.`,
      };
    }
    setPlatformState('appliedCouponCode', coupon.code);
    persistState();
    return { ok: true, coupon };
  },

  clearCoupon() {
    setPlatformState('appliedCouponCode', '');
    persistState();
  },

  // ---- CUSTOMER ORDERS & LIFECYCLE ----
  async placeOrder({ customer, deliveryAddress, paymentMethod }) {
    if (!platformState.cart.length) {
      throw new Error('Your cart is empty.');
    }
    const storeId = platformState.cart[0].storeId;
    const store = platformState.stores.find((s) => s.id === storeId);
    if (!store) throw new Error('Selected store could not be found.');

    const subtotal = platformState.cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
    let discount = 0;
    const coupon = platformState.coupons.find(
      (c) => c.code === platformState.appliedCouponCode && c.active && subtotal >= c.minOrder
    );
    if (coupon) {
      discount =
        coupon.type === 'percent'
          ? Math.min(Math.round((subtotal * coupon.value) / 100), coupon.maxDiscount)
          : coupon.value;
    }

    const deliveryFee =
      subtotal >= platformState.settings.freeDeliveryAbove
        ? 0
        : platformState.settings.baseDeliveryFee;
    const total = Math.max(0, subtotal - discount + deliveryFee);
    const platformCommission = Math.round(
      (subtotal * platformState.settings.commissionRatePercent) / 100
    );
    const riderEarnings = Math.max(45, Math.round(35 + (store.distanceKm || 2) * 10));
    const supplierPayable = Math.max(0, total - platformCommission - riderEarnings);

    const orderId = generateOrderId();
    let paymentNotice = '';
    let paymentStatus = 'pending_cod';

    if (paymentMethod === 'ONLINE_GATEWAY') {
      const paymentInit = await platformService.initiateOnlinePayment({
        orderId,
        amount: total,
        customer: { id: customer.id, name: customer.name, email: customer.email },
      });
      paymentNotice = paymentInit.notice || '';
      paymentStatus = 'awaiting_gateway_integration';
    }

    const now = new Date().toISOString();
    const newOrder = {
      id: orderId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      storeId: store.id,
      storeName: store.name,
      supplierId: store.supplierId,
      storeAddress: store.address,
      deliveryAddress,
      riderId: null,
      riderName: null,
      riderPhone: null,
      status: ORDER_STATUS.PLACED,
      items: platformState.cart.map((c) => ({
        productId: c.productId,
        name: c.name,
        variation: c.variation,
        qty: c.qty,
        unitPrice: c.unitPrice,
      })),
      subtotal,
      discount,
      couponCode: coupon ? coupon.code : '',
      deliveryFee,
      total,
      platformCommission,
      riderEarnings,
      supplierPayable,
      paymentMethod,
      paymentStatus,
      pickupOtp: generateOtpCode(),
      deliveryOtp: generateOtpCode(),
      distanceKm: store.distanceKm || 2.1,
      etaMins: store.etaMins || 25,
      refundStatus: 'none',
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: ORDER_STATUS.PLACED, at: now, note: `Order placed by ${customer.name}` }],
    };

    setPlatformState('orders', (prev) => [newOrder, ...prev]);

    // Decrement product stock
    newOrder.items.forEach((item) => {
      const pIdx = platformState.products.findIndex((p) => p.id === item.productId);
      if (pIdx >= 0) {
        const nextStock = Math.max(0, platformState.products[pIdx].stock - item.qty);
        setPlatformState('products', pIdx, 'stock', nextStock);
        if (nextStock === 0) setPlatformState('products', pIdx, 'available', false);
      }
    });

    pushNotification({
      targetRole: ROLES.SUPPLIER,
      userId: store.supplierId,
      title: `New order ${orderId}`,
      body: `${customer.name} ordered ${newOrder.items.length} item(s) totaling ₹${total}.`,
    });

    this.clearCart();
    persistState();
    return { order: newOrder, paymentNotice };
  },

  async updateOrderStatus(orderId, nextStatus, { note = '', rider = null, cancelReason = '' } = {}) {
    const idx = platformState.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) throw new Error('Order not found.');

    await platformService.syncOrderStatus(orderId, nextStatus, { note, riderId: rider?.id });

    const now = new Date().toISOString();
    const order = platformState.orders[idx];

    setPlatformState('orders', idx, 'status', nextStatus);
    setPlatformState('orders', idx, 'updatedAt', now);

    if (rider) {
      setPlatformState('orders', idx, 'riderId', rider.id);
      setPlatformState('orders', idx, 'riderName', rider.name);
      setPlatformState('orders', idx, 'riderPhone', rider.phone);
    }

    if (nextStatus === ORDER_STATUS.CANCELLED) {
      setPlatformState('orders', idx, 'cancelReason', cancelReason || note || 'Order cancelled');
      if (order.paymentMethod === 'ONLINE_GATEWAY') {
        setPlatformState('orders', idx, 'refundStatus', 'processing');
        setPlatformState('orders', idx, 'paymentStatus', 'refund_requested');
      }
    }

    if (nextStatus === ORDER_STATUS.COMPLETED) {
      setPlatformState('orders', idx, 'paymentStatus', 'settled');
    }

    setPlatformState('orders', idx, 'timeline', (prev) => [
      ...prev,
      { status: nextStatus, at: now, note: note || `Status updated to ${nextStatus}` },
    ]);

    // Cross-role notifications
    pushNotification({
      targetRole: ROLES.CUSTOMER,
      userId: order.customerId,
      title: `Order ${orderId}: ${nextStatus.replace(/_/g, ' ')}`,
      body: note || `Your order from ${order.storeName} moved to ${nextStatus.replace(/_/g, ' ')}.`,
    });

    if (nextStatus === ORDER_STATUS.READY_FOR_PICKUP) {
      pushNotification({
        targetRole: ROLES.RIDER,
        title: `Pickup ready at ${order.storeName}`,
        body: `Order ${orderId} (${order.distanceKm} km) is ready for delivery partner pickup.`,
      });
    }

    if (nextStatus === ORDER_STATUS.RIDER_ASSIGNED && rider) {
      pushNotification({
        targetRole: ROLES.SUPPLIER,
        userId: order.supplierId,
        title: `Rider assigned for ${orderId}`,
        body: `${rider.name} is arriving to pick up order ${orderId}. Pickup OTP: ${order.pickupOtp}.`,
      });
    }

    persistState();
    return platformState.orders[idx];
  },

  reorderToCart(order) {
    const items = [];
    for (const item of order.items) {
      const prod = platformState.products.find((p) => p.id === item.productId && p.available);
      if (prod) {
        items.push({
          productId: prod.id,
          storeId: prod.storeId,
          name: prod.name,
          image: prod.images?.[0] || '',
          variation: item.variation,
          unitPrice: item.unitPrice,
          qty: item.qty,
        });
      }
    }
    if (!items.length) return false;
    setPlatformState('cart', items);
    setPlatformState('appliedCouponCode', '');
    persistState();
    return true;
  },

  // ---- USER PROFILE & ADDRESSES ----
  updateUserProfile(userId, patch) {
    const idx = platformState.users.findIndex((u) => u.id === userId);
    if (idx < 0) return null;
    setPlatformState('users', idx, (prev) => ({ ...prev, ...patch }));
    persistState();
    return platformState.users[idx];
  },

  addCustomerAddress(userId, address) {
    const idx = platformState.users.findIndex((u) => u.id === userId);
    if (idx < 0) return;
    const newAddr = {
      id: `addr-${Date.now()}`,
      ...address,
      isDefault: Boolean(address.isDefault) || !(platformState.users[idx].addresses || []).length,
    };
    setPlatformState('users', idx, 'addresses', (prev = []) => {
      const base = newAddr.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
      return [...base, newAddr];
    });
    persistState();
  },

  removeCustomerAddress(userId, addrId) {
    const idx = platformState.users.findIndex((u) => u.id === userId);
    if (idx < 0) return;
    setPlatformState('users', idx, 'addresses', (prev = []) => prev.filter((a) => a.id !== addrId));
    persistState();
  },

  setDefaultAddress(userId, addrId) {
    const idx = platformState.users.findIndex((u) => u.id === userId);
    if (idx < 0) return;
    setPlatformState('users', idx, 'addresses', (prev = []) =>
      prev.map((a) => ({ ...a, isDefault: a.id === addrId }))
    );
    persistState();
  },

  // ---- SUPPLIER STORE & PRODUCT MANAGEMENT ----
  updateStore(storeId, patch) {
    const idx = platformState.stores.findIndex((s) => s.id === storeId);
    if (idx < 0) return;
    setPlatformState('stores', idx, (prev) => ({ ...prev, ...patch }));
    persistState();
  },

  addProduct(productData) {
    const next = {
      id: `prod-${Date.now()}`,
      rating: 4.8,
      ...productData,
    };
    setPlatformState('products', (prev) => [next, ...prev]);
    persistState();
    return next;
  },

  updateProduct(productId, patch) {
    const idx = platformState.products.findIndex((p) => p.id === productId);
    if (idx < 0) return;
    setPlatformState('products', idx, (prev) => ({ ...prev, ...patch }));
    persistState();
  },

  deleteProduct(productId) {
    setPlatformState('products', (prev) => prev.filter((p) => p.id !== productId));
    persistState();
  },

  // ---- REVIEWS & SUPPORT ----
  addReview(reviewData) {
    const next = {
      id: `rev-${Date.now()}`,
      status: 'published',
      createdAt: new Date().toISOString(),
      ...reviewData,
    };
    setPlatformState('reviews', (prev) => [next, ...prev]);
    if (reviewData.orderId) {
      const oIdx = platformState.orders.findIndex((o) => o.id === reviewData.orderId);
      if (oIdx >= 0) setPlatformState('orders', oIdx, 'rated', true);
    }
    persistState();
    return next;
  },

  updateReviewStatus(reviewId, status) {
    const idx = platformState.reviews.findIndex((r) => r.id === reviewId);
    if (idx < 0) return;
    setPlatformState('reviews', idx, 'status', status);
    persistState();
  },

  createSupportTicket({ userId, userName, userRole, subject, message, priority = 'medium' }) {
    const next = {
      id: `TKT-${Math.floor(100 + Math.random() * 899)}`,
      userId,
      userName,
      userRole,
      subject,
      message,
      status: 'open',
      priority,
      reply: '',
      createdAt: new Date().toISOString(),
    };
    setPlatformState('tickets', (prev) => [next, ...prev]);
    persistState();
    return next;
  },

  updateTicket(ticketId, patch) {
    const idx = platformState.tickets.findIndex((t) => t.id === ticketId);
    if (idx < 0) return;
    setPlatformState('tickets', idx, (prev) => ({ ...prev, ...patch }));
    persistState();
  },

  // ---- NOTIFICATIONS ----
  markNotificationRead(notifId) {
    const idx = platformState.notifications.findIndex((n) => n.id === notifId);
    if (idx >= 0) {
      setPlatformState('notifications', idx, 'read', true);
      persistState();
    }
  },

  markAllNotificationsRead(role, userId) {
    setPlatformState('notifications', (prev) =>
      prev.map((n) =>
        n.targetRole === role && (!n.userId || n.userId === userId) ? { ...n, read: true } : n
      )
    );
    persistState();
  },

  clearNotifications(role, userId) {
    setPlatformState('notifications', (prev) =>
      prev.filter((n) => !(n.targetRole === role && (!n.userId || n.userId === userId)))
    );
    persistState();
  },

  addStoreSubcategory(categoryId, subName) {
    const idx = platformState.categories.findIndex((c) => c.id === categoryId);
    if (idx < 0) return null;
    const clean = String(subName || '').trim();
    if (!clean) return null;
    const id = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = (platformState.categories[idx].subcategories || []).find((s) => s.id === id);
    if (existing) return existing;
    const nextSub = {
      id,
      name: clean,
      label: clean,
      image: platformState.categories[idx].heroImage || '',
      portrait: false,
      tone: 'from-blue-100 to-indigo-200',
      accent: '#0066FF',
    };
    setPlatformState('categories', idx, 'subcategories', (prev = []) => [...prev, nextSub]);
    persistState();
    return nextSub;
  },

  requestWithdrawal({ recipientId, recipientName, recipientRole, amount, upiId }) {
    const nextPayout = {
      id: `PAY-${Math.floor(1000 + Math.random() * 8999)}`,
      recipientId,
      recipientName,
      recipientRole,
      amount: Number(amount) || 0,
      commissionDeducted: 0,
      period: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'processing',
      reference: `UPI:${upiId || 'linked-bank'}`,
      settledAt: '',
    };
    setPlatformState('payouts', (prev) => [nextPayout, ...prev]);
    persistState();
    return nextPayout;
  },

  broadcastNotification({ targetRole, title, body }) {
    pushNotification({ targetRole, title, body });
    persistState();
  },

  // ---- ADMIN OPERATIONS ----
  settlePayout(payoutId) {
    const idx = platformState.payouts.findIndex((p) => p.id === payoutId);
    if (idx < 0) return;
    setPlatformState('payouts', idx, 'status', 'settled');
    setPlatformState('payouts', idx, 'settledAt', new Date().toISOString().slice(0, 10));
    setPlatformState('payouts', idx, 'reference', `UTR${Date.now().toString().slice(-10)}`);
    persistState();
  },

  processRefund(orderId, refundStatus) {
    const idx = platformState.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) return;
    setPlatformState('orders', idx, 'refundStatus', refundStatus);
    if (refundStatus === 'completed') {
      setPlatformState('orders', idx, 'paymentStatus', 'refunded');
    }
    persistState();
  },

  addCategory(cat) {
    setPlatformState('categories', (prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, active: true, sortOrder: prev.length + 1, ...cat },
    ]);
    persistState();
  },

  toggleCategory(catId) {
    const idx = platformState.categories.findIndex((c) => c.id === catId);
    if (idx < 0) return;
    setPlatformState('categories', idx, 'active', (v) => !v);
    persistState();
  },

  addCoupon(cpn) {
    setPlatformState('coupons', (prev) => [
      { id: `cpn-${Date.now()}`, usageCount: 0, active: true, ...cpn },
      ...prev,
    ]);
    persistState();
  },

  toggleCoupon(cpnId) {
    const idx = platformState.coupons.findIndex((c) => c.id === cpnId);
    if (idx < 0) return;
    setPlatformState('coupons', idx, 'active', (v) => !v);
    persistState();
  },

  addBanner(banner) {
    setPlatformState('banners', (prev) => [
      { id: `ban-${Date.now()}`, active: true, ...banner },
      ...prev,
    ]);
    persistState();
  },

  toggleBanner(banId) {
    const idx = platformState.banners.findIndex((b) => b.id === banId);
    if (idx < 0) return;
    setPlatformState('banners', idx, 'active', (v) => !v);
    persistState();
  },

  updateSettings(patch) {
    setPlatformState('settings', (prev) => ({ ...prev, ...patch }));
    persistState();
  },

  registerNewUser(userPayload, storePayload = null) {
    setPlatformState('users', (prev) => [userPayload, ...prev]);
    if (storePayload) {
      setPlatformState('stores', (prev) => [storePayload, ...prev]);
    }
    persistState();
    return userPayload;
  },
};

export { platformState, appMode };
