import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const FIREBASE_SETTINGS_URL = 'https://console.firebase.google.com/project/_/settings/general';
const FIREBASE_STATUS_URL = 'https://status.firebase.google.com/';
const FIREBASE_SETUP_URL = 'https://firebase.google.com/docs/web/setup';
const FIRESTORE_RULES_URL = 'https://firebase.google.com/docs/firestore/security/get-started';
const FIRESTORE_SETUP_URL = 'https://firebase.google.com/docs/firestore/quickstart';

const SERVICE_LABELS = {
  auth: 'Auth',
  firestore: 'Firestore'
};

const createServiceState = (service, status, message, extras = {}) => ({
  service,
  label: SERVICE_LABELS[service] ?? service,
  status,
  message,
  link: extras.link ?? null,
  linkLabel: extras.linkLabel ?? null,
  error: extras.error ?? null
});

const createCheckingState = () => ({
  status: 'checking',
  message: 'Checking Firebase services…',
  services: {
    auth: createServiceState('auth', 'checking', 'Checking authentication…'),
    firestore: createServiceState('firestore', 'checking', 'Checking Firestore…')
  }
});

const computeOverallStatus = (services) => {
  const statuses = Object.values(services).map((service) => service.status);
  if (statuses.every((status) => status === 'ready')) {
    return 'ready';
  }
  if (statuses.some((status) => status === 'error')) {
    return 'error';
  }
  return 'checking';
};

const computeOverallMessage = (services) => {
  const serviceList = Object.values(services);
  const errors = serviceList.filter((service) => service.status === 'error');

  if (errors.length === 0) {
    if (serviceList.every((service) => service.status === 'ready')) {
      return 'Firebase is ready to sync.';
    }
    return 'Checking Firebase services…';
  }

  if (errors.length === 1) {
    return `Firebase ${errors[0].label} needs attention.`;
  }

  return 'Firebase Auth & Firestore need attention.';
};

const buildAuthErrorDetails = (error) => {
  const base = {
    link: FIREBASE_SETTINGS_URL,
    linkLabel: 'Open Firebase settings'
  };

  switch (error?.code) {
    case 'auth/invalid-api-key':
      return {
        ...base,
        message: 'Invalid Firebase API key. Update src/firebase/config.js with a valid key from your Firebase project.'
      };
    case 'auth/network-request-failed':
      return {
        ...base,
        link: FIREBASE_STATUS_URL,
        linkLabel: 'View Firebase status',
        message: 'Network error while contacting Firebase Auth. Check your internet connection or firewall settings.'
      };
    case 'auth/configuration-not-found':
    case 'auth/project-not-found':
      return {
        ...base,
        message: 'Firebase Auth configuration is missing. Confirm the project exists and Auth is enabled in the Firebase console.'
      };
    default:
      return {
        link: FIREBASE_SETUP_URL,
        linkLabel: 'Review web setup guide',
        message: error?.message ? `Auth error: ${error.message}` : 'Auth error. Review your Firebase configuration.'
      };
  }
};

const buildFirestoreErrorDetails = (error) => {
  switch (error?.code) {
    case 'failed-precondition':
    case 'firestore/failed-precondition':
      return {
        link: FIRESTORE_SETUP_URL,
        linkLabel: 'Enable Firestore',
        message: 'Firestore is not yet enabled for this project. Enable it in the Firebase console.'
      };
    case 'permission-denied':
    case 'firestore/permission-denied':
      return {
        link: FIRESTORE_RULES_URL,
        linkLabel: 'Review Firestore rules',
        message: 'Firestore denied access. Update your security rules or sign in with a user who has read permissions.'
      };
    case 'unavailable':
    case 'firestore/unavailable':
      return {
        link: FIREBASE_STATUS_URL,
        linkLabel: 'View Firebase status',
        message: 'Firestore service is unavailable. Verify your network connection or check Firebase status.'
      };
    default:
      return {
        link: FIRESTORE_SETUP_URL,
        linkLabel: 'Review Firestore setup',
        message: error?.message ? `Firestore error: ${error.message}` : 'Firestore error. Review your Firebase configuration.'
      };
  }
};

const missingInstanceMessage = (service) =>
  createServiceState(
    service,
    'error',
    `Firebase ${SERVICE_LABELS[service]} instance not found. Confirm exports in src/firebase/config.js.`,
    {
      link: FIREBASE_SETUP_URL,
      linkLabel: 'Review web setup guide'
    }
  );

const useFirebaseStatus = () => {
  const [state, setState] = useState(() => createCheckingState());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkAuth = useCallback(async () => {
    if (!auth) {
      return missingInstanceMessage('auth');
    }

    try {
      await new Promise((resolve, reject) => {
        let unsubscribe = () => {};
        unsubscribe = onAuthStateChanged(
          auth,
          () => {
            unsubscribe();
            resolve();
          },
          (error) => {
            unsubscribe();
            reject(error);
          }
        );
      });

      return createServiceState('auth', 'ready', 'Authentication is ready.');
    } catch (error) {
      const { message, link, linkLabel } = buildAuthErrorDetails(error);
      return createServiceState('auth', 'error', message, { link, linkLabel, error });
    }
  }, []);

  const checkFirestore = useCallback(async () => {
    if (!db) {
      return missingInstanceMessage('firestore');
    }

    try {
      const testDocRef = doc(db, '__firebase_status__', '__ping__');
      await getDoc(testDocRef);
      return createServiceState('firestore', 'ready', 'Firestore is reachable.');
    } catch (error) {
      const { message, link, linkLabel } = buildFirestoreErrorDetails(error);
      return createServiceState('firestore', 'error', message, { link, linkLabel, error });
    }
  }, []);

  const refresh = useCallback(async () => {
    setState(createCheckingState());

    const [authResult, firestoreResult] = await Promise.all([checkAuth(), checkFirestore()]);
    if (!isMountedRef.current) {
      return;
    }

    const services = {
      auth: authResult,
      firestore: firestoreResult
    };

    setState({
      status: computeOverallStatus(services),
      message: computeOverallMessage(services),
      services
    });
  }, [checkAuth, checkFirestore]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      ...state,
      refresh
    }),
    [state, refresh]
  );
};

export default useFirebaseStatus;
