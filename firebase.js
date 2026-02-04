import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCADBg6bzpMuII1xje5OvOaIz-2jtPcftQ",
    authDomain: "mylogin-f41d5.firebaseapp.com",
    projectId: "mylogin-f41d5",
    storageBucket: "mylogin-f41d5.firebasestorage.app",
    messagingSenderId: "806828163950",
    appId: "1:806828163950:web:2d6966fed3158fcc38b77f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
const db = getFirestore(app);

// ================================================
// Client ID from user UID
// ================================================
function generatePermanentClientId(userUid) {
    return 'CL' + userUid.substring(0, 4).toUpperCase();
}

// Get or create PERMANENT Client ID
function getOrCreatePermanentClientId(userUid) {
    // Use the shared function
    if (typeof getSharedClientId === 'function') {
        return getSharedClientId(userUid);
    }
    
    const storageKey = `permanentClientId_${userUid}`;
    let clientId = localStorage.getItem(storageKey);
    
    if (!clientId) {
        clientId = 'CL' + userUid.substring(0, 4).toUpperCase();
        localStorage.setItem(storageKey, clientId);
    }
    
    return clientId;
}

async function ensureClientIdInFirestore(userUid, email) {
    try {
        // Get PERMANENT Client ID
        const clientId = getOrCreatePermanentClientId(userUid);
        
        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', userUid));
        
        if (!userDoc.exists()) {
            // Create new user document with PERMANENT Client ID
            await setDoc(doc(db, 'users', userUid), {
                email: email,
                clientId: clientId,
                createdAt: Timestamp.now(),
                role: 'user',
                clientIdCreatedAt: Timestamp.now(),
                isPermanent: true
            });
            console.log('Created user document with PERMANENT Client ID:', clientId);
        } else {

          const userData = userDoc.data();
            if (!userData.clientId) {
                await updateDoc(doc(db, 'users', userUid), {
                    clientId: clientId,
                    clientIdUpdatedAt: Timestamp.now(),
                    isPermanent: true
                });
                console.log('Updated user with PERMANENT Client ID:', clientId);
            } else if (!userData.isPermanent) {

              await updateDoc(doc(db, 'users', userUid), {
                    clientId: clientId,
                    clientIdUpdatedAt: Timestamp.now(),
                    isPermanent: true,
                    previousClientId: userData.clientId
                });
                console.log('Converted to PERMANENT Client ID:', clientId);
            }
        }
        
        return clientId;
        
    } catch (error) {
        console.error('Error ensuring Client ID in Firestore:', error);
        return null;
    }
}

// Helper function to extract friendly error messages
function getFriendlyErrorMessage(error) {
  const errorCode = error.code || error.message;
  
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials.';
    
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please use a different email or try logging in.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    
    default:
      return 'An error occurred. Please try again.';
  }
}

// Strong password validation function
function validateStrongPassword(password) {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must include at least one special character (e.g., @, #, $).');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter.');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter.');
  }
  
  return errors;
}

// ================================================
// REGISTER - Create user with PERMANENT Client ID
// ================================================
export async function registerWithEmail(email, password) {
    try {
        const passwordErrors = validateStrongPassword(password);
        if (passwordErrors.length > 0) {
            return {
                success: false,
                error: passwordErrors.join(' ')
            };
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Generate PERMANENT Client ID based on user UID
        const clientId = getOrCreatePermanentClientId(user.uid);
        
        // Save user to Firestore with PERMANENT Client ID
        try {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                clientId: clientId,
                createdAt: Timestamp.now(),
                role: 'user',
                clientIdCreatedAt: Timestamp.now(),
                isPermanent: true
            });
            console.log('User registered with PERMANENT Client ID:', clientId);
        } catch (firestoreError) {
            console.warn('Could not save user to Firestore:', firestoreError);
        }
        
        await sendEmailVerification(user);
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: false,
                clientId: clientId
            },
            clientId: clientId
        };
    } catch (error) {
        return {
            success: false,
            error: getFriendlyErrorMessage(error)
        };
    }
}

