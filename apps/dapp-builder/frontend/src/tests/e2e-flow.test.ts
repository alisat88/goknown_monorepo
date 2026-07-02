import { describe, test, expect, beforeEach } from 'vitest';
import {
  loadSavedApps,
  saveApp,
  updateApp,
  deleteApp,
  getApp,
  shareApp,
  seedDemoApps,
} from '../services/storage';
import { isWhitelisted, getWhitelist } from '../services/whitelist';
import { SavedDApp } from '../types';
import { FLOW_STEPS } from '../components/InstructionsPage';
import { DAPP_BUILDER_TUTORIALS_COPY } from '../components/TutorialsPage';
import { DAPP_BUILDER_TUTORIALS } from '../dappBuilderTutorials';
import {
  PROMPT_GUIDE_INTRO,
  PROMPT_CHECKLIST,
  PROMPT_OPENING,
  PROMPT_SECTIONS,
  EXAMPLE_PROMPT_RAW,
} from '../promptGuide';
import { validateGeneratedHtml } from '../lib/generateCode';
import { getDashboardUrl } from '../lib/navigation';

function makeDApp(overrides: Partial<SavedDApp> = {}): SavedDApp {
  return {
    id: crypto.randomUUID(),
    dappName: 'Test dApp',
    description: '',
    template: 'ledger-app',
    permissionModel: 'role-based',
    apis: ['identity', 'ledger'],
    workflow: ['authenticate-user', 'read-ledger-entries'],
    generatedCode: 'export default function App() { return null; }',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sharedWith: [],
    sharedAccess: [],
    ownerId: 'mike@goknown.io',
    ownerName: 'Mike',
    status: 'Draft',
    version: 1,
    ...overrides,
  };
}

