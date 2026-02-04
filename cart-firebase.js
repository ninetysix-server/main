import { getCurrentUser } from './firebase.js';

export async function saveOrderToFirebase(orderId, orderData) {
    try {
        if (!window.firestoreFunctions) {
            console.error('Firestore not available');
            return false;
        }
        
        const { db, doc, setDoc, Timestamp } = window.firestoreFunctions;
        
        // Get user with PERMANENT Client ID
        const user = getCurrentUser();
        
        if (!user) {
            console.error('No user found');
            return false;
        }
        
        // Validate we have a Client ID
        if (!user.clientId) {
            console.error('No Client ID found for user');
            return false;
        }
        
        const completeOrderData = {
            ...orderData,
            orderId: orderId,
            userId: user.uid,
            clientId: user.clientId,
            userEmail: user.email,
            paymentStatus: orderData.paymentStatus || 'Pending',
            designStatus: orderData.designStatus || 'Waiting',
            progress: orderData.progress || 0,
            ozowPaymentLink: orderData.ozowPaymentLink || null,
            adminNotes: orderData.adminNotes || '',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            estimatedCompletion: orderData.estimatedCompletion || null
        };
        
        await setDoc(doc(db, 'orders', orderId), completeOrderData);
        console.log('✓ Order saved with PERMANENT Client ID:', user.clientId);
        return true;
        
    } catch (error) {
        console.error('Error saving order to Firestore:', error);
        return false;
    }
}

// Simple get order function
export async function getOrderFromFirebase(orderId) {
    try {
        if (!window.firestoreFunctions) {
            return null;
        }
        
        const { db, doc, getDoc } = window.firestoreFunctions;
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
            return { id: orderDoc.id, ...orderDoc.data() };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting order:', error);
        return null;
    }
}