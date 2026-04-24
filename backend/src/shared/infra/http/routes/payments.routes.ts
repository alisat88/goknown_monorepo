import { Router } from "express";

const router = Router();

// 🔥 In-memory accounts
const balances: Record<string, number> = {
  Alisa: 1000,
  Mike: 1000,
  Connie: 1000,
  Chuck: 1000,
};

// 📊 simple transaction tracking
const transactions: Record<string, number[]> = {
  Alisa: [],
  Mike: [],
  Connie: [],
  Chuck: [],
};

// =======================
// 🪙 MINT
// =======================
router.post("/mint", (req, res) => {
  const { user_id, amount } = req.body;

  if (!balances[user_id]) {
    return res.status(400).json({ error: "Invalid user" });
  }

  balances[user_id] += amount;
  transactions[user_id].push(amount);

  return res.status(201).json({
    message: "Mint successful",
    balance: balances[user_id],
  });
});

// =======================
// 💸 TRANSFER
// =======================
router.post("/transfer", (req, res) => {
  const { from_user, to_user, amount } = req.body;

  if (!balances[from_user] || !balances[to_user]) {
    return res.status(400).json({ error: "Invalid user" });
  }

  if (balances[from_user] < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  balances[from_user] -= amount;
  balances[to_user] += amount;

  transactions[from_user].push(-amount);
  transactions[to_user].push(amount);

  return res.json({
    message: "Transfer successful",
    from_balance: balances[from_user],
    to_balance: balances[to_user],
  });
});

// =======================
// 📊 VELOCITY
// =======================
router.get("/velocity/:user", (req, res) => {
  const { user } = req.params;

  if (!transactions[user]) {
    return res.status(400).json({ error: "Invalid user" });
  }

  const lastTransactions = transactions[user];

  return res.json({
    last1minVolume: lastTransactions.slice(-1).reduce((a, b) => a + b, 0),
    last5minVolume: lastTransactions.slice(-5).reduce((a, b) => a + b, 0),
    last1hrVolume: lastTransactions.reduce((a, b) => a + b, 0),
    txCountLast5min: lastTransactions.slice(-5).length,
    isSuspicious: lastTransactions.slice(-5).length > 3,
  });
});

export default router;