import React, { JSX, useState } from 'react';
import './App.css';
import Events from './components/Events';
import Auth from './components/Auth';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importar utilidades de testing en desarrollo
if (process.env.NODE_ENV === 'development') {
  import('./utils/testData.js');
}

type ViewType = 'home' | 'events';
type AuthAction = 'login' | 'register' | 'logout';

function AppContent(): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  
  const { user, logout, isAuthenticated } = useAuth();

  const handleAuthAction = (action: AuthAction): void => {
    if (action === 'logout') {
      logout();
    } else {
      setShowAuthModal(true);
    }
  };

  const renderContent = (): JSX.Element => {
    switch(currentView) {
      case 'events':
        return <Events />;
      case 'home':
      default:
        return (
          <main className="main-content">
            {/* Section 1: WHY? */}
            <section id="why" className="section">
              <div className="section-container">
                <h1 className="section-title">WHY?</h1>
                <div className="section-content">
                  <p>This is the WHY section where we explain the purpose and motivation behind Telescopio.</p>
                </div>
              </div>
            </section>

            {/* Section 2: HOW? */}
            <section id="how" className="section">
              <div className="section-container">
                <h1 className="section-title">HOW?</h1>
                <div className="section-content">
                  <p>This is the HOW section where we explain the process and methodology of Telescopio.</p>
                </div>
              </div>
            </section>

            {/* Section 3: DEMO */}
            <section id="demo" className="section">
              <div className="section-container">
                <h1 className="section-title">DEMO</h1>
                <div className="section-content">
                  <p>This is the DEMO section where we showcase the capabilities of Telescopio.</p>
                </div>
              </div>
            </section>
          </main>
        );
    }
  };

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2 onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>TELESCOPIO</h2>
          </div>
          <div className="nav-menu">
            <button onClick={() => setCurrentView('home')} className="nav-link">About</button>
            <button onClick={() => setCurrentView('home')} className="nav-link">See Demo</button>
            <button onClick={() => setCurrentView('events')} className="nav-link">Events</button>
            
            {isAuthenticated ? (
              <>
                <span className="user-greeting">Hola, {user?.name}</span>
                <button onClick={() => handleAuthAction('logout')} className="nav-link nav-button">Cerrar Sesión</button>
              </>
            ) : (
              <>
                <button onClick={() => handleAuthAction('register')} className="nav-link nav-button">Register</button>
                <button onClick={() => handleAuthAction('login')} className="nav-link nav-button">Login</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {renderContent()}

      {showAuthModal && (
        <Auth onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
