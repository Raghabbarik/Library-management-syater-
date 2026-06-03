const { db } = require('../config/firebaseAdmin');
const admin = require('firebase-admin');

/**
 * Gets a collection reference scoped to the user's institution.
 * If the user is a super_admin and no specific institutionId is provided, returns a collectionGroup reference.
 * 
 * @param {Object} req - Express request object
 * @param {string} collectionName - Name of the collection ('users', 'books', 'transactions', 'gate_logs', 'notifications')
 * @param {string} [overrideInstId] - Optional explicit institutionId
 * @returns {FirebaseFirestore.Query | FirebaseFirestore.CollectionReference} Firestore Query or CollectionReference
 */
const getScopedCollection = (req, collectionName, overrideInstId) => {
  let instId = overrideInstId;
  
  if (!instId && req.query && req.query.institutionId) {
    instId = req.query.institutionId;
  }
  
  if (!instId && req.user) {
    instId = req.user.institutionId;
  }

  // If super_admin and no institution specified, fetch globally using collectionGroup
  if (req.user && req.user.role === 'super_admin' && !instId) {
    return db.collectionGroup(collectionName);
  }
  
  const finalInstId = instId || 'default_institution';
  return db.collection('institutions').doc(finalInstId).collection(collectionName);
};

/**
 * Gets a specific document from a collection.
 * If req.user is a super_admin and we don't have a specific institution scope, it will
 * query the collectionGroup to find the document.
 * 
 * @param {Object} req - Express request object
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - The document ID
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>} The document snapshot
 */
const getScopedDoc = async (req, collectionName, docId) => {
  let instId = null;
  if (req.query && req.query.institutionId) {
    instId = req.query.institutionId;
  } else if (req.user) {
    instId = req.user.institutionId;
  }
  
  if (req.user && req.user.role === 'super_admin' && !instId) {
    if (collectionName === 'users') {
      const userIndexDoc = await db.collection('userIndex').doc(docId).get();
      if (userIndexDoc.exists) {
        instId = userIndexDoc.data().institutionId;
      }
    }
    if (!instId) {
      instId = 'default_institution';
    }
  }
  
  const finalInstId = instId || 'default_institution';
  const doc = await db.collection('institutions').doc(finalInstId).collection(collectionName).doc(docId).get();
  return doc.exists ? doc : null;
};

/**
 * Gets a document reference for updates/deletions.
 * Resolves the reference directly if institutionId is known. If super_admin, searches the collectionGroup first.
 * 
 * @param {Object} req - Express request object
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - The document ID
 * @returns {Promise<FirebaseFirestore.DocumentReference>} The document reference
 */
const getScopedDocRefAsync = async (req, collectionName, docId) => {
  let instId = null;
  if (req.query && req.query.institutionId) {
    instId = req.query.institutionId;
  } else if (req.user) {
    instId = req.user.institutionId;
  }
  
  if (req.user && req.user.role === 'super_admin' && !instId) {
    if (collectionName === 'users') {
      const userIndexDoc = await db.collection('userIndex').doc(docId).get();
      if (userIndexDoc.exists) {
        instId = userIndexDoc.data().institutionId;
      }
    }
    if (!instId) {
      instId = 'default_institution';
    }
  }
  
  const finalInstId = instId || 'default_institution';
  return db.collection('institutions').doc(finalInstId).collection(collectionName).doc(docId);
};

/**
 * Gets a direct reference for a document, assuming the user's institution ID.
 * 
 * @param {Object} req - Express request object
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - The document ID
 * @returns {FirebaseFirestore.DocumentReference} The document reference
 */
const getScopedDocRef = (req, collectionName, docId) => {
  let instId = req.user ? req.user.institutionId : null;
  const finalInstId = instId || 'default_institution';
  return db.collection('institutions').doc(finalInstId).collection(collectionName).doc(docId);
};

module.exports = {
  getScopedCollection,
  getScopedDoc,
  getScopedDocRefAsync,
  getScopedDocRef
};
