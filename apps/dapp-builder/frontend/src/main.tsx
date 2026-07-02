import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './builder.css';
import { BuilderDashboard } from './components/BuilderDashboard';
import { AuthProvider } from './context/AuthContext';
import { getDashboardUrl } from './lib/navigation';

const logoPath = '/assets/dappbuilder.png';

function BackToDashboardBtn() {
  const url = getDashboardUrl();
  return (
    <a
      href={url}
      className="nav-back-btn"
      aria-label="Back to DApp Genius dashboard"
    >
      ←&nbsp;<span className="nav-back-label">Back to Dashboard</span>
    </a>
  );
}

function App() {
  return (
    <AuthProvider>
    <main className="shell">
      <header className="nav" aria-label="Primary">
        <div className="brand" aria-label="DApp Builder">
          <span className="brand-mark" aria-hidden="true">
            <img src={logoPath} alt="" />
          </span>
          <span className="brand-copy">
            <strong>DApp Builder</strong>
            <span>Decentralized app studio</span>
          </span>
        </div>
        <BackToDashboardBtn />
      </header>

      <BuilderDashboard />
    </main>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
