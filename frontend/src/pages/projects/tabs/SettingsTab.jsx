// src/pages/projects/tabs/SettingsTab.jsx
import { useState } from "react";
import api from "@/api/axios";

export default function SettingsTab({ project }) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    callbacks: { ...project.callbacks },
    gateways: JSON.parse(JSON.stringify(project.gatewayConfigs || {})),
  });

  const updateField = (path, value) => {
    setForm((prev) => {
      const copy = { ...prev };
      let ref = copy;
      const parts = path.split(".");

      while (parts.length > 1) {
        const p = parts.shift();
        ref[p] = { ...ref[p] };
        ref = ref[p];
      }

      ref[parts[0]] = value;
      return copy;
    });
  };

  const addGateway = (gw) => {
    setForm((prev) => ({
      ...prev,
      gateways: {
        ...prev.gateways,
        [gw]: { enabled: true, config: {} },
      },
    }));
  };

  const removeGateway = (gw) => {
    const copy = { ...form.gateways };
    delete copy[gw];
    setForm((prev) => ({ ...prev, gateways: copy }));
  };

  const save = async () => {
    await api.patch(`/api/projects/${project._id}/settings`, form);
    alert("Settings updated");
    window.location.reload();
  };

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">Project Settings</h2>

      {/* NAME + DESCRIPTION */}
      <div>
        <label className="block mb-1 font-semibold">Project Name</label>
        <input
          className="border p-2 rounded w-full"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />

        <label className="block mt-3 mb-1 font-semibold">Description</label>
        <textarea
          className="border p-2 rounded w-full"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </div>

      {/* CALLBACK URLS */}
      <div className="space-y-2">
        <h3 className="font-semibold">Callback URLs</h3>

        {["successUrl", "failureUrl", "webhookUrl"].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium">{field}</label>
            <input
              className="border p-2 rounded w-full"
              value={form.callbacks[field] || ""}
              onChange={(e) =>
                updateField(`callbacks.${field}`, e.target.value)
              }
            />
          </div>
        ))}
      </div>

      {/* GATEWAYS LIST */}
      <div>
        <h3 className="font-semibold mb-2">Gateways</h3>

        {Object.entries(form.gateways).map(([gw, data]) => (
          <div
            key={gw}
            className="border rounded p-4 mb-3 bg-white shadow-sm"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-lg">{gw.toUpperCase()}</h4>

              <button
                className="text-red-600"
                onClick={() => removeGateway(gw)}
              >
                Remove
              </button>
            </div>

            <div className="mt-2">
              <label className="font-medium">Enabled</label>
              <input
                type="checkbox"
                className="ml-2"
                checked={data.enabled}
                onChange={(e) =>
                  updateField(`gateways.${gw}.enabled`, e.target.checked)
                }
              />
            </div>

            <div className="mt-3 space-y-2">
              {Object.entries(data.config || {}).map(([k, v]) => (
                <div key={k}>
                  <label className="text-sm">{k}</label>
                  <input
                    className="border p-2 rounded w-full"
                    value={v || ""}
                    onChange={(e) =>
                      updateField(`gateways.${gw}.config.${k}`, e.target.value)
                    }
                  />
                </div>
              ))}

              {/* Add new config key */}
              <button
                className="mt-2 text-blue-600"
                onClick={() => {
                  const key = prompt("Enter config field name:");
                  if (key) {
                    updateField(`gateways.${gw}.config.${key}`, "");
                  }
                }}
              >
                + Add Field
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD NEW GATEWAY */}
      <div>
        <select
          className="border p-2 rounded"
          onChange={(e) => {
            if (e.target.value) addGateway(e.target.value);
          }}
        >
          <option value="">Add Gateway...</option>
          <option value="payu">PayU</option>
          <option value="cashfree">Cashfree</option>
          <option value="razorpay">Razorpay</option>
          <option value="paytm">PayTM</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      <button
        onClick={save}
        className="bg-black text-white px-5 py-2 rounded-lg"
      >
        Save Settings
      </button>
    </div>
  );
}
