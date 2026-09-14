import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import AgentProfile from './pages/AgentProfile';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Auth from './pages/Auth';
import { AuthModal } from './components/auth/AuthModal';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './context/AuthContext';
import AIAssistant from './pages/AIAssistant';
import AIFloatingWidget from './components/ai/AIFloatingWidget';
import About from './pages/About';


function AppContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Prevent premature redirect by waiting for auth check
  if (authLoading) return null;

  const isAgentOrSeller = user && (
    user.role === 'agent' || 
    user.role === 'seller' || 
    profile?.user_type === 'agent' || 
    profile?.user_type === 'seller'
  );

  return (
    <>
      {isAuthModalOpen && <AuthModal onClose={closeAuthModal} />}

      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={<Landing openAuthModal={openAuthModal} />}
        />

        {/* Auth Routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />

        {/* User Dashboard */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />

        {/* Agent Dashboard */}
        <Route
          path="/agent-dashboard"
          element={isAgentOrSeller ? <AgentDashboard /> : <Navigate to="/login" replace />}
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin-dashboard"
          element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" replace />}
        />

        {/* Properties Page */}
        <Route
          path="/properties"
          element={<Properties />}
        />

        {/* Property Details Page */}
        <Route
          path="/properties/:id"
          element={<PropertyDetails />}
        />

        {/* Public Agent Profile Pages */}
        <Route
          path="/agents/:userId"
          element={<AgentProfile />}
        />
        <Route
          path="/agent/:userId"
          element={<AgentProfile />}
        />

        {/* Legal & Policy Pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />

        {/* SuDomus AI Assistant Routes */}
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/assistant" element={<AIAssistant />} />

        {/* About Page */}
        <Route path="/about" element={<About />} />

        {/* Custom 404 Not Found Catch-all */}
        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      {/* Floating AI Assistant Widget */}
      <AIFloatingWidget />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
