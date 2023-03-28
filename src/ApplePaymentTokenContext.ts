import { EllipticCurveDecryptStrategy } from './EllipticCurveDecryptStrategy';
import type { DecryptedPaymentData, PaymentTokenPaymentData } from './types';

export interface ApplePaymentTokenContextOptions {
  certificatePem: Buffer;
  privatePem: Buffer;
}

export class ApplePaymentTokenContext {
  public constructor(
    private readonly options: ApplePaymentTokenContextOptions
  ) {}

  public decrypt(paymentData: PaymentTokenPaymentData): DecryptedPaymentData {
    if (paymentData.version === 'EC_v1') {
      const strategy = new EllipticCurveDecryptStrategy(this.options);

      return strategy.decrypt(paymentData);
    }

    throw new Error(
      `Unsupported decryption for payment data version: ${paymentData.version}`
    );
  }
}
