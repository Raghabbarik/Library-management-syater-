require('dotenv').config();
const { db, auth } = require('./src/config/firebaseAdmin');
const { generateQRCode } = require('./src/utils/qrGenerator');

const seedFirestore = async () => {
  try {
    console.log('Starting Firestore and Firebase Auth seeding with Scoped Multi-Tenant Database Collections...');

    const defaultAdminEmail = 'admin@smartlib.com';
    const defaultStudentEmail = 'student@smartlib.com';
    const defaultSuperAdminEmail = 'prempolai99@gmail.com';

    // 1. Clean up existing users in Firebase Auth
    const emailsToCleanup = [defaultAdminEmail, defaultStudentEmail, defaultSuperAdminEmail, 'superadmin@smartlib.com'];
    for (const email of emailsToCleanup) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        await auth.deleteUser(userRecord.uid);
        console.log(`Cleaned up Auth user: ${email}`);
      } catch (err) {
        // User doesn't exist, ignore
      }
    }

    // 2. Clear all scoped subcollections using collectionGroup
    const subcollectionsToClear = ['books', 'transactions', 'gate_logs', 'notifications', 'users'];
    for (const coll of subcollectionsToClear) {
      const snapshot = await db.collectionGroup(coll).get();
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Cleared Firestore collectionGroup: ${coll} (${snapshot.size} docs deleted)`);
    }

    // 3. Clear institutions root collection
    const instSnapshot = await db.collection('institutions').get();
    const instBatch = db.batch();
    instSnapshot.forEach(doc => instBatch.delete(doc.ref));
    await instBatch.commit();
    console.log(`Cleared root institutions collection (${instSnapshot.size} docs deleted)`);

    // 3b. Clear userIndex root collection
    const userIndexSnapshot = await db.collection('userIndex').get();
    const userIndexBatch = db.batch();
    userIndexSnapshot.forEach(doc => userIndexBatch.delete(doc.ref));
    await userIndexBatch.commit();
    console.log(`Cleared root userIndex collection (${userIndexSnapshot.size} docs deleted)`);

    // 4. Seed default institution
    const defaultInstId = 'default_institution';
    const defaultInst = {
      name: 'Smart Library',
      logo: '',
      plan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.collection('institutions').doc(defaultInstId).set(defaultInst);
    console.log('Seeded default institution.');

    // 5. Create Super Admin in Firebase Auth & Firestore Scoped Subcollection
    const superAdminUid = 'superadmin_smartlib_default_uid';
    await auth.createUser({
      uid: superAdminUid,
      email: defaultSuperAdminEmail,
      password: 'Prem@2006',
      displayName: 'Super Administrator'
    });
    await auth.setCustomUserClaims(superAdminUid, { role: 'super_admin', institutionId: defaultInstId });
    console.log('Created Super Admin in Firebase Auth + custom claims.');

    const superAdminQrData = JSON.stringify({ userId: superAdminUid, studentId: 'N/A', name: 'Super Administrator' });
    const superAdminQrCode = await generateQRCode(superAdminQrData);

    const superAdminProfile = {
      name: 'Super Administrator',
      email: defaultSuperAdminEmail,
      role: 'super_admin',
      phone: '+1 555 9999',
      isActive: true,
      isVerified: true,
      institutionId: defaultInstId,
      qrCode: superAdminQrCode,
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.collection('institutions').doc(defaultInstId).collection('users').doc(superAdminUid).set(superAdminProfile);
    await db.collection('userIndex').doc(superAdminUid).set({
      institutionId: defaultInstId,
      role: 'super_admin',
      email: defaultSuperAdminEmail.toLowerCase().trim()
    });
    console.log('Seeded Super Admin profile in scoped users subcollection and userIndex.');

    // 6. Create Admin in Firebase Auth & Scoped Subcollection
    const adminUid = 'admin_smartlib_default_uid';
    await auth.createUser({
      uid: adminUid,
      email: defaultAdminEmail,
      password: 'adminpassword123',
      displayName: 'Librarian Admin'
    });
    await auth.setCustomUserClaims(adminUid, { role: 'admin', institutionId: defaultInstId });
    console.log('Created Admin in Firebase Auth + custom claims.');

    const adminQrData = JSON.stringify({ userId: adminUid, studentId: 'N/A', name: 'Librarian Admin' });
    const adminQrCode = await generateQRCode(adminQrData);

    const adminProfile = {
      name: 'Librarian Admin',
      email: defaultAdminEmail,
      role: 'admin',
      phone: '+1 555 0199',
      isActive: true,
      isVerified: true,
      institutionId: defaultInstId,
      qrCode: adminQrCode,
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.collection('institutions').doc(defaultInstId).collection('users').doc(adminUid).set(adminProfile);
    await db.collection('userIndex').doc(adminUid).set({
      institutionId: defaultInstId,
      role: 'admin',
      email: defaultAdminEmail.toLowerCase().trim()
    });
    console.log('Seeded Admin profile in scoped users subcollection and userIndex.');

    // 7. Create Student in Firebase Auth & Scoped Subcollection
    const studentUid = 'student_smartlib_default_uid';
    await auth.createUser({
      uid: studentUid,
      email: defaultStudentEmail,
      password: 'studentpassword123',
      displayName: 'John Doe'
    });
    await auth.setCustomUserClaims(studentUid, { role: 'student', institutionId: defaultInstId });
    console.log('Created Student in Firebase Auth + custom claims.');

    const studentQrData = JSON.stringify({ userId: studentUid, studentId: 'STU001', name: 'John Doe' });
    const studentQrCode = await generateQRCode(studentQrData);

    const studentProfile = {
      name: 'John Doe',
      email: defaultStudentEmail,
      role: 'student',
      studentId: 'STU001',
      department: 'Computer Science',
      year: '3rd Year',
      phone: '+1 555 0100',
      isActive: true,
      isVerified: true,
      institutionId: defaultInstId,
      qrCode: studentQrCode,
      avatar: '',
      totalBooksIssued: 0,
      currentlyBorrowed: 0,
      totalFinesPaid: 0,
      pendingFines: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.collection('institutions').doc(defaultInstId).collection('users').doc(studentUid).set(studentProfile);
    await db.collection('userIndex').doc(studentUid).set({
      institutionId: defaultInstId,
      role: 'student',
      email: defaultStudentEmail.toLowerCase().trim()
    });
    console.log('Seeded Student profile in scoped users subcollection and userIndex.');

    // 8. Seed default books inside scoped subcollection
    const defaultBooks = [
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565',
        category: 'Fiction',
        description: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
        totalCopies: 5,
        availableCopies: 5,
        issuedCopies: 0,
        totalIssued: 0,
        isActive: true,
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80',
        coverImagePublicId: '',
        location: 'Fiction Shelf A',
        addedBy: adminUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '9780446310789',
        category: 'Fiction',
        description: 'The story of attorney Atticus Finch as he defends a black man charged with the rape of a white girl.',
        totalCopies: 3,
        availableCopies: 3,
        issuedCopies: 0,
        totalIssued: 0,
        isActive: true,
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
        coverImagePublicId: '',
        location: 'Fiction Shelf B',
        addedBy: adminUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '9780553380163',
        category: 'Science',
        description: 'A landmark volume in science writing by one of the great minds of our time.',
        totalCopies: 2,
        availableCopies: 2,
        issuedCopies: 0,
        totalIssued: 0,
        isActive: true,
        coverImage: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=400&q=80',
        coverImagePublicId: '',
        location: 'Science Shelf 1',
        addedBy: adminUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const booksColl = db.collection('institutions').doc(defaultInstId).collection('books');
    for (const book of defaultBooks) {
      const docRef = booksColl.doc();
      const bookQrData = JSON.stringify({ bookId: docRef.id, isbn: book.isbn, title: book.title });
      book.qrCode = await generateQRCode(bookQrData);
      book.institutionId = defaultInstId;
      await docRef.set(book);
    }
    console.log('Seeded default books in scoped books subcollection.');

    // 9. Seed initial entry gate logs inside scoped subcollection
    const now = new Date();
    const mockLogs = [
      {
        user: studentUid,
        type: 'entry',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
        scannedBy: adminUid,
        method: 'qr',
        notes: 'Desk QR Scan',
        institutionId: defaultInstId
      },
      {
        user: studentUid,
        type: 'exit',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString(),
        scannedBy: adminUid,
        method: 'qr',
        notes: 'Desk QR Scan',
        institutionId: defaultInstId
      },
      {
        user: studentUid,
        type: 'entry',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
        scannedBy: studentUid,
        method: 'qr',
        notes: 'Self-scanned',
        institutionId: defaultInstId
      },
      {
        user: studentUid,
        type: 'exit',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        scannedBy: studentUid,
        method: 'qr',
        notes: 'Self-scanned',
        institutionId: defaultInstId
      }
    ];

    const logsColl = db.collection('institutions').doc(defaultInstId).collection('gate_logs');
    for (const log of mockLogs) {
      await logsColl.add(log);
    }
    console.log('Seeded initial gate logs in scoped gate_logs subcollection.');

    console.log('All Firestore seeding finished successfully in scoped collections!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Firestore error:', error);
    process.exit(1);
  }
};

seedFirestore();
