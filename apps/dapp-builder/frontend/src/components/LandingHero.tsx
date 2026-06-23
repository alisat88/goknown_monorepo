// LandingHero is not used as the app entry point — the builder loads directly.
// Kept here in case a marketing/landing page is needed in a future version.

import React from 'react';
import {
  Boxes,
  // CircleDotDashed,   // "Currently in development" pill — removed
  // Contact,            // "Launching soon" CTA — removed
  Cpu,
  Hexagon,
  Layers3,
  // Rocket,             // "Enter Builder" button — removed
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

const logoPath = '/assets/dappbuilder.png';

const features = [
  {
    icon: ShieldCheck,
    title: 'Smart contract-ready workflows',
    description:
      'Plan application flows around verifiable actions, permissions, and on-chain handoff points.',
  },
  {
    icon: WalletCards,
    title: 'Wallet-friendly architecture',
    description:
      'Design user journeys that can align with wallet access, signatures, and decentralized identity patterns.',
  },
  {
    icon: Layers3,
    title: 'Modular dApp building blocks',
    description:
      'Compose reusable screens, data surfaces, and transaction-aware modules as the platform evolves.',
  },
  {
    icon: Cpu,
    title: 'Scalable deployment foundation',
    description:
      'A polished starting point for the infrastructure, observability, and release paths future dApps need.',
  },
];

interface Props {
  onEnterBuilder?: () => void; // no longer needed as an entry gate; kept for potential future use
}

export function LandingHero(_props: Props) {
  return (
    <>
      <section id="home" className="hero">
        <div className="hero-copy">
          {/* "Currently in development" status pill removed */}
          <h1>DApp Builder</h1>
          <p className="tagline">Build decentralized applications with confidence.</p>
          <p className="description">
            A focused platform experience for teams that want to design, assemble, and launch
            decentralized applications with cleaner workflows and stronger foundations.
          </p>
          {/*
          <div className="hero-actions" aria-label="Launch actions">
            <button className="enter-builder-btn" onClick={onEnterBuilder}>
              <Rocket size={18} />
              Enter Builder
            </button>
            <a className="secondary-action" href="#features">
              Explore features
            </a>
          </div>
          */}
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
          <h2>A builder experience for decentralized products.</h2>
        </div>
        <p>
          DApp Builder is a practical workspace for shaping decentralized application concepts into
          real product foundations — templates, workflow blocks, API components, and AI-assisted
          code generation in one place.
        </p>
      </section>

      <section id="features" className="features" aria-label="Features">
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

      {/*
        Contact / early-access CTA section removed — no longer a pre-launch teaser.
        Footer placeholder copy removed.
      */}
    </>
  );
}
