import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import TrainerRoute from './components/TrainerRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Facilities from './pages/Facilities';
import FacilitySchedule from './pages/FacilitySchedule';
import Admin from './pages/Admin';
import BookingsManagement from './pages/BookingsManagement';
import TrainerDashboard from './pages/TrainerDashboard';
import Trainers from './pages/Trainers';
import TrainerDetails from './pages/TrainerDetails';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/facilities" replace />} />
              <Route path="/facilities" element={<Facilities />} />
              <Route path="/facilities/:id" element={<FacilitySchedule />} />
              <Route path="/bookings" element={<BookingsManagement />} />
              <Route path="/trainers" element={<Trainers />} />
              <Route path="/trainers/:id" element={<TrainerDetails />} />

              {/* Trainer Routes */}
              <Route element={<TrainerRoute />}>
                <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
