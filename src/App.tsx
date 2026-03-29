import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { BookingForm } from './components/BookingForm';
import { AvailabilityCalendar } from './components/AvailabilityCalendar';
import { Management } from './components/Management';
import { Infrastructure } from './components/Infrastructure';
import { Settings } from './components/Settings';
import { IntroScreen } from './components/IntroScreen';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [introUnmounted, setIntroUnmounted] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 3000); // Wait minimum 3 seconds
    return () => clearTimeout(timer);
  }, []);

  const isReady = !loading && minTimePassed;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'book':
        return <BookingForm />;
      case 'availability':
        return <AvailabilityCalendar />;
      case 'management':
        return <Management />;
      case 'infrastructure':
        return <Infrastructure />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const mainContent = (loading || !isAuthenticated) ? <Auth /> : (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );

  return (
    <>
      {!introUnmounted && (
        <IntroScreen isReady={isReady} onFadeComplete={() => setIntroUnmounted(true)} />
      )}
      {mainContent}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
