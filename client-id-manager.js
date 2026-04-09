export function getSharedClientId(userUid) {
    let clientId = localStorage.getItem(`permanentClientId_${userUid}`);
    
    if (!clientId) {
        clientId = localStorage.getItem(`clientId_${userUid}`);
        
        if (!clientId) {
            clientId = 'CL' + userUid.substring(0, 4).toUpperCase();
            localStorage.setItem(`permanentClientId_${userUid}`, clientId);
        }
    }
    
    return clientId;
}

export function getLegacyClientId(userUid) {
    return localStorage.getItem(`clientId_${userUid}`);
}