import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
console.log(firebaseConfig);

// Check if environment variables are loaded
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error('Firebase configuration is missing. Make sure you have set up .env.local with NEXT_PUBLIC_FIREBASE_* variables');
}

// Initialize Firebase
let app;
let db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    const auth = getAuth(app);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
}

// Function to test Firebase connection
export async function testFirebaseConnection() {
    try {
        // Try to fetch a document from Firestore
        const testCollection = collection(db, "signups");
        await getDocs(testCollection);
        console.log("✅ Firebase connection test successful!");
        return true;
    } catch (error) {
        console.error("❌ Firebase connection test failed:", error);
        throw error;
    }
}
// Authentication helper functions
export const signUpWithEmail = async (email, password, phoneNumber = null) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(getAuth(app), email, password);
        const user = userCredential.user;
        console.log("user", user);
        const userDoc = {
            uid: user.uid,
            email: user.email,
            createdAt: new Date(),
            lastLogin: new Date(),
            isActive: true,
        };

        // Add phone number if provided
        if (phoneNumber) {
            userDoc.phoneNumber = phoneNumber;
        }

        // Save user document to Firestore using UID as document ID
        await setDoc(doc(db, "users", user.uid), userDoc);
        
        console.log("User created successfully:", user);
        console.log("User document saved to Firestore");
        return { success: true, user };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error: error.message };
    }
};

export const signInWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(getAuth(app), email, password);
        const user = userCredential.user;
        console.log("User signed in successfully:", user);
        return { success: true, user };
    } catch (error) {
        console.error("Error signing in:", error);
        return { success: false, error: error.message };
    }
};

export const logOut = async () => {
    try {
        await signOut(getAuth(app));
        console.log("User signed out successfully");
        return { success: true };
    } catch (error) {
        console.error("Error signing out:", error);
        return { success: false, error: error.message };
    }
};

// Export initialized instances
export { db, app };
