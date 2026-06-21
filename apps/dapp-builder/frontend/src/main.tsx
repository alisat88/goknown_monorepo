import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './builder.css';
import { LandingHero } from './components/LandingHero';
import { BuilderDashboard } from './components/BuilderDashboard';

const logoPath = '/assets/dappbuilder.png';

function App() {
  const [view, setView] = useState<'landing' | 'builder'>('landing');

  return (
    <main className="shell">
      <header className="nav" aria-label="Primary">
        <a
          className="brand"
          href="#home"
          aria-label="DApp Builder home"
          onClick={(e) => {
            e.preventDefault();
            setView('landing');
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            <img src={logoPath} alt="" />
          </span>
          <span className="brand-copy">
            <strong>DApp Builder</strong>
            <span>Decentralized app studio</span>
          </span>
        </a>

        {view === 'landing' ? (
          <nav className="nav-links" aria-label="Page sections">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#contact">Contact</a>
          </nav>
        ) : (
          <div className="nav-links">
            <button className="nav-back-btn" onClick={() => setView('landing')}>
              ← Home
            </button>
          </div>
        )}
      </header>

      {view === 'landing' ? (
        <LandingHero onEnterBuilder={() => setView('builder')} />
      ) : (
        <BuilderDashboard />
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
