import React, { useState } from 'react';
import { SavedDApp } from '../types';
import { WORKFLOW_BLOCKS, API_COMPONENTS } from '../data';

// ── App-type inference ───────────────────────────────────────────────────────

type AppType =
  | 'token-dashboard'
  | 'nft-mint'
  | 'dao-voting'
  | 'escrow-payment'
  | 'ledger-app'
  | 'permissioned-workflow'
  | 'weather-outfit'
  | 'travel-planner'
  | 'budget-tracker'
  | 'task-workflow'
  | 'generic';

const KNOWN_TEMPLATE_TYPES: AppType[] = [
  'token-dashboard', 'nft-mint', 'dao-voting',
  'escrow-payment', 'ledger-app', 'permissioned-workflow',
];

export function inferAppType(
  name: string,
  desc: string,
  templateId: string,
  apis?: string[]
): AppType {
  if (KNOWN_TEMPLATE_TYPES.includes(templateId as AppType)) return templateId as AppType;

  // Explicit API selection takes highest priority — user intent is clear
  if (apis?.includes('weather-api') || apis?.includes('outfit-api')) return 'weather-outfit';
  if (apis?.includes('smart-contract') && apis?.includes('wallet')) return 'nft-mint';
  if (apis?.includes('bft') && apis?.includes('permissions')) return 'dao-voting';

  const s = `${name} ${desc}`.toLowerCase();

  if (/weather|outfit|temperature|clothes|clothing|dress|wear|wardrobe/.test(s)) return 'weather-outfit';
  if (/travel|trip|itinerary|destination|vacation|holiday|flight|hotel|tour/.test(s)) return 'travel-planner';
  if (/budget|finance|expense|spending|money|cost|invoice|accounting/.test(s)) return 'budget-tracker';
  if (/task|todo|checklist|project|manage|ticket|issue|board/.test(s)) return 'task-workflow';
  if (/ledger|transaction|payment|transfer|receipt|invoice|history/.test(s)) return 'ledger-app';
  if (/token|balance|wallet|coin|crypto|defi|staking|reward/.test(s)) return 'token-dashboard';
  if (/nft|mint|collection|art|digital asset|creator/.test(s)) return 'nft-mint';
  if (/vote|dao|governance|proposal|quorum/.test(s)) return 'dao-voting';
  if (/escrow|escro|release|condition|settle|multi.party/.test(s)) return 'escrow-payment';
  if (/workflow|approval|permission|access|role|step/.test(s)) return 'permissioned-workflow';

  return 'generic';
}

// ── Connected APIs panel ─────────────────────────────────────────────────────
// Shown in every rendered app to surface which APIs the user selected.

function ConnectedApisPanel({ apis }: { apis: string[] }) {
  if (!apis || apis.length === 0) return null;
  return (
    <Card label="Connected APIs">
      <div className="gen-workflow-chips">
        {apis.map((id) => {
          const meta = API_COMPONENTS.find((a) => a.id === id);
          return (
            <span key={id} className="gen-chip gen-chip--api" title={meta?.purpose}>
              {meta?.name.replace(' (Placeholder)', '').replace(' Adapter API', ' Adapter').replace(' API', '') ?? id}
            </span>
          );
        })}
      </div>
    </Card>
  );
}

// ── Shared tiny helpers ──────────────────────────────────────────────────────

function AppShell({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="gen-app">
      <div className="gen-app-header">{title}</div>
      {desc && <div className="gen-app-desc">{desc}</div>}
      {children}
    </div>
  );
}

function Card({ label, children, result }: { label?: string; children: React.ReactNode; result?: boolean }) {
  return (
    <div className={`gen-card${result ? ' gen-card--result' : ''}`}>
      {label && <div className="gen-card-label">{label}</div>}
      {children}
    </div>
  );
}

function Feedback({ msg }: { msg: string }) {
  return <div className="gen-feedback">{msg}</div>;
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return <span className={`gen-status gen-status--${ok ? 'ok' : 'pending'}`}>{label}</span>;
}

// ── 1. Token Dashboard ───────────────────────────────────────────────────────

