"use client";

import { normalizeAuctionRequestFields } from "@/lib/auctionRequestFields";

function fieldTypeLabel(type) {
  const labels = {
    category: "Category dropdown",
    currency: "Currency dropdown",
    store: "Store dropdown",
    images: "Photo upload",
    cnic_image: "CNIC upload",
    checkbox: "Checkbox",
    textarea: "Long text",
    number: "Number",
    text: "Text",
  };
  return labels[type] || type;
}

export function AuctionRequestFieldsEditor({ fields, onChange }) {
  function updateField(id, patch) {
    onChange(
      fields.map((field) => {
        if (field.id !== id) return field;
        return { ...field, ...patch };
      })
    );
  }

  return (
    <div className="request-fields-editor">
      {fields.map((field) => (
        <div className="request-field-row" key={field.id}>
          <div className="request-field-row-head">
            <strong>{field.id}</strong>
            <span className="muted-copy">{fieldTypeLabel(field.type)}</span>
            {field.system ? <span className="field-tag required">Core field</span> : null}
          </div>
          <div className="form-grid request-field-row-grid">
            <label>
              Label shown to users
              <input
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                required
              />
            </label>
            <label>
              Placeholder / hint
              <input
                value={field.placeholder || ""}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                placeholder={field.type === "checkbox" ? "Helper text under the checkbox" : "Placeholder text"}
              />
            </label>
            {field.id === "item_images" ? (
              <label>
                Minimum photos
                <input
                  min={1}
                  max={12}
                  type="number"
                  value={field.minCount || 4}
                  onChange={(e) => updateField(field.id, { minCount: Number(e.target.value) || 4 })}
                />
              </label>
            ) : null}
            <label className="checkbox-row request-field-toggle">
              <input
                checked={field.required}
                disabled={field.system}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                type="checkbox"
              />
              <span>Required for submit</span>
            </label>
            <label className="checkbox-row request-field-toggle">
              <input
                checked={field.enabled !== false}
                disabled={field.system}
                onChange={(e) => updateField(field.id, { enabled: e.target.checked })}
                type="checkbox"
              />
              <span>Show on user form</span>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export function buildRequestFieldsFormState(raw) {
  return normalizeAuctionRequestFields(raw);
}
