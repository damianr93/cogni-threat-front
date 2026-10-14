import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../../../shared/utils/api', () => {
  const api = { get: vi.fn(), put: vi.fn() };
  return { api, default: api };
});

import { api } from '../../../shared/utils/api';
import reducer, {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  selectNotificationItems,
  selectNotificationsError,
  selectNotificationsLoading,
  selectUnreadCounts,
  selectUnreadTotal,
  type AlertNotification,
} from './notificationsSlice';

const mockedApi = vi.mocked(api);

const makeItem = (
  id: string,
  sourceKey: string | null,
  isRead = false,
): AlertNotification => ({
  id,
  sourceKey,
  isRead,
  readAt: isRead ? '2026-01-01T00:00:00.000Z' : null,
  sentAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-02T00:00:00.000Z',
  payload: { telegramMessage: `message ${id}` },
});

const makeStore = () =>
  configureStore({ reducer: { notifications: reducer } });

type TestStore = ReturnType<typeof makeStore>;

const seed = async (
  store: TestStore,
  items: AlertNotification[],
  counts: Record<string, number>,
) => {
  mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: items } });
  await store.dispatch(fetchNotifications());
  mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: counts } });
  await store.dispatch(fetchUnreadCount());
};

const COUNTS = {
  total: 3,
  'ransomware-live': 2,
  'telegram-channel': 0,
  'vuln-monitor': 1,
};

