import { STORAGE_KEYS } from '../constants';
import type { User } from '../types';

interface StoredAuthSession {
  token: string | null;
  user: User | null;
}

const parseUser = (value: string | null): User | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
};

export const clearLegacyPersistentAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

export const getStoredAuthSession = (): StoredAuthSession => {
  clearLegacyPersistentAuth();

  const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const user = parseUser(sessionStorage.getItem(STORAGE_KEYS.USER_DATA));

  return { token, user };
};

export const getStoredAuthToken = (): string | null => {
  clearLegacyPersistentAuth();
  return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const persistAuthSession = (token: string, user: User) => {
  clearLegacyPersistentAuth();
  sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
};

export const updateStoredAuthUser = (user: User) => {
  sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
};

export const clearAuthSession = () => {
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
  clearLegacyPersistentAuth();
};
