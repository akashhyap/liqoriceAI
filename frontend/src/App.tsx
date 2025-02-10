import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import theme from './theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SuperAdminRoutes from './routes/superAdminRoutes';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import FullScreenChat from './pages/FullScreenChat';
import DashboardPage from './pages/DashboardPage';
import ChatbotSettingsPage from './pages/ChatbotSettingsPage';
import ProfilePage from './pages/ProfilePage';
import ChatbotTrainingPage from './pages/ChatbotTrainingPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import ChatbotDeployPage from './pages/ChatbotDeployPage';
import StandaloneChatPage from './pages/StandaloneChatPage';
import LandingPage from './pages/LandingPage';
import TrainingDetailsPage from './pages/TrainingDetailsPage';
import ChatbotsPage from './pages/ChatbotsPage';

// Super Admin Components
import SuperAdminLogin from './pages/super-admin/Login';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import Dashboard from './components/super-admin/Dashboard';
import UsersManagement from './components/super-admin/UsersManagement';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <SuperAdminRoutes />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/chat/:chatbotId" element={<StandaloneChatPage />} />

              {/* Protected routes */}
              <Route path="/app" element={<Layout />}>
                <Route element={<ProtectedRoute />}>
                  <Route index element={<Navigate to="/app/dashboard" />} />
                  <Route path="dashboard">
                    <Route index element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="subscription" element={<SubscriptionPage />} />
                  <Route path="chatbots" element={<ChatbotsPage />} />
                  
                  {/* Chatbot specific routes - only accessible through dashboard */}
                  <Route path="chatbot">
                    <Route path="new" element={<ChatbotSettingsPage />} />
                    <Route path=":id/settings" element={<ChatbotSettingsPage />} />
                    <Route path=":id/train" element={<ChatbotTrainingPage />} />
                    <Route path=":id/training/documents/details" element={<TrainingDetailsPage />} />
                    <Route path=":id/deploy" element={<ChatbotDeployPage />} />
                    <Route path=":id/history" element={<ChatHistoryPage />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
