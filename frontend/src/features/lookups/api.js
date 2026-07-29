import {
  deleteJson,
  getJson,
  postJson,
} from "../../shared/api/client.js";

export const LOOKUP_TYPES = [
  { label: "Fabrics", value: "fabrics", api: "/api/fabrics" },
  { label: "Eshra", value: "eshra", api: "/api/eshra" },
  { label: "Paintings", value: "paintings", api: "/api/paintings" },
  { label: "Marbles", value: "marbles", api: "/api/marbles" },
  { label: "Glass", value: "glass", api: "/api/glass" },
];

export function fetchLookupItems(apiBase) {
  return getJson(`${apiBase}/all`);
}

export function createLookupItem(apiBase, payload) {
  return postJson(`${apiBase}/create`, payload);
}

export function deleteLookupItem(apiBase, id) {
  return deleteJson(`${apiBase}/${id}`);
}