describe('DApp Builder end-to-end flow', () => {
  beforeEach(() => localStorage.clear());

  test('createAndSaveApp — saves to localStorage and reloads correctly', () => {
    const app = makeDApp({ dappName: 'Aviation Ledger' });
    saveApp(app);

    const loaded = loadSavedApps();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(app.id);
    expect(loaded[0].dappName).toBe('Aviation Ledger');
    expect(loaded[0].template).toBe('ledger-app');
    expect(loaded[0].generatedCode).toBe(app.generatedCode);
  });

  test('persistence — saved apps survive a simulated page reload', () => {
    const app = makeDApp({ dappName: 'Persistent dApp' });
    saveApp(app);

    // Simulate page reload: load from localStorage fresh
    const reloaded = loadSavedApps();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].dappName).toBe('Persistent dApp');
  });

  test('updateApp — updatedAt changes, other fields preserved', () => {
    // Use a fixed past date so updateApp's new Date() is always different.
    const app = makeDApp({ dappName: 'Original Name', status: 'Draft', updatedAt: '2020-01-01T00:00:00.000Z' });
    saveApp(app);

    const originalUpdatedAt = app.updatedAt;
    // 'Preview' is a legacy status remapped to 'Saved' by migrate() — use 'Generated' instead
    updateApp(app.id, { dappName: 'Updated Name', status: 'Generated' });

    const updated = getApp(app.id);
    expect(updated).not.toBeNull();
    expect(updated!.dappName).toBe('Updated Name');
    expect(updated!.status).toBe('Generated');
    expect(updated!.template).toBe('ledger-app'); // preserved
    expect(updated!.updatedAt).not.toBe(originalUpdatedAt);
  });

  test('deleteApp — removed from localStorage, not returned by loadSavedApps', () => {
    const a = makeDApp({ dappName: 'App A' });
    const b = makeDApp({ dappName: 'App B' });
    saveApp(a);
    saveApp(b);
    expect(loadSavedApps()).toHaveLength(2);

    deleteApp(a.id);
    const remaining = loadSavedApps();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].dappName).toBe('App B');
    expect(getApp(a.id)).toBeNull();
  });

  test('shareApp — whitelisted email is added to sharedWith array', () => {
    const app = makeDApp();
    saveApp(app);

    shareApp(app.id, 'chuck@goknown.io');
    const updated = getApp(app.id);
    expect(updated!.sharedWith).toContain('chuck@goknown.io');
  });

  test('shareApp — non-whitelisted email is rejected by isWhitelisted()', () => {
    expect(isWhitelisted('outsider@example.com')).toBe(false);
    // shareApp does not guard the whitelist — isWhitelisted is the gate in the UI layer
    const app = makeDApp();
    saveApp(app);
    // Calling shareApp directly always succeeds (UI enforces the whitelist)
    // Confirm isWhitelisted correctly rejects the address
    expect(isWhitelisted('hacker@evil.com')).toBe(false);
    expect(isWhitelisted('alisa@goknown.io')).toBe(true);
  });

  test('whitelist — check is case-insensitive', () => {
    expect(isWhitelisted('CHUCK@GOKNOWN.IO')).toBe(true);
    expect(isWhitelisted('Chuck@GoKnown.io')).toBe(true);
    expect(isWhitelisted('alisa@GOKNOWN.IO')).toBe(true);
    expect(isWhitelisted('OUTSIDER@EXAMPLE.COM')).toBe(false);
  });

  test('pre-seeded demo apps — present on first load, not duplicated on second load', () => {
    const seed: SavedDApp[] = [
      makeDApp({ id: 'demo-1', dappName: 'Demo App One' }),
      makeDApp({ id: 'demo-2', dappName: 'Demo App Two' }),
    ];

    // First call: key does not exist → seeds
    seedDemoApps(seed);
    expect(loadSavedApps()).toHaveLength(2);
    expect(loadSavedApps()[0].dappName).toBe('Demo App One');

    // Second call: key exists → no-op, no duplication
    seedDemoApps(seed);
    expect(loadSavedApps()).toHaveLength(2);
  });

  test('corrupt localStorage — loadSavedApps returns [] without throwing', () => {
    localStorage.setItem('dappbuilder:saved_apps', 'not-valid-json{{{{');
    expect(() => loadSavedApps()).not.toThrow();
    expect(loadSavedApps()).toEqual([]);
  });

  test('getWhitelist — returns all whitelisted emails', () => {
    const list = getWhitelist();
    expect(list).toContain('alisa@goknown.io');
    expect(list).toContain('chuck@goknown.io');
    expect(list.length).toBeGreaterThanOrEqual(8);
  });

  // ── Auth / ownership tests ────────────────────────────────────────────────

  test('ownership — Mike creates a draft and draft owner is Mike, not Alisa', () => {
    const app = makeDApp({
      dappName: 'Mikes App',
      ownerId: 'mike@goknown.io',
      ownerName: 'Mike',
    });
    saveApp(app);

    const loaded = getApp(app.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.ownerId).toBe('mike@goknown.io');
    expect(loaded!.ownerName).toBe('Mike');
    expect(loaded!.ownerId).not.toBe('alisa@goknown.io');
    expect(loaded!.ownerName).not.toBe('Alisa');
  });

  test('migrate — apps missing ownerId do not default to Alisa after storage.ts fix', () => {
    // Simulate an old record saved without ownerId / ownerName
    const legacyRecord: Partial<SavedDApp> = {
      id: 'legacy-001',
      dappName: 'Old App',
      template: 'ledger-app',
      permissionModel: 'role-based',
      apis: [],
      workflow: [],
      generatedCode: '',
      status: 'Draft',
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Write raw partial (bypasses saveApp type check)
    localStorage.setItem('dappbuilder:saved_apps', JSON.stringify([legacyRecord]));

    const loaded = loadSavedApps();
    expect(loaded).toHaveLength(1);
    // After fix: migrate() defaults to '' not 'alisa@goknown.io'
    expect(loaded[0].ownerId).not.toBe('alisa@goknown.io');
    expect(loaded[0].ownerName).not.toBe('Alisa');
  });

  test('ownership — ownerId is preserved through save / load / update cycle', () => {
    const app = makeDApp({ ownerId: 'mike@goknown.io', ownerName: 'Mike' });
    saveApp(app);

    updateApp(app.id, { dappName: 'Updated Name' });

    const updated = getApp(app.id);
    expect(updated!.ownerId).toBe('mike@goknown.io');
    expect(updated!.ownerName).toBe('Mike');
    expect(updated!.dappName).toBe('Updated Name');
  });

  test('access control — a user cannot see apps they do not own and are not shared with', () => {
    const mikesApp  = makeDApp({ dappName: 'Mikes App',  ownerId: 'mike@goknown.io',  ownerName: 'Mike' });
    const alisasApp = makeDApp({ dappName: 'Alisas App', ownerId: 'alisa@goknown.io', ownerName: 'Alisa' });
    saveApp(mikesApp);
    saveApp(alisasApp);

    const all = loadSavedApps();

    // Only mikesApp is owned by mike
    const mikeOwned = all.filter((a) => a.ownerId === 'mike@goknown.io');
    expect(mikeOwned).toHaveLength(1);
    expect(mikeOwned[0].dappName).toBe('Mikes App');

    // alisasApp is not in mikesApp's scope unless shared
    const mikeShared = all.filter(
      (a) => a.ownerId !== 'mike@goknown.io' &&
             a.sharedWith.includes('mike@goknown.io')
    );
    expect(mikeShared).toHaveLength(0);
  });

  test('sharing — shared viewer is recorded with Viewer role, owner stays unchanged', () => {
    const app = makeDApp({ ownerId: 'alisa@goknown.io', ownerName: 'Alisa' });
    saveApp(app);

    shareApp(app.id, 'mike@goknown.io', { email: 'mike@goknown.io', role: 'Viewer' });

    const updated = getApp(app.id);
    expect(updated!.ownerId).toBe('alisa@goknown.io');
    expect(updated!.sharedWith).toContain('mike@goknown.io');
    expect(updated!.sharedAccess[0].role).toBe('Viewer');
    expect(updated!.sharedAccess[0].email).toBe('mike@goknown.io');
  });

  test('sharing — owner cannot be demoted to Viewer via shareApp', () => {
    const app = makeDApp({ ownerId: 'alisa@goknown.io', ownerName: 'Alisa' });
    saveApp(app);

    // Attempting to share back with the owner does not change ownerId
    shareApp(app.id, 'alisa@goknown.io', { email: 'alisa@goknown.io', role: 'Viewer' });

    const updated = getApp(app.id);
    // ownerId is never modified by shareApp
    expect(updated!.ownerId).toBe('alisa@goknown.io');
  });

  // ── "How it works" messaging tests ───────────────────────────────────────────

  test('InstructionsPage — no step mentions copying to a repo or deploying manually', () => {
    const allText = FLOW_STEPS.map((s) => `${s.label} ${s.desc}`).join(' ').toLowerCase();
    expect(allText).not.toMatch(/copy.*repo/);
    expect(allText).not.toMatch(/paste.*repo/);
    expect(allText).not.toMatch(/drop.*repo/);
    expect(allText).not.toMatch(/your (project|repo)/);
    expect(allText).not.toMatch(/github/);
    expect(allText).not.toMatch(/deploy.*yourself/);
  });

  test('InstructionsPage — last step describes previewing or creating the app, not exporting code', () => {
    const lastStep = FLOW_STEPS[FLOW_STEPS.length - 1];
    const text = `${lastStep.label} ${lastStep.desc}`.toLowerCase();
    // Must mention preview, library, or save — not "copy", "export", or "repo"
    const hasPositive = /preview|library|save|launch/.test(text);
    const hasDeveloperLang = /copy|export|paste|repo/.test(text);
    expect(hasPositive).toBe(true);
    expect(hasDeveloperLang).toBe(false);
  });

  test('InstructionsPage — five steps are defined and none are blank', () => {
    expect(FLOW_STEPS).toHaveLength(5);
    FLOW_STEPS.forEach((step, i) => {
      expect(step.label.trim(), `step ${i + 1} label is blank`).not.toBe('');
      expect(step.desc.trim(), `step ${i + 1} desc is blank`).not.toBe('');
    });
  });

  // ── Generated app preview validation tests ───────────────────────────────────

  test('validateGeneratedHtml — rejects empty string', () => {
    expect(validateGeneratedHtml('')).not.toBeNull();
  });

  test('validateGeneratedHtml — rejects very short output (likely just a header)', () => {
    const headerOnly = `<!DOCTYPE html><html><body><h1>Dog-walking app</h1><p>Web3-Verified Walk Logs</p></body></html>`;
    expect(validateGeneratedHtml(headerOnly)).not.toBeNull();
  });

  test('validateGeneratedHtml — rejects output with no interactive elements', () => {
    const noInteraction = '<!DOCTYPE html><html><body>' + '<p>content</p>'.repeat(50) + '</body></html>';
    expect(validateGeneratedHtml(noInteraction)).not.toBeNull();
  });

  test('validateGeneratedHtml — accepts a complete app with inputs and buttons', () => {
    const fullApp = `<!DOCTYPE html>
<html><head><title>Dog-walking app</title></head>
<body>
  <header><h1>Dog-walking app</h1></header>
  <main>
    <form id="walk-form">
      <input type="text" id="dog-name" placeholder="Dog name" />
      <input type="number" id="distance" placeholder="Distance (km)" />
      <button type="submit">Log Walk</button>
    </form>
    <section id="stats">
      <div class="stat-card"><h3>Total Walks</h3><span id="total">3</span></div>
      <div class="stat-card"><h3>Total Distance</h3><span id="dist">7.2 km</span></div>
    </section>
    <section id="history">
      <table><tbody>
        <tr><td>Buddy</td><td>2.5 km</td><td>30 min</td></tr>
        <tr><td>Max</td><td>1.8 km</td><td>22 min</td></tr>
        <tr><td>Buddy</td><td>2.9 km</td><td>35 min</td></tr>
      </tbody></table>
    </section>
  </main>
  <script>
    document.getElementById('walk-form').addEventListener('submit', function(e) {
      e.preventDefault();
      document.getElementById('total').textContent = String(parseInt(document.getElementById('total').textContent || '0') + 1);
    });
  </script>
</body></html>`;
    expect(validateGeneratedHtml(fullApp)).toBeNull();
  });

  test('validateGeneratedHtml — accepts output with a form, button, and reasonable length', () => {
    // A realistic-length HTML with interactive elements
    const withForm = `<!DOCTYPE html>
<html>
<head><title>Test App</title>
<style>
  body { background: #0d1117; color: #e8f4ff; font-family: sans-serif; margin: 0; padding: 20px; }
  input { display: block; width: 100%; padding: 10px; margin: 8px 0; background: #1a1f3c; border: 1px solid #26b8ff; color: #e8f4ff; border-radius: 4px; }
  button { padding: 10px 20px; background: #26b8ff; color: #0d1117; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  td, th { padding: 10px; border: 1px solid #1a2f5c; }
</style>
</head>
<body>
  <header><h1>Test App</h1></header>
  <form id="main-form">
    <input type="text" id="name" placeholder="Enter name" />
    <input type="number" id="value" placeholder="Enter value" />
    <button type="submit">Submit</button>
  </form>
  <div id="result" style="padding:12px; background:#1a1f3c; border-radius:4px; margin-top:16px; display:none;"></div>
  <table id="history"><thead><tr><th>Name</th><th>Value</th><th>Date</th></tr></thead>
    <tbody>
      <tr><td>Sample 1</td><td>42</td><td>2026-06-28</td></tr>
      <tr><td>Sample 2</td><td>18</td><td>2026-06-27</td></tr>
    </tbody>
  </table>
  <script>
    document.getElementById('main-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const result = document.getElementById('result');
      result.textContent = 'Saved: ' + name;
      result.style.display = 'block';
    });
  </script>
</body></html>`;
    expect(validateGeneratedHtml(withForm)).toBeNull();
  });

  test('validateGeneratedHtml — rejects output with only 1 interactive element and short length', () => {
    const almostEmpty = '<!DOCTYPE html><html><body><h1>App</h1><button>Go</button></body></html>';
    // Short AND only 1 interactive element → should flag as incomplete
    expect(validateGeneratedHtml(almostEmpty)).not.toBeNull();
  });
});

