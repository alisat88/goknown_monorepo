import React from 'react';
import { Lock, ShieldCheck, Eye, Crown } from 'lucide-react';
import { SecurityLevel } from '../types';
import { API_COMPONENTS } from '../data';

function SecurityIcon({ level }: { level: SecurityLevel }) {
  if (level === 'admin') return <Crown size={12} />;
  if (level === 'readonly') return <Eye size={12} />;
  if (level === 'dapp') return <ShieldCheck size={12} />;
  return <Lock size={12} />;
}

function securityClass(level: SecurityLevel) {
  const map: Record<SecurityLevel, string> = {
    auth: 'api-security--auth',
    dapp: 'api-security--dapp',
    readonly: 'api-security--readonly',
    admin: 'api-security--admin',
  };
  return map[level];
}

export function ApiComponentLibrary() {
  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">Reusable API Components</p>
        <h2 className="pane-title">Microservice / API library</h2>
        <p className="pane-desc">
          These are the composable API building blocks available to every dApp. Each represents a
          discrete microservice with a defined interface, security contract, and input/output shape.
          Drag any block into your workflow to wire it into your dApp's execution path.
        </p>
      </div>

      <div className="card-grid">
        {API_COMPONENTS.map((api) => (
          <div key={api.id} className="api-card">
            <h3 className="api-card-name">{api.name}</h3>
            <p className="api-card-purpose">{api.purpose}</p>
            <div className="api-endpoint">
              <span style={{ opacity: 0.5 }}>GET</span>
              {api.endpoint}
            </div>
            <p className="api-io">{api.inputOutput}</p>
            <span className={`api-security ${securityClass(api.securityLevel)}`}>
              <SecurityIcon level={api.securityLevel} />
              {api.securityNote}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
