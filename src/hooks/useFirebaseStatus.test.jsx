/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useFirebaseStatus from './useFirebaseStatus';

const onAuthStateChangedMock = vi.fn();
const getDocMock = vi.fn();
const docMock = vi.fn(() => ({ path: 'mock/doc' }));

vi.mock('../firebase/config', () => ({
  auth: {},
  db: {}
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => onAuthStateChangedMock(...args)
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args) => docMock(...args),
  getDoc: (...args) => getDocMock(...args)
}));

const TestComponent = () => {
  const status = useFirebaseStatus();

  return (
    <div>
      <span data-testid="overall">{status.status}</span>
      <span data-testid="message">{status.message}</span>
      <span data-testid="auth-status">{status.services.auth.status}</span>
      <span data-testid="auth-message">{status.services.auth.message}</span>
      <span data-testid="firestore-status">{status.services.firestore.status}</span>
      <span data-testid="firestore-message">{status.services.firestore.message}</span>
    </div>
  );
};

describe('useFirebaseStatus', () => {
  beforeEach(() => {
    onAuthStateChangedMock.mockReset();
    getDocMock.mockReset();
    docMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('reports ready when both Auth and Firestore succeed', async () => {
    onAuthStateChangedMock.mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(null);
      }, 0);
      return () => {};
    });
    getDocMock.mockResolvedValue({ exists: () => true });

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('overall').textContent).toBe('ready');
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('ready');
    expect(screen.getByTestId('firestore-status').textContent).toBe('ready');
    expect(screen.getByTestId('message').textContent).toBe('Firebase is ready to sync.');
  });

  it('reports error when services fail with actionable messaging', async () => {
    const authError = { code: 'auth/invalid-api-key', message: 'Invalid API key' };
    const firestoreError = { code: 'firestore/permission-denied', message: 'Missing or insufficient permissions.' };

    onAuthStateChangedMock.mockImplementation((auth, callback, errorCallback) => {
      setTimeout(() => {
        if (errorCallback) {
          errorCallback(authError);
        }
      }, 0);
      return () => {};
    });
    getDocMock.mockRejectedValue(firestoreError);

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('overall').textContent).toBe('error');
    });

    expect(screen.getByTestId('auth-message').textContent).toContain('Invalid Firebase API key');
    expect(screen.getByTestId('firestore-message').textContent).toContain('Firestore denied access');
  });
});
