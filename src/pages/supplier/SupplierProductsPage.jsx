import { For, Show, createMemo, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  ArrowRight,
  Briefcase,
  ChevronLeft,
  Crosshair,
  Edit2,
  Film,
  MessageCircle,
  Plus,
  Trash2,
  Upload,
} from 'lucide-solid';
import { SupplierLayout } from './SupplierLayout.jsx';
import { ASSET_IMAGES } from '../../constants/config.js';
import { platformActions, platformState } from '../../stores/platformStore.js';
import { currentUser } from '../../stores/authStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { requestConfirmation, showToast } from '../../stores/toastStore.js';
import { formatCurrency } from '../../utils/formatters.js';
import { sanitizeText, validateProductForm } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, ImageWithFallback } from '../../components/ui/DataDisplay.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SelectField, TextAreaField, TextField } from '../../components/ui/FormControls.jsx';
import { StoreMiniIcon } from '../../components/ui/FestiveVisuals.jsx';

export function SupplierProductsPage() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const user = () => currentUser();

  const store = createMemo(
    () => platformState.stores.find((s) => s.supplierId === user()?.id) || platformState.stores[0]
  );

  const storeCategory = createMemo(
    () =>
      platformState.categories.find((c) => c.id === store()?.categoryId) ||
      platformState.categories[0]
  );

  const [selectedSub, setSelectedSub] = createSignal('all');
  const [modalOpen, setModalOpen] = createSignal(false);
  const [categoryModal, setCategoryModal] = createSignal(false);
  const [newSubName, setNewSubName] = createSignal('');
  const [editingId, setEditingId] = createSignal('');
  const [errors, setErrors] = createSignal({});

  const [form, setForm] = createSignal({
    name: '',
    description: '',
    categoryId: 'cat-fashion',
    subcategoryId: 'men',
    price: '',
    discountPrice: '',
    stock: '20',
    available: true,
    image: ASSET_IMAGES.fashionBanner,
    variationsText: 'Size M:0, Size L:0',
  });

  const storeProducts = createMemo(() =>
    platformState.products.filter((p) => p.storeId === store()?.id)
  );

  const filteredProducts = createMemo(() => {
    const sub = selectedSub();
    if (sub === 'all') return storeProducts();
    return storeProducts().filter((p) => p.subcategoryId === sub);
  });

  const openCreateModal = () => {
    const cat = storeCategory();
    const firstSub = cat?.subcategories?.[0];
    setEditingId('');
    setErrors({});
    setForm({
      name: '',
      description: '',
      categoryId: cat?.id || 'cat-fashion',
      subcategoryId: firstSub?.id || 'general',
      price: '',
      discountPrice: '',
      stock: '25',
      available: true,
      image: store()?.banner || ASSET_IMAGES.fashionBanner,
      variationsText: 'Standard:0',
    });
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingId(prod.id);
    setErrors({});
    setForm({
      name: prod.name,
      description: prod.description || '',
      categoryId: prod.categoryId,
      subcategoryId: prod.subcategoryId || '',
      price: String(prod.price),
      discountPrice: prod.discountPrice ? String(prod.discountPrice) : '',
      stock: String(prod.stock),
      available: Boolean(prod.available),
      image: prod.images?.[0] || store()?.banner || ASSET_IMAGES.fashionBanner,
      variationsText: (prod.variations || [])
        .map((v) => `${v.label}:${v.priceDelta || 0}`)
        .join(', '),
    });
    setModalOpen(true);
  };

  const handleImageFile = (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, image: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const f = form();
    const errs = validateProductForm(f);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const subObj = (storeCategory()?.subcategories || []).find((s) => s.id === f.subcategoryId);

    const variations = String(f.variationsText || 'Standard:0')
      .split(',')
      .map((chunk, idx) => {
        const [label, delta] = chunk.split(':');
        return {
          id: `v-${idx + 1}`,
          label: sanitizeText(label || 'Standard', 60) || 'Standard',
          priceDelta: Number(delta) || 0,
        };
      });

    const payload = {
      storeId: store().id,
      categoryId: f.categoryId,
      subcategoryId: f.subcategoryId || 'general',
      subcategoryLabel: subObj?.label || subObj?.name || storeCategory()?.name || 'Item',
      name: sanitizeText(f.name, 120),
      description: sanitizeText(f.description, 400),
      price: Number(f.price),
      discountPrice: f.discountPrice ? Number(f.discountPrice) : 0,
      stock: Number(f.stock),
      available: Boolean(f.available) && Number(f.stock) > 0,
      images: [f.image || store()?.banner || ASSET_IMAGES.fashionBanner],
      variations,
    };

    if (editingId()) {
      platformActions.updateProduct(editingId(), payload);
      showToast(`${payload.name} updated.`, 'success');
    } else {
      platformActions.addProduct(payload);
      showToast(`${payload.name} added to your store.`, 'success');
    }
    setModalOpen(false);
  };

  const handleAddSubcategory = (e) => {
    e.preventDefault();
    const clean = sanitizeText(newSubName(), 40);
    if (!clean) {
      showToast('Enter a subcategory name.', 'error');
      return;
    }
    platformActions.addStoreSubcategory(storeCategory().id, clean);
    setNewSubName('');
    setCategoryModal(false);
    showToast(`Subcategory "${clean}" added to ${storeCategory().name}.`, 'success');
  };

  const handleDelete = async (prod) => {
    const ok = await requestConfirmation({
      title: `Delete ${prod.name}?`,
      message: 'This product will be removed from customer listings immediately.',
      confirmLabel: 'Delete Item',
      tone: 'danger',
    });
    if (!ok) return;
    platformActions.deleteProduct(prod.id);
    showToast(`${prod.name} deleted.`, 'info');
  };

  const handleGpsUpdate = async () => {
    const loc = await geo.detectLocation();
    if (loc) {
      platformActions.updateStore(store().id, {
        address: loc.fullAddress || store().address,
        locality: loc.area || loc.city || store().locality,
        lat: loc.lat,
        lng: loc.lng,
      });
      showToast(`Store GPS updated: ${loc.shortAddress || loc.fullAddress}`, 'success');
    } else if (geo.error()) {
      showToast(geo.error(), 'warning');
    }
  };

  return (
    <SupplierLayout title="Store Products" hideTopBar={true} fullBleed={true}>
      <div class="min-h-screen bg-[#F4F7FC] pb-10">
        {/* Royal Blue Top Header matching Screenshot 1 */}
        <header class="bg-[#0066FF] text-white px-4 sm:px-6 py-3.5">
          <div class="max-w-3xl mx-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate('/supplier')}
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" />
              <span>Back</span>
            </button>

            <h1 class="font-display text-base sm:text-lg font-extrabold truncate">
              {store()?.categoryName} Store Products
            </h1>

            <div class="w-16" />
          </div>
        </header>

        <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-3 space-y-4">
          {/* Store Name + Orders + Edit Strip */}
          <div class="bg-white rounded-2xl border border-[#E2EBF8] p-4 flex items-center justify-between gap-3 shadow-xs">
            <div class="min-w-0">
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-[#0066FF]">
                {store()?.categoryName} STORE NAME
              </p>
              <div class="mt-1 flex items-center gap-2">
                <div class="w-8 h-8 flex items-center justify-center shrink-0 scale-75 origin-left">
                  <StoreMiniIcon />
                </div>
                <span class="font-display text-lg font-extrabold text-[#0D1B3E] truncate">
                  {store()?.name}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/supplier/orders')}
                class="px-3.5 py-2 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle class="w-3.5 h-3.5" />
                <span>Orders</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/supplier/store')}
                class="px-3.5 py-2 rounded-2xl bg-[#F8FAFD] border border-[#CBD8EC] hover:bg-[#EFF6FF] text-[#0066FF] text-xs font-extrabold cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>

          {/* 3 Stacked Action Buttons matching Screenshot 1 */}
          <div class="space-y-2.5">
            <button
              type="button"
              onClick={() => setCategoryModal(true)}
              class="w-full min-h-[48px] rounded-2xl bg-[#F0F7FF] hover:bg-[#E0EEFF] border border-[#BFDBFE] text-[#0052CC] text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Plus class="w-4 h-4" />
              <span>Add Category</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              class="w-full min-h-[50px] rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_16px_rgba(0,102,255,0.22)] transition-colors"
            >
              <Briefcase class="w-4 h-4" />
              <span>Add {store()?.categoryName} Item</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/supplier/store')}
              class="w-full min-h-[48px] rounded-2xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#E9D5FF] text-[#7E22CE] text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Film class="w-4 h-4" />
              <span>Store Showcase &amp; Lottie Animation</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>

          {/* Permanent Store Location Bar + GPS Update */}
          <div class="bg-white rounded-2xl border border-[#E2EBF8] p-3.5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#0066FF] flex items-center justify-center shrink-0">
                <Crosshair class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-extrabold uppercase tracking-wider text-[#0066FF]">
                  LIVE DEVICE / STORE LOCATION
                </p>
                <p class="text-xs font-bold text-[#0D1B3E] truncate">
                  {geo.liveLocation()?.fullAddress ||
                    (geo.loading() ? 'Fetching live device GPS...' : store()?.address)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGpsUpdate}
              class="px-3.5 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-extrabold inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Crosshair class={`w-3.5 h-3.5 ${geo.loading() ? 'animate-spin' : ''}`} />
              <span>GPS Update</span>
            </button>
          </div>

          {/* Subcategory Filter Pills: All (N) + Subcategories + New Category */}
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedSub('all')}
              class={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer ${
                selectedSub() === 'all'
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-white border border-[#DDE6F2] text-[#475569]'
              }`}
            >
              All ({storeProducts().length})
            </button>

            <For each={storeCategory()?.subcategories || []}>
              {(sub) => {
                const count = () =>
                  storeProducts().filter((p) => p.subcategoryId === sub.id).length;
                return (
                  <button
                    type="button"
                    onClick={() => setSelectedSub(sub.id)}
                    class={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedSub() === sub.id
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-white border border-[#DDE6F2] text-[#475569]'
                    }`}
                  >
                    {sub.name} ({count()})
                  </button>
                );
              }}
            </For>

            <button
              type="button"
              onClick={() => setCategoryModal(true)}
              class="px-4 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#0066FF] text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
            >
              + New Category
            </button>
          </div>

          {/* Store Product Cards Grid */}
          <Show
            when={filteredProducts().length > 0}
            fallback={
              <EmptyState
                title={`No ${store()?.categoryName} items yet`}
                description="Tap 'Add Item' above to list products with photos and pricing."
                action={<Button onClick={openCreateModal}>+ Add First Item</Button>}
              />
            }
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <For each={filteredProducts()}>
                {(prod, idx) => (
                  <div
                    style={{ '--item-delay': `${Math.min(idx(), 10) * 48}ms` }}
                    class="item-card-reveal group bg-white rounded-2xl border border-[#E2EBF8] hover:border-[#93C5FD] p-3.5 flex gap-3.5 shadow-xs hover:shadow-[0_12px_24px_rgba(0,102,255,0.1)] transition-all duration-300 hover:-translate-y-1"
                  >
                    <div class="relative w-20 h-20 rounded-xl overflow-hidden bg-[#F8FAFD] border border-[#E2E8F0] shrink-0">
                      <ImageWithFallback
                        src={prod.images?.[0]}
                        alt={prod.name}
                        class="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                      <div aria-hidden="true" class="item-shine-layer" />
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div class="flex items-start justify-between gap-2">
                          <h3 class="text-sm font-extrabold text-[#0D1B3E] group-hover:text-[#0066FF] line-clamp-1 transition-colors">
                            {prod.name}
                          </h3>
                          <span class="text-xs font-extrabold text-[#0066FF] tabular-nums shrink-0">
                            {formatCurrency(
                              prod.discountPrice > 0 ? prod.discountPrice : prod.price
                            )}
                          </span>
                        </div>
                        <p class="text-[11px] text-[#64748B] mt-0.5">
                          {prod.subcategoryLabel || store()?.categoryName} · Stock: {prod.stock}
                        </p>
                      </div>

                      <div class="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            platformActions.updateProduct(prod.id, { available: !prod.available })
                          }
                          class={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-transform active:scale-95 ${
                            prod.available && prod.stock > 0
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : 'bg-[#FEE2E2] text-[#DC2626]'
                          }`}
                        >
                          {prod.available && prod.stock > 0 ? 'In Stock' : 'Hidden'}
                        </button>

                        <div class="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            aria-label="Edit item"
                            class="w-8 h-8 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0066FF] inline-flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                          >
                            <Edit2 class="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod)}
                            aria-label="Delete item"
                            class="w-8 h-8 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] inline-flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* Add Subcategory Modal */}
      <Modal
        open={categoryModal()}
        onClose={() => setCategoryModal(false)}
        title={`Add Subcategory to ${store()?.categoryName}`}
      >
        <form onSubmit={handleAddSubcategory} class="space-y-4">
          <TextField
            label="Subcategory Name"
            value={newSubName()}
            onInput={(e) => setNewSubName(e.currentTarget.value)}
            placeholder="e.g. Ethnic Wear, Footwear, Accessories"
          />
          <div class="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCategoryModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Category</Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Item Modal */}
      <Modal
        open={modalOpen()}
        onClose={() => setModalOpen(false)}
        title={editingId() ? 'Edit Store Item' : `Add ${store()?.categoryName} Item`}
        size="lg"
      >
        <form onSubmit={handleSaveProduct} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <TextField
              label="Item Name"
              value={form().name}
              onInput={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
              placeholder="e.g. Cotton Kurti Set"
              error={errors().name}
            />
            <SelectField
              label="Subcategory"
              value={form().subcategoryId}
              onChange={(e) => setForm((f) => ({ ...f, subcategoryId: e.currentTarget.value }))}
            >
              <For each={storeCategory()?.subcategories || []}>
                {(sub) => <option value={sub.id}>{sub.name}</option>}
              </For>
            </SelectField>
            <TextField
              label="Regular Price (₹)"
              type="number"
              value={form().price}
              onInput={(e) => setForm((f) => ({ ...f, price: e.currentTarget.value }))}
              error={errors().price}
            />
            <TextField
              label="Offer Price (₹)"
              type="number"
              value={form().discountPrice}
              onInput={(e) => setForm((f) => ({ ...f, discountPrice: e.currentTarget.value }))}
            />
            <TextField
              label="Stock Quantity"
              type="number"
              value={form().stock}
              onInput={(e) => setForm((f) => ({ ...f, stock: e.currentTarget.value }))}
              error={errors().stock}
            />
            <TextField
              label="Variations (Label:PriceDelta)"
              value={form().variationsText}
              onInput={(e) => setForm((f) => ({ ...f, variationsText: e.currentTarget.value }))}
            />
          </div>

          <TextAreaField
            label="Description"
            rows={2}
            value={form().description}
            onInput={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))}
          />

          <div class="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFD] border border-[#DDE6F2]">
            <ImageWithFallback
              src={form().image}
              alt="Preview"
              class="w-14 h-14 rounded-lg object-cover border border-[#CBD8EC]"
            />
            <label class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066FF] cursor-pointer hover:underline">
              <Upload class="w-4 h-4" />
              <span>Upload Item Image</span>
              <input type="file" accept="image/*" class="hidden" onChange={handleImageFile} />
            </label>
          </div>

          <div class="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingId() ? 'Save Changes' : 'Publish Item'}</Button>
          </div>
        </form>
      </Modal>
    </SupplierLayout>
  );
}