// ================================================
// LOGIN 
// ================================================
export async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get PERMANENT Client ID 
        const clientId = getOrCreatePermanentClientId(user.uid);
        
        // Check user document without overwriting role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            // Only create if doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                clientId: clientId,
                createdAt: Timestamp.now(),
                role: 'user', 
                clientIdCreatedAt: Timestamp.now(),
                isPermanent: true
            });
        }
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                clientId: clientId
            }
        };
    } catch (error) {
        return {
            success: false,
            error: getFriendlyErrorMessage(error)
        };
    }
}

// ================================================
// GOOGLE LOGIN
// ================================================
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get PERMANENT Client ID
    const clientId = getOrCreatePermanentClientId(user.uid);
    
    // Check if document exists first
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
        // Only create if doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            clientId: clientId,
            createdAt: Timestamp.now(),
            role: 'user',
            displayName: user.displayName,
            photoURL: user.photoURL,
            clientIdCreatedAt: Timestamp.now(),
            isPermanent: true
        });
        console.log('Created Google user document');
    }
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        clientId: clientId
      }
    };
  } catch (error) {
    return {
      success: false,
      error: getFriendlyErrorMessage(error)
    };
  }
}

// Protect admin roles
export async function protectAdminRoles() {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in first');
            return false;
        }
        
        const { db, collection, getDocs, doc, updateDoc, Timestamp } = window.firestoreFunctions;
        
        // Get all users
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        let protectedCount = 0;
        
        // For each user with admin role
        for (const docSnapshot of snapshot.docs) {
            const userData = docSnapshot.data();
            
            if (userData.role === 'admin') {
                await updateDoc(docSnapshot.ref, {
                    isAdminProtected: true,
                    roleProtectedAt: Timestamp.now(),
                    protectedBy: user.uid
                });
                protectedCount++;
                console.log('Protected admin:', userData.email);
            }
        }
        
        console.log(`Protected ${protectedCount} admin users`);
        return true;
        
    } catch (error) {
        console.error('Error protecting admin roles:', error);
        return false;
    }
}

// ================================================
// GET CURRENT USER
// ================================================
export function getCurrentUser() {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
        return null;
    }
    
    // Get PERMANENT Client ID
    const clientId = getOrCreatePermanentClientId(firebaseUser.uid);
    
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        clientId: clientId 
    };
}

// ================================================
// EXISTING USERS
// ================================================
export async function migrateToPermanentClientIds() {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in first');
            return false;
        }
        
        // Get PERMANENT Client ID
        const permanentClientId = getOrCreatePermanentClientId(user.uid);
        
        // 1. Update user document in Firestore
        await updateDoc(doc(db, 'users', user.uid), {
            clientId: permanentClientId,
            clientIdMigratedAt: Timestamp.now(),
            isPermanent: true
        });
        
        // 2. Update all orders for this user
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, where("userId", "==", user.uid));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        let updatedOrders = 0;
        const updatePromises = [];
        
        ordersSnapshot.forEach((orderDoc) => {
            updatePromises.push(
                updateDoc(doc(db, 'orders', orderDoc.id), {
                    clientId: permanentClientId,
                    clientIdMigratedAt: Timestamp.now()
                })
            );
            updatedOrders++;
        });
        
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }
        
        alert(`✓ Migrated to PERMANENT Client ID!\n\nYour permanent Client ID: ${permanentClientId}\nUpdated ${updatedOrders} order(s)`);
        
        return permanentClientId;
        
    } catch (error) {
        console.error('Error migrating to permanent Client IDs:', error);
        alert('Error migrating to permanent Client IDs');
        return null;
    }
}

// ================================================
// DEBUG: Show current Client ID info
// ================================================
export function debugClientIdInfo() {
    const user = getCurrentUser();
    if (user) {
        console.group('🔍 Client ID Debug Info');
        console.log('User UID:', user.uid);
        console.log('User Email:', user.email);
        console.log('Current Client ID:', user.clientId);
        console.log('From localStorage:', localStorage.getItem(`permanentClientId_${user.uid}`));
        console.log('Is Permanent:', true);
        console.groupEnd();
        
        return {
            uid: user.uid,
            clientId: user.clientId,
            isPermanent: true
        };
    }
    return null;
}

