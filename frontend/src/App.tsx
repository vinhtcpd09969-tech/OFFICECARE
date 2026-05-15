import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import VerifyEmail from './pages/VerifyEmail';

import LandingLayout from './layouts/LandingLayout';
import Home from './pages/Home';
import Booking from './pages/Booking';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCustomers from './pages/admin/ManageCustomers';
import ManageStaff from './pages/admin/ManageStaff';
import ManageSchedules from './pages/admin/ManageSchedules';
import ManageMedicalRecords from './pages/admin/ManageMedicalRecords';
import ManageServices from './pages/admin/ManageServices';
import ManageEquipment from './pages/admin/ManageEquipment';
import ManagePackages from './pages/admin/ManagePackages';
import AuditLogs from './pages/admin/AuditLogs';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
        </Route>
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Chỉ Lễ tân (2) và Admin (5) được phép truy cập Quản lý Lịch hẹn */}
            <Route element={<ProtectedRoute allowedRoles={[2, 5]} />}>
              <Route path="/appointments" element={<Appointments />} />
            </Route>
          </Route>
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={[5]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/appointments" element={<Appointments />} />
            <Route path="/admin/customers" element={<ManageCustomers />} />
            <Route path="/admin/medical-records" element={<ManageMedicalRecords />} />
            <Route path="/admin/staff" element={<ManageStaff />} />
            <Route path="/admin/schedules" element={<ManageSchedules />} />
            <Route path="/admin/services" element={<ManageServices />} />
            <Route path="/admin/equipment" element={<ManageEquipment />} />
            <Route path="/admin/packages" element={<ManagePackages />} />
            <Route path="/admin/audit" element={<AuditLogs />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
