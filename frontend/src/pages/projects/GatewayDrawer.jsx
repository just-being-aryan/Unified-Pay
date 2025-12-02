// src/pages/projects/GatewayDrawer.jsx
import { X, Trash2 } from "lucide-react";

export default function GatewayDrawer({
  open,
  onClose,
  gatewayKey,
  gatewayLabel,
  fields,
  baseFields,
  onChange,
  markConfigured,
}) {
  if (!open) return null;

  const customFields = Object.entries(fields).filter(
    ([key]) => !baseFields.includes(key)
  );

  const deleteField = (key) => {
    const newFields = { ...fields };
    delete newFields[key];
    onChange("__replace_all__", newFields);
  };

  const validateFields = () => {
    // BASE fields
    for (let f of baseFields) {
      if (!fields[f] || fields[f].trim() === "") {
        alert(`Missing required field: ${f}`);
        return false;
      }
    }

    // CUSTOM fields
    for (let [key, val] of Object.entries(fields)) {
      if (val.trim() === "") {
        alert(`Custom field "${key}" cannot be empty`);
        return false;
      }
    }

    return true;
  };

  const handleDone = () => {
    if (!validateFields()) return;

    // Tell Step2 that this gateway is configured
    markConfigured(gatewayKey);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[420px] bg-white rounded-2xl shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto">

        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        <h2 className="text-2xl font-semibold mb-4">{gatewayLabel} Settings</h2>

        <div className="space-y-4">

          {/* Required fields */}
          {baseFields.map((key) => (
            <div key={key}>
              <label className="block text-sm text-gray-600 mb-1">{key}</label>
              <input
                value={fields[key] || ""}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder={key}
              />
            </div>
          ))}

          {/* Custom fields */}
          {customFields.map(([key, val]) => (
            <div key={key} className="relative">
              <label className="block text-sm text-gray-600 mb-1">{key}</label>
              <input
                value={val}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />

              <button
                className="absolute right-2 top-[38px] text-red-500 hover:text-red-700"
                onClick={() => deleteField(key)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button
            className="text-indigo-600 text-sm"
            onClick={() => {
              const key = prompt("Enter key name:");
              if (!key) return;
              onChange(key, "");
            }}
          >
            + Add custom field
          </button>

          <div className="pt-6 flex justify-end">
            <button
              onClick={handleDone}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
