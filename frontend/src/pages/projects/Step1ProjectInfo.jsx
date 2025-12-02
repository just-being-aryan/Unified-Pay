// src/pages/projects/Step1ProjectInfo.jsx
export default function Step1ProjectInfo({ data, update, next }) {
  const handleChange = (field, value) => {
    update({ [field]: value });
  };

  const handleCallbackChange = (field, value) => {
    update({
      callbacks: { ...data.callbacks, [field]: value },
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Project Information</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm">Project Name</label>
          <input
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="My Store App"
          />
        </div>

        <div>
          <label className="text-sm">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="text-sm">Success URL</label>
          <input
            value={data.callbacks.successUrl}
            onChange={(e) => handleCallbackChange("successUrl", e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="https://yourapp.com/payment/success"
          />
        </div>

        <div>
          <label className="text-sm">Failure URL</label>
          <input
            value={data.callbacks.failureUrl}
            onChange={(e) => handleCallbackChange("failureUrl", e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="https://yourapp.com/payment/failure"
          />
        </div>

        <div>
          <label className="text-sm">Webhook URL</label>
          <input
            value={data.callbacks.webhookUrl}
            onChange={(e) => handleCallbackChange("webhookUrl", e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="https://yourapp.com/api/unipay/webhook"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm">Environment</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="environment"
                value="test"
                checked={data.environment === "test"}
                onChange={() => handleChange("environment", "test")}
              />
              Test
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="environment"
                value="live"
                checked={data.environment === "live"}
                onChange={() => handleChange("environment", "live")}
              />
              Live
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={next}
          className="px-6 py-2 bg-indigo-600 text-white rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