function InteractiveTokenDashboard({ name }: { name: string }) {
  const [balance, setBalance] = useState(14_820.5);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHistory, setTxHistory] = useState([
    { id: 'TX-0089', to: '0x9b1...7e4d', amount: 250, status: 'Confirmed' },
    { id: 'TX-0088', to: '0x4f3...2c1a', amount: 100, status: 'Confirmed' },
    { id: 'TX-0087', to: '0xaa2...1f3b', amount: 500, status: 'Confirmed' },
  ]);
  const [feedback, setFeedback] = useState('');

  const handleSend = () => {
    const amt = parseFloat(amount);
    if (!recipient) { setFeedback('Enter a recipient address.'); return; }
    if (isNaN(amt) || amt <= 0) { setFeedback('Enter a valid amount.'); return; }
    if (amt > balance) { setFeedback('Insufficient balance.'); return; }
    const newId = `TX-${String(txHistory.length + 90).padStart(4, '0')}`;
    setBalance((b) => b - amt);
    setTxHistory((prev) => [
      { id: newId, to: recipient.slice(0, 12) + '...', amount: amt, status: 'Confirmed' },
      ...prev,
    ].slice(0, 8));
    setRecipient('');
    setAmount('');
    setFeedback(`✓ Sent ${amt.toLocaleString()} ZTA · kBFT™ confirmed`);
    setTimeout(() => setFeedback(''), 3500);
  };

  return (
    <AppShell title={name}>
      <div className="gen-row">
        <Card>
          <div className="gen-card-label">ZTA Balance</div>
          <div className="gen-card-value">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="gen-card-sub">≈ ${(balance * 0.216).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</div>
        </Card>
        <Card>
          <div className="gen-card-label">Staked</div>
          <div className="gen-card-value gen-card-value--sm">3,200.00</div>
          <div className="gen-card-sub">APY 12.4 %</div>
        </Card>
      </div>
      <Card label="Send ZTA">
        <div className="gen-form-grid gen-form-grid--2col">
          <div className="gen-field gen-field--wide">
            <label className="gen-label">Recipient address</label>
            <input className="gen-input" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </div>
          <div className="gen-field">
            <label className="gen-label">Amount (ZTA)</label>
            <input className="gen-input" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <button className="gen-btn gen-btn--primary" onClick={handleSend}>Send →</button>
        {feedback && <Feedback msg={feedback} />}
      </Card>
      <Card label="Transaction History">
        <table className="gen-table">
          <thead><tr><th>TX ID</th><th>To</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {txHistory.map((tx) => (
              <tr key={tx.id}>
                <td className="gen-mono">{tx.id}</td>
                <td className="gen-mono gen-muted">{tx.to}</td>
                <td>{tx.amount.toLocaleString()} ZTA</td>
                <td><StatusChip ok label={tx.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}

// ── 2. NFT Mint ──────────────────────────────────────────────────────────────

function InteractiveNFTMint({ name }: { name: string }) {
  const [qty, setQty] = useState(1);
  const [totalMinted, setTotalMinted] = useState(42);
  const [feedback, setFeedback] = useState('');
  const [collection, setCollection] = useState([
    { id: '#0042', trait: 'Legendary', rarity: '1.8 %', color: '#ffd700' },
    { id: '#0041', trait: 'Rare',      rarity: '7.2 %', color: '#c490ff' },
    { id: '#0040', trait: 'Uncommon',  rarity: '22.1 %', color: '#4ee5ff' },
    { id: '#0039', trait: 'Common',    rarity: '68.9 %', color: '#7ee87e' },
  ]);

  const TRAITS = ['Common', 'Uncommon', 'Rare', 'Legendary'];
  const RARITY_RANGES = ['55–75 %', '15–30 %', '5–14 %', '0.5–4 %'];
  const COLORS = ['#7ee87e', '#4ee5ff', '#c490ff', '#ffd700'];

  const handleMint = () => {
    const newNFTs = Array.from({ length: qty }, (_, i) => {
      const tierRoll = Math.random();
      const tier = tierRoll < 0.01 ? 3 : tierRoll < 0.08 ? 2 : tierRoll < 0.25 ? 1 : 0;
      return {
        id: `#${String(totalMinted + i + 1).padStart(4, '0')}`,
        trait: TRAITS[tier],
        rarity: RARITY_RANGES[tier],
        color: COLORS[tier],
      };
    });
    setCollection((prev) => [...newNFTs, ...prev].slice(0, 8));
    setTotalMinted((n) => n + qty);
    setFeedback(`✓ Minted ${qty} NFT${qty > 1 ? 's' : ''} · wallet confirmed · kBFT™ logged`);
    setTimeout(() => setFeedback(''), 3500);
  };

  return (
    <AppShell title={name}>
      <div className="gen-row gen-row--center">
        <Card>
          <div className="gen-card-label">Total Minted</div>
          <div className="gen-card-value">{totalMinted}</div>
          <div className="gen-card-sub">of 10,000 max supply</div>
        </Card>
        <Card>
          <div className="gen-card-label">Floor Price</div>
          <div className="gen-card-value gen-card-value--sm">0.08 ETH</div>
          <div className="gen-card-sub">≈ $148 USD</div>
        </Card>
      </div>
      <Card label="Mint NFTs">
        <div className="gen-mint-row">
          <button className="gen-btn gen-btn--sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="gen-qty-display">{qty}</span>
          <button className="gen-btn gen-btn--sm" onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
          <span className="gen-qty-label">NFT{qty > 1 ? 's' : ''}</span>
          <button className="gen-btn gen-btn--primary" onClick={handleMint}>◈ Mint</button>
        </div>
        {feedback && <Feedback msg={feedback} />}
      </Card>
      <Card label="Collection">
        <div className="gen-nft-grid">
          {collection.map((nft) => (
            <div key={nft.id} className="gen-nft-card">
              <div className="gen-nft-art" style={{ color: nft.color }}>◈</div>
              <div className="gen-nft-id">{nft.id}</div>
              <div className="gen-nft-meta" style={{ color: nft.color }}>{nft.trait}</div>
              <div className="gen-nft-rarity">{nft.rarity}</div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

// ── 3. DAO Voting ────────────────────────────────────────────────────────────

function InteractiveDAOVoting({ name }: { name: string }) {
  const [votes, setVotes] = useState({ for: 58, against: 22, abstain: 20 });
  const [userVote, setUserVote] = useState<string | null>(null);
  const total = votes.for + votes.against + votes.abstain;

  const handleVote = (choice: 'for' | 'against' | 'abstain') => {
    if (userVote) return;
    setVotes((v) => ({ ...v, [choice]: v[choice] + 1 }));
    setUserVote(choice);
  };

  const pct = (n: number) => Math.round((n / (total + (userVote ? 1 : 0))) * 100);

  return (
    <AppShell title={name}>
      <Card label="Active Proposal">
        <div className="gen-proposal-title">Proposal #14 — Increase quorum threshold to 67 %</div>
        <p className="gen-proposal-desc">
          Adjusts the minimum quorum required for kBFT™ consensus on governance votes from 51 % to 67 %
          to improve protocol security and prevent minority attacks.
        </p>
        <div className="gen-vote-btns">
          <button
            className={`gen-btn gen-btn--vote gen-btn--vote-for${userVote === 'for' ? ' active' : ''}`}
            onClick={() => handleVote('for')} disabled={!!userVote}
          >
            ✓ Vote For {userVote === 'for' && '← your vote'}
          </button>
          <button
            className={`gen-btn gen-btn--vote gen-btn--vote-against${userVote === 'against' ? ' active' : ''}`}
            onClick={() => handleVote('against')} disabled={!!userVote}
          >
            ✗ Vote Against {userVote === 'against' && '← your vote'}
          </button>
          <button
            className={`gen-btn gen-btn--vote${userVote === 'abstain' ? ' active' : ''}`}
            onClick={() => handleVote('abstain')} disabled={!!userVote}
          >
            — Abstain {userVote === 'abstain' && '← your vote'}
          </button>
        </div>
        {userVote && <Feedback msg="✓ Vote recorded · kBFT™ consensus verified" />}
      </Card>
      <Card label={`Live Results (${total + (userVote ? 1 : 0)} votes)`}>
        {(['for', 'against', 'abstain'] as const).map((choice) => {
          const count = votes[choice] + (userVote === choice ? 1 : 0);
          const p = Math.round(count / (total + (userVote ? 1 : 0)) * 100);
          const color = choice === 'for' ? '#7ee87e' : choice === 'against' ? '#ff8855' : 'var(--text-muted)';
          const label = choice.charAt(0).toUpperCase() + choice.slice(1);
          return (
            <div key={choice} className="gen-vote-bar-row">
              <span className="gen-vote-label" style={{ color }}>{label}: {p} %</span>
              <div className="gen-bar-track">
                <div className={`gen-bar-fill gen-bar-fill--${choice}`} style={{ width: `${p}%` }} />
              </div>
              <span className="gen-vote-count">{count}</span>
            </div>
          );
        })}
      </Card>
    </AppShell>
  );
}

// ── 4. Escrow Payment ────────────────────────────────────────────────────────

function InteractiveEscrowPayment({ name }: { name: string }) {
  const [escrowStatus, setEscrowStatus] = useState<'holding' | 'released' | 'disputed'>('holding');
  const [feedback, setFeedback] = useState('');

  const release = () => { setEscrowStatus('released'); setFeedback('✓ Funds released · kBFT™ settlement confirmed'); setTimeout(() => setFeedback(''), 4000); };
  const dispute = () => { setEscrowStatus('disputed'); setFeedback('⚠ Dispute raised · awaiting Reviewer decision'); setTimeout(() => setFeedback(''), 4000); };
  const reset   = () => { setEscrowStatus('holding'); setFeedback('↺ Escrow reset to holding state'); setTimeout(() => setFeedback(''), 2000); };

  const statusLabel = {
    holding: '⏳ Funds Held in Escrow — awaiting release condition',
    released: '✓ Funds Released — settlement complete on-chain',
    disputed: '⚠ Dispute Active — Reviewer approval required',
  }[escrowStatus];

  return (
    <AppShell title={name}>
      <div className="gen-row">
        <Card>
          <div className="gen-card-label">Payer</div>
          <div className="gen-party-name">Chuck (Demo)</div>
          <div className="gen-party-addr">0x4f3...2c1a</div>
        </Card>
        <div className="gen-escrow-mid">
          <div className="gen-escrow-arrow">→</div>
          <div className="gen-escrow-amount">5,000 ZTA</div>
          <div className="gen-escrow-held">held in escrow</div>
        </div>
        <Card>
          <div className="gen-card-label">Payee</div>
          <div className="gen-party-name">Aviation Co.</div>
          <div className="gen-party-addr">0x9b1...7e4d</div>
        </Card>
      </div>
      <Card label="Escrow Status">
        <div className={`gen-escrow-status gen-escrow-status--${escrowStatus}`}>{statusLabel}</div>
        {escrowStatus === 'holding' && (
          <div className="gen-escrow-actions">
            <button className="gen-btn gen-btn--primary" onClick={release}>Release Funds →</button>
            <button className="gen-btn gen-btn--warn"    onClick={dispute}>Raise Dispute</button>
          </div>
        )}
        {escrowStatus !== 'holding' && (
          <button className="gen-btn gen-btn--sm" style={{ marginTop: '10px' }} onClick={reset}>↺ Reset Demo</button>
        )}
        {feedback && <Feedback msg={feedback} />}
      </Card>
      <Card label="Audit Log">
        <table className="gen-table">
          <thead><tr><th>Event</th><th>Actor</th><th>Status</th></tr></thead>
          <tbody>
            {[
              { event: 'Escrow created', actor: 'Chuck', ok: true },
              { event: 'Funds deposited', actor: 'System', ok: true },
              { event: 'Condition check', actor: 'kBFT™', ok: true },
              { event: escrowStatus === 'released' ? 'Funds released' : escrowStatus === 'disputed' ? 'Dispute raised' : 'Awaiting release', actor: escrowStatus !== 'holding' ? 'Chuck' : '—', ok: escrowStatus === 'released' },
            ].map((row, i) => (
              <tr key={i}>
                <td>{row.event}</td>
                <td className="gen-muted">{row.actor}</td>
                <td><StatusChip ok={row.ok} label={row.ok ? 'Confirmed' : escrowStatus === 'disputed' ? 'Disputed' : 'Pending'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}

// ── 5. Ledger App ────────────────────────────────────────────────────────────

function InteractiveLedgerApp({ name }: { name: string }) {
  const [filter, setFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [entries, setEntries] = useState([
    { id: 'TX-0091', ts: '2026-06-21 14:32', action: 'VERIFY_FLIGHT', actor: 'System',  status: 'Verified'   },
    { id: 'TX-0090', ts: '2026-06-21 14:28', action: 'SUBMIT_LOG',    actor: 'Chuck',   status: 'Confirmed'  },
    { id: 'TX-0089', ts: '2026-06-21 13:55', action: 'APPROVE_RECORD',actor: 'Connie',  status: 'Confirmed'  },
    { id: 'TX-0088', ts: '2026-06-21 13:40', action: 'CREATE_ENTRY',  actor: 'Mike',    status: 'Confirmed'  },
    { id: 'TX-0087', ts: '2026-06-21 13:10', action: 'SUBMIT_LOG',    actor: 'Chuck',   status: 'Pending'    },
  ]);

  const filtered = filter === 'All' ? entries : entries.filter((e) => e.status === filter);

  const handleAdd = () => {
    if (!newEntry.trim()) return;
    const now = new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
    const id = `TX-${String(entries.length + 92).padStart(4, '0')}`;
    setEntries((prev) => [{ id, ts: now, action: newEntry.trim().toUpperCase().replace(/\s+/g, '_'), actor: 'Demo User', status: 'Confirmed' }, ...prev]);
    setNewEntry('');
    setShowAdd(false);
  };

  return (
    <AppShell title={name}>
      <Card label="Immutable Ledger — kBFT™ Verified">
        <div className="gen-ledger-toolbar">
          <select className="gen-select gen-select--sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {['All', 'Confirmed', 'Pending', 'Verified'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="gen-btn gen-btn--sm gen-btn--primary" onClick={() => setShowAdd(!showAdd)}>
            + Add Entry
          </button>
        </div>
        {showAdd && (
          <div className="gen-input-row" style={{ marginBottom: '10px' }}>
            <input className="gen-input" placeholder="Action name (e.g. INSPECT_AIRCRAFT)" value={newEntry} onChange={(e) => setNewEntry(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            <button className="gen-btn gen-btn--sm gen-btn--primary" onClick={handleAdd}>Save</button>
          </div>
        )}
        <table className="gen-table">
          <thead><tr><th>TX ID</th><th>Timestamp</th><th>Action</th><th>Actor</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td className="gen-mono">{e.id}</td>
                <td className="gen-muted">{e.ts}</td>
                <td className="gen-mono">{e.action}</td>
                <td>{e.actor}</td>
                <td><StatusChip ok={e.status !== 'Pending'} label={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}

// ── 6. Permissioned Workflow ─────────────────────────────────────────────────

function InteractivePermissionedWorkflow({ name }: { name: string }) {
  const [steps, setSteps] = useState([
    { label: 'Submit request',      role: 'Builder',  status: 'done'    },
    { label: 'Reviewer sign-off',   role: 'Reviewer', status: 'pending' },
    { label: 'Owner approval',      role: 'Owner',    status: 'locked'  },
    { label: 'Deploy to network',   role: 'Owner',    status: 'locked'  },
  ]);
  const [feedback, setFeedback] = useState('');

  const approveStep = (idx: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], status: 'done' };
      if (idx + 1 < next.length) next[idx + 1] = { ...next[idx + 1], status: 'pending' };
      return next;
    });
    setFeedback(`✓ Step "${steps[idx].label}" approved · kBFT™ consensus logged`);
    setTimeout(() => setFeedback(''), 3000);
  };

  const allDone = steps.every((s) => s.status === 'done');

  const COLOR: Record<string, string> = { done: '#7ee87e', pending: '#ffc83c', locked: 'var(--text-muted)' };

  return (
    <AppShell title={name}>
      {feedback && <Feedback msg={feedback} />}
      <Card label="Workflow Progress">
        {steps.map((step, i) => (
          <div key={step.label} className="gen-workflow-step">
            <span className="gen-step-num" style={{ background: step.status === 'done' ? 'rgba(126,232,126,0.18)' : 'rgba(38,184,255,0.1)', color: COLOR[step.status] }}>
              {step.status === 'done' ? '✓' : i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#dff4ff', fontWeight: 600, fontSize: '0.9rem' }}>{step.label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Required role: {step.role}</div>
            </div>
            <span style={{ color: COLOR[step.status], fontWeight: 700, fontSize: '0.82rem', textTransform: 'capitalize', minWidth: '56px', textAlign: 'right' }}>
              {step.status}
            </span>
            {step.status === 'pending' && (
              <button className="gen-btn gen-btn--sm gen-btn--primary" onClick={() => approveStep(i)}>Approve</button>
            )}
          </div>
        ))}
      </Card>
      {allDone && (
        <div className="gen-card gen-card--result" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✓</div>
          <div style={{ color: '#7ee87e', fontWeight: 700, fontSize: '1rem' }}>All steps approved</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
            Workflow complete · Ready for deployment
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ── 7. Weather Outfit Planner ────────────────────────────────────────────────

const OUTFIT_TABLE: Record<string, Record<string, string>> = {
  Sunny: {
    Casual:  '👕 Light t-shirt · shorts · sneakers · sunglasses',
    Work:    '👔 Light dress shirt · chinos · loafers · light blazer',
    Formal:  '🥻 Linen suit · dress pants · leather shoes · pocket square',
    Outdoor: '🧢 Tank top · cargo shorts · hiking sandals · wide-brim hat',
  },
  Cloudy: {
    Casual:  '🧥 Light jacket · jeans · clean sneakers',
    Work:    '👔 Button-down · trousers · light cardigan',
    Formal:  '🧥 Dark blazer · dress pants · oxford shoes',
    Outdoor: '🧥 Windbreaker · athletic pants · trail shoes',
  },
  Rainy: {
    Casual:  '🌧 Raincoat · waterproof boots · jeans · umbrella',
    Work:    '☂️ Trench coat · dark slacks · waterproof oxfords',
    Formal:  '☂️ Dark overcoat · formal pants · umbrella · waterproof shoes',
    Outdoor: '🌧 Waterproof jacket · rain pants · rubber boots · dry pack',
  },
  Cold: {
    Casual:  '🧣 Heavy coat · scarf · jeans · winter boots · beanie',
    Work:    '🧥 Wool coat · turtleneck · dress pants · boots · gloves',
    Formal:  '🧥 Overcoat · suit · dress shoes · gloves · wool scarf',
    Outdoor: '❄️ Parka · thermal base layers · snow boots · gloves · balaclava',
  },
  Hot: {
    Casual:  '☀️ Tank top · shorts · flip-flops · sunscreen · water bottle',
    Work:    '👗 Breathable dress · sandals · light cardigan for A/C',
    Formal:  '👔 Lightweight linen suit · loafers · minimal layers',
    Outdoor: '🏃 Moisture-wicking shirt · shorts · trail runners · hat · electrolytes',
  },
  Snowy: {
    Casual:  '❄️ Insulated parka · snow pants · winter boots · thermal layers',
    Work:    '🧥 Wool coat · turtleneck · waterproof boots · hand warmers',
    Formal:  '🧥 Heavy overcoat · suit · insulated dress boots · leather gloves',
    Outdoor: '⛄ Full ski-style layering — base/mid/shell · snow boots · goggles',
  },
};

function WeatherOutfitApp({ name, description, apis }: { name: string; description: string; apis?: string[] }) {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState('Sunny');
  const [temp, setTemp] = useState('72');
  const [occasion, setOccasion] = useState('Casual');
  const [outfit, setOutfit] = useState<string | null>(null);

  const generate = () => {
    const t = parseInt(temp, 10);
    let key = weather;
    if (!isNaN(t)) {
      if (t <= 28)      key = 'Snowy';
      else if (t <= 40) key = 'Cold';
      else if (t >= 90) key = 'Hot';
    }
    const rec = OUTFIT_TABLE[key]?.[occasion] ?? OUTFIT_TABLE['Sunny']?.[occasion] ?? 'Light, comfortable layers for the conditions.';
    setOutfit(rec);
  };

  return (
    <AppShell title={name || 'Weather Outfit Planner'} desc={description}>
      <Card label="Today's Conditions">
        <div className="gen-form-grid gen-form-grid--2col">
          <div className="gen-field gen-field--wide">
            <label className="gen-label">City (optional)</label>
            <input className="gen-input" placeholder="e.g. San Francisco" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="gen-field">
            <label className="gen-label">Temperature (°F)</label>
            <input className="gen-input" type="number" value={temp} onChange={(e) => setTemp(e.target.value)} />
          </div>
          <div className="gen-field">
            <label className="gen-label">Weather</label>
            <select className="gen-select" value={weather} onChange={(e) => setWeather(e.target.value)}>
              {Object.keys(OUTFIT_TABLE).map((w) => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div className="gen-field">
            <label className="gen-label">Occasion</label>
            <select className="gen-select" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              <option>Casual</option><option>Work</option><option>Formal</option><option>Outdoor</option>
            </select>
          </div>
        </div>
        <button className="gen-btn gen-btn--primary gen-btn--full" onClick={generate}>
          🌤 Generate Outfit Plan
        </button>
      </Card>

      {outfit && (
        <Card label="Recommended Outfit" result>
          <div className="gen-outfit-result">
            {city && (
              <div className="gen-outfit-city">
                📍 {city} · {weather} · {temp}°F · {occasion}
              </div>
            )}
            <div className="gen-outfit-text">{outfit}</div>
            <div className="gen-outfit-note">
              Tap any condition to regenerate a new recommendation.
            </div>
          </div>
        </Card>
      )}

      {/* Notification log panel — shown when Notification API is selected */}
      {apis?.includes('notifications') && outfit && (
        <Card label="Notification Log">
          <div className="gen-muted" style={{ fontSize: '0.78rem' }}>
            <div>📩 Outfit plan generated for {city || 'your location'} — {new Date().toLocaleTimeString()}</div>
            {apis?.includes('identity') && (
              <div style={{ marginTop: '6px' }}>✓ Session verified via Identity API</div>
            )}
          </div>
        </Card>
      )}

      {/* Permission status block — shown when Permissioning API is selected */}
      {apis?.includes('permissions') && (
        <Card label="Access Status">
          <div className="gen-workflow-step" style={{ padding: '6px 0', border: 'none' }}>
            <span className="gen-task-check gen-task-check--done">✓</span>
            <span style={{ color: '#dff4ff', fontSize: '0.84rem' }}>Permissioning API — access granted</span>
            <StatusChip ok label="Authorized" />
          </div>
          <div className="gen-muted" style={{ fontSize: '0.76rem', marginTop: '4px' }}>
            Permission model: {name.toLowerCase().includes('outfit') ? 'user-scoped' : 'role-based'}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

// ── 8. Travel Planner ────────────────────────────────────────────────────────

const ITINERARIES: Record<string, string[]> = {
  Culture:     ['🏛 Morning: National Museum · 3 hrs', '🍽 Lunch: Local traditional restaurant', '🎭 Afternoon: Historical district walking tour', '🌅 Evening: Rooftop dinner with city views'],
  Adventure:   ['🧗 6 AM: Sunrise trail hike (bring water)', '🥗 Lunch: Basecamp café', '🏄 Afternoon: Water sports / outdoor activity', '🌙 Evening: Campfire with local guides'],
  Relaxation:  ['☀️ Morning: Beach or park stroll', '☕ Brunch: Scenic garden café', '🧖 Afternoon: Spa & wellness session', '🍷 Evening: Sunset dinner reservation'],
  Foodie:      ['🥐 Morning: Farmers market breakfast', '🍜 Lunch: Best local ramen / noodle spot', '🧑‍🍳 Afternoon: Cooking class with local chef', '🍾 Evening: Fine-dining reservation (book ahead)'],
};

function TravelPlannerApp({ name, description }: { name: string; description: string }) {
  const [dest, setDest] = useState('');
  const [dates, setDates] = useState('');
  const [budget, setBudget] = useState('');
  const [style, setStyle] = useState('Culture');
  const [plan, setPlan] = useState<string[] | null>(null);

  return (
    <AppShell title={name || 'Travel Planner'} desc={description}>
      <Card label="Plan Your Trip">
        <div className="gen-form-grid gen-form-grid--2col">
          <div className="gen-field gen-field--wide">
            <label className="gen-label">Destination</label>
            <input className="gen-input" placeholder="e.g. Tokyo, Japan" value={dest} onChange={(e) => setDest(e.target.value)} />
          </div>
          <div className="gen-field">
            <label className="gen-label">Travel Dates</label>
            <input className="gen-input" placeholder="e.g. Jul 10 – 17" value={dates} onChange={(e) => setDates(e.target.value)} />
          </div>
          <div className="gen-field">
            <label className="gen-label">Budget (USD)</label>
            <input className="gen-input" placeholder="e.g. 2,000" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="gen-field">
            <label className="gen-label">Travel Style</label>
            <select className="gen-select" value={style} onChange={(e) => setStyle(e.target.value)}>
              {Object.keys(ITINERARIES).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button className="gen-btn gen-btn--primary gen-btn--full" onClick={() => setPlan(ITINERARIES[style])}>
          ✈️ Generate Itinerary
        </button>
      </Card>

      {plan && (
        <Card label={`Your Itinerary${dest ? ` — ${dest}` : ''}`} result>
          {plan.map((item, i) => <div key={i} className="gen-itinerary-item">{item}</div>)}
          {budget && <div className="gen-outfit-note" style={{ marginTop: '10px' }}>Budget: ${budget} · enjoy your trip!</div>}
        </Card>
      )}
    </AppShell>
  );
}

// ── 9. Budget Tracker ────────────────────────────────────────────────────────

function BudgetTrackerApp({ name, description }: { name: string; description: string }) {
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [cat, setCat] = useState('Food');
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [expenses, setExpenses] = useState([
    { cat: 'Transport',    amount: 45,  note: 'Monthly transit pass' },
    { cat: 'Food',         amount: 120, note: 'Groceries' },
    { cat: 'Utilities',    amount: 80,  note: 'Internet + phone' },
  ]);
  const [feedback, setFeedback] = useState('');

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetNum = parseFloat(monthlyBudget) || 0;
  const remaining = budgetNum - total;

  const addExpense = () => {
    const a = parseFloat(amt);
    if (isNaN(a) || a <= 0) return;
    setExpenses((prev) => [{ cat, amount: a, note }, ...prev]);
    setFeedback(`✓ Added $${a} · ${cat}`);
    setAmt(''); setNote('');
    setTimeout(() => setFeedback(''), 2000);
  };

  return (
    <AppShell title={name || 'Budget Tracker'} desc={description}>
      <div className="gen-row">
        <Card>
          <div className="gen-card-label">Total Spent</div>
          <div className="gen-card-value" style={{ color: budgetNum > 0 && total > budgetNum ? '#ff8855' : '#4ee5ff' }}>
            ${total.toLocaleString()}
          </div>
        </Card>
        {budgetNum > 0 && (
          <Card>
            <div className="gen-card-label">Remaining</div>
            <div className="gen-card-value" style={{ color: remaining < 0 ? '#ff8855' : '#7ee87e' }}>
              ${remaining.toLocaleString()}
            </div>
          </Card>
        )}
      </div>
      {budgetNum > 0 && (
        <Card>
          <div className="gen-bar-track" style={{ height: '8px', borderRadius: '4px' }}>
            <div className="gen-bar-fill gen-bar-fill--for" style={{ width: `${Math.min(100, total / budgetNum * 100)}%`, height: '100%', borderRadius: '4px' }} />
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {Math.round(total / budgetNum * 100)} % of ${Number(monthlyBudget).toLocaleString()} budget used
          </div>
        </Card>
      )}
      <Card label="Set Monthly Budget (optional)">
        <input className="gen-input" type="number" placeholder="e.g. 2000" value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)} />
      </Card>
      <Card label="Add Expense">
        <div className="gen-form-grid gen-form-grid--2col">
          <div className="gen-field">
            <label className="gen-label">Category</label>
            <select className="gen-select" value={cat} onChange={(e) => setCat(e.target.value)}>
              {['Food', 'Transport', 'Housing', 'Utilities', 'Health', 'Entertainment', 'Other'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="gen-field">
            <label className="gen-label">Amount ($)</label>
            <input className="gen-input" type="number" placeholder="0.00" value={amt} onChange={(e) => setAmt(e.target.value)} />
          </div>
          <div className="gen-field gen-field--wide">
            <label className="gen-label">Note (optional)</label>
            <input className="gen-input" placeholder="e.g. Grocery run" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <button className="gen-btn gen-btn--primary" onClick={addExpense}>+ Add</button>
        {feedback && <Feedback msg={feedback} />}
      </Card>
      {expenses.length > 0 && (
        <Card label="Expense Log">
          {expenses.map((e, i) => (
            <div key={i} className="gen-expense-row">
              <span className="gen-expense-cat">{e.cat}</span>
              <span className="gen-expense-note">{e.note}</span>
              <span className="gen-expense-amt">${e.amount.toLocaleString()}</span>
            </div>
          ))}
        </Card>
      )}
    </AppShell>
  );
}

// ── 10. Task / Workflow App ──────────────────────────────────────────────────

function TaskWorkflowApp({ name, description }: { name: string; description: string }) {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Define project scope',       done: true  },
    { id: 2, text: 'Configure workflow blocks',  done: true  },
    { id: 3, text: 'Review with stakeholders',   done: false },
    { id: 4, text: 'Deploy to preview network',  done: false },
  ]);
  const [newTask, setNewTask] = useState('');
  const done = tasks.filter((t) => t.done).length;

  const toggle = (id: number) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now(), text: newTask.trim(), done: false }]);
    setNewTask('');
  };

  return (
    <AppShell title={name || 'Task Workflow App'} desc={description}>
      <Card>
        <div className="gen-progress-row">
          <span className="gen-label">Progress {done}/{tasks.length}</span>
          <div className="gen-bar-track" style={{ flex: 1 }}>
            <div className="gen-bar-fill gen-bar-fill--for" style={{ width: `${tasks.length ? done / tasks.length * 100 : 0}%` }} />
          </div>
          <span className="gen-label">{tasks.length ? Math.round(done / tasks.length * 100) : 0} %</span>
        </div>
      </Card>
      <Card label="Tasks">
        {tasks.map((task) => (
          <div key={task.id} className="gen-task-row" onClick={() => toggle(task.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === ' ' && toggle(task.id)}>
            <span className={`gen-task-check${task.done ? ' gen-task-check--done' : ''}`}>{task.done ? '✓' : '○'}</span>
            <span style={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-muted)' : '#dff4ff' }}>{task.text}</span>
          </div>
        ))}
        <div className="gen-input-row" style={{ marginTop: '12px' }}>
          <input className="gen-input" placeholder="Add a task…" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
          <button className="gen-btn gen-btn--sm gen-btn--primary" onClick={addTask}>Add</button>
        </div>
      </Card>
    </AppShell>
  );
}

// ── 11. Generic Generated App ────────────────────────────────────────────────

function inferFields(name: string, desc: string): Array<{ key: string; label: string; type?: string; placeholder?: string; options?: string[] }> {
  const s = `${name} ${desc}`.toLowerCase();
  if (/recipe|cook|food|meal|ingredient/.test(s)) return [
    { key: 'ingredients', label: 'Ingredients', placeholder: 'e.g. chicken, garlic, olive oil' },
    { key: 'diet',        label: 'Dietary',     type: 'select', options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free'] },
    { key: 'cuisine',     label: 'Cuisine',     type: 'select', options: ['Any', 'Italian', 'Asian', 'Mexican', 'Mediterranean'] },
  ];
  if (/fitness|workout|exercise|gym|train/.test(s)) return [
    { key: 'exercise', label: 'Exercise Type', type: 'select', options: ['Cardio', 'Strength', 'Yoga', 'HIIT', 'Flexibility'] },
    { key: 'duration', label: 'Duration (min)', type: 'number', placeholder: '30' },
    { key: 'level',    label: 'Fitness Level',  type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
  ];
  if (/music|playlist|song|album|artist/.test(s)) return [
    { key: 'mood',   label: 'Mood',   type: 'select', options: ['Happy', 'Calm', 'Energetic', 'Focused', 'Melancholy'] },
    { key: 'genre',  label: 'Genre',  type: 'select', options: ['Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Hip-hop'] },
    { key: 'length', label: 'Duration', type: 'select', options: ['15 min', '30 min', '1 hour', '2+ hours'] },
  ];
  return [
    { key: 'input1', label: `${name} Input`,  placeholder: `Enter ${name.toLowerCase()} details…` },
    { key: 'input2', label: 'Parameters',      placeholder: 'Any additional parameters…' },
  ];
}

function inferActionLabel(name: string, desc: string): string {
  const s = `${name} ${desc}`.toLowerCase();
  if (/search|find|discover/.test(s))   return `🔍 Search ${name}`;
  if (/generate|create|make/.test(s))   return `⚡ Generate ${name}`;
  if (/analyze|check|verify/.test(s))   return `🔎 Analyze`;
  if (/plan|schedule|organiz/.test(s))  return `📅 Build Plan`;
  if (/submit|send|publish/.test(s))    return `📤 Submit`;
  return `▶ Run ${name}`;
}

function inferOutputText(name: string, desc: string, inputs: Record<string, string>, workflow: string[]): string {
  const filledInputs = Object.entries(inputs).filter(([, v]) => v?.trim()).map(([k, v]) => `${k}: ${v}`).join(' · ');
  const lines: string[] = [
    `✓ ${name} processed successfully`,
    '',
    filledInputs ? `Input: ${filledInputs}` : `Input: (no parameters provided)`,
    '',
  ];
  if (desc) lines.push(`App logic: ${desc}`);
  if (workflow.length) {
    lines.push('');
    lines.push('Workflow executed:');
    workflow.forEach((id, i) => {
      const label = WORKFLOW_BLOCKS.find((b) => b.id === id)?.label ?? id;
      lines.push(`  ${i + 1}. ${label} — Complete ✓`);
    });
  }
  lines.push('');
  lines.push('Status: Preview Ready · Frontend mock · Backend/API deployment coming later');
  return lines.join('\n');
}

function GenericGeneratedApp({ app }: { app: SavedDApp }) {
  const fields = inferFields(app.dappName, app.description);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string | null>(null);
  const actionLabel = inferActionLabel(app.dappName, app.description);

  const handleAction = () => {
    setOutput(inferOutputText(app.dappName, app.description, inputs, app.workflow));
  };

  return (
    <AppShell title={app.dappName} desc={app.description}>
      <Card label="App Inputs">
        {fields.map((f) => (
          <div key={f.key} className="gen-field" style={{ marginBottom: '12px' }}>
            <label className="gen-label">{f.label}</label>
            {f.type === 'select' ? (
              <select className="gen-select" value={inputs[f.key] ?? ''} onChange={(e) => setInputs((prev) => ({ ...prev, [f.key]: e.target.value }))}>
                <option value="">Select…</option>
                {f.options?.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input className="gen-input" type={f.type ?? 'text'} placeholder={f.placeholder} value={inputs[f.key] ?? ''} onChange={(e) => setInputs((prev) => ({ ...prev, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
        <button className="gen-btn gen-btn--primary gen-btn--full" onClick={handleAction}>{actionLabel}</button>
      </Card>

      {output && (
        <Card label="Generated Output" result>
          <pre className="gen-output-text">{output}</pre>
        </Card>
      )}

      {app.workflow.length > 0 && (
        <Card label="Workflow Logic">
          <div className="gen-workflow-chips">
            {app.workflow.map((id, i) => (
              <React.Fragment key={id}>
                {i > 0 && <span className="gen-chip-sep">→</span>}
                <span className="gen-chip">{WORKFLOW_BLOCKS.find((b) => b.id === id)?.label ?? id}</span>
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      {app.apis.length > 0 && (
        <Card label="Connected Services">
          <div className="gen-workflow-chips">
            {app.apis.map((api) => <span key={api} className="gen-chip gen-chip--api">{api}</span>)}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

// ── Error / Invalid fallback ─────────────────────────────────────────────────

function InvalidAppFallback({ app, onBack }: { app: Partial<SavedDApp>; onBack?: () => void }) {
  const missing: string[] = [];
  if (!app.id)       missing.push('id');
  if (!app.dappName) missing.push('dappName');
  if (!app.template) missing.push('template');

  return (
    <div className="gen-app gen-app--error">
      <div className="gen-error-icon">⚠</div>
      <div className="gen-error-title">Preview could not be generated</div>
      {missing.length > 0 && (
        <div className="gen-error-detail">Missing fields: {missing.join(', ')}</div>
      )}
      <div className="gen-error-actions">
        {onBack && (
          <button className="gen-btn gen-btn--primary" onClick={onBack}>← Back to Builder</button>
        )}
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export interface GeneratedAppRendererProps {
  app: SavedDApp;
  onBack?: () => void;
}

export function GeneratedAppRenderer({ app, onBack }: GeneratedAppRendererProps) {
  if (!app?.id || !app?.dappName) return <InvalidAppFallback app={app ?? {}} onBack={onBack} />;

  const appType = inferAppType(app.dappName, app.description ?? '', app.template, app.apis);

  const apiPanel = <ConnectedApisPanel apis={app.apis ?? []} />;

  switch (appType) {
    case 'token-dashboard':
      return <><InteractiveTokenDashboard name={app.dappName} />{apiPanel}</>;
    case 'nft-mint':
      return <><InteractiveNFTMint name={app.dappName} />{apiPanel}</>;
    case 'dao-voting':
      return <><InteractiveDAOVoting name={app.dappName} />{apiPanel}</>;
    case 'escrow-payment':
      return <><InteractiveEscrowPayment name={app.dappName} />{apiPanel}</>;
    case 'ledger-app':
      return <><InteractiveLedgerApp name={app.dappName} />{apiPanel}</>;
    case 'permissioned-workflow':
      return <><InteractivePermissionedWorkflow name={app.dappName} />{apiPanel}</>;
    case 'weather-outfit':
      return <><WeatherOutfitApp name={app.dappName} description={app.userPrompt || app.description || ''} apis={app.apis} />{apiPanel}</>;
    case 'travel-planner':
      return <><TravelPlannerApp name={app.dappName} description={app.userPrompt || app.description || ''} />{apiPanel}</>;
    case 'budget-tracker':
      return <><BudgetTrackerApp name={app.dappName} description={app.userPrompt || app.description || ''} />{apiPanel}</>;
    case 'task-workflow':
      return <><TaskWorkflowApp name={app.dappName} description={app.userPrompt || app.description || ''} />{apiPanel}</>;
    default:
      return <><GenericGeneratedApp app={app} />{apiPanel}</>;
  }
}
