// src/pages/projects/CreateProjectWizard.jsx
import { useState, useRef, useEffect } from "react";
import Step1ProjectInfo from "./Step1ProjectInfo";
import Step2GatewayConfig from "./Step2GatewayConfig";
import Step3GstInfo from "./Step3GstInfo";
import api from "@/api/axios";

export default function CreateProjectWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState({});
  const errorRef = useRef(null);

  const scrollToError = () => {
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    callbacks: {
      successUrl: "",
      failureUrl: "",
      webhookUrl: "",
    },
    gateways: {},
    gstInfo: null,
  });

  const [showGstModal, setShowGstModal] = useState(false);

  const updateProjectData = (data) => {
    setProjectData((prev) => ({ ...prev, ...data }));
  };

  // VALIDATION FOR STEP 1
  const validateStep1 = () => {
    const invalid = {};
    if (!projectData.name.trim()) invalid.name = true;
    if (!projectData.callbacks.successUrl.trim()) invalid.successUrl = true;
    if (!projectData.callbacks.failureUrl.trim()) invalid.failureUrl = true;

    setInvalidFields(invalid);

    if (Object.keys(invalid).length > 0) {
      setError("Please fill all required fields.");
      scrollToError();
      return false;
    }

    setError("");
    return true;
  };

  // VALIDATION FOR STEP 2
  const validateStep2 = () => {
    if (!Object.keys(projectData.gateways || {}).length) {
      setError("Select at least one gateway and configure it.");
      scrollToError();
      return false;
    }

    for (const [key, g] of Object.entries(projectData.gateways)) {
      if (g.enabled && !g.configured) {
        setError(`Please complete configuration for ${key}.`);
        scrollToError();
        return false;
      }
    }

    setError("");
    return true;
  };

  // VALIDATION FOR STEP 3
  const validateStep3 = () => {
    const g = projectData.gstInfo;
    const invalid = {};

    if (!g?.address) invalid.address = true;
    if (!g?.gstNumber) invalid.gstNumber = true;
    if (!g?.state) invalid.state = true;
    if (!g?.city) invalid.city = true;
    if (!g?.pincode) invalid.pincode = true;

    setInvalidFields(invalid);

    if (Object.keys(invalid).length > 0) {
      setError("Please fill all GST fields.");
      scrollToError();
      return false;
    }

    setError("");
    return true;
  };

  // SUBMIT
  const handleSubmitFinal = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await api.post("/api/projects", projectData);
      const projectId = res?.data?.data?.project?._id;
      window.location.href = `/projects?open=${projectId}`;
    } catch (e) {
      console.error(e);
      setError("Failed to create project. Try again.");
      scrollToError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextFromStep1 = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!validateStep2()) return;
    setShowGstModal(true);
  };

  const handleGstChoice = (choice) => {
    setShowGstModal(false);

    if (choice === "yes") {
      setStep(3);
    } else {
      handleSubmitFinal();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">

      {/* ERROR UI */}
      {error && (
        <div
          ref={errorRef}
          className="mb-6 p-4 text-red-700 bg-red-100 border border-red-300 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* STEPS HEADER */}
      <div className="flex justify-center mb-12 transition-all duration-300">
        <div className="flex items-center gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-col items-center">
              <div
                className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  step >= n ? "bg-black text-white scale-110" : "bg-gray-200 text-gray-500"
                }`}
              >
                {n}
              </div>
              <span className="mt-2 text-sm font-medium">
                {["Project Info", "Gateway Setup", "GST Details"][n - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 transition-all duration-300">

        {step === 1 && (
          <Step1ProjectInfo
            data={projectData}
            update={updateProjectData}
            invalid={invalidFields}
            next={handleNextFromStep1}
          />
        )}

        {step === 2 && (
          <Step2GatewayConfig
            data={projectData}
            update={updateProjectData}
            next={handleNextFromStep2}
            back={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step3GstInfo
            data={projectData}
            update={updateProjectData}
            invalid={invalidFields}
            finish={() => {
              if (!validateStep3()) return;
              handleSubmitFinal();
            }}
            back={() => setStep(2)}
            disabled={isSubmitting}
          />
        )}
      </div>

      {/* GST CHOICE MODAL */}
      {showGstModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[380px] p-8 rounded-2xl shadow-2xl border border-gray-200 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-2">Generate GST Invoice?</h2>
            <p className="text-gray-600 mb-6 text-sm">Enable GST invoicing?</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleGstChoice("no")}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                No
              </button>

              <button
                onClick={() => handleGstChoice("yes")}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900 transition"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