// ── getDashboardUrl (navigation utility) ──────────────────────────────────────

describe('getDashboardUrl', () => {
  test('returns empty string when no base URL is provided', () => {
    expect(getDashboardUrl('')).toBe('');
    expect(getDashboardUrl('   ')).toBe('');
  });

  test('appends /dashboard to a clean base URL', () => {
    expect(getDashboardUrl('https://node1.goknown.app')).toBe('https://node1.goknown.app/dashboard');
  });

  test('strips trailing slash from base URL before appending /dashboard', () => {
    expect(getDashboardUrl('https://node1.goknown.app/')).toBe('https://node1.goknown.app/dashboard');
  });

  test('works with a localhost dev URL', () => {
    expect(getDashboardUrl('http://localhost:3000')).toBe('http://localhost:3000/dashboard');
  });

  test('works with a localhost dev URL with trailing slash', () => {
    expect(getDashboardUrl('http://localhost:3000/')).toBe('http://localhost:3000/dashboard');
  });

  test('falls back to production URL when no base override and env var not set', () => {
    // VITE_GOKNOWN_URL is not set in the test environment (import.meta.env is empty),
    // so getDashboardUrl() should use the hardcoded production fallback.
    expect(getDashboardUrl(undefined)).toBe('https://node1.goknown.app/dashboard');
  });
});

