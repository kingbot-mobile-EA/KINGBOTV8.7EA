// Lightweight JSON file store — no external DB required for demo / Render free tier.
// Swap for Postgres in production (see README). All data persisted to ./data/*.json
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(
  process.env.DATA_DIR || path.join(__dirname, "..", "..", "data")
);

async function ensureDir() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

const cache = new Map();

export async function readCollection(name) {
  await ensureDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  if (cache.has(name)) return cache.get(name);
  try {
    const raw = await readFile(file, "utf8");
    const data = JSON.parse(raw);
    cache.set(name, data);
    return data;
  } catch {
    const empty = [];
    cache.set(name, empty);
    return empty;
  }
}

export async function writeCollection(name, data) {
  await ensureDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  cache.set(name, data);
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
  return data;
}

export async function insertOne(name, doc) {
  const col = await readCollection(name);
  col.push(doc);
  await writeCollection(name, col);
  return doc;
}

export async function findOne(name, predicate) {
  const col = await readCollection(name);
  return col.find(predicate) || null;
}

export async function updateOne(name, predicate, patch) {
  const col = await readCollection(name);
  const idx = col.findIndex(predicate);
  if (idx === -1) return null;
  col[idx] = { ...col[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeCollection(name, col);
  return col[idx];
}

export async function findMany(name, predicate) {
  const col = await readCollection(name);
  return col.filter(predicate);
}
