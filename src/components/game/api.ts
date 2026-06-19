import funcUrls from '../../../backend/func2url.json';

const AUTH_URL = funcUrls.auth;
const WORLD_URL = funcUrls.world;
const CLANS_URL = funcUrls.clans;

const TOKEN_KEY = 'pw_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function post(url: string, body: Record<string, unknown>, auth = true) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['X-Auth-Token'] = getToken();
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

// AUTH
export const apiRegister = (username: string, password: string, char: number) =>
  post(AUTH_URL, { action: 'register', username, password, char }, false);
export const apiLogin = (username: string, password: string) =>
  post(AUTH_URL, { action: 'login', username, password }, false);

// WORLD
export const apiSync = (x: number, y: number) => post(WORLD_URL, { action: 'sync', x, y });
export const apiDrop = (item: {
  x: number; y: number; sprite: unknown; creator: string; editors: string[]; solid: boolean;
}) => post(WORLD_URL, { action: 'drop', ...item });
export const apiPick = (id: number) => post(WORLD_URL, { action: 'pick', id });
export const apiEditItem = (id: number, sprite: unknown) => post(WORLD_URL, { action: 'edit', id, sprite });
export const apiSolid = (id: number, solid: boolean) => post(WORLD_URL, { action: 'solid', id, solid });
export const apiChat = (text: string) => post(WORLD_URL, { action: 'chat', text });
export const apiPrivatize = (col: number, row: number) => post(WORLD_URL, { action: 'privatize', col, row });
export const apiExtend = (col: number, row: number) => post(WORLD_URL, { action: 'extend', col, row });

// CLANS
export const apiClanList = (query = '') => post(CLANS_URL, { action: 'list', query });
export const apiClanCreate = (name: string) => post(CLANS_URL, { action: 'create', name });
export const apiClanRequest = (clanId: number) => post(CLANS_URL, { action: 'request', clanId });
export const apiClanRequests = () => post(CLANS_URL, { action: 'requests' });
export const apiClanAccept = (requestId: number) => post(CLANS_URL, { action: 'accept', requestId });
export const apiClanLeave = () => post(CLANS_URL, { action: 'leave' });
export const apiLeaderboard = () => post(CLANS_URL, { action: 'leaderboard' });
