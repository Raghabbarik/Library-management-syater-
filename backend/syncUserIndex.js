require('dotenv').config();
const { db, auth } = require('./src/config/firebaseAdmin');

const syncUserIndex = async () => {
  try {
    console.log('🔄 Starting userIndex synchronization and profile activation...');

    // 1. Get all user profiles from all institutions
    const usersSnapshot = await db.collectionGroup('users').get();
    console.log(`Found ${usersSnapshot.size} total users in subcollections.`);

    const batch = db.batch();
    let count = 0;

    for (const doc of usersSnapshot.docs) {
      const uid = doc.id;
      const userData = doc.data();
      const institutionId = userData.institutionId || 'default_institution';
      const role = userData.role || 'student';
      const email = userData.email || '';

      console.log(`Processing User: uid=${uid}, email=${email}, role=${role}, institutionId=${institutionId}`);

      // Ensure userIndex document exists
      const userIndexRef = db.collection('userIndex').doc(uid);
      batch.set(userIndexRef, {
        institutionId,
        role,
        email: email.toLowerCase().trim()
      });

      // Activate all users automatically for convenience in local dev
      if (!userData.isActive) {
        console.log(`  -> Activating user ${email} (setting isActive=true)`);
        const userDocRef = doc.ref;
        batch.update(userDocRef, { isActive: true, isVerified: true });
      }

      // Also set Firebase Custom Claims to make sure they are updated in Firebase Auth
      try {
        await auth.setCustomUserClaims(uid, {
          role,
          institutionId
        });
        console.log(`  -> Custom Claims updated successfully in Auth for ${uid}`);
      } catch (authErr) {
        console.warn(`  -> Could not set custom claims in Auth for ${uid}:`, authErr.message);
      }

      count++;
    }

    if (count > 0) {
      await batch.commit();
      console.log(`Successfully synchronized and activated ${count} users in userIndex!`);
    } else {
      console.log('No users found to synchronize.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error synchronizing userIndex:', error);
    process.exit(1);
  }
};

syncUserIndex();
