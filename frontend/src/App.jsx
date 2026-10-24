import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Loading from './components/ui/Loading';

// Lazy-load pages for instant initial load and small bundle size
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const FriendDetailPage = lazy(() => import('./pages/FriendDetailPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  return (
    <Suspense fallback={<Loading fullScreen text="Loading Spend-A-Friend..." />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/friends/:id" element={<FriendDetailPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
