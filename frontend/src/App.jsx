import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import StatusFoundationPage from './pages/StatusFoundationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import OnboardingPage from './pages/OnboardingPage';
import CreatorDirectoryPage from './pages/CreatorDirectoryPage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import BriefDirectoryPage from './pages/BriefDirectoryPage';
import BriefDetailPage from './pages/BriefDetailPage';
import BriefCreatePage from './pages/BriefCreatePage';
import CreatorDashboardPage from './pages/CreatorDashboardPage';
import BrandDashboardPage from './pages/BrandDashboardPage';
import AdminVerificationPage from './pages/AdminVerificationPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public Landing & Diagnostics */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/foundation" element={<StatusFoundationPage />} />

        {/* Authentication & Onboarding Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={['CREATOR', 'BRAND', 'ADMIN']}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Public Discovery & Showcase Routes */}
        <Route path="/creators" element={<CreatorDirectoryPage />} />
        <Route path="/creators/:slug" element={<CreatorProfilePage />} />

        {/* Campaign Briefs Routes */}
        <Route path="/briefs" element={<BriefDirectoryPage />} />
        <Route path="/briefs/:slug" element={<BriefDetailPage />} />
        
        <Route
          path="/briefs/create"
          element={
            <ProtectedRoute allowedRoles={['BRAND', 'ADMIN']}>
              <BriefCreatePage />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected Workspaces */}
        <Route
          path="/creator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['CREATOR', 'ADMIN']}>
              <CreatorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/brand/dashboard"
          element={
            <ProtectedRoute allowedRoles={['BRAND', 'ADMIN']}>
              <BrandDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verification"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminVerificationPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
