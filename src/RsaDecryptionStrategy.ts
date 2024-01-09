import * as forge from 'node-forge';
import type { ApplePayMerchantConfiguration } from './ApplePaymentTokenContext';
import type {
  DecryptedPaymentData,
  DecryptionStrategy,
  RSAPaymentTokenPaymentData,
} from './types';

export class RsaDecryptionStrategy
  implements DecryptionStrategy<RSAPaymentTokenPaymentData>
{
  private readonly privateKey: Buffer;

  public constructor({ privateKeyPem }: ApplePayMerchantConfiguration) {
    this.privateKey = privateKeyPem;
  }

  public decrypt(
    paymentData: RSAPaymentTokenPaymentData
  ): DecryptedPaymentData {
    const {
      header: { wrappedKey },
      data,
    } = paymentData;

    const restoredKey = this.decryptWrappedKey(wrappedKey);

    const decrypted = this.decryptCiphertext(restoredKey, data);

    try {
      return JSON.parse(decrypted);
    } catch (error) {
      const err = new Error(
        'Unexpected format of decrypted data. Please check payment processing certificate and its private key.'
      );

      err.stack = error.stack;
      throw err;
    }
  }

  /**
   * Decrypting the wrappedKey with the merchant private key using by using the RSA/ECB/OAEPWithSHA256AndMGF1Padding algorithm.
   */
  private decryptWrappedKey(wrappedKey: string): string {
    const key = forge.pki.privateKeyFromPem(this.privateKey.toString('utf-8'));

    return key.decrypt(forge.util.decode64(wrappedKey), 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });
  }

  /**
   * Decrypting the cipher text from the token (data in the original payment token) key using AES–128 (id-aes128-GCM 2.16.840.1.101.3.4.1.6), with an initialization vector of 16 null bytes and no associated authentication data.
   *
   */
  private decryptCiphertext(symmetricKey: string, data: string): string {
    const decoded = forge.util.decode64(data);
    const SYMMETRIC_KEY = forge.util.createBuffer(symmetricKey);
    const iv = forge.util.createBuffer(
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).toString(
        'binary'
      )
    ); // Initialization vector of 16 null bytes
    const CIPHERTEXT = forge.util.createBuffer(decoded.slice(0, -16));

    const decipher = forge.cipher.createDecipher('AES-GCM', SYMMETRIC_KEY); // Creates and returns a Decipher object that uses the given algorithm and password (key)
    const tag = decoded.slice(-16, decoded.length);

    decipher.start({
      iv,
      tagLength: 128,
      tag: forge.util.createBuffer(tag),
    });

    decipher.update(CIPHERTEXT);
    decipher.finish();

    return Buffer.from(decipher.output.toHex(), 'hex').toString('utf-8');
  }
}
