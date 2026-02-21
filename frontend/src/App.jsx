import React, { useEffect } from 'react';
import AuthPage from './features/auth/AuthPage';
import PatientShell from './app/PatientShell';
import ProfessionalShell from './app/ProfessionalShell';
import { useAuth } from './store/useAuth';
import './App.css';

function App() {
  const { isAuthenticated, isLoading, verifyToken, role } = useAuth();

  useEffect(() => { verifyToken(); }, [verifyToken]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f7fb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', border: '3px solid #e2e8f0', borderTopColor: '#06b6d4', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;
  if (role === 'professional') return <ProfessionalShell />;
  return <PatientShell />;
}

export default App;
