import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ActivePatientProvider } from "./context/ActivePatientContext";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import DoctorLayout from "./layouts/DoctorLayout";
import PatientLayout from "./layouts/PatientLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public Pages
import Landing from "./page/public/Landing";
import Login from "./page/public/Login";
import Signup from "./page/public/Signup";

// Doctor Pages
import DoctorDashboard from "./page/doctor/DoctorDashboard";
import PatientForm from "./page/doctor/PatientForm";
import Patients from "./page/doctor/Patients";
import PatientDetails from "./page/doctor/PatientDetails";
import Detection from "./page/doctor/Detection";
import HeatmapJourney from "./page/doctor/HeatmapJourney";
import ConvoWithDoctor from "./page/doctor/ConvoWithDoctor";
import Settings from "./page/doctor/Settings";
import DoctorChat from "./page/doctor/DoctorChat";
import DoctorAppointments from "./page/doctor/DoctorAppointments";

// Admin Pages
import AdminDashboard from "./page/admin/AdminDashboard";

// Patient Pages
import PatientDashboard from "./page/patient/PatientDashboard";
import FindHospitals from "./page/patient/FindHospitals";
import BookAppointment from "./page/patient/BookAppointment";
import PatientChat from "./page/patient/Chat";
import PatientAppointments from "./page/patient/Results";    // Appointments (was Results)
import PatientReports from "./page/patient/ReportExplainer"; // Reports (was ReportExplainer)
import AIAnalysis from "./page/patient/SubmitData";          // AI Analysis (was SubmitData)
import PatientHistory from "./page/patient/HistoryPage";
import PatientReviews from "./page/patient/Reviews";
import PatientSettings from "./page/patient/PatientSettings";

// Route Guard Component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { userRole } = useAuth();
  
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(userRole)) {
    // Redirect to their respective dashboard if wrong role
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to={userRole === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <ActivePatientProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Doctor Routes */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="patient-form" element={<PatientForm />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patient/:id" element={<PatientDetails />} />
              <Route path="detection" element={<Detection />} />
              <Route path="heatmap-journey" element={<HeatmapJourney />} />
              <Route path="convo-with-dr" element={<ConvoWithDoctor />} />
              <Route path="chat" element={<DoctorChat />} />
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Patient Routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="hospitals" element={<FindHospitals />} />
              <Route path="appointments" element={<PatientAppointments />} />
              <Route path="book" element={<BookAppointment />} />
              <Route path="chat" element={<PatientChat />} />
              <Route path="ai-analysis" element={<AIAnalysis />} />
              <Route path="history" element={<PatientHistory />} />
              <Route path="reviews" element={<PatientReviews />} />
              <Route path="settings" element={<PatientSettings />} />
              {/* Legacy routes redirects */}
              <Route path="results" element={<Navigate to="appointments" replace />} />
              <Route path="explain" element={<Navigate to="ai-analysis" replace />} />
              <Route path="submit" element={<Navigate to="ai-analysis" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
            </Route>

            {/* Default Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ActivePatientProvider>
    </AuthProvider>
  );
};

export default App;