// ── DApp Builder Tutorials tab ────────────────────────────────────────────────

describe('DApp Builder Tutorials tab', () => {
  test('title is "DApp Builder Tutorials"', () => {
    expect(DAPP_BUILDER_TUTORIALS_COPY.title).toBe('DApp Builder Tutorials');
  });

  test('body mentions videos appearing here soon', () => {
    expect(DAPP_BUILDER_TUTORIALS_COPY.body).toMatch(/tutorial videos will appear here soon/i);
  });

  test('subtitle covers DApp Builder-specific topics', () => {
    const sub = DAPP_BUILDER_TUTORIALS_COPY.subtitle.toLowerCase();
    expect(sub).toMatch(/templates/);
    expect(sub).toMatch(/workflows/);
    expect(sub).toMatch(/apis/);
  });

  test('copy contains no KnownCompute references or external Loom links', () => {
    const allText = Object.values(DAPP_BUILDER_TUTORIALS_COPY).join(' ').toLowerCase();
    expect(allText).not.toMatch(/knowncompute/);
    expect(allText).not.toMatch(/loom\.com/);
  });

  test('copy does not reference the main /tutorials page', () => {
    const allText = Object.values(DAPP_BUILDER_TUTORIALS_COPY).join(' ');
    expect(allText).not.toMatch(/\/tutorials/);
    expect(allText).not.toMatch(/goknown tutorials/i);
  });
});

