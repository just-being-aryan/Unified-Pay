// src/pages/projects/Step3GstInfo.jsx
import { useState } from "react";

export default function Step3GstInfo({ data, update, finish, back }) {
  const [gst, setGst] = useState({
    address: "",
    gstNumber: "",
    state: "",
    city: "",
    pincode: "",
    kycStatus: "pending",
    signatureImage: null,
  });

  const handleChange = (field, val) => {
    const newData = { ...gst, [field]: val };
    setGst(newData);
    update({ gstInfo: newData });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    handleChange("signatureImage", file);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">GST / Tax Invoice Details</h2>

      <div className="space-y-4">
        <input
          placeholder="Address"
          className="w-full px-3 py-2 border rounded"
          value={gst.address}
          onChange={(e) => handleChange("address", e.target.value)}
        />

        <input
          placeholder="GST Number"
          className="w-full px-3 py-2 border rounded"
          value={gst.gstNumber}
          onChange={(e) => handleChange("gstNumber", e.target.value)}
        />

        <div className="flex gap-4">
          <input
            placeholder="State"
            className="w-full px-3 py-2 border rounded"
            value={gst.state}
            onChange={(e) => handleChange("state", e.target.value)}
          />
          <input
            placeholder="City"
            className="w-full px-3 py-2 border rounded"
            value={gst.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>

        <input
          placeholder="Pincode"
          className="w-full px-3 py-2 border rounded"
          value={gst.pincode}
          onChange={(e) => handleChange("pincode", e.target.value)}
        />

        <select
          className="w-full px-3 py-2 border rounded"
          value={gst.kycStatus}
          onChange={(e) => handleChange("kycStatus", e.target.value)}
        >
          <option value="pending">KYC Pending</option>
          <option value="verified">KYC Verified</option>
          <option value="rejected">KYC Rejected</option>
        </select>

        <div>
          <label className="text-sm">Upload Signature</label>
          <input type="file" accept="image/*" onChange={handleFile} className="mt-1" />
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={back} className="px-6 py-2 bg-gray-200 rounded">
          Back
        </button>

        <button onClick={finish} className="px-6 py-2 bg-indigo-600 text-white rounded">
          Finish
        </button>
      </div>
    </div>
  );
}
