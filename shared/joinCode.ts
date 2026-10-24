// Team join codes (data-model spec): 8 characters with no look-alike 0, O, 1 or I.
// 32 characters, so a random byte maps to one without modulo bias.

export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_LENGTH = 8;

export function generateJoinCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(JOIN_CODE_LENGTH));
  return Array.from(bytes, (byte) => JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length]).join('');
}
