// src/pages/projects/Step2GatewayConfig.jsx
import { useEffect, useState } from "react";
import GatewayCard from "./GatewayCard";
import GatewayDrawer from "./GatewayDrawer";

export default function Step2GatewayConfig({ data, update, next, back }) {
  // local copy of gateways so we can edit freely and sync back to parent
  const [localGateways, setLocalGateways] = useState(data.gateways || {});
  const [drawerOpen, setDrawerOpen] = useState(null);

  // Keep local copy in sync when parent data changes (e.g., coming from server)
  useEffect(() => {
    setLocalGateways(data.gateways || {});
  }, [data.gateways]);

  // Gateway definitions: label + required base fields
  const gatewayDefinitions = {
    payu: {
      label: "PayU",
      baseFields: ["PAYU_MERCHANT_KEY", "PAYU_MERCHANT_SALT", "PAYU_BASE_URL"],
    },
    cashfree: {
      label: "Cashfree",
      baseFields: ["CASHFREE_APP_ID", "CASHFREE_SECRET_KEY", "CASHFREE_BASE_URL"],
    },
    paytm: {
      label: "Paytm",
      baseFields: [
        "PAYTM_MID",
        "PAYTM_MERCHANT_KEY",
        "PAYTM_MERCHANT_WEBSITE",
        "PAYTM_MERCHANT_INDUSTRY",
        "PAYTM_CHANNEL_ID",
      ],
    },
    paypal: {
      label: "PayPal",
      baseFields: ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET", "PAYPAL_BASE_URL"],
    },
    razorpay: {
      label: "Razorpay",
      baseFields: ["RAZORPAY_TEST_API_KEY", "RAZORPAY_TEST_API_SECRET"],
    },
  };

  // Helper: push local state back up to parent projectData
  const syncToParent = (newGateways) => {
    setLocalGateways(newGateways);
    update({ gateways: newGateways });
  };

  // Toggle enable/disable. If enabling, immediately open drawer to configure.
  const handleToggle = (key, enabled) => {
    const cur = localGateways[key] || { enabled: false, fields: {}, configured: false };
    const updated = {
      ...localGateways,
      [key]: {
        ...cur,
        enabled,
        // If disabling, clear configured flag
        configured: enabled ? cur.configured : false,
        fields: cur.fields || {},
      },
    };

    syncToParent(updated);

    // If user just enabled, open drawer to configure
    if (enabled) {
      setDrawerOpen(key);
    } else {
      // closing: ensure drawer closed if it was open
      if (drawerOpen === key) setDrawerOpen(null);
    }
  };

  // Update a single field for a gateway
  const updateField = (gatewayKey, field, value) => {
    const gw = localGateways[gatewayKey] || { enabled: true, fields: {}, configured: false };
    const newFields = { ...(gw.fields || {}), [field]: value };

    const updated = {
      ...localGateways,
      [gatewayKey]: { ...gw, fields: newFields },
    };

    syncToParent(updated);
  };

  // Replace all fields (used for deleting a custom field)
  const replaceAllFields = (gatewayKey, newFieldsObject) => {
    const gw = localGateways[gatewayKey] || { enabled: true, fields: {}, configured: false };
    const updated = {
      ...localGateways,
      [gatewayKey]: { ...gw, fields: newFieldsObject },
    };
    syncToParent(updated);
  };

  // Called by GatewayDrawer when Done is clicked and validation passed.
  // Sets configured=true and closes drawer.
  const markConfigured = (gatewayKey) => {
    const gw = localGateways[gatewayKey] || { enabled: true, fields: {}, configured: false };
    const updated = {
      ...localGateways,
      [gatewayKey]: { ...gw, configured: true, enabled: true },
    };
    syncToParent(updated);
    setDrawerOpen(null);
  };

  // Called by Drawer on any field change (or replace all)
  const handleDrawerChange = (gatewayKey, fieldOrSpecial, value) => {
    if (fieldOrSpecial === "__replace_all__") {
      replaceAllFields(gatewayKey, value || {});
      return;
    }
    updateField(gatewayKey, fieldOrSpecial, value);
  };

  return (
    <div className="space-y-10">
      <h2 className="text-3xl font-bold text-gray-900">Select Gateways & Configure</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(gatewayDefinitions).map(([key, def]) => {
          const val = localGateways[key] || { enabled: false, fields: {}, configured: false };
          return (
            <GatewayCard
              key={key}
              gatewayKey={key}
              label={def.label}
              value={val}
              onToggle={handleToggle}
              openDrawer={() => setDrawerOpen(key)}
            />
          );
        })}
      </div>

      {/* Drawer modal: only one open at a time */}
      {drawerOpen && (
        <GatewayDrawer
          open={true}
          onClose={() => setDrawerOpen(null)}
          gatewayKey={drawerOpen}
          gatewayLabel={gatewayDefinitions[drawerOpen].label}
          fields={localGateways[drawerOpen]?.fields || {}}
          baseFields={gatewayDefinitions[drawerOpen].baseFields}
          onChange={(field, val) => handleDrawerChange(drawerOpen, field, val)}
          markConfigured={(gwKey) => markConfigured(gwKey)}
        />
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={back}
          className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
        >
          Back
        </button>

        <button
          onClick={next}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
