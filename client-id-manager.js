export function getSharedClientId(userUid) {
    // Try permanent ID first
    let clientId = localStorage.getItem(`permanentClientId_${userUid}`);
    
    if (!clientId) {
        // Fallback to old random ID (for existing users)
        clientId = localStorage.getItem(`clientId_${userUid}`);
        
        if (!clientId) {
            // Generate PERMANENT Client ID based on UID
            clientId = 'CL' + userUid.substring(0, 4).toUpperCase();
            localStorage.setItem(`permanentClientId_${userUid}`, clientId);
        }
    }
    
    return clientId;
}

// For backward compatibility
export function getLegacyClientId(userUid) {
    return localStorage.getItem(`clientId_${userUid}`);
}