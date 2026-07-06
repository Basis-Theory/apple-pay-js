import { ApplePaymentDecryptionError } from './ApplePaymentDecryptionError';
import { EcDecryptionStrategy } from './EcDecryptionStrategy';
import { RsaDecryptionStrategy } from './RsaDecryptionStrategy';
import {
  DecryptedPaymentData,
  DecryptionStrategy,
  PaymentTokenPaymentData,
} from './types';

interface ApplePayMerchantConfiguration {
  /**
   * (Optional) Merchant identifier, used for tracking errors.
   */
  identifier?: string;
  /**
   * Payment processing certificate issued by Apple for the merchant in PEM format.
   */
  certificatePem: Buffer;
  /**
   * Payment processing private key created by the Merchant in PEM format.
   */
  privateKeyPem: Buffer;
}

interface ApplePaymentTokenContextOptions {
  merchants: ApplePayMerchantConfiguration[];
}

/**
 * Context used for decrypting Apple Payment Tokens.
 */
export class ApplePaymentTokenContext {
  public constructor(
    private readonly options: ApplePaymentTokenContextOptions
  ) {
    if (!options.merchants.length) {
      throw new ApplePaymentDecryptionError(
        'No merchant configuration provided for decryption context.'
      );
    }
  }

  public decrypt(paymentData: PaymentTokenPaymentData): DecryptedPaymentData {
    const errors = [];

    for (const merchant of this.options.merchants) {
      try {
        return this.decryptForMerchant(paymentData, merchant);
      } catch (error) {
        error.merchantIdentifier = merchant.identifier;
        errors.push(error);
      }
    }

    throw new ApplePaymentDecryptionError(
      'Failed to decrypt payment data using provided merchant configuration(s).',
      errors
    );
  }

  private decryptForMerchant(
    paymentData: PaymentTokenPaymentData,
    merchant: ApplePayMerchantConfiguration
  ): DecryptedPaymentData {
    const strategy: DecryptionStrategy<PaymentTokenPaymentData> =
      paymentData.version === 'EC_v1'
        ? new EcDecryptionStrategy(merchant)
        : new RsaDecryptionStrategy(merchant);

    return strategy.decrypt(paymentData);
  }
}

export type { ApplePaymentTokenContextOptions, ApplePayMerchantConfiguration };
