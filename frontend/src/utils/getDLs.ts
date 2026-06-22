import { v4 as uuid } from "uuid";

import auditlogs from "../assets/auditlogs.svg";
import chat from "../assets/chat.svg";
import dappbuilder from "../assets/dappbuilder.png";
import dataforms from "../assets/dataforms.svg";
import group from "../assets/group.svg";
import knowncompute from "../assets/KnownCompute.jpg";
import laboratory from "../assets/laboratory.png";
import nft from "../assets/nft.svg";
import organizations from "../assets/organizations.svg";
import team from "../assets/team.svg";
import wallet from "../assets/wallet.svg";
import ZTA from "../assets/ZTA.png";
import {
  DAPP_BUILDER_URL,
  KNOWNCOMPUTE_URL,
  ZTA_COIN_URL,
} from "../config/externalApps";
import { IDL } from "../pages/Organizations/types";

export default [
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Digital Assets",
    description:
      "Upload, permission, and share documents, images, videos, and audio files as ledger-backed assets.",
    icon: nft,
    icon_url: nft,
    route: "/digitalassets",
    flag: "digital_assets",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Wallet",
    description:
      "Hold and manage tokens used for identification, rewards, group access, and application-specific workflows.",
    icon: wallet,
    icon_url: wallet,
    route: "/transactions",
    flag: "wallet",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Groups",
    description:
      "Create user groups that coordinate members and share access to permissioned data.",
    icon: group,
    icon_url: group,
    route: "/groups",
    flag: "groups",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Data Forms",
    description:
      "Build, edit, and collect structured records with no-code forms for your GoKnown workflows.",
    icon: dataforms,
    icon_url: dataforms,
    route: "/dataforms",
    flag: "data_forms",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Organizations",
    description:
      "Define organization structures, membership, rooms, and governance rules for collaborative work.",
    icon: organizations,
    icon_url: organizations,
    route: "/organizations",
    flag: "organizations",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Messenger",
    description:
      "Send one-to-one messages inside the workspace and keep collaboration close to the data.",
    icon: chat,
    icon_url: chat,
    route: "/messenger",
    flag: "messenger",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Audit Logs",
    description:
      "Search and review transaction activity stored in the immutable ledger.",
    icon: auditlogs,
    icon_url: auditlogs,
    route: "/auditlogs",
    flag: "auditlogs",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "User Manager",
    description:
      "Invite users, manage access, issue tokens, and handle account administration.",
    icon: team,
    icon_url: team,
    route: "/users",
    flag: "inviteusers",
    roles: "admin",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Laboratory",
    description:
      "Administrative tools for testing, beta operations, and controlled workspace setup.",
    icon: laboratory,
    icon_url: laboratory,
    route: "/labs",
    flag: "labs",
    roles: "admin",
  },

  // ============================================
  // 💳 ZTA COIN (Payments App)
  // ============================================
  {
    id: uuid(),
    sync_id: uuid(),
    name: "ZTA Coin",
    description:
      "Open the ZTA Coin application for token and payment workflows.",
    icon: ZTA,
    icon_url: ZTA,
    route: "/payments", // ✅ INTERNAL ROUTE
    externalUrl: ZTA_COIN_URL,
    flag: "payments",
    roles: "admin",
  },

  // ============================================
  // ⚙️ KNOWNCOMPUTE (Workflow App)
  // ============================================
  {
    id: uuid(),
    sync_id: uuid(),
    name: "KnownCompute",
    description:
      "Open KnownCompute for AI and compute workflows connected to the GoKnown ecosystem.",
    icon: knowncompute,
    icon_url: knowncompute,
    route: "/workflow", // ✅ INTERNAL ROUTE
    externalUrl: KNOWNCOMPUTE_URL,
    flag: "workflow",
    roles: "admin",
  },

  // ============================================
  // 🧩 DAPP BUILDER (dApp Studio)
  // ============================================
  {
    id: uuid(),
    sync_id: uuid(),
    name: "DApp Builder",
    description:
      "Design, assemble, and preview decentralized applications using templates, reusable API components, and a visual workflow builder.",
    icon: dappbuilder,
    icon_url: dappbuilder,
    route: "/dapp-builder", // ✅ INTERNAL ROUTE (placeholder — app is separately deployed)
    externalUrl: DAPP_BUILDER_URL,
    flag: "dapp_builder",
  },
] as IDL[];