describe('notificationsSlice', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchNotifications', () => {
    it('requests the unread filter and source key and stores the items', async () => {
      const store = makeStore();
      const items = [makeItem('a', 'vuln-monitor'), makeItem('b', 'vuln-monitor')];
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: items } });

      await store.dispatch(
        fetchNotifications({ sourceKey: 'vuln-monitor', unread: true }),
      );

      expect(mockedApi.get).toHaveBeenCalledWith('/alerts/notifications', {
        params: { limit: 50, offset: 0, sourceKey: 'vuln-monitor', unread: true },
      });
      expect(selectNotificationItems(store.getState())).toEqual(items);
      expect(selectNotificationsLoading(store.getState())).toBe(false);
      expect(selectNotificationsError(store.getState())).toBeNull();
    });

    it('omits sourceKey and unread when not requested', async () => {
      const store = makeStore();
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

      await store.dispatch(fetchNotifications({ sourceKey: 'all' }));

      expect(mockedApi.get).toHaveBeenCalledWith('/alerts/notifications', {
        params: { limit: 50, offset: 0 },
      });
    });

    it('sets loading while pending', () => {
      const store = makeStore();
      mockedApi.get.mockReturnValueOnce(new Promise(() => {}));

      void store.dispatch(fetchNotifications());

      expect(selectNotificationsLoading(store.getState())).toBe(true);
    });

    it('sets error and clears the list when the first page fails', async () => {
      const store = makeStore();
      await seed(store, [makeItem('a', 'vuln-monitor')], COUNTS);
      mockedApi.get.mockRejectedValueOnce(new Error('Network Error'));

      await store.dispatch(fetchNotifications());

      expect(selectNotificationItems(store.getState())).toEqual([]);
      expect(selectNotificationsError(store.getState())).toBe('Network Error');
      expect(selectNotificationsLoading(store.getState())).toBe(false);
    });

    it('prefers the backend error message', async () => {
      const store = makeStore();
      mockedApi.get.mockRejectedValueOnce({
        response: { data: { error: 'sourceKey invalido' } },
        message: 'Request failed',
      });

      await store.dispatch(fetchNotifications());

      expect(selectNotificationsError(store.getState())).toBe('sourceKey invalido');
    });

    it('clears a previous error on the next successful fetch', async () => {
      const store = makeStore();
      mockedApi.get.mockRejectedValueOnce(new Error('boom'));
      await store.dispatch(fetchNotifications());
      mockedApi.get.mockResolvedValueOnce({
        data: { success: true, data: [makeItem('a', null)] },
      });

      await store.dispatch(fetchNotifications());

      expect(selectNotificationsError(store.getState())).toBeNull();
      expect(selectNotificationItems(store.getState())).toHaveLength(1);
    });

    it('appends further pages and tracks hasMore by short page', async () => {
      const store = makeStore();
      const page1 = Array.from({ length: 2 }, (_, i) => makeItem(`p1-${i}`, null));
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: page1 } });
      await store.dispatch(fetchNotifications({ limit: 2 }));
      expect(store.getState().notifications.hasMore).toBe(true);

      mockedApi.get.mockResolvedValueOnce({
        data: { success: true, data: [makeItem('p2-0', null)] },
      });
      await store.dispatch(fetchNotifications({ limit: 2, offset: 2 }));

      expect(mockedApi.get).toHaveBeenLastCalledWith('/alerts/notifications', {
        params: { limit: 2, offset: 2 },
      });
      expect(selectNotificationItems(store.getState()).map((n) => n.id)).toEqual([
        'p1-0',
        'p1-1',
        'p2-0',
      ]);
      expect(store.getState().notifications.hasMore).toBe(false);
    });

    it('keeps loaded items when a later page fails', async () => {
      const store = makeStore();
      mockedApi.get.mockResolvedValueOnce({
        data: { success: true, data: [makeItem('a', null), makeItem('b', null)] },
      });
      await store.dispatch(fetchNotifications({ limit: 2 }));
      mockedApi.get.mockRejectedValueOnce(new Error('boom'));

      await store.dispatch(fetchNotifications({ limit: 2, offset: 2 }));

      expect(selectNotificationItems(store.getState())).toHaveLength(2);
      expect(selectNotificationsError(store.getState())).toBe('boom');
    });
  });

  describe('fetchUnreadCount', () => {
    it('stores all counts when no source key is given', async () => {
      const store = makeStore();
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: COUNTS } });

      await store.dispatch(fetchUnreadCount());

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/alerts/notifications/unread-count',
        { params: {} },
      );
      expect(selectUnreadCounts(store.getState())).toEqual(COUNTS);
      expect(selectUnreadTotal(store.getState())).toBe(3);
    });

    it('updates only the requested source and recomputes total', async () => {
      const store = makeStore();
      await seed(store, [], COUNTS);
      mockedApi.get.mockResolvedValueOnce({
        data: { success: true, data: { count: 5 } },
      });

      await store.dispatch(fetchUnreadCount('telegram-channel'));

      expect(mockedApi.get).toHaveBeenLastCalledWith(
        '/alerts/notifications/unread-count',
        { params: { sourceKey: 'telegram-channel' } },
      );
      expect(selectUnreadCounts(store.getState())).toEqual({
        total: 8,
        'ransomware-live': 2,
        'telegram-channel': 5,
        'vuln-monitor': 1,
      });
    });

    it('keeps counts and does not set the list error when it fails', async () => {
      const store = makeStore();
      await seed(store, [], COUNTS);
      mockedApi.get.mockRejectedValueOnce(new Error('boom'));

      await store.dispatch(fetchUnreadCount());

      expect(selectUnreadCounts(store.getState())).toEqual(COUNTS);
      expect(selectNotificationsError(store.getState())).toBeNull();
    });
  });

  describe('markNotificationRead', () => {
    it('optimistically marks read and decrements total and source count', async () => {
      const store = makeStore();
      await seed(store, [makeItem('a', 'ransomware-live')], COUNTS);
      mockedApi.put.mockReturnValueOnce(new Promise(() => {}));

      void store.dispatch(markNotificationRead('a'));

      const state = store.getState();
      expect(selectNotificationItems(state)[0].isRead).toBe(true);
      expect(selectNotificationItems(state)[0].readAt).not.toBeNull();
      expect(selectUnreadCounts(state)).toEqual({
        total: 2,
        'ransomware-live': 1,
        'telegram-channel': 0,
        'vuln-monitor': 1,
      });
    });

    it('calls the read endpoint and keeps the change on success', async () => {
      const store = makeStore();
      await seed(store, [makeItem('a', 'vuln-monitor')], COUNTS);
      mockedApi.put.mockResolvedValueOnce({ data: { success: true, data: { id: 'a' } } });

      await store.dispatch(markNotificationRead('a'));

      expect(mockedApi.put).toHaveBeenCalledWith('/alerts/notifications/a/read');
      expect(selectNotificationItems(store.getState())[0].isRead).toBe(true);
      expect(selectUnreadTotal(store.getState())).toBe(2);
      expect(selectUnreadCounts(store.getState())['vuln-monitor']).toBe(0);
    });

    it('reverts the item and counts when the request is rejected', async () => {
      const store = makeStore();
      await seed(store, [makeItem('a', 'ransomware-live')], COUNTS);
      mockedApi.put.mockRejectedValueOnce(new Error('404'));

      await store.dispatch(markNotificationRead('a'));

      const state = store.getState();
      expect(selectNotificationItems(state)[0].isRead).toBe(false);
      expect(selectNotificationItems(state)[0].readAt).toBeNull();
      expect(selectUnreadCounts(state)).toEqual(COUNTS);
    });

    it('never decrements below zero and reverts only what it applied', async () => {
      const store = makeStore();
      await seed(
        store,
        [makeItem('a', 'telegram-channel')],
        { ...COUNTS, total: 0, 'telegram-channel': 0, 'ransomware-live': 0, 'vuln-monitor': 0 },
      );
      mockedApi.put.mockReturnValueOnce(new Promise(() => {}));
      void store.dispatch(markNotificationRead('a'));
      expect(selectUnreadTotal(store.getState())).toBe(0);
      expect(selectUnreadCounts(store.getState())['telegram-channel']).toBe(0);

      const store2 = makeStore();
      await seed(
        store2,
        [makeItem('a', 'telegram-channel')],
        { ...COUNTS, total: 0, 'telegram-channel': 0, 'ransomware-live': 0, 'vuln-monitor': 0 },
      );
      mockedApi.put.mockRejectedValueOnce(new Error('boom'));
      await store2.dispatch(markNotificationRead('a'));
      expect(selectUnreadTotal(store2.getState())).toBe(0);
      expect(selectUnreadCounts(store2.getState())['telegram-channel']).toBe(0);
    });

    it('does not touch counts for an already-read item but still calls the API', async () => {
      const store = makeStore();
      await seed(store, [makeItem('a', 'vuln-monitor', true)], COUNTS);
      mockedApi.put.mockResolvedValueOnce({ data: { success: true, data: { id: 'a' } } });

      await store.dispatch(markNotificationRead('a'));

      expect(selectUnreadCounts(store.getState())).toEqual(COUNTS);
    });

    it('does not move counts for an id that is not in the list', async () => {
      const store = makeStore();
      await seed(store, [makeItem('a', 'vuln-monitor')], COUNTS);
      mockedApi.put.mockResolvedValueOnce({ data: { success: true, data: { id: 'zzz' } } });

      await store.dispatch(markNotificationRead('zzz'));

      expect(selectUnreadCounts(store.getState())).toEqual(COUNTS);
      expect(selectNotificationItems(store.getState())[0].isRead).toBe(false);
    });

    it('exposes the action error when the request is rejected', async () => {
      const store = makeStore();
      await seed(store, [makeItem('a', 'vuln-monitor')], COUNTS);
      mockedApi.put.mockRejectedValueOnce(new Error('boom'));

      await store.dispatch(markNotificationRead('a'));

      expect(store.getState().notifications.actionError).toBe('boom');
      expect(selectNotificationsError(store.getState())).toBeNull();
    });
  });

  describe('markAllNotificationsRead', () => {
    const items = () => [
      makeItem('a', 'ransomware-live'),
      makeItem('b', 'vuln-monitor'),
      makeItem('c', 'ransomware-live'),
    ];

    it('resets only the given source and marks its loaded items read', async () => {
      const store = makeStore();
      await seed(store, items(), COUNTS);
      mockedApi.put.mockResolvedValueOnce({ data: { success: true, data: { count: 2 } } });

      await store.dispatch(markAllNotificationsRead('ransomware-live'));

      expect(mockedApi.put).toHaveBeenCalledWith('/alerts/notifications/read-all', null, {
        params: { sourceKey: 'ransomware-live' },
      });
      expect(selectNotificationItems(store.getState()).map((n) => n.isRead)).toEqual([
        true,
        false,
        true,
      ]);
      expect(selectUnreadCounts(store.getState())).toEqual({
        total: 1,
        'ransomware-live': 0,
        'telegram-channel': 0,
        'vuln-monitor': 1,
      });
    });

    it('resets every count when no source is given', async () => {
      const store = makeStore();
      await seed(store, items(), COUNTS);
      mockedApi.put.mockResolvedValueOnce({ data: { success: true, data: { count: 3 } } });

      await store.dispatch(markAllNotificationsRead());

      expect(mockedApi.put).toHaveBeenCalledWith('/alerts/notifications/read-all', null, {
        params: {},
      });
      expect(selectNotificationItems(store.getState()).every((n) => n.isRead)).toBe(true);
      expect(selectUnreadCounts(store.getState())).toEqual({
        total: 0,
        'ransomware-live': 0,
        'telegram-channel': 0,
        'vuln-monitor': 0,
      });
    });

    it('treats the all tab as no source', async () => {
      const store = makeStore();
      await seed(store, items(), COUNTS);
      mockedApi.put.mockResolvedValueOnce({ data: { success: true, data: { count: 3 } } });

      await store.dispatch(markAllNotificationsRead('all'));

      expect(selectUnreadTotal(store.getState())).toBe(0);
    });

    it('changes nothing and sets actionError when rejected', async () => {
      const store = makeStore();
      await seed(store, items(), COUNTS);
      mockedApi.put.mockRejectedValueOnce(new Error('boom'));

      await store.dispatch(markAllNotificationsRead());

      expect(selectUnreadCounts(store.getState())).toEqual(COUNTS);
      expect(selectNotificationItems(store.getState()).some((n) => n.isRead)).toBe(false);
      expect(store.getState().notifications.actionError).toBe('boom');
    });
  });
});
