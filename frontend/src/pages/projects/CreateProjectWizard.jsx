// src/pages/projects/CreateProjectWizard.jsx
import { useState } from "react";
import Step1ProjectInfo from "./Step1ProjectInfo";
import Step2GatewayConfig from "./Step2GatewayConfig";
import Step3GstInfo from "./Step3GstInfo";
import api from "@/api/axios";

export default function CreateProjectWizard() {
  const [step, setStep] = useState(1);

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

  const handleSubmitFinal = async () => {
    
    console.log('FINAL PROJECT DATA :',projectData)
    try {
      const res = await api.post("/api/projects", projectData);
      const projectId = res.data.data.project._id;
      window.location.href = `/projects/${projectId}`;
    } catch (e) {
      console.error(e);
      alert("Failed to create project");
    }
  };

  const handleNextFromStep2 = () => {
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

      {/* ----------- STEP INDICATOR ----------- */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-8">

          <div className="flex flex-col items-center">
            <div
              className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-semibold
                ${step >= 1 ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
            >
              1
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">
              Project Info
            </span>
          </div>

          <div className="h-[2px] w-10 bg-gray-300" />

          <div className="flex flex-col items-center">
            <div
              className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-semibold
                ${step >= 2 ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
            >
              2
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">
              Gateway Setup
            </span>
          </div>

          <div className="h-[2px] w-10 bg-gray-300" />

          <div className="flex flex-col items-center">
            <div
              className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-semibold
                ${step >= 3 ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
            >
              3
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">
              GST Details
            </span>
          </div>
        </div>
      </div>

      {/* ----------- CONTENT ----------- */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 transition-all duration-300">

        {step === 1 && (
          <Step1ProjectInfo
            data={projectData}
            update={updateProjectData}
            next={() => setStep(2)}
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
            finish={handleSubmitFinal}
            back={() => setStep(2)}
          />
        )}
      </div>

      {/* ----------- GST MODAL ----------- */}
      {showGstModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          
          <div className="bg-white w-[380px] p-8 rounded-2xl shadow-2xl border border-gray-200">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              Generate GST Invoice?
            </h2>

            <p className="text-gray-600 mb-6 text-sm">
              Do you want to enable GST invoicing for this project?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleGstChoice("no")}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
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
