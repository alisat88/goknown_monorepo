import React from "react";
import ReactDOM from "react-dom/client";
import {
  Boxes,
  CircleDotDashed,
  Contact,
  Cpu,
  Hexagon,
  Layers3,
  Rocket,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import "./styles.css";

const logoPath = "/assets/dappbuilder.png";

const features = [
  {
    icon: ShieldCheck,
    title: "Smart contract-ready workflows",
    description:
      "Plan application flows around verifiable actions, permissions, and on-chain handoff points.",
  },
  {
    icon: WalletCards,
    title: "Wallet-friendly architecture",
    description:
      "Design user journeys that can align with wallet access, signatures, and decentralized identity patterns.",
  },
  {
    icon: Layers3,
    title: "Modular dApp building blocks",
    description:
      "Compose reusable screens, data surfaces, and transaction-aware modules as the platform evolves.",
  },
  {
    icon: Cpu,
    title: "Scalable deployment foundation",
    description:
      "A polished starting point for the infrastructure, observability, and release paths future dApps need.",
  },
];

function App() {
  return (
    <main className="shell">
      <header className="nav" aria-label="Primary">
        <a className="brand" href="#home" aria-label="DApp Builder home">
          <span className="brand-mark" aria-hidden="true">
            <img src={logoPath} alt="" />
          </span>
          <span className="brand-copy">
            <strong>DApp Builder</strong>
            <span>Decentralized app studio</span>
          </span>
        </a>

        <nav className="nav-links" aria-label="Page sections">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section id="home" className="hero">
        <div className="hero-copy">
          <div className="status-pill">
            <CircleDotDashed size={16} />
            <span>Currently in development</span>
          </div>
          <h1>DApp Builder</h1>
          <p className="tagline">
            Build decentralized applications with confidence.
          </p>
          <p className="description">
            A focused platform experience is taking shape for teams that want
            to design, assemble, and launch decentralized applications with
            cleaner workflows and stronger foundations.
          </p>

          <div className="hero-actions" aria-label="Launch status">
            <a className="primary-action" href="#contact">
              <Rocket size={18} />
              Launching soon
            </a>
            <a className="secondary-action" href="#features">
              Explore teasers
            </a>
          </div>
        </div>

        <div className="logo-stage" aria-label="DApp Builder logo">
          <div className="logo-orbit">
            <Hexagon className="orbit-icon orbit-one" size={34} />
            <Boxes className="orbit-icon orbit-two" size={30} />
          </div>
          <img src={logoPath} alt="DApp Builder logo" />
        </div>
      </section>

      <section id="about" className="about">
        <div>
          <p className="section-kicker">Coming Soon</p>
          <h2>A builder experience for decentralized products.</h2>
        </div>
        <p>
          DApp Builder is planned as a practical workspace for shaping
          decentralized application concepts into real product foundations. This
          placeholder is frontend-only while the platform direction, launch
          timeline, and final deployment details are finalized.
        </p>
      </section>

      <section id="features" className="features" aria-label="Feature teasers">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article className="feature-card" key={feature.title}>
              <div className="feature-icon">
                <Icon size={24} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          );
        })}
      </section>

      <section id="contact" className="cta">
        <div>
          <p className="section-kicker">Early Access</p>
          <h2>Interested in early access?</h2>
          <p>
            Contact the DApp Builder team for demo updates and launch
            information as the product moves toward release.
          </p>
        </div>
        <div className="cta-card">
          <Contact size={26} />
          <strong>Launching soon</strong>
          <span>No production URL has been set yet.</span>
        </div>
      </section>

      <footer>
        <span>DApp Builder placeholder app</span>
        <span>Built for demo preview only</span>
      </footer>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
