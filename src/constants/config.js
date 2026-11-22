export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
  RIDER: 'RIDER',
};

export const ROLE_LABELS = {
  CUSTOMER: 'Customer',
  SUPPLIER: 'Supplier',
  RIDER: 'Delivery Partner',
};

export const ROLE_HOME_ROUTES = {
  CUSTOMER: '/customer',
  SUPPLIER: '/supplier',
  RIDER: '/rider',
};

export const ORDER_STATUS = {
  PLACED: 'PLACED',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  RIDER_ASSIGNED: 'RIDER_ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_WORKFLOW_STEPS = [
  { key: ORDER_STATUS.PLACED, label: 'Order Placed', actor: 'Customer' },
  { key: ORDER_STATUS.ACCEPTED, label: 'Store Accepted', actor: 'Supplier' },
  { key: ORDER_STATUS.PREPARING, label: 'Preparing Order', actor: 'Supplier' },
  { key: ORDER_STATUS.READY_FOR_PICKUP, label: 'Ready for Pickup', actor: 'Supplier' },
  { key: ORDER_STATUS.RIDER_ASSIGNED, label: 'Rider Assigned', actor: 'Rider' },
  { key: ORDER_STATUS.PICKED_UP, label: 'Picked Up', actor: 'Rider' },
  { key: ORDER_STATUS.DELIVERED, label: 'Delivered', actor: 'Rider' },
  { key: ORDER_STATUS.COMPLETED, label: 'Completed', actor: 'Customer' },
];

export const ORDER_STATUS_META = {
  PLACED: { label: 'Placed', tone: 'warning', stepIndex: 0 },
  ACCEPTED: { label: 'Accepted', tone: 'info', stepIndex: 1 },
  PREPARING: { label: 'Preparing', tone: 'info', stepIndex: 2 },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', tone: 'warning', stepIndex: 3 },
  RIDER_ASSIGNED: { label: 'Rider Assigned', tone: 'info', stepIndex: 4 },
  PICKED_UP: { label: 'Out for Delivery', tone: 'info', stepIndex: 5 },
  DELIVERED: { label: 'Delivered', tone: 'success', stepIndex: 6 },
  COMPLETED: { label: 'Completed', tone: 'success', stepIndex: 7 },
  CANCELLED: { label: 'Cancelled', tone: 'danger', stepIndex: -1 },
};

export const PAYMENT_METHODS = {
  COD: {
    id: 'COD',
    label: 'Cash on Delivery',
    description: 'Pay in cash or UPI upon order handoff at your doorstep.',
  },
  ONLINE_GATEWAY: {
    id: 'ONLINE_GATEWAY',
    label: 'Online Payment Gateway',
    description: 'Card, UPI, or Net Banking via configured payment provider SDK.',
  },
};

export const ENV_CONFIG = {
  appMode: import.meta.env.VITE_APP_MODE === 'production' ? 'production' : 'demo',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com/v1',
  paymentGatewayConfigured: Boolean(import.meta.env.VITE_PAYMENT_GATEWAY_PUBLIC_KEY),
  mapsConfigured: Boolean(import.meta.env.VITE_MAPS_PUBLIC_KEY),
};

export const ASSET_IMAGES = {
  hero: '/src/assets/images/hero_delivery_marketplace_1795236544721.jpg',
  freshMarket: '/src/assets/images/store_fresh_market_1795236543722.jpg',
  bakery: '/src/assets/images/store_artisan_bakery_1795236544761.jpg',
  pharmacy: '/src/assets/images/store_wellness_pharmacy_1795236543815.jpg',
  electronics: '/src/assets/images/store_tech_essentials_1795236544552.jpg',

  // Fashion
  fashionBanner: '/src/assets/images/fashion_hero_banner_1795245766013.jpg',
  fashionMen: '/src/assets/images/fashion_men_card_1795245766407.jpg',
  fashionWomen: '/src/assets/images/fashion_women_card_1795245768394.jpg',
  fashionKids: '/src/assets/images/fashion_kids_card_1795245767063.jpg',
  fashionSneakers: '/src/assets/images/fashion_sneakers_item_1795245889007.jpg',
  fashionHandbag: '/src/assets/images/fashion_handbag_item_1795245889239.jpg',

  // Beauty & Facial
  beautyBanner: '/src/assets/images/beauty_hero_banner_1795245766890.jpg',
  beautyFacial: '/src/assets/images/beauty_facial_care_1795245767455.jpg',
  beautyMakeup: '/src/assets/images/beauty_makeup_kit_1795245766433.jpg',
  beautyHair: '/src/assets/images/beauty_hair_glow_1795245766531.jpg',

  // Vegetables & Fruits
  vegLeafy: '/src/assets/images/veg_leafy_greens_1795245821015.jpg',
  vegDaily: '/src/assets/images/veg_daily_sabji_1795245823180.jpg',
  fruitsBanner: '/src/assets/images/fruits_hero_banner_1795245823388.jpg',
  fruitsDry: '/src/assets/images/fruits_exotic_dry_1795245824515.jpg',

  // Toys
  toysBanner: '/src/assets/images/toys_hero_banner_1795245825927.jpg',
  toysPlush: '/src/assets/images/toys_plush_bear_1795245825545.jpg',
  toysLearning: '/src/assets/images/toys_stem_blocks_1795245827397.jpg',
  toysGames: '/src/assets/images/toys_rc_games_1795245825722.jpg',

  // Food & Cafe
  foodMeals: '/src/assets/images/food_indian_meals_1795245887943.jpg',
  foodCoffee: '/src/assets/images/food_cafe_coffee_1795245889211.jpg',

  // Groceries & Dairy & Snacks
  groceryStaples: '/src/assets/images/grocery_staples_grains_1795245887341.jpg',
  groceryDairy: '/src/assets/images/grocery_dairy_fresh_1795245888069.jpg',
  grocerySnacks: '/src/assets/images/grocery_snacks_biscuits_1795245889981.jpg',

  // Pharmacy Herbal
  pharmacyHerbal: '/src/assets/images/pharmacy_herbal_wellness_1795245889179.jpg',
};
