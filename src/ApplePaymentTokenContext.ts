import { EllipticCurveDecryptStrategy } from './EllipticCurveDecryptStrategy';
import type { DecryptedPaymentData, PaymentTokenPaymentData } from './types';

interface ApplePaymentTokenContextOptions {
  certificatePem: Buffer;
  privateKeyPem: Buffer;
}

interface ApplePaymentTokenContextWithFallbackOptions {
  primaryCertificatePem: Buffer;
  primaryPrivateKeyPem: Buffer;
  secondaryCertificatePem: Buffer;
  secondaryPrivateKeyPem: Buffer;
}

/**
 * Context used for decrypting Apple Payment Tokens.
 */
export class ApplePaymentTokenContext {
  public constructor(
    private readonly options:
      | ApplePaymentTokenContextOptions
      | ApplePaymentTokenContextWithFallbackOptions
  ) {}

  public decrypt(paymentData: PaymentTokenPaymentData): DecryptedPaymentData {
    if (
      (this.options as ApplePaymentTokenContextWithFallbackOptions)
        .primaryCertificatePem
    ) {
      return this.decryptWithFallback(
        paymentData,
        this.options as ApplePaymentTokenContextWithFallbackOptions
      );
    }

    return this.decryptWithOptions(
      paymentData,
      this.options as ApplePaymentTokenContextOptions
    );
  }

  private decryptWithFallback(
    paymentData: PaymentTokenPaymentData,
    options: ApplePaymentTokenContextWithFallbackOptions
  ): DecryptedPaymentData {
    try {
      return this.decryptWithOptions(paymentData, {
        certificatePem: options.primaryCertificatePem,
        privateKeyPem: options.primaryPrivateKeyPem,
      });
    } catch {
      return this.decryptWithOptions(paymentData, {
        certificatePem: options.secondaryCertificatePem,
        privateKeyPem: options.secondaryPrivateKeyPem,
      });
    }
  }

  private decryptWithOptions(
    paymentData: PaymentTokenPaymentData,
    options: ApplePaymentTokenContextOptions
  ): DecryptedPaymentData {
    if (paymentData.version === 'EC_v1') {
      const strategy = new EllipticCurveDecryptStrategy(options);

      return strategy.decrypt(paymentData);
    }

    throw new Error(
      `Unsupported decryption for payment data version: ${paymentData.version}`
    );
  }
}

export type {
  ApplePaymentTokenContextOptions,
  ApplePaymentTokenContextWithFallbackOptions,
};
