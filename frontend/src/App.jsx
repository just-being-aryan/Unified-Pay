import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import UserSDK from "@/pages/UserSDK"
import Home from "@/pages/Home";
import Payments from "@/pages/Payments";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFailure from "@/pages/PaymentFailure";
import Dashboard from "@/pages/Dashboard";
import OauthHandler from "@/pages/OauthHandler";
import ProjectsLayout from "@/pages/projects/ProjectsLayout";
import AuthPage from "@/pages/AuthPage";
import CreateProjectWizard from "@/pages/projects/CreateProjectWizard";
import ProjectTestPaymentPage from "@/pages/projects/ProjectTestPaymentPage";
import ProjectDashboard from "@/pages/projects/ProjectDashboard";

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
          <Route path = "/sdk" element = {<UserSDK/>}/>

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

          {/** ───────────────────────────────────────────────
           *  PROJECTS SYSTEM (WITH SIDEBAR)
           *  `/dashboard/:projectId` = OPEN PROJECT
           *  `/projects` = list
           *  `/projects/create` = STANDALONE WIZARD
           *  ─────────────────────────────────────────────── */}

          {/* PROJECT LIST (SIDEBAR + empty view) */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsLayout />
              </ProtectedRoute>
            }
          />

          {/* PROJECT DASHBOARD (SIDEBAR + PROJECT VIEW) — CORRECT ROUTE */}
          <Route
            path="/dashboard/:projectId"
            element={
              <ProtectedRoute>
                <ProjectsLayout>
                  <ProjectDashboard />
                </ProjectsLayout>
              </ProtectedRoute>
            }
          />

          {/* TEST PAYMENT (still part of project dashboard ecosystem) */}
          <Route
            path="/dashboard/:projectId/test-payment"
            element={
              <ProtectedRoute>
                <ProjectsLayout>
                  <ProjectTestPaymentPage />
                </ProjectsLayout>
              </ProtectedRoute>
            }
          />

          {/* CREATE PROJECT → NO SIDEBAR (STANDALONE PAGE) */}
          <Route
            path="/projects/create"
            element={
              <ProtectedRoute>
                <CreateProjectWizard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectsLayout>
                  <ProjectDashboard />
                </ProjectsLayout>
              </ProtectedRoute>
            }
          />

 
          <Route
          path="/projects/:id/test-payment"
          element={
            <ProtectedRoute>
              <ProjectsLayout>
                <ProjectTestPaymentPage />
              </ProjectsLayout>
            </ProtectedRoute>
          }
        />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
