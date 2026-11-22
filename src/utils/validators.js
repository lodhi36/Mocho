export function sanitizeText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function isValidPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

export function isValidOtp(otp) {
  return /^\d{4,6}$/.test(String(otp || '').trim());
}

export function isValidIfsc(ifsc) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(ifsc || '').trim());
}

export function isValidPan(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(String(pan || '').trim());
}

export function validateProductForm(form) {
  const errors = {};
  if (!sanitizeText(form.name, 120)) errors.name = 'Product name is required.';
  if (!form.categoryId) errors.categoryId = 'Select a category.';
  const price = Number(form.price);
  if (!Number.isFinite(price) || price <= 0) errors.price = 'Enter a valid price greater than 0.';
  const discount = Number(form.discountPrice || 0);
  if (discount < 0 || (discount > 0 && discount >= price)) {
    errors.discountPrice = 'Discount price must be lower than regular price.';
  }
  const stock = Number(form.stock);
  if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Stock must be a non-negative integer.';
  return errors;
}

export function validateAddressForm(form) {
  const errors = {};
  if (!sanitizeText(form.label, 40)) errors.label = 'Address label is required (e.g., Home, Office).';
  if (sanitizeText(form.line1, 200).length < 6) errors.line1 = 'Enter complete street address.';
  if (!sanitizeText(form.city, 60)) errors.city = 'City is required.';
  if (!/^\d{5,6}$/.test(String(form.postalCode || '').trim())) {
    errors.postalCode = 'Enter a valid 5 or 6 digit postal code.';
  }
  return errors;
}