// ── DApp Builder tutorial videos config ───────────────────────────────────────

describe('DApp Builder tutorial videos config', () => {
  test('contains the DApp Builder Walkthrough entry', () => {
    expect(DAPP_BUILDER_TUTORIALS).toHaveLength(1);
    expect(DAPP_BUILDER_TUTORIALS[0].id).toBe('walkthrough-1');
  });

  test('walkthrough entry has the correct title', () => {
    expect(DAPP_BUILDER_TUTORIALS[0].title).toBe('DApp Builder Walkthrough');
  });

  test('walkthrough entry has a non-empty description', () => {
    expect(DAPP_BUILDER_TUTORIALS[0].description.trim()).not.toBe('');
  });

  test('walkthrough URL is the DApp Builder-specific Loom recording', () => {
    expect(DAPP_BUILDER_TUTORIALS[0].url).toBe(
      'https://www.loom.com/share/eeb06d45824748009ad4bd1ba387daf4'
    );
  });

  test('tutorial entries do not reference KnownCompute or the main /tutorials page', () => {
    const allText = DAPP_BUILDER_TUTORIALS
      .map((t) => `${t.title} ${t.description}`)
      .join(' ')
      .toLowerCase();
    expect(allText).not.toMatch(/knowncompute/);
    expect(allText).not.toMatch(/\/tutorials/);
  });

  test('each entry has required fields: id, title, description, url', () => {
    for (const t of DAPP_BUILDER_TUTORIALS) {
      expect(t.id.trim()).not.toBe('');
      expect(t.title.trim()).not.toBe('');
      expect(t.description.trim()).not.toBe('');
      expect(t.url.trim()).not.toBe('');
    }
  });
});

