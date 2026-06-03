const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let firebaseApp;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    const resolvedPath = path.resolve(serviceAccountPath);
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized with Service Account file');
    } else {
      throw new Error(`Credential file not found at resolved path: ${resolvedPath}`);
    }
  } else {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized with Service Account JSON from Env');
    } else {
      // Fallback: Initialize with project ID. Verifying tokens will work, 
      // but writing/reading Firestore database locally requires credentials or Application Default Credentials.
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'librarymanagement-fb5c9'
      });
      console.log('⚠️ Firebase Admin initialized with Project ID only');
    }
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
