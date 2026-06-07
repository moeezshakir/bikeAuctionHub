export const DEFAULT_AUCTION_REQUEST_FIELDS = [
  {
    id: "category_id",
    label: "Category",
    placeholder: "Select category",
    type: "category",
    required: true,
    enabled: true,
    fullWidth: false,
    system: true,
  },
  {
    id: "currency",
    label: "Currency",
    placeholder: "",
    type: "currency",
    required: true,
    enabled: true,
    fullWidth: false,
    system: true,
  },
  {
    id: "item_title",
    label: "Listing title",
    placeholder: "e.g. Honda CD 70 2021 — leave blank to use make + model",
    type: "text",
    required: false,
    enabled: true,
    fullWidth: true,
    system: false,
  },
  {
    id: "bike_make",
    label: "Make / brand",
    placeholder: "e.g. Honda",
    type: "text",
    required: true,
    enabled: true,
    fullWidth: false,
    system: false,
  },
  {
    id: "bike_model",
    label: "Model",
    placeholder: "e.g. CD 70",
    type: "text",
    required: true,
    enabled: true,
    fullWidth: false,
    system: false,
  },
  {
    id: "bike_year",
    label: "Year",
    placeholder: "e.g. 2021",
    type: "text",
    required: false,
    enabled: true,
    fullWidth: false,
    system: false,
  },
  {
    id: "bike_engine_cc",
    label: "Engine (CC)",
    placeholder: "e.g. 125",
    type: "text",
    required: false,
    enabled: true,
    fullWidth: false,
    system: false,
  },
  {
    id: "bike_color",
    label: "Color",
    placeholder: "e.g. Red",
    type: "text",
    required: false,
    enabled: true,
    fullWidth: false,
    system: false,
  },
  {
    id: "bike_mileage",
    label: "Mileage (km)",
    placeholder: "e.g. 15000",
    type: "text",
    required: false,
    enabled: true,
    fullWidth: false,
    system: false,
  },
  {
    id: "bike_notes",
    label: "Notes",
    placeholder: "Condition, extras, or anything buyers should know",
    type: "textarea",
    required: false,
    enabled: true,
    fullWidth: true,
    system: false,
  },
  {
    id: "lowest_price",
    label: "Lowest price",
    placeholder: "",
    type: "number",
    required: true,
    enabled: true,
    fullWidth: false,
    system: true,
  },
  {
    id: "highest_price",
    label: "Highest price",
    placeholder: "",
    type: "number",
    required: true,
    enabled: true,
    fullWidth: false,
    system: true,
  },
  {
    id: "cnic_number",
    label: "CNIC number",
    placeholder: "35202-1234567-1",
    type: "text",
    required: true,
    enabled: true,
    fullWidth: false,
    system: true,
  },
  {
    id: "store_id",
    label: "Pickup store",
    placeholder: "Select store",
    type: "store",
    required: true,
    enabled: true,
    fullWidth: false,
    system: true,
  },
  {
    id: "city",
    label: "City",
    placeholder: "Auto-filled from store, or type your city",
    type: "text",
    required: true,
    enabled: true,
    fullWidth: false,
    system: true,
  },
  {
    id: "item_images",
    label: "Item images (minimum 4)",
    placeholder: "",
    type: "images",
    required: true,
    enabled: true,
    fullWidth: true,
    minCount: 4,
    system: true,
  },
  {
    id: "cnic_image",
    label: "CNIC image",
    placeholder: "",
    type: "cnic_image",
    required: true,
    enabled: true,
    fullWidth: true,
    system: true,
  },
  {
    id: "registered_on_cnic",
    label: "Item is registered on my CNIC",
    placeholder: "Required for auction requests.",
    type: "checkbox",
    required: true,
    enabled: true,
    fullWidth: true,
    system: true,
  },
];

const SLOT_FORM_KEYS = {
  item_title: "item_title",
  bike_make: "bike_make",
  bike_model: "bike_model",
  bike_year: "bike_year",
  bike_engine_cc: "bike_engine_cc",
  bike_color: "bike_color",
  bike_mileage: "bike_mileage",
  bike_notes: "bike_notes",
  lowest_price: "lowest_price",
  highest_price: "highest_price",
  cnic_number: "cnic_number",
  city: "city",
  category_id: "category_id",
  currency: "currency",
  store_id: "store_id",
};

