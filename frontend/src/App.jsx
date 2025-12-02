import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

import Home from "@/pages/Home";
import Payments from "@/pages/Payments";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFailure from "@/pages/PaymentFailure";
import Dashboard from "@/pages/Dashboard";
import OauthHandler from "@/pages/OauthHandler";

// NEW unified Auth Page
import AuthPage from "@/pages/AuthPage";

// NEW project wizard import
import CreateProjectWizard from "@/pages/projects/CreateProjectWizard";

function App() {
  return (
    <Router>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen pt-[120px]">
        <Navbar />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />

          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />

          {/* OAuth */}
          <Route path="/oauth" element={<OauthHandler />} />

          {/* Payment Redirect Pages */}
          <Route path="/payments/success" element={<PaymentSuccess />} />
          <Route path="/payments/failure" element={<PaymentFailure />} />

          {/* Protected Pages */}
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

         
          {/* Redirect /projects → /projects/create */}
          <Route
            path="/projects"
            element={<Navigate to="/projects/create" replace />}
          />

          {/* The multi-step wizard */}
          <Route
            path="/projects/create"
            element={
              <ProtectedRoute>
                <CreateProjectWizard />
              </ProtectedRoute>
            }
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
