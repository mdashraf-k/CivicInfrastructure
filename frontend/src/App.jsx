import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportIssue } from './pages/ReportIssue';
import { NearbyMap } from './pages/NearbyMap';
import { MyReports } from './pages/MyReports';
import { IssueDetails } from './pages/IssueDetails';
import { Profile } from './pages/Profile';

import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { IssueManagementTable } from './pages/IssueManagementTable';
import { AuthorityIssueDetail } from './pages/AuthorityIssueDetail';
import { Analytics } from './pages/Analytics';

// Protected Route Guard Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'AUTHORITY' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return children;
};

// Main App Layout
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Citizen Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="CITIZEN">
              <AppLayout><CitizenDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute requiredRole="CITIZEN">
              <AppLayout><ReportIssue /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/nearby" element={
            <ProtectedRoute requiredRole="CITIZEN">
              <AppLayout><NearbyMap /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/my-reports" element={
            <ProtectedRoute requiredRole="CITIZEN">
              <AppLayout><MyReports /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/issues/:id" element={
            <ProtectedRoute>
              <AppLayout><IssueDetails /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout><Profile /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Authority Protected Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="AUTHORITY">
              <AppLayout><AuthorityDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/issues" element={
            <ProtectedRoute requiredRole="AUTHORITY">
              <AppLayout><IssueManagementTable /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/map" element={
            <ProtectedRoute requiredRole="AUTHORITY">
              <AppLayout><NearbyMap /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/issues/:id" element={
            <ProtectedRoute requiredRole="AUTHORITY">
              <AppLayout><AuthorityIssueDetail /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute requiredRole="AUTHORITY">
              <AppLayout><Analytics /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
