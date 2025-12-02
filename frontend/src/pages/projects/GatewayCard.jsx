// src/pages/projects/GatewayCard.jsx
import { Check } from "lucide-react";

export default function GatewayCard({
  gatewayKey,
  label,
  value,
  openDrawer,
  onToggle,
}) {
  const enabled = value?.enabled || false;
  const configured = value?.configured || false;

  return (
    <div
      className={`border rounded-2xl p-5 cursor-pointer transition relative
      ${enabled ? "border-indigo-500 shadow-lg" : "border-gray-300 hover:shadow"}
    `}
      onClick={() => {
        if (enabled) openDrawer(gatewayKey);
      }}
    >

      {/* Header + Toggle */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{label}</h3>

        <button
          className={`px-3 py-1 text-sm rounded-full border transition
          ${enabled ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-100 border-gray-300"}
        `}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(gatewayKey, !enabled);

            if (!enabled) {
              // USER JUST ENABLED → OPEN CONFIG IMMEDIATELY
              openDrawer(gatewayKey);
            }
          }}
        >
          {enabled ? "Disable" : "Enable"}
        </button>
      </div>

      {/* Status Text */}
      <p
        className={`text-sm ${
          configured ? "text-green-600 font-medium" : "text-gray-500"
        }`}
      >
        {configured ? "Configured" : enabled ? "Configure Gateway" : "Not Enabled"}
      </p>
    </div>
  );
}
