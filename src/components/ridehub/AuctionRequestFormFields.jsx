"use client";

import { LocalImagePreviewGrid } from "@/components/ridehub/AuctionGallery";
import { computeSellerCreditPreview } from "@/lib/auctionFees";
import { getEnabledAuctionRequestFields } from "@/lib/auctionRequestFields";

const CURRENCIES = [
  { code: "PKR", label: "Pakistani Rupee (PKR)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
];

function FieldLabel({ children, required = false }) {
  return (
    <span className="field-label-row">
      {children}
      {required ? <span className="field-tag required">Required</span> : <span className="field-tag optional">Optional</span>}
    </span>
  );
}

function FeePreviewPanel({ amount, feePercent, currency, formatMoney, label }) {
  const preview = computeSellerCreditPreview(amount, feePercent);
  if (!preview.base) return null;

  return (
    <div className="fee-preview-panel">
      <p className="section-kicker">{label}</p>
      <div className="fee-preview-grid">
        <span>Price / bid: {formatMoney(preview.base, currency)}</span>
        <span>
          Seller fee ({preview.feePercent}%): {formatMoney(preview.sellerFee, currency)}
        </span>
        <strong>You receive if sold: {formatMoney(preview.sellerCreditAmount, currency)}</strong>
      </div>
    </div>
  );
}

export function AuctionRequestFormFields({
  fields,
  slotForm,
  setSlotForm,
  slotImages,
  setSlotImages,
  cnicImage,
  setCnicImage,
  registeredOnCnic,
  setRegisteredOnCnic,
  categories,
  stores,
  platformSettings,
  formatMoney,
}) {
  const enabledFields = getEnabledAuctionRequestFields(fields);
  const showHighestFee = enabledFields.some((field) => field.id === "highest_price");
  const showLowestFee = enabledFields.some((field) => field.id === "lowest_price");

  return (
    <>
      {enabledFields.map((field) => {
        const labelClass = field.fullWidth ? "full-span" : undefined;

        if (field.id === "category_id") {
          return (
            <label className={labelClass} key={field.id}>
              <FieldLabel required={field.required}>{field.label}</FieldLabel>
              <select value={slotForm.category_id} onChange={(e) => setSlotForm((c) => ({ ...c, category_id: e.target.value }))}>
                <option value="">{field.placeholder || "Select category"}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.id === "currency") {
          return (
            <label className={labelClass} key={field.id}>
              <FieldLabel required={field.required}>{field.label}</FieldLabel>
              <select value={slotForm.currency} onChange={(e) => setSlotForm((c) => ({ ...c, currency: e.target.value }))}>
                {CURRENCIES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.id === "store_id") {
          return (
            <label className={labelClass} key={field.id}>
              <FieldLabel required={field.required}>{field.label}</FieldLabel>
              <select
                value={slotForm.store_id}
                onChange={(e) => {
                  const store = stores.find((s) => String(s._id) === e.target.value);
                  setSlotForm((c) => ({
                    ...c,
                    store_id: e.target.value,
                    city: store?.location?.city || c.city,
                  }));
                }}
              >
                <option value="">{field.placeholder || "Select store"}</option>
                {stores.map((store) => (
                  <option key={store._id} value={store._id}>
                    {store.storeName} — {store.location?.city}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (field.id === "item_images") {
          const minCount = field.minCount || 4;
          return (
            <div className="full-span" key={field.id}>
              <label>
                <FieldLabel required={field.required}>{field.label}</FieldLabel>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.bmp" multiple onChange={(e) => setSlotImages(Array.from(e.target.files || []))} />
                <small className="field-hint">JPG, PNG, WEBP, GIF, HEIC, or BMP — at least {minCount} photos.</small>
                <small className={`field-hint${slotImages.length >= minCount ? " field-hint-ok" : " field-hint-warn"}`}>
                  {slotImages.length >= minCount
                    ? `${slotImages.length} photos selected — ready.`
                    : `${slotImages.length} selected — add ${minCount - slotImages.length} more photo${minCount - slotImages.length === 1 ? "" : "s"}.`}
                </small>
              </label>
              <LocalImagePreviewGrid files={slotImages} label="Selected upload preview" />
            </div>
          );
        }

        if (field.id === "cnic_image") {
          return (
            <label className="full-span" key={field.id}>
              <FieldLabel required={field.required}>{field.label}</FieldLabel>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.bmp" onChange={(e) => setCnicImage(e.target.files?.[0] || null)} />
              <small className={`field-hint${cnicImage ? " field-hint-ok" : " field-hint-warn"}`}>
                {cnicImage ? `Selected: ${cnicImage.name}` : field.placeholder || "Upload a photo of your CNIC."}
              </small>
            </label>
          );
        }

        if (field.id === "registered_on_cnic") {
          return (
            <label className="full-span checkbox-row" key={field.id}>
              <input
                checked={registeredOnCnic}
                name="registered_on_cnic"
                onChange={(e) => setRegisteredOnCnic(e.target.checked)}
                type="checkbox"
                value="true"
              />
              <span>
                <strong>{field.label}</strong>
                {field.placeholder ? <small className="muted-copy">{field.placeholder}</small> : null}
              </span>
            </label>
          );
        }

        if (field.type === "textarea") {
          return (
            <label className={labelClass || "full-span"} key={field.id}>
              <FieldLabel required={field.required}>{field.label}</FieldLabel>
              <textarea
                placeholder={field.placeholder}
                rows={2}
                value={slotForm[field.id] || ""}
                onChange={(e) => setSlotForm((c) => ({ ...c, [field.id]: e.target.value }))}
              />
            </label>
          );
        }

        if (field.type === "number") {
          return (
            <label className={labelClass} key={field.id}>
              <FieldLabel required={field.required}>{field.label}</FieldLabel>
              <input
                min="1"
                placeholder={field.placeholder}
                type="number"
                value={slotForm[field.id] || ""}
                onChange={(e) => setSlotForm((c) => ({ ...c, [field.id]: e.target.value }))}
              />
            </label>
          );
        }

        return (
          <label className={labelClass} key={field.id}>
            <FieldLabel required={field.required}>{field.label}</FieldLabel>
            <input
              placeholder={field.placeholder}
              value={slotForm[field.id] || ""}
              onChange={(e) => setSlotForm((c) => ({ ...c, [field.id]: e.target.value }))}
            />
          </label>
        );
      })}

      {showHighestFee && slotForm.highest_price ? (
        <div className="full-span">
          <FeePreviewPanel
            amount={slotForm.highest_price}
            currency={slotForm.currency}
            feePercent={platformSettings.seller_fee_percent ?? 5}
            formatMoney={formatMoney}
            label={`If sold at highest price (${formatMoney(Number(slotForm.highest_price), slotForm.currency)})`}
          />
        </div>
      ) : null}

      {showLowestFee && showHighestFee && slotForm.lowest_price && slotForm.lowest_price !== slotForm.highest_price ? (
        <div className="full-span">
          <FeePreviewPanel
            amount={slotForm.lowest_price}
            currency={slotForm.currency}
            feePercent={platformSettings.seller_fee_percent ?? 5}
            formatMoney={formatMoney}
            label={`If sold at lowest price (${formatMoney(Number(slotForm.lowest_price), slotForm.currency)})`}
          />
        </div>
      ) : null}
    </>
  );
}
