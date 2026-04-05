import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Tutorial } from './components/Tutorial';
import { getTutorialSteps } from './tutorial-steps';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, user, updateTutorialRole } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [introUnmounted, setIntroUnmounted] = useState(false);

  // Tutorial state
  const [runTutorial, setRunTutorial] = useState(false);
  const [isReplay, setIsReplay] = useState(false);
  const tutorialTriggered = useRef(false);

  // Expose navigation for cross-component use (e.g. BookingForm success link)
  useEffect(() => {
    (window as any).__navigateTo = (tab: string) => setActiveTab(tab);
    return () => { delete (window as any).__navigateTo; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 3000); // Wait minimum 3 seconds
    return () => clearTimeout(timer);
  }, []);

  // Auto-trigger tutorial when user is authenticated and intro is done
  useEffect(() => {
    if (!user || !introUnmounted || tutorialTriggered.current) return;

    const needsTutorial =
      // First-time user: never seen any tutorial
      !user.tutorialRole ||
      // Role was upgraded: tutorial role doesn't match current role
      user.tutorialRole !== user.role;

    if (needsTutorial) {
      // Small delay so the layout renders and data-tutorial targets are in the DOM
      const timer = setTimeout(() => {
        setIsReplay(false);
        setRunTutorial(true);
        tutorialTriggered.current = true;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user, introUnmounted]);

  const handleTutorialComplete = useCallback(async () => {
    setRunTutorial(false);
    if (user) {
      await updateTutorialRole(user.role);
    }
  }, [user, updateTutorialRole]);

  const handleTutorialSkip = useCallback(async () => {
    setRunTutorial(false);
    if (user) {
      await updateTutorialRole(user.role);
    }
  }, [user, updateTutorialRole]);

  const handleHelpClick = useCallback(() => {
    setIsReplay(true);
    setActiveTab('home');
    // Small delay so the home tab renders before starting the tour
    setTimeout(() => {
      setRunTutorial(true);
    }, 300);
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

  const tutorialSteps = user
    ? getTutorialSteps(user.role, user.tutorialRole, isReplay)
    : [];

  const mainContent = (loading || !isAuthenticated) ? <Auth /> : (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} onHelpClick={handleHelpClick}>
        {renderContent()}
      </Layout>
      <Tutorial
        run={runTutorial}
        steps={tutorialSteps}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    </>
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
