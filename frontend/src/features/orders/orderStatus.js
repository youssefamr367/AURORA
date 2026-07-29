export const ORDER_STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "New", value: "New" },
  { label: "In Manufacturing", value: "manufacturing" },
  { label: "Ready to Move", value: "Done" },
  { label: "Finished", value: "finished" },
];

export const ORDER_TABS = ORDER_STATUS_OPTIONS.filter(
  (option) => option.value !== ""
);

export const ORDER_SLA_EDIT_STATUSES = ["New", "manufacturing", "Done"];
export const ORDER_SLA_LEVELS = [
  { key: "greenDate", label: "Green date", tone: "green" },
  { key: "orangeDate", label: "Orange date", tone: "orange" },
  { key: "redDate", label: "Red date", tone: "red" },
];

export function getStatusDate(order) {
  if (!order?.statusHistory?.length) {
    return order?.createdAt;
  }

  const currentStatusEntries = order.statusHistory
    .filter((entry) => entry.status === order.status)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return currentStatusEntries.length > 0
    ? currentStatusEntries[0].date
    : order.createdAt;
}

function parseDateEnd(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatDate(value) {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toInputDateValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function sanitizeDate(value) {
  return value?.trim?.() ?? value ?? "";
}

export function getStatusDeadline(order, status = order?.status) {
  return order?.statusSla?.[status] || null;
}

export function getStatusColor(order) {
  if (!order) return "";

  const sla = getStatusDeadline(order);
  if (!sla) return "";

  const greenDate = parseDateEnd(sla.greenDate);
  const orangeDate = parseDateEnd(sla.orangeDate);
  const redDate = parseDateEnd(sla.redDate);
  if (!greenDate || !orangeDate || !redDate) return "";

  const now = new Date();

  if (now <= greenDate) return "bg-green-200";
  if (now <= orangeDate) return "bg-orange-200";
  if (now <= redDate) return "bg-red-200";
  return "bg-red-200";
}

export function isOverdue(order) {
  const sla = getStatusDeadline(order);
  const redDate = parseDateEnd(sla?.redDate);
  if (!redDate) return false;
  return new Date() > redDate;
}

export function normalizeStatusSla(raw) {
  const out = {};

  for (const status of ORDER_SLA_EDIT_STATUSES) {
    const greenDate = sanitizeDate(raw?.[status]?.greenDate);
    const orangeDate = sanitizeDate(raw?.[status]?.orangeDate);
    const redDate = sanitizeDate(raw?.[status]?.redDate);

    if (!greenDate && !orangeDate && !redDate) continue;

    out[status] = { greenDate, orangeDate, redDate };
  }

  return Object.keys(out).length ? out : undefined;
}

export function createStatusSlaDraft(statusSla) {
  const base = statusSla || {};
  const ensure = (status) => ({
    greenDate: toInputDateValue(base[status]?.greenDate),
    orangeDate: toInputDateValue(base[status]?.orangeDate),
    redDate: toInputDateValue(base[status]?.redDate),
  });

  return {
    New: ensure("New"),
    manufacturing: ensure("manufacturing"),
    Done: ensure("Done"),
  };
}

export function getStatusSlaValidation(sla, minDate = "") {
  const greenDate = sanitizeDate(sla?.greenDate);
  const orangeDate = sanitizeDate(sla?.orangeDate);
  const redDate = sanitizeDate(sla?.redDate);

  if (!greenDate || !orangeDate || !redDate) {
    return {
      valid: false,
      message: "Set green, orange, and red dates for this status.",
    };
  }

  if (minDate && greenDate < minDate) {
    return {
      valid: false,
      message: "Green date cannot be earlier than today.",
    };
  }

  if (orangeDate <= greenDate) {
    return {
      valid: false,
      message: "Orange date must be after the green date.",
    };
  }

  if (redDate <= orangeDate) {
    return {
      valid: false,
      message: "Red date must be after the orange date.",
    };
  }

  return { valid: true, message: "" };
}

export function formatStatusDeadline(value) {
  if (!value) return "Not set";

  return [
    `Green ${formatDate(value.greenDate)}`,
    `Orange ${formatDate(value.orangeDate)}`,
    `Red ${formatDate(value.redDate)}`,
  ].join("  |  ");
}

export function getOrderStatusActions(status) {
  const actions = [];

  if (status === "New") {
    actions.push({
      label: "Move to Manufacturing",
      next: "manufacturing",
      needsSla: true,
    });
  } else if (status === "manufacturing") {
    actions.push({ label: "Back to New", next: "New", needsSla: true });
    actions.push({
      label: "Move to Ready",
      next: "Done",
      needsSla: true,
    });
  } else if (status === "Done") {
    actions.push({
      label: "Back to Manufacturing",
      next: "manufacturing",
      needsSla: true,
    });
    actions.push({
      label: "Mark as Finished",
      next: "finished",
      needsSla: false,
    });
  } else if (status === "finished") {
    actions.push({ label: "Back to Ready", next: "Done", needsSla: true });
  }

  return actions;
}
