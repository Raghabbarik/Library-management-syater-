const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixUsers() {
  const institutionsSnapshot = await db.collection('institutions').get();
  let count = 0;
  
  for (const doc of institutionsSnapshot.docs) {
    const usersSnapshot = await db.collection(`institutions/${doc.id}/users`).get();
    for (const userDoc of usersSnapshot.docs) {
      if (!userDoc.data().isActive) {
        await userDoc.ref.update({ isActive: true });
        count++;
        console.log(`Activated user: ${userDoc.data().email} in institution ${doc.id}`);
      }
    }
  }
  console.log(`Successfully activated ${count} users.`);
}

fixUsers().then(() => process.exit(0)).catch(console.error);
