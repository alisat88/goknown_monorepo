import { v4 as uuid } from "uuid";

import auditlogs from "../assets/auditlogs.svg";
import chat from "../assets/chat.svg";
import dataforms from "../assets/dataforms.svg";
import group from "../assets/group.svg";
import laboratory from "../assets/laboratory.png";
import nft from "../assets/nft.svg";
import organizations from "../assets/organizations.svg";
import team from "../assets/team.svg";
import wallet from "../assets/wallet.svg";
import knowncompute from "../assets/KnownCompute.jpg";
import ZTA from "../assets/ZTA.png";

// 🔥 NEW ICONS (reuse existing ones for now). this will be changed later
import walletIcon from "../assets/wallet.svg";
import labIcon from "../assets/laboratory.png";

import { IDL } from "../pages/Organizations/types";

export default [
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Digital Assets",
    icon: nft,
    icon_url: nft,
    route: "/digitalassets",
    flag: "digital_assets",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Wallet",
    icon: wallet,
    icon_url: wallet,
    route: "/trasactions",
    flag: "wallet",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Groups",
    icon: group,
    icon_url: group,
    route: "/groups",
    flag: "groups",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Data Forms",
    icon: dataforms,
    icon_url: dataforms,
    route: "/dataforms",
    flag: "data_forms",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Organizations",
    icon: organizations,
    icon_url: organizations,
    route: "/organizations",
    flag: "organizations",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Messenger",
    icon: chat,
    icon_url: chat,
    route: "/messenger",
    flag: "messenger",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "Audit Logs",
    icon: auditlogs,
    icon_url: auditlogs,
    route: "/auditlogs",
    flag: "auditlogs",
  },
  {
    id: uuid(),
    sync_id: uuid(),
    name: "User Manager",
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
    icon: laboratory,
    icon_url: laboratory,
    route: "/labs",
    flag: "labs",
    roles: "admin",
  },

  // ============================================
  // 💳 PAYMENTS APP (NEW)
  // ============================================
  {
    id: uuid(),
    sync_id: uuid(),
    name: "ZTA Coin",
    icon: ZTA,
    icon_url: ZTA,
    route: "/payments",
    flag: "payments",
    roles: "admin",
  },

  // ============================================
  // ⚙️ WORKFLOW APP (NEW)
  // ============================================
  {
  id: uuid(),
  sync_id: uuid(),
  name: "KnownCompute",
  icon: knowncompute,
  icon_url: knowncompute,
  route: "/workflow",
  flag: "workflow",
  roles: "admin",
},
] as IDL[];
