import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../utils/api', () => {
  const api = { get: vi.fn(), put: vi.fn() };
  return { api, default: api };
});

import { api } from '../utils/api';
import notificationsReducer, {
  type AlertNotification,
} from '../../store/slices/notifications/notificationsSlice';
import authReducer from '../../store/slices/auth/authSlice';
import NotificationsBell from './NotificationsBell';
import MainLayout from './MainLayout';

const mockedApi = vi.mocked(api);

const makeItem = (id: string, message: string, isRead = false): AlertNotification => ({
  id,
  sourceKey: 'vuln-monitor',
  isRead,
  readAt: null,
  sentAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-02T00:00:00.000Z',
  payload: { telegramMessage: message },
});

const counts = (total: number) => ({
  total,
  'ransomware-live': 0,
  'telegram-channel': 0,
  'vuln-monitor': total,
});

const mockBackend = (items: AlertNotification[], total: number) => {
  mockedApi.get.mockImplementation(async (url: string) => {
    if (url.endsWith('/unread-count')) return { data: { success: true, data: counts(total) } };
    return { data: { success: true, data: items } };
  });
  mockedApi.put.mockResolvedValue({ data: { success: true, data: {} } });
};

const makeStore = () =>
  configureStore({ reducer: { notifications: notificationsReducer, auth: authReducer } });

const renderWith = (ui: React.ReactElement) =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );

const openBell = async () => {
  fireEvent.click(await screen.findByRole('button', { name: /^Notificaciones/ }));
  return screen.findByRole('dialog');
};

describe('NotificationsBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('shows the unread count in the badge with a Spanish aria-label', async () => {
    mockBackend([], 4);
    renderWith(<NotificationsBell />);
    const badge = await screen.findByLabelText('4 notificaciones sin leer');
    expect(badge.textContent).toBe('4');
  });

  it('shows a Spanish empty state', async () => {
    mockBackend([], 0);
    renderWith(<NotificationsBell />);
    const panel = await openBell();
    expect(await within(panel).findByText('No hay notificaciones')).toBeTruthy();
    expect(within(panel).getByText('Notificaciones')).toBeTruthy();
  });

  it('shows a Spanish error state when the backend fails', async () => {
    mockedApi.get.mockRejectedValue(new Error('boom'));
    renderWith(<NotificationsBell />);
    const panel = await openBell();
    expect(await within(panel).findByText('No se pudieron cargar las notificaciones')).toBeTruthy();
    expect(within(panel).queryByText('No hay notificaciones')).toBeNull();
  });

  it('renders script-containing payloads as plain text only', async () => {
    mockBackend([makeItem('1', '<b>CVE-1</b> is <script>x</script>critical')], 1);
    renderWith(<NotificationsBell />);
    const panel = await openBell();
    const text = await within(panel).findByText('CVE-1 is critical');
    expect(text.textContent).toBe('CVE-1 is critical');
    expect(panel.querySelector('script, b')).toBeNull();
  });

  it('drops style content from payloads', async () => {
    mockBackend([makeItem('1', 'ok<style>p{color:red}</style>done')], 1);
    renderWith(<NotificationsBell />);
    const panel = await openBell();
    expect(await within(panel).findByText('okdone')).toBeTruthy();
    expect(panel.querySelector('style')).toBeNull();
  });

  it('marks one notification as read', async () => {
    mockBackend([makeItem('n1', 'first alert')], 1);
    renderWith(<NotificationsBell />);
    const panel = await openBell();
    fireEvent.click(await within(panel).findByText('first alert'));
    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/alerts/notifications/n1/read'),
    );
    await waitFor(() => expect(screen.queryByLabelText(/sin leer/)).toBeNull());
  });

  it('marks all notifications as read and clears the badge', async () => {
    mockBackend([makeItem('1', 'a'), makeItem('2', 'b')], 2);
    renderWith(<NotificationsBell />);
    const panel = await openBell();
    expect(await screen.findByLabelText('2 notificaciones sin leer')).toBeTruthy();
    fireEvent.click(await within(panel).findByRole('button', { name: 'Marcar todas como leídas' }));
    await waitFor(() => expect(mockedApi.put).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByLabelText(/sin leer/)).toBeNull());
  });

  it('polls the unread count and stops on unmount', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      mockBackend([], 0);
      const { unmount } = renderWith(<NotificationsBell />);
      const unreadCalls = () =>
        mockedApi.get.mock.calls.filter(([url]) => String(url).endsWith('/unread-count')).length;
      await waitFor(() => expect(unreadCalls()).toBe(1));
      await vi.advanceTimersByTimeAsync(30_000);
      expect(unreadCalls()).toBe(2);
      unmount();
      await vi.advanceTimersByTimeAsync(90_000);
      expect(unreadCalls()).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('bell wiring in MainLayout', () => {
  const setViewport = (mobile: boolean) => {
    window.matchMedia = ((query: string) => ({
      matches: mobile && query.includes('max-width'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      onchange: null,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBackend([], 0);
  });
  afterEach(() => {
    cleanup();
  });

  it.each([
    ['desktop', false],
    ['mobile', true],
  ])('mounts a single bell on %s', async (_label, mobile) => {
    setViewport(mobile);
    renderWith(
      <MainLayout>
        <div>content</div>
      </MainLayout>,
    );
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());
    expect(screen.getAllByRole('button', { name: /^Notificaciones/, hidden: true })).toHaveLength(1);
  });
});
