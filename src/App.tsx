import React, { JSX, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import './App.css';
import Events from './components/events/Events';
import Auth from './components/auth/Auth';
import EventDetailPage from './pages/event-detail/EventDetailPage';
import CreateEventPage from './pages/create-event/CreateEventPage';
import ManageEventPage from './pages/manage-event/ManageEventPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importar utilidades de testing en desarrollo
if (process.env.NODE_ENV === 'development') {
  import('./utils/testData.js');
}

type AuthAction = 'login' | 'register' | 'logout';

// Home Page Component
function HomePage(): JSX.Element {
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

// Events List Page Component
function EventsPage(): JSX.Element {
  const navigate = useNavigate();

  const handleViewEventDetail = (eventId: string): void => {
    navigate(`/events/${eventId}`);
  };

  return <Events onViewEventDetail={handleViewEventDetail} />;
}

// Event Detail Page Wrapper Component
function EventDetailPageWrapper(): JSX.Element {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const handleBack = (): void => {
    navigate('/events');
  };

  if (!eventId) {
    return <div>Event not found</div>;
  }

  return <EventDetailPage eventId={eventId} onBack={handleBack} />;
}

// Main App Content with Navigation
function AppContent(): JSX.Element {
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, logout, isAuthenticated } = useAuth();

  const handleAuthAction = (action: AuthAction): void => {
    if (action === 'logout') {
      logout();
    } else {
      setAuthMode(action);
      setShowAuthModal(true);
    }
  };

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ cursor: 'pointer' }}>TELESCOPIO</h2>
            </Link>
          </div>
          <div className="nav-menu">
            <Link to="/" className="nav-link">About</Link>
            <Link to="/" className="nav-link">See Demo</Link>
            <Link to="/events" className="nav-link">Events</Link>

            {isAuthenticated ? (
              <>
                <span className="user-greeting">Hello, {user?.name}</span>
                <button onClick={() => handleAuthAction('logout')} className="nav-link nav-button">Logout</button>
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

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/create" element={<CreateEventPage />} />
        <Route path="/events/:eventId/manage" element={<ManageEventPage />} />
        <Route path="/events/:eventId" element={<EventDetailPageWrapper />} />
      </Routes>

      {showAuthModal && (
        <Auth onClose={() => setShowAuthModal(false)} initialMode={authMode} />
      )}
    </div>
  );
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
