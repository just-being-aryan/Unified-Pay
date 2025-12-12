// src/pages/projects/GatewayDrawer.jsx
import { useState, useRef, useEffect } from "react";
import { X, Trash2, PlusCircle } from "lucide-react";

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

  const [errors, setErrors] = useState({});
  const firstErrorRef = useRef(null);

  const customFields = Object.entries(fields).filter(
    ([key]) => !baseFields.includes(key)
  );

  // Auto-scroll to the first error
  useEffect(() => {
    if (firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors]);

  const deleteField = (key) => {
    const newFields = { ...fields };
    delete newFields[key];
    onChange("__replace_all__", newFields);
  };

  const validateFields = () => {
    const newErrors = {};

    // Validate base fields
    baseFields.forEach((f) => {
      if (!fields[f] || fields[f].trim() === "") {
        newErrors[f] = `${f} is required`;
      }
    });

    // Validate custom fields
    Object.entries(fields).forEach(([key, val]) => {
      if (!val || val.trim() === "") {
        newErrors[key] = `${key} cannot be empty`;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleDone = () => {
    if (!validateFields()) return;

    markConfigured(gatewayKey);
    onClose();
  };

  const addCustomField = () => {
    const randomKey = `custom_${Date.now()}`;
    onChange(randomKey, "");
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

        <div className="space-y-5">

          {/* BASE FIELDS */}
          {baseFields.map((key) => {
            const hasError = errors[key];
            return (
              <div key={key} ref={hasError && !firstErrorRef.current ? firstErrorRef : null}>
                <label className="block text-sm text-gray-700 mb-1">{key}</label>
                <input
                  value={fields[key] || ""}
                  onChange={(e) => onChange(key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition ${
                    hasError ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder={key}
                />
                {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
              </div>
            );
          })}

          {/* CUSTOM FIELDS */}
          {customFields.map(([key, val]) => {
            const hasError = errors[key];
            return (
              <div key={key} className="relative"
                ref={hasError && !firstErrorRef.current ? firstErrorRef : null}
              >
                <label className="block text-sm text-gray-700 mb-1">{key}</label>

                <input
                  value={val}
                  onChange={(e) => onChange(key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition ${
                    hasError ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                />

                <button
                  className="absolute right-2 top-[38px] text-red-500 hover:text-red-700"
                  onClick={() => deleteField(key)}
                >
                  <Trash2 size={18} />
                </button>

                {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
              </div>
            );
          })}

          {/* ADD CUSTOM FIELD BUTTON */}
          <button
            className="flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-800"
            onClick={addCustomField}
          >
            <PlusCircle size={16} /> Add custom field
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
