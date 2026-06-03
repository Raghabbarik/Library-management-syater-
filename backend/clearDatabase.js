require('dotenv').config();
const { db, auth } = require('./src/config/firebaseAdmin');
const { generateQRCode } = require('./src/utils/qrGenerator');

const clearDatabase = async () => {
  try {
    console.log('🧹 Starting database purge: removing all institutions, books, transactions, gate logs, notifications, and users...');

    const defaultSuperAdminEmail = 'prempolai99@gmail.com';

    // 1. Fetch and delete all users in Firebase Auth except the Super Admin
    let pageToken;
    let authUsersDeleted = 0;
    do {
      const listUsersResult = await auth.listUsers(1000, pageToken);
      for (const userRecord of listUsersResult.users) {
        if (userRecord.email !== defaultSuperAdminEmail) {
          await auth.deleteUser(userRecord.uid);
          authUsersDeleted++;
        }
      }
      pageToken = listUsersResult.pageToken;
    } while (pageToken);
    console.log(`Deleted ${authUsersDeleted} users from Firebase Auth.`);

    // 2. Clear all nested subcollections using collectionGroup
    const subcollectionsToClear = ['books', 'transactions', 'gate_logs', 'notifications', 'users'];
    for (const coll of subcollectionsToClear) {
      const snapshot = await db.collectionGroup(coll).get();
      const batch = db.batch();
      let count = 0;
      snapshot.forEach(doc => {
        // Keep the Super Admin profile in the users subcollection
        if (coll === 'users' && doc.id === 'superadmin_smartlib_default_uid') {
          return;
        }
        batch.delete(doc.ref);
        count++;
      });
      if (count > 0) {
        await batch.commit();
      }
      console.log(`Cleared Firestore collectionGroup: ${coll} (${count} docs deleted)`);
    }

    // 3. Clear institutions root collection, keeping only the default_institution for the Super Admin
    const instSnapshot = await db.collection('institutions').get();
    const instBatch = db.batch();
    let instCount = 0;
    instSnapshot.forEach(doc => {
      if (doc.id === 'default_institution') {
        return; // Keep default institution for Super Admin
      }
      instBatch.delete(doc.ref);
      instCount++;
    });
    if (instCount > 0) {
      await instBatch.commit();
    }
    console.log(`Cleared institutions root collection (${instCount} docs deleted)`);

    // 3b. Clear userIndex root collection, keeping only the Super Admin
    const userIndexSnapshot = await db.collection('userIndex').get();
    const userIndexBatch = db.batch();
    let userIndexCount = 0;
    userIndexSnapshot.forEach(doc => {
      if (doc.id === 'superadmin_smartlib_default_uid') {
        return; // Keep Super Admin index
      }
      userIndexBatch.delete(doc.ref);
      userIndexCount++;
    });
    if (userIndexCount > 0) {
      await userIndexBatch.commit();
    }
    console.log(`Cleared userIndex collection (${userIndexCount} docs deleted)`);

    // 4. Re-ensure Super Admin exists in Firebase Auth with custom claims
    const superAdminUid = 'superadmin_smartlib_default_uid';
    let superAdminAuthExists = false;
    try {
      await auth.getUser(superAdminUid);
      superAdminAuthExists = true;
    } catch (err) {
      // Doesn't exist
    }

    if (!superAdminAuthExists) {
      await auth.createUser({
        uid: superAdminUid,
        email: defaultSuperAdminEmail,
        password: 'Prem@2006',
        displayName: 'Super Administrator'
      });
      console.log('Recreated Super Admin in Firebase Auth.');
    }

    await auth.setCustomUserClaims(superAdminUid, { role: 'super_admin', institutionId: 'default_institution' });
    console.log('Ensured custom claims for Super Admin.');

    // 5. Re-ensure Super Admin profile document exists in Firestore
    const superAdminQrData = JSON.stringify({ userId: superAdminUid, studentId: 'N/A', name: 'Super Administrator' });
    const superAdminQrCode = await generateQRCode(superAdminQrData);

    const superAdminProfile = {
      name: 'Super Administrator',
      email: defaultSuperAdminEmail,
      role: 'super_admin',
      phone: '+1 555 9999',
      isActive: true,
      isVerified: true,
      institutionId: 'default_institution',
      qrCode: superAdminQrCode,
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.collection('institutions').doc('default_institution').collection('users').doc(superAdminUid).set(superAdminProfile);
    await db.collection('userIndex').doc(superAdminUid).set({
      institutionId: 'default_institution',
      role: 'super_admin',
      email: defaultSuperAdminEmail.toLowerCase().trim()
    });
    console.log('Ensured Super Admin profile document in Firestore and userIndex.');

    // 6. Ensure default_institution exists in Firestore
    const defaultInst = {
      name: 'Smart Library',
      logo: '',
      plan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.collection('institutions').doc('default_institution').set(defaultInst);
    console.log('Ensured default_institution settings document.');

    console.log('✨ Database purge finished successfully! Only the root Super Admin remains.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error purging database:', error);
    process.exit(1);
  }
};

clearDatabase();
