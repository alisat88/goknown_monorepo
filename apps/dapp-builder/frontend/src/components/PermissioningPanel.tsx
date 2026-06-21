import React from 'react';
import { Crown, Hammer, Eye, CheckSquare } from 'lucide-react';

const roles = [
  {
    icon: Crown,
    title: 'Owner',
    access: 'Create, edit, and delete dApps. Manage team members and roles. Full access to all builder features, config, and deployment controls.',
  },
  {
    icon: Hammer,
    title: 'Builder',
    access: 'Edit workflows, templates, and API mappings. Cannot delete dApps or manage team permissions. Can submit workflows for review.',
  },
  {
    icon: CheckSquare,
    title: 'Reviewer',
    access: 'Approve or reject workflow submissions. View all config and code previews. Cannot edit workflows or manage team membership.',
  },
  {
    icon: Eye,
    title: 'Viewer',
    access: 'View deployed and preview dApps only. No edit, review, or team-management access. Suitable for stakeholders and demo observers.',
  },
];

const teamMembers = [
  { name: 'Alisa', roles: ['Owner'] },
  { name: 'Mike', roles: ['Architect', 'Reviewer'] },
  { name: 'Connie', roles: ['Reviewer'] },
  { name: 'Chuck', roles: ['Viewer', 'Demo Builder'] },
  { name: 'Dr. Lu', roles: ['Viewer'] },
  { name: 'Dr. Sam', roles: ['Viewer'] },
  { name: 'Fiona', roles: ['Viewer'] },
  { name: 'Leo', roles: ['Viewer'] },
];

function roleBadgeStyle(role: string) {
  if (role === 'Owner') return { color: '#ffcb6b', background: 'rgba(255,203,107,0.12)', border: '1px solid rgba(255,203,107,0.22)' };
  if (role === 'Reviewer' || role === 'Architect') return { color: '#4ee5ff', background: 'rgba(78,229,255,0.1)', border: '1px solid rgba(78,229,255,0.2)' };
  if (role === 'Demo Builder') return { color: '#82aaff', background: 'rgba(130,170,255,0.1)', border: '1px solid rgba(130,170,255,0.2)' };
  return { color: '#9bb6d3', background: 'rgba(155,182,211,0.1)', border: '1px solid rgba(155,182,211,0.18)' };
}

export function PermissioningPanel() {
  return (
    <div className="pane">
      <div className="pane-header">
        <p className="pane-kicker">dApp Permissioning</p>
        <h2 className="pane-title">Roles &amp; access control</h2>
        <p className="pane-desc">
          Every dApp has a role-based permission model. Roles are enforced at the API layer and
          at the UI level. Production permissioning will be backed by a dedicated dApp-level access
          control service.
        </p>
      </div>

      <div className="role-grid">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div key={role.title} className="role-card">
              <div className="role-card-icon">
                <Icon size={20} />
              </div>
              <h3 className="role-card-title">{role.title}</h3>
              <p className="role-card-access">{role.access}</p>
            </div>
          );
        })}
      </div>

      <div className="access-table-wrap">
        <h3 className="access-table-title">Sample access roster</h3>
        <table className="access-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role(s)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.name}>
                <td style={{ fontWeight: 600, color: '#dff4ff' }}>{member.name}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {member.roles.map((r) => (
                      <span
                        key={r}
                        style={{
                          ...roleBadgeStyle(r),
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span style={{ color: '#4ee5ff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ee5ff', display: 'inline-block', opacity: 0.75 }} />
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="perm-note">
        <strong style={{ color: '#dff4ff' }}>Production note:</strong> Production permissioning
        will be backed by a dedicated dApp-level access control service integrated with the
        Permissioning API (<code style={{ fontFamily: 'monospace', color: '#4ee5ff', fontSize: '0.84em' }}>/api/permissions/check-access</code>).
        Role assignments and enforcement are managed out-of-band; this panel is a demo scaffold.
      </div>
    </div>
  );
}
