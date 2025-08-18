import React, { useState } from 'react';
import './App.css';
import Events from './components/Events';

function App() {
  const [currentView, setCurrentView] = useState('home');

  const renderContent = () => {
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
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2 onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>TELESCOPIO</h2>
          </div>
          <div className="nav-menu">
            <button onClick={() => setCurrentView('home')} className="nav-link">About</button>
            <button onClick={() => setCurrentView('home')} className="nav-link">See Demo</button>
            <button onClick={() => setCurrentView('events')} className="nav-link">Events</button>
            <button onClick={() => setCurrentView('register')} className="nav-link nav-button">Register</button>
            <button onClick={() => setCurrentView('login')} className="nav-link nav-button">Login</button>
          </div>
        </div>
      </nav>

      {renderContent()}
    </div>
  );
}

export default App;