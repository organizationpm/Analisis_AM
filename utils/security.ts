// --- CONFIGURACIÓN DE SEGURIDAD ---

// SHA-256 Hash (Pendiente de regeneración para nueva clave, se usará Fallback Base64)
export const PASSWORD_HASH = "PENDING_UPDATE_FOR_NEW_PASSWORD"; 

// Base64 de "alimarket2025#1234" (Respaldo activo)
const BACKUP_KEY = "YWxpbWFya2V0MjAyNSMxMjM0"; 

export async function hashPassword(password: string): Promise<string> {
  // Aseguramos minúsculas para el hash hexadecimal
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  } catch (e) {
    console.error("Crypto API error", e);
    return "error_generating_hash";
  }
}

export async function checkPassword(input: string): Promise<{ isValid: boolean; debugInfo?: string }> {
  const cleanInput = input.trim();
  
  // 1. Intento Principal: SHA-256
  const generatedHash = await hashPassword(cleanInput);
  if (generatedHash === PASSWORD_HASH) {
    return { isValid: true };
  }

  // 2. Intento de Respaldo: Base64 (Compatibilidad universal)
  // Esto asegura que si crypto.subtle falla en el navegador, la clave siga funcionando.
  try {
    const encoded = btoa(cleanInput);
    if (encoded === BACKUP_KEY) {
      return { isValid: true };
    }
  } catch (e) {
    // ignorar error de btoa
  }

  return { 
    isValid: false, 
    debugInfo: `Hash calculado: ${generatedHash.substring(0, 10)}... | Input: ${cleanInput}` 
  };
}

export function saveSession() {
  sessionStorage.setItem('auth_token', 'valid');
}

export function checkSession(): boolean {
  return sessionStorage.getItem('auth_token') === 'valid';
}

export function logout() {
  sessionStorage.removeItem('auth_token');
  window.location.reload();
}