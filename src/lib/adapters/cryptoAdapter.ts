import { CryptoProvider } from "../../domain/kiosk/kioskSecurity";

export const browserCryptoAdapter: CryptoProvider = {
  digestSha256: async (text: string): Promise<string> => {
    if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
      try {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (e) {
        console.warn("browserCryptoAdapter digest failed:", e);
      }
    }
    return "";
  },

  getRandomBytes: (length: number): Uint8Array => {
    const randomVals = new Uint8Array(length);
    if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(randomVals);
      return randomVals;
    }
    throw new Error("Secure cryptographic randomness provider is unavailable in this environment.");
  }
};
