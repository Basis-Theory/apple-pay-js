import * as x509 from '@fidm/x509';
import * as crypto from 'crypto';
// import * as ECKey from 'ec-key';
import * as forge from 'node-forge';
import type { ApplePaymentTokenContextOptions } from './ApplePaymentTokenContext';
import type { ECPaymentTokenPaymentData, DecryptedPaymentData } from './types';

// TODO couldn't make this work with a import statement using parcel
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ECKey = require('ec-key');

const MERCHANT_ID_FIELD_OID = '1.2.840.113635.100.6.32';

/**
 * Initializing an instance of `PaymentToken` with JSON values present in the Apple Pay token string
 * JSON representation - https://developer.apple.com/library/ios/documentation/PassKit/Reference/PaymentTokenJSON/PaymentTokenJSON.html
 */
export class EllipticCurveDecryptStrategy {
  // There is no type definitions for ECKey
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly privateKey: any;

  private readonly merchantId: string;

  public constructor({
    certificatePem,
    privateKeyPem,
  }: ApplePaymentTokenContextOptions) {
    this.privateKey = new ECKey(privateKeyPem, 'pem');
    this.merchantId = this.extractMerchantId(certificatePem);
  }

  /**
   * Decrypting the token using the PEM formatted merchant certificate and private key (the latter of which, at least, is managed by a third-party)
   */
  public decrypt(paymentData: ECPaymentTokenPaymentData): DecryptedPaymentData {
    const {
      header: { ephemeralPublicKey },
      data,
    } = paymentData;

    const sharedSecret = this.generateSharedSecret(ephemeralPublicKey);
    const symmetricKey = this.deriveSymmetricKey(sharedSecret);
    const decrypted = this.decryptCiphertext(symmetricKey, data);

    // matches the second close brace and returns everything before and including
    // the second close brace. we need this because the result often returns with
    // some random cruft at the end, such as `�d*�<?}ތ0j{��[`
    const regex = /^[^}]+\}[^}]*\}/gu;

    return JSON.parse(decrypted.match(regex)[0]);
  }

  /**
   * Generating the shared secret with the merchant private key and the ephemeral public key(part of the payment token data)
   * using Elliptic Curve Diffie-Hellman (id-ecDH 1.3.132.1.12).
   * As the Apple Pay certificate is issued using prime256v1 encryption, create elliptic curve key instances using the package - https://www.npmjs.com/package/ec-key
   */
  private generateSharedSecret(ephemeralPublicKey: string): string {
    const prv = new ECKey(this.privateKey, 'pem'); // Create a new ECkey instance from PEM formatted string
    const publicEc = new ECKey(ephemeralPublicKey, 'spki'); // Create a new ECKey instance from a base-64 spki string

    return prv.computeSecret(publicEc).toString('hex'); // Compute secret using private key for provided ephemeral public key
  }

  /**
   * Extracting merchant id from merchant certificate
   * Merchant ID is the data of the extension 1.2.840.113635.100.6.32, which is the merchant identifier field (OID 1.2.840.113635.100.6.32).
   * This an id extension of the certificate it’s not your merchant identifier.
   * Parsing the certificate with the x509 NPM package - https://www.npmjs.com/package/x509#x509parsecert-cert-
   */
  private extractMerchantId(cert: Buffer | string): string {
    try {
      const info = x509.Certificate.fromPEM(
        typeof cert === 'string' ? Buffer.from(cert) : cert
      );
      const oid = info.extensions.find(
        (extension) => extension.oid === MERCHANT_ID_FIELD_OID
      );

      return oid.value.toString().slice(2);
    } catch {
      throw new Error('Unable to extract merchant ID from certificate.');
    }
  }

  /**
   * Derive the symmetric key using the key derivation function described in NIST SP 800-56A, section 5.8.1
   * https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-56ar.pdf
   * The symmetric key is a sha256 hash that contains shared secret token plus encoding information
   */
  private deriveSymmetricKey(sharedSecret: string): string {
    const KDF_ALGORITHM = '\u000Did-aes256-GCM'; // The byte (0x0D) followed by the ASCII string "id-aes256-GCM". The first byte of this value is an unsigned integer that indicates the string’s length in bytes; the remaining bytes are a constiable-length string.
    const KDF_PARTY_V = Buffer.from(this.merchantId, 'hex').toString('binary'); // The SHA-256 hash of your merchant ID string literal; 32 bytes in size.
    const KDF_PARTY_U = 'Apple'; // The ASCII string "Apple". This value is a fixed-length string.
    const KDF_INFO = KDF_ALGORITHM + KDF_PARTY_U + KDF_PARTY_V;

    const hash = crypto.createHash('sha256');

    hash.update(Buffer.from('000000', 'hex'));
    hash.update(Buffer.from('01', 'hex'));
    hash.update(Buffer.from(sharedSecret, 'hex'));
    hash.update(KDF_INFO, 'binary');

    return hash.digest('hex');
  }

  /**
   * Decrypting the cipher text from the token (data in the original payment token) key using AES–256 (id-aes256-GCM 2.16.840.1.101.3.4.1.46), with an initialization vector of 16 null bytes and no associated authentication data.
   *
   */
  private decryptCiphertext(symmetricKey: string, data: string): string {
    const decoded = forge.util.decode64(data);
    const SYMMETRIC_KEY = forge.util.createBuffer(
      Buffer.from(symmetricKey, 'hex').toString('binary')
    );
    const IV = forge.util.createBuffer(
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).toString(
        'binary'
      )
    ); // Initialization vector of 16 null bytes
    const CIPHERTEXT = forge.util.createBuffer(decoded.slice(0, -16));

    const decipher = forge.cipher.createDecipher('AES-GCM', SYMMETRIC_KEY); // Creates and returns a Decipher object that uses the given algorithm and password (key)
    const tag = decoded.slice(-16, decoded.length);

    decipher.start({
      iv: IV,
      tagLength: 128,
      tag,
    });

    decipher.update(CIPHERTEXT);
    decipher.finish();

    return Buffer.from(decipher.output.toHex(), 'hex').toString('utf-8');
  }
}
