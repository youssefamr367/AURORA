export function sanitizeSupplierPhone(value) {
  return value.replace(/[^\d]/g, "").slice(0, 11);
}

export function validateSupplierForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!form.number.trim()) {
    errors.number = "Phone number is required.";
  } else if (!/^\d{11}$/.test(form.number)) {
    errors.number = "Phone number must be exactly 11 digits.";
  }

  return errors;
}
