import { Router } from "express";
import { ensureDriverTable } from "../models/driver.js";

export const driverRouter = Router();

let initialized = false;
async function ensureInitialized(pool) {
  if (!initialized) {
    await ensureDriverTable(pool);
    initialized = true;
  }
}

// GET /drivers/profile - expects x-driver-id
driverRouter.get("/profile", async (req, res) => {
  const driverId = req.header("x-driver-id");
  if (!driverId) {
    return res.status(400).json({ error: "x-driver-id header is required" });
  }
  try {
    await ensureInitialized(req.db);
    const { rows } = await req.db.query(
      "SELECT id, name, vehicle, status, latitude, longitude, created_at FROM drivers WHERE id = $1",
      [driverId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Driver not found" });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching driver profile", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /drivers/status - update availability
driverRouter.put("/status", async (req, res) => {
  const driverId = req.header("x-driver-id");
  const { status } = req.body || {};

  if (!driverId) {
    return res.status(400).json({ error: "x-driver-id header is required" });
  }
  if (!["online", "offline", "busy"].includes(status)) {
    return res
      .status(400)
      .json({ error: "status must be one of online, offline, busy" });
  }

  try {
    await ensureInitialized(req.db);
    const { rows } = await req.db.query(
      "UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, vehicle, status, latitude, longitude, created_at, updated_at",
      [status, driverId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Driver not found" });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error updating driver status", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /drivers/location - simplified location update
driverRouter.put("/location", async (req, res) => {
  const driverId = req.header("x-driver-id");
  const { latitude, longitude } = req.body || {};

  if (!driverId) {
    return res.status(400).json({ error: "x-driver-id header is required" });
  }
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "latitude and longitude must be numbers" });
  }

  try {
    await ensureInitialized(req.db);
    const { rows } = await req.db.query(
      "UPDATE drivers SET latitude = $1, longitude = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, vehicle, status, latitude, longitude, created_at, updated_at",
      [latitude, longitude, driverId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Driver not found" });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error updating driver location", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /drivers/nearby?lat=..&lng=..&radiusKm=..
driverRouter.get("/nearby", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radiusKm || 5);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res
      .status(400)
      .json({ error: "lat and lng query params are required numbers" });
  }

  try {
    await ensureInitialized(req.db);
    // Simple bounding-box filter for performance; fine-grained geo can use PostGIS later.
    const degRadius = radiusKm / 111; // approx degrees per km

    const { rows } = await req.db.query(
      `
      SELECT id, name, vehicle, status, latitude, longitude
      FROM drivers
      WHERE status = 'online'
        AND latitude BETWEEN $1 AND $2
        AND longitude BETWEEN $3 AND $4
      LIMIT 50
      `,
      [lat - degRadius, lat + degRadius, lng - degRadius, lng + degRadius]
    );

    return res.json({ drivers: rows });
  } catch (err) {
    console.error("Error fetching nearby drivers", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

