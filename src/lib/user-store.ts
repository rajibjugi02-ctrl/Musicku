import fs from "fs/promises";
import path from "path";

export interface FallbackUser {
  id: string;
  name: string;
  email: string;
  password: string; // bcrypt hashed password
  image?: string | null;
  createdAt: string;
}

const STORE_FILE = path.join(process.cwd(), ".users-store.json");

// In-memory cache for ultra-fast lookup and transient resilience
const memoryCache = new Map<string, FallbackUser>();
let isInitialized = false;

async function loadStore(): Promise<void> {
  if (isInitialized) return;
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item?.email) {
          memoryCache.set(item.email.toLowerCase().trim(), item);
        }
      }
    }
  } catch {
    // File doesn't exist yet or is empty: create an empty JSON array
    try {
      await fs.writeFile(STORE_FILE, JSON.stringify([], null, 2), "utf-8");
    } catch {
      // Ignore disk error on readonly environments
    }
  }
  isInitialized = true;
}

export async function getFallbackUserByEmail(email: string): Promise<FallbackUser | null> {
  await loadStore();
  const normalized = email.toLowerCase().trim();
  return memoryCache.get(normalized) || null;
}

export async function getFallbackUserById(id: string): Promise<FallbackUser | null> {
  await loadStore();
  for (const user of memoryCache.values()) {
    if (user.id === id) return user;
  }
  return null;
}

export async function saveFallbackUser(user: {
  id?: string;
  name?: string;
  email: string;
  password?: string;
  image?: string | null;
}): Promise<FallbackUser> {
  await loadStore();
  const normalized = user.email.toLowerCase().trim();

  const record: FallbackUser = {
    id: user.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: user.name?.trim() || "Musicku User",
    email: normalized,
    password: user.password || "",
    image: user.image || null,
    createdAt: new Date().toISOString(),
  };

  memoryCache.set(normalized, record);

  try {
    const all = Array.from(memoryCache.values());
    await fs.writeFile(STORE_FILE, JSON.stringify(all, null, 2), "utf-8");
  } catch (err) {
    console.warn("[UserStore] File write warning:", err);
  }

  return record;
}

export async function getAllFallbackUsers(): Promise<FallbackUser[]> {
  await loadStore();
  return Array.from(memoryCache.values());
}