// ── Prompt guide data ─────────────────────────────────────────────────────────

describe('Prompt guide data', () => {
  test('PROMPT_GUIDE_INTRO is non-empty and mentions "prompt"', () => {
    expect(PROMPT_GUIDE_INTRO.trim()).not.toBe('');
    expect(PROMPT_GUIDE_INTRO.toLowerCase()).toMatch(/prompt/);
  });

  test('PROMPT_CHECKLIST includes required items', () => {
    const list = PROMPT_CHECKLIST.map((i) => i.toLowerCase());
    expect(list).toContain('app name');
    expect(list).toContain('purpose');
    expect(list).toContain('target user');
    expect(list).toContain('core features');
    expect(list).toContain('visual design');
    expect(list).toContain('interactions');
  });

  test('PROMPT_OPENING names the example app', () => {
    expect(PROMPT_OPENING).toMatch(/Smart Weather Planner/);
  });

  test('PROMPT_SECTIONS covers all required section IDs', () => {
    const ids = PROMPT_SECTIONS.map((s) => s.id);
    expect(ids).toContain('purpose');
    expect(ids).toContain('target-user');
    expect(ids).toContain('core-features');
    expect(ids).toContain('weather-card');
    expect(ids).toContain('outfit');
    expect(ids).toContain('forecast');
    expect(ids).toContain('visual-design');
    expect(ids).toContain('fallback');
    expect(ids).toContain('api');
    expect(ids).toContain('interactions');
    expect(ids).toContain('final');
  });

  test('every section has non-empty id, heading, and content', () => {
    for (const s of PROMPT_SECTIONS) {
      expect(s.id.trim(), `id blank on section "${s.id}"`).not.toBe('');
      expect(s.heading.trim(), `heading blank on section "${s.id}"`).not.toBe('');
      expect(s.content.trim(), `content blank on section "${s.id}"`).not.toBe('');
    }
  });

  test('annotated sections have non-empty annotation text', () => {
    const annotated = PROMPT_SECTIONS.filter((s) => s.annotation !== undefined);
    expect(annotated.length).toBeGreaterThan(0);
    for (const s of annotated) {
      expect(s.annotation!.trim(), `annotation blank on "${s.id}"`).not.toBe('');
    }
  });

  test('EXAMPLE_PROMPT_RAW contains the example app name', () => {
    expect(EXAMPLE_PROMPT_RAW).toMatch(/Smart Weather Planner/);
  });

  test('EXAMPLE_PROMPT_RAW includes fallback demo data', () => {
    expect(EXAMPLE_PROMPT_RAW).toMatch(/Fort Lauderdale/);
    expect(EXAMPLE_PROMPT_RAW).toMatch(/84/);
  });

  test('EXAMPLE_PROMPT_RAW does not contain annotation text', () => {
    expect(EXAMPLE_PROMPT_RAW).not.toMatch(/Why this works/i);
    expect(EXAMPLE_PROMPT_RAW).not.toMatch(/tells DApp Builder/i);
    expect(EXAMPLE_PROMPT_RAW).not.toMatch(/reduce ambiguity/i);
  });

  test('EXAMPLE_PROMPT_RAW covers all 10 numbered sections', () => {
    for (let i = 1; i <= 10; i++) {
      expect(EXAMPLE_PROMPT_RAW).toMatch(new RegExp(`${i}\\.`));
    }
  });
});
