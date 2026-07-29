import { fetchLookupItems, LOOKUP_TYPES } from "../lookups/api.js";
import { fetchSuppliers } from "../suppliers/api.js";

export const PRODUCT_LOOKUP_FIELDS = [
  "fabrics",
  "eshra",
  "paintings",
  "marble",
  "glass",
];

export function createEmptyProductForm() {
  return {
    productId: "",
    name: "",
    description: "",
    fabrics: [],
    eshra: [],
    paintings: [],
    marble: [],
    glass: [],
    images: "",
    supplierId: "",
  };
}

export function createEmptyProductSelection() {
  return {
    fabrics: "",
    eshra: "",
    paintings: "",
    marble: "",
    glass: "",
    supplier: "",
  };
}

export function sanitizeProductId(value) {
  return value.replace(/[^\d]/g, "");
}

export function validateProductForm(form, { requireProductId = true } = {}) {
  const errors = {};

  if (requireProductId && !form.productId.trim()) {
    errors.productId = "Product ID is required.";
  }

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!form.supplierId?.trim()) {
    errors.supplierId = "Supplier is required.";
  }

  return errors;
}

export async function loadProductFormLists() {
  const [fabrics, eshra, paintings, marble, glass, suppliers] =
    await Promise.all([
      fetchLookupItems(LOOKUP_TYPES[0].api),
      fetchLookupItems(LOOKUP_TYPES[1].api),
      fetchLookupItems(LOOKUP_TYPES[2].api),
      fetchLookupItems(LOOKUP_TYPES[3].api),
      fetchLookupItems(LOOKUP_TYPES[4].api),
      fetchSuppliers(),
    ]);

  return {
    fabrics,
    eshra,
    paintings,
    marble,
    glass,
    suppliers,
  };
}

export function mapProductToEditForm(product) {
  return {
    productId: product.productId?.toString() || "",
    name: product.name || "",
    description: product.description || "",
    fabrics: (product.fabrics || []).map((option) => option._id),
    eshra: (product.eshra || []).map((option) => option._id),
    paintings: (product.paintings || []).map((option) => option._id),
    marble: (product.marble || []).map((option) => option._id),
    glass: (product.glass || []).map((option) => option._id),
    images: product.images || "",
    supplierId: product.supplier?._id || "",
  };
}

export function createProductPayload(form) {
  const payload = {
    productId: parseInt(form.productId, 10),
    name: form.name.trim(),
    description: form.description,
    fabrics: form.fabrics,
    eshra: form.eshra,
    paintings: form.paintings,
    marble: form.marble,
    glass: form.glass,
    images: form.images,
    supplier: form.supplierId,
  };

  return payload;
}

export function createProductUpdatePayload(form) {
  return {
    name: form.name.trim(),
    description: form.description,
    fabrics: form.fabrics,
    eshra: form.eshra,
    paintings: form.paintings,
    marble: form.marble,
    glass: form.glass,
    images: form.images,
    supplier: form.supplierId,
  };
}

export function findOptionName(list, id) {
  return list.find((item) => item._id === id)?.name || id;
}
