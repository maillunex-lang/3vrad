import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'paradise_guest_token';

export type Player = {
  id: string;
  guestToken: string;
  displayName: string;
  coins: number;
  diamonds: number;
  buildStars: number;
  maxLevelCleared: number;
};

export type BuildingState = {
  buildingId: string;
  stage: number;
  style: 'tropical' | 'luxury' | 'fantasy';
};

export type InventoryItem = { itemId: string; qty: number };

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  currency: 'coins' | 'diamonds';
  price: number;
  kind: string;
};

export type TeamInfo = {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  members: number;
};

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.set('X-Guest-Token', token);
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

export async function ensureSession(): Promise<{
  player: Player;
  buildings: BuildingState[];
  inventory: InventoryItem[];
}> {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    const created = await api<Player>('/api/v1/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ name: 'Гость' }),
    });
    localStorage.setItem(TOKEN_KEY, created.guestToken);
    token = created.guestToken;
  }
  try {
    const me = await api<{
      player: Player;
      buildings: BuildingState[];
      inventory: InventoryItem[];
    }>('/api/v1/me');
    return { ...me, inventory: me.inventory ?? [] };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    const created = await api<Player>('/api/v1/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ name: 'Гость' }),
    });
    localStorage.setItem(TOKEN_KEY, created.guestToken);
    const me = await api<{
      player: Player;
      buildings: BuildingState[];
      inventory: InventoryItem[];
    }>('/api/v1/me');
    return { ...me, inventory: me.inventory ?? [] };
  }
}

export async function clearLevel(levelNo: number, coinsBase: number, idem: string) {
  return api<{
    alreadyCleared: boolean;
    buildStarGained: boolean;
    coinsGained: number;
    buildStars: number;
    coins: number;
    maxLevelCleared: number;
  }>('/api/v1/levels/clear', {
    method: 'POST',
    headers: { 'Idempotency-Key': idem },
    body: JSON.stringify({ levelNo, coinsBase, ratingStars: 1, idempotencyKey: idem }),
  });
}

export async function advanceBuilding(buildingId: string, idem: string) {
  return api<{
    buildingId: string;
    stage: number;
    style: string;
    buildStars: number;
    alreadyApplied: boolean;
  }>('/api/v1/buildings/advance', {
    method: 'POST',
    headers: { 'Idempotency-Key': idem },
    body: JSON.stringify({ buildingId, idempotencyKey: idem }),
  });
}

export async function setBuildingStyle(buildingId: string, style: string) {
  return api<BuildingState>('/api/v1/buildings/style', {
    method: 'POST',
    body: JSON.stringify({ buildingId, style }),
  });
}

export async function fetchShopCatalog() {
  return api<{ items: ShopItem[]; note: string }>('/api/v1/shop/catalog');
}

export async function buyShopItem(itemId: string, idem: string) {
  return api<{
    itemId: string;
    granted: Record<string, number>;
    coins: number;
    diamonds: number;
    inventory: InventoryItem[];
    alreadyApplied: boolean;
  }>('/api/v1/shop/buy', {
    method: 'POST',
    headers: { 'Idempotency-Key': idem },
    body: JSON.stringify({ itemId, idempotencyKey: idem }),
  });
}

export async function useInventoryItem(itemId: string, idem: string) {
  return api<{
    itemId: string;
    coins: number;
    diamonds: number;
    inventory: InventoryItem[];
    alreadyApplied: boolean;
  }>('/api/v1/inventory/use', {
    method: 'POST',
    headers: { 'Idempotency-Key': idem },
    body: JSON.stringify({ itemId, idempotencyKey: idem }),
  });
}

export async function fetchTeam() {
  return api<{ team: TeamInfo | null; members: { playerId: string; displayName: string; role: string }[] }>(
    '/api/v1/team',
  );
}

export async function createTeam(name: string) {
  return api<TeamInfo>('/api/v1/team/create', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function joinTeam(code: string) {
  return api<TeamInfo>('/api/v1/team/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}
