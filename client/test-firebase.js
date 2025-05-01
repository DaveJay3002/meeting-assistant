const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config();

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
console.log("Firebase initialized");

// Test function to create a test user
async function testCreateUser() {
  try {
    console.log("Attempting to create test user...");
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = "Test123!";
    
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log("Test user created successfully", userCredential.user.uid);
    
    // Now try to sign in with the test credentials
    await testSignIn(testEmail, testPassword);
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

// Test function to sign in
async function testSignIn(email, password) {
  try {
    console.log(`Attempting to sign in with ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Sign in successful", userCredential.user.uid);
  } catch (error) {
    console.error("Error signing in:", error);
  }
}

// Run tests
testCreateUser(); 