import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../constants';
import type { User } from '../types';
import {
  clearAuthSession,
  getStoredAuthSession,
  getStoredAuthToken,
  persistAuthSession,
  updateStoredAuthUser,
} from './authSession';

const user: User = {
  id: 'user-1',
  email: 'admin@example.com',
  role: 'ADMIN',
  permission: 'WRITE',
};

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores auth data in sessionStorage instead of localStorage', () => {
    persistAuthSession('token-1', user);

    expect(sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe('token-1');
    expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
    expect(getStoredAuthSession()).toEqual({ token: 'token-1', user });
  });

  it('clears legacy localStorage auth data when reading the session', () => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'legacy-token');
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    expect(getStoredAuthToken()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER_DATA)).toBeNull();
  });

  it('updates and clears the session user without leaving persistent auth data', () => {
    persistAuthSession('token-1', user);
    updateStoredAuthUser({ ...user, email: 'updated@example.com' });

    expect(getStoredAuthSession().user?.email).toBe('updated@example.com');

    clearAuthSession();

    expect(sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.USER_DATA)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
  });
});
