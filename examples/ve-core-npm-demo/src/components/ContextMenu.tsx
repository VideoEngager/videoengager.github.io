import { useEffect } from "react";

interface ContextMenuProps {
  contextAttributes: Record<string, string>;
  setContextAttributes: (value: Record<string, string>) => void;
  disabled: boolean;
}

const PRESETS: Record<string, Record<string, string>> = {
  travel: {
    firstName: "Ava Rossi",
    emailAddress: "ava.rossi@example.com",
    phoneNumber: "+39 02 1234 5678",
    sessionId: "ve_travel_001",
    customerId: "PAX-4451",
    caseId: "BOOK-AV-2025-0912",
    productSKU: "TKT-EUR-RT",
    deviceModel: "Web",
    priority: "high",
    locale: "en-GB",
    consentFlag: "true",
    notes: "Unsure about baggage & missed connection rebooking",
  },
  banking: {
    firstName: "John Smith",
    emailAddress: "john.smith@example.com",
    phoneNumber: "+1 555 123 4567",
    sessionId: "ve_bank_001",
    customerId: "CUST-GOLD-22",
    caseId: "LOAN-APP-12345",
    productSKU: "MORT-30Y-FIXED",
    deviceModel: "Web",
    priority: "high",
    locale: "en-US",
    consentFlag: "true",
    notes: "Income doc format question before submission",
  },
  healthcare: {
    firstName: "Sarah Johnson",
    emailAddress: "sarah.j@example.com",
    phoneNumber: "+1 555 987 6543",
    sessionId: "ve_hc_001",
    customerId: "PAT-7741",
    caseId: "APPT-CARDIO-2025-10",
    productSKU: "SPECIALIST-CONSULT",
    deviceModel: "Web",
    priority: "normal",
    locale: "en-US",
    consentFlag: "true",
    notes: "Coverage question for specialist visit",
  },
  telco: {
    firstName: "Mike Chen",
    emailAddress: "mike.chen@example.com",
    phoneNumber: "+1 555 456 7890",
    sessionId: "ve_telco_001",
    customerId: "ACC-55621",
    caseId: "PLAN-UPGRADE-2025-09",
    productSKU: "FAMILY-ULTRA-5G",
    deviceModel: "Router-ACME-9000",
    priority: "high",
    locale: "en-US",
    consentFlag: "true",
    notes: "Confused about fees; router troubleshooting",
  },
  custom: {
    firstName: "Ava Rossi",
    emailAddress: "ava.rossi@example.com",
    phoneNumber: "+39 02 1234 5678",
    sessionId: "ve_demo_001",
    customerId: "CUST-9988",
    caseId: "CASE-2025-0912",
    productSKU: "SKU-12345",
    deviceModel: "Model-X",
    priority: "high",
    locale: "it-IT",
    consentFlag: "true",
    notes: "Video freezes after 2 minutes",
  },
};

const ContextMenu = ({
  contextAttributes,
  setContextAttributes,
  disabled,
}: ContextMenuProps) => {
  // Set default travel preset on mount if contextAttributes is empty
  useEffect(() => {
    if (Object.keys(contextAttributes).length === 0) {
      setContextAttributes(PRESETS.travel);
    }
  }, [contextAttributes, setContextAttributes]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setContextAttributes({
      ...contextAttributes,
      [name]: value,
    });
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS[e.target.value];
    if (preset) {
      setContextAttributes(preset);
    }
  };

  const handleApply = () => {
    // Handle apply logic here
    console.log("Applying context:", contextAttributes);
  };

  return (
    <>
      <details
        id="context-card-container"
        className="ctx-preview"
        open={!disabled}
      >
        <summary>Context</summary>
        <section
          id="context-card"
          aria-label="Demo Context"
          className="ctx-card"
        >
          <header className="ctx-head">
            <div className="ctx-actions">
              <label htmlFor="ctx-preset">Preset:</label>
              <select
                id="ctx-preset"
                onChange={handlePresetChange}
                defaultValue="travel"
                disabled={disabled}
              >
                <option value="travel">Travel / Aviation</option>
                <option value="banking">Banking</option>
                <option value="healthcare">Healthcare</option>
                <option value="telco">Telecom</option>
                <option value="custom">Custom</option>
              </select>
              <button
                id="ctx-apply"
                disabled={disabled}
                type="button"
                title="Apply context to session"
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </header>

          <form id="ctx-form" className="ctx-grid" autoComplete="off">
            <label>
              name
              <input
                disabled={disabled}
                name="firstName"
                value={contextAttributes.firstName || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              email
              <input
                name="emailAddress"
                disabled={disabled}
                value={contextAttributes.emailAddress || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              phone
              <input
                name="phoneNumber"
                disabled={disabled}
                value={contextAttributes.phoneNumber || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              sessionId
              <input
                name="sessionId"
                disabled={disabled}
                value={contextAttributes.sessionId || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              customerId
              <input
                name="customerId"
                disabled={disabled}
                value={contextAttributes.customerId || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              caseId
              <input
                name="caseId"
                disabled={disabled}
                value={contextAttributes.caseId || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              productSKU
              <input
                name="productSKU"
                disabled={disabled}
                value={contextAttributes.productSKU || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              deviceModel
              <input
                name="deviceModel"
                disabled={disabled}
                value={contextAttributes.deviceModel || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              priority
              <select
                name="priority"
                disabled={disabled}
                value={contextAttributes.priority || "high"}
                onChange={handleInputChange}
              >
                <option value="low">low</option>
                <option value="normal">normal</option>
                <option value="high">high</option>
              </select>
            </label>
            <label>
              locale
              <input
                name="locale"
                disabled={disabled}
                value={contextAttributes.locale || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              consentFlag
              <select
                name="consentFlag"
                disabled={disabled}
                value={contextAttributes.consentFlag || "true"}
                onChange={handleInputChange}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
            <label className="ctx-notes">
              notes
              <textarea
                name="notes"
                rows={2}
                disabled={disabled}
                value={contextAttributes.notes || ""}
                onChange={handleInputChange}
              />
            </label>
          </form>
        </section>
      </details>

      <details className="ctx-preview" open>
        <summary>Preview JSON</summary>
        <pre id="ctx-json">{JSON.stringify(contextAttributes, null, 2)}</pre>
      </details>
    </>
  );
};

export default ContextMenu;
