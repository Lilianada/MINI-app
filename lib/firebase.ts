// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required config values are present
const isConfigValid = Object.values(firebaseConfig).every(
  (value) => value !== undefined && value !== null && value !== ""
);

// Only initialize Firebase on the client side
let app: any = undefined;
let auth: any = undefined;
let db: any = undefined;

const initializeFirebase = async () => {
  if (typeof window === "undefined") {
    // Server-side: return null values
    return { app: null, auth: null, db: null };
  }

  if (!isConfigValid) {
    console.error(
      "Firebase configuration is incomplete. Check your environment variables:",
      Object.keys(firebaseConfig)
        .filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig])
        .join(", ")
    );
    return { app: null, auth: null, db: null };
  }

  try {
    if (app && auth && db) {
      return { app, auth, db };
    }

    const { initializeApp, getApps } = await import("firebase/app");
    const { getAuth, setPersistence, browserLocalPersistence } = await import("firebase/auth");
    const { getFirestore } = await import("firebase/firestore");

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    auth = getAuth(app);
    
    // Set persistence on client
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
    
    db = getFirestore(app);

    return { app, auth, db };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return { app: null, auth: null, db: null };
  }
};

// Initialize immediately if on client
if (typeof window !== "undefined") {
  initializeFirebase();
}

export { app, auth, db, initializeFirebase };
