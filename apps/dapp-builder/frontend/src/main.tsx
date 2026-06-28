import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './builder.css';
import { BuilderDashboard } from './components/BuilderDashboard';
import { AuthProvider } from './context/AuthContext';

const logoPath = '/assets/dappbuilder.png';

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
