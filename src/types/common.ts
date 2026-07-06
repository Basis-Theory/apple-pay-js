interface BasePaymentHeader {
  applicationData?: string;
  publicKeyHash: string;
  transactionId: string;
}

interface ECPaymentHeader extends BasePaymentHeader {
  ephemeralPublicKey: string;
}

interface RSAPaymentHeader extends BasePaymentHeader {
  wrappedKey: string;
}

interface BasePaymentTokenPaymentData {
  /**
   * Encrypted payment data dictionary, Base64 encoded
   */
  data: string;
  /**
   * Signature of the payment and header data, Base64 encoded
   */
  signature: string;
}

interface ECPaymentTokenPaymentData extends BasePaymentTokenPaymentData {
  version: 'EC_v1';
  header: ECPaymentHeader;
}

interface RSAPaymentTokenPaymentData extends BasePaymentTokenPaymentData {
  version: 'RSA_v1';
  header: RSAPaymentHeader;
}

type PaymentTokenPaymentData =
  | ECPaymentTokenPaymentData
  | RSAPaymentTokenPaymentData;

interface ThreeDSDetailedPaymentData {
  /**
   * Online payment cryptogram, as defined by 3D Secure. Base64 encoded
   */
  onlinePaymentCryptogram: string;
  /**
   * ECI indicator, as defined by 3D Secure.
   *
   * The card network may add an ECI indicator to the payment data that the payment token includes.
   *
   * If you receive an ECI indicator, you must pass it on to your payment processor; otherwise, the transaction fails.
   */
  eciIndicator?: string;
}

interface EMVDetailedPaymentData {
  /**
   * The Europay, Mastercard, and Visa (EMV) payment structure, as a Base64-encoded string
   *
   * Output from the Secure Element
   */
  emvData: string;
  /**
   * The encrypted PIN, as a hex-encoded string.
   *
   * The PIN is encrypted using the bank’s key.
   *
   * RSA_v1 only.
   */
  encryptedPINData?: string;
}

interface AuthenticationResponse {
  /**
   * The submerchant identifier as provided by the coordinator merchant
   */
  merchantIdentifier: string;
  /**
   * Payment network-generated cryptogram for the submerchant
   */
  authenticationData: string;
  /**
   * The authorized amount for a given submerchant
   */
  transactionAmount: string;
}

interface MerchantTokenMetadata {
  /**
   * An array containing data you use to display art that represents the card related to the merchant token.
   */
  cardArt: {
    /**
     * A name representing the bank and the card used for the transaction.
     */
    name: string;
    /**
     * The card type.
     */
    type: string;
    /**
     * The URL for downloading the card art, as provided by the issuing bank.
     */
    url: string;
  }[];
  /**
   * Card data, including its expiration date and suffix, for the card related to the merchant token.
   */
  cardMetadata: {
    /**
     * The card’s expiration date.
     */
    expirationDate: string;
    /**
     * The last four digits of a card’s number.
     */
    fpanSuffix: string;
  };
}

interface BaseDecryptedPaymentData {
  /**
   * Device-specific account number of the card that funds this transaction.
   * A.K.A. "DPAN"
   */
  applicationPrimaryAccountNumber: string;
  /**
   * Card expiration date in the format YYMMDD
   */
  applicationExpirationDate: string;
  /**
   * ISO 4217 numeric currency code, as a string to preserve leading zeros
   */
  currencyCode: string;
  /**
   * Transaction amount
   */
  transactionAmount: number;
  /**
   * Optional. Cardholder name.
   */
  cardholderName?: string;
  /**
   * Hex-encoded device manufacturer identifier
   */
  deviceManufacturerIdentifier: string;
  /**
   * For a multitoken request, a list of submerchant responses that contain cryptograms.
   */
  authenticationResponses?: AuthenticationResponse[];
  /**
   * For a merchant token request, the provisioned merchant token identifier from the payment network
   */
  merchantTokenIdentifier?: string;
  /**
   * For a merchant token request, this data contains card art and the token's last four digits and expiration date
   */
  merchantTokenMetadata?: MerchantTokenMetadata;
}

interface ThreeDSDecryptedPaymentData extends BaseDecryptedPaymentData {
  paymentDataType: '3DSecure';
  /**
   * Detailed payment data
   */
  paymentData: ThreeDSDetailedPaymentData;
}

interface EMVDecryptedPaymentData extends BaseDecryptedPaymentData {
  paymentDataType: 'EMV';
  /**
   * Detailed payment data
   */
  paymentData: EMVDetailedPaymentData;
}

type DecryptedPaymentData =
  | ThreeDSDecryptedPaymentData
  | EMVDecryptedPaymentData;

interface DecryptionStrategy<T extends PaymentTokenPaymentData> {
  decrypt(paymentData: T): DecryptedPaymentData;
}

export type {
  DecryptionStrategy,
  RSAPaymentTokenPaymentData,
  ECPaymentTokenPaymentData,
  PaymentTokenPaymentData,
  DecryptedPaymentData,
};
