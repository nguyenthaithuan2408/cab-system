import { Router } from "express";
import { ensurePaymentTables } from "../models/payment.js";

export const paymentRouter = Router();

let initialized = false;
async function ensureInitialized(pool) {
  if (!initialized) {
    await ensurePaymentTables(pool);
    initialized = true;
  }
}

// POST /payments/charge
paymentRouter.post("/charge", async (req, res) => {
  const { rideId, userId, amountCents, currency = "USD" } = req.body || {};

  if (!rideId || !userId || !Number.isInteger(amountCents) || amountCents <= 0) {
    return res.status(400).json({
      error: "rideId, userId, and positive integer amountCents are required",
    });
  }

  const client = await req.db.connect();
  try {
    await ensureInitialized(req.db);
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO wallets (user_id, balance_cents)
      VALUES ($1, 0)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [userId]
    );

    const { rows: walletRows } = await client.query(
      "SELECT balance_cents FROM wallets WHERE user_id = $1 FOR UPDATE",
      [userId]
    );

    const currentBalance = walletRows[0]?.balance_cents ?? 0;
    if (currentBalance < amountCents) {
      await client.query("ROLLBACK");
      return res.status(402).json({ error: "Insufficient wallet balance" });
    }

    const newBalance = currentBalance - amountCents;

    await client.query(
      "UPDATE wallets SET balance_cents = $1, updated_at = NOW() WHERE user_id = $2",
      [newBalance, userId]
    );

    const { rows: paymentRows } = await client.query(
      `
      INSERT INTO payments (ride_id, user_id, amount_cents, currency, status)
      VALUES ($1, $2, $3, $4, 'success')
      RETURNING id, ride_id, user_id, amount_cents, currency, status, created_at
      `,
      [rideId, userId, amountCents, currency]
    );

    await client.query("COMMIT");
    return res.status(201).json({
      ...paymentRows[0],
      balanceCentsAfter: newBalance,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error processing payment", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// GET /payments/history?userId=...
paymentRouter.get("/history", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: "userId query param is required" });
  }

  try {
    await ensureInitialized(req.db);
    const { rows } = await req.db.query(
      `
      SELECT id, ride_id, user_id, amount_cents, currency, status, created_at
      FROM payments
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [userId]
    );
    return res.json({ payments: rows });
  } catch (err) {
    console.error("Error fetching payment history", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /payments/wallet/topup
paymentRouter.post("/wallet/topup", async (req, res) => {
  const { userId, amountCents } = req.body || {};

  if (!userId || !Number.isInteger(amountCents) || amountCents <= 0) {
    return res.status(400).json({
      error: "userId and positive integer amountCents are required",
    });
  }

  const client = await req.db.connect();
  try {
    await ensureInitialized(req.db);
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO wallets (user_id, balance_cents)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET balance_cents = wallets.balance_cents + EXCLUDED.balance_cents,
                    updated_at = NOW()
      `,
      [userId, amountCents]
    );

    const { rows } = await client.query(
      "SELECT user_id, balance_cents, updated_at FROM wallets WHERE user_id = $1",
      [userId]
    );

    await client.query("COMMIT");
    return res.status(200).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error topping up wallet", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