// ================================================
// Other functions
// ================================================
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getFriendlyErrorMessage(error)
    };
  }
}

export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
      return { success: true };
    }
    return {
      success: false,
      error: 'No user logged in.'
    };
  } catch (error) {
    return {
      success: false,
      error: getFriendlyErrorMessage(error)
    };
  }
}

export async function changePassword(currentPassword, newPassword) {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      return {
        success: false,
        error: 'No user logged in.'
      };
    }
    
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    const passwordErrors = validateStrongPassword(newPassword);
    if (passwordErrors.length > 0) {
      return {
        success: false,
        error: passwordErrors.join(' ')
      };
    }
    
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getFriendlyErrorMessage(error)
    };
  }
}

export async function deleteAccount(password) {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      return {
        success: false,
        error: 'No user logged in.'
      };
    }
    
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    // Remove Client ID from localStorage
    localStorage.removeItem(`permanentClientId_${user.uid}`);
    
    // Delete user from Firestore
    try {
      await deleteDoc(doc(db, 'users', user.uid));
    } catch (firestoreError) {
      console.warn('Could not delete user from Firestore:', firestoreError);
    }
    
    await deleteUser(user);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getFriendlyErrorMessage(error)
    };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getFriendlyErrorMessage(error)
    };
  }
}

export function isEmailVerified() {
  const user = auth.currentUser;
  return user ? user.emailVerified : false;
}

export function checkAuthState(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Get PERMANENT Client ID
            const clientId = getOrCreatePermanentClientId(user.uid);
            
            // Safe check - only create if doesn't exist
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                // Only create new document if it doesn't exist
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    clientId: clientId,
                    createdAt: Timestamp.now(),
                    role: 'user',
                    clientIdCreatedAt: Timestamp.now(),
                    isPermanent: true
                });
                console.log('Created new user document for:', user.email);
            } else {

              const userData = userDoc.data();
                if (!userData.clientId || !userData.isPermanent) {
                    await updateDoc(doc(db, 'users', user.uid), {
                        clientId: clientId,
                        isPermanent: true,
                        clientIdUpdatedAt: Timestamp.now()
                    });
                }
            }
            
            callback(true, user, {
                email: user.email,
                emailVerified: user.emailVerified,
                clientId: clientId
            });
        } else {
            callback(false, null, null);
        }
    });
}

// Safe function to update ONLY clientId without affecting role
async function safeUpdateClientId(userUid, clientId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userUid));
        
        if (!userDoc.exists()) {
            return null; 
        }
        
        const userData = userDoc.data();
        
        // Only update if clientId is different or not permanent
        if (!userData.isPermanent || userData.clientId !== clientId) {
            const updateData = {
                clientId: clientId,
                isPermanent: true,
                clientIdUpdatedAt: Timestamp.now()
            };
            
            // Preserve previous clientId for reference
            if (userData.clientId && userData.clientId !== clientId) {
                updateData.previousClientId = userData.clientId;
            }
            
            await updateDoc(doc(db, 'users', userUid), updateData);
            console.log('Updated clientId for user:', userUid);
        }
        
        return clientId;
    } catch (error) {
        console.error('Error safely updating clientId:', error);
        return null;
    }
}

// Make functions available globally
window.auth = auth;
window.firestoreFunctions = {
    db: db,
    doc: doc,
    setDoc: setDoc,
    getDoc: getDoc,
    collection: collection,
    query: query,
    where: where,
    getDocs: getDocs,
    updateDoc: updateDoc,
    deleteDoc: deleteDoc,
    Timestamp: Timestamp,
    orderBy: orderBy
};

// Export utility functions
window.getCurrentUser = getCurrentUser;
window.migrateToPermanentClientIds = migrateToPermanentClientIds;
window.debugClientIdInfo = debugClientIdInfo;
window.signOutUser = signOutUser;

console.log('Firebase initialized with PERMANENT Client IDs');