function normalizeField(entry, fallback) {
  return {
    id: fallback.id,
    label: String(entry?.label || fallback.label).trim() || fallback.label,
    placeholder: String(entry?.placeholder ?? fallback.placeholder ?? "").trim(),
    type: fallback.type,
    required: entry?.required != null ? Boolean(entry.required) : fallback.required,
    enabled: entry?.enabled === false ? false : fallback.enabled !== false,
    fullWidth: entry?.fullWidth != null ? Boolean(entry.fullWidth) : fallback.fullWidth,
    minCount: Number(entry?.minCount || fallback.minCount || 4),
    system: Boolean(fallback.system),
  };
}

export function normalizeAuctionRequestFields(raw) {
  const overrides = Array.isArray(raw) ? raw : [];
  const byId = new Map(overrides.map((entry) => [entry.id, entry]));

  return DEFAULT_AUCTION_REQUEST_FIELDS.map((fallback) => {
    const merged = normalizeField(byId.get(fallback.id) || {}, fallback);
    if (merged.system) {
      merged.enabled = true;
    }
    return merged;
  });
}

export function getEnabledAuctionRequestFields(fields) {
  return fields.filter((field) => field.enabled !== false);
}

export function buildCreateFormValidation({
  fields,
  slotForm,
  slotImages,
  cnicImage,
  policyAccepted,
  registeredOnCnic,
}) {
  const highest = Number(slotForm.highest_price);
  const lowest = Number(slotForm.lowest_price);
  const pricesValid = Number.isFinite(highest) && Number.isFinite(lowest) && highest > 0 && lowest > 0 && highest >= lowest;
  const enabled = getEnabledAuctionRequestFields(fields);
  const issues = [
    {
      id: "policy",
      label: "Accept the auction policy",
      ok: policyAccepted,
      hint: 'Check the box just above "Submit request" in this form.',
    },
  ];

  for (const field of enabled) {
    if (!field.required) continue;

    if (field.id === "category_id") {
      issues.push({
        id: field.id,
        label: field.label,
        ok: Boolean(slotForm.category_id),
        hint: field.placeholder || "Select a category.",
      });
      continue;
    }

    if (field.id === "currency") {
      issues.push({
        id: field.id,
        label: field.label,
        ok: Boolean(slotForm.currency),
        hint: "Select a currency.",
      });
      continue;
    }

    if (field.id === "store_id") {
      issues.push({
        id: field.id,
        label: field.label,
        ok: Boolean(slotForm.store_id),
        hint: field.placeholder || "Choose a pickup store.",
      });
      continue;
    }

    if (field.id === "lowest_price" || field.id === "highest_price") {
      continue;
    }

    if (field.id === "item_images") {
      const minCount = field.minCount || 4;
      issues.push({
        id: field.id,
        label: field.label,
        ok: slotImages.length >= minCount,
        hint:
          slotImages.length >= minCount
            ? "Enough photos selected."
            : `Upload ${minCount - slotImages.length} more photo${minCount - slotImages.length === 1 ? "" : "s"}.`,
      });
      continue;
    }

    if (field.id === "cnic_image") {
      issues.push({
        id: field.id,
        label: field.label,
        ok: Boolean(cnicImage),
        hint: "Upload a clear photo of your CNIC.",
      });
      continue;
    }

    if (field.id === "registered_on_cnic") {
      issues.push({
        id: field.id,
        label: field.label,
        ok: registeredOnCnic,
        hint: field.placeholder || "Confirm registration on your CNIC.",
      });
      continue;
    }

    const formKey = SLOT_FORM_KEYS[field.id];
    if (formKey) {
      const value = String(slotForm[formKey] || "").trim();
      issues.push({
        id: field.id,
        label: field.label,
        ok: field.id === "cnic_number" ? value.length >= 5 : Boolean(value),
        hint: field.placeholder || `Enter ${field.label.toLowerCase()}.`,
      });
    }
  }

  const priceFields = enabled.filter((field) => field.id === "lowest_price" || field.id === "highest_price");
  if (priceFields.some((field) => field.required)) {
    issues.push({
      id: "prices",
      label: "Lowest and highest price",
      ok: pricesValid,
      hint: "Both prices must be numbers; highest must be greater than or equal to lowest.",
    });
  }

  return {
    ok: issues.every((entry) => entry.ok),
    issues,
  };
}

export function serializeAuctionRequestFieldsApi(fields) {
  return normalizeAuctionRequestFields(fields).map((field) => ({
    id: field.id,
    label: field.label,
    placeholder: field.placeholder,
    required: field.required,
    enabled: field.enabled,
    fullWidth: field.fullWidth,
    minCount: field.minCount || 4,
    system: field.system,
    type: field.type,
  }));
}
