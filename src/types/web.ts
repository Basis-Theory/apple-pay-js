import type { PaymentTokenPaymentData } from './common';

type ApplePayPaymentMethodType = 'debit' | 'credit' | 'prepaid' | 'store';

type ApplePayPaymentPassActivationState =
  | 'activated'
  | 'requiresActivation'
  | 'activating'
  | 'suspended'
  | 'deactivated';

interface ApplePayPaymentPass {
  primaryAccountIdentifier: string;
  primaryAccountNumberSuffix: string;
  deviceAccountIdentifier?: string;
  deviceAccountNumberSuffix?: string;
  activationState: ApplePayPaymentPassActivationState;
}

interface ApplePayPaymentContact {
  phoneNumber: string;
  emailAddress: string;
  givenName: string;
  familyName: string;
  phoneticGivenName: string;
  phoneticFamilyName: string;
  addressLines: string[];
  subLocality: string;
  locality: string;
  postalCode: string;
  subAdministrativeArea: string;
  administrativeArea: string;
  country: string;
  countryCode: string;
}

interface ApplePayPaymentMethod {
  displayName?: string;
  network?: string;
  type?: ApplePayPaymentMethodType;
  paymentPass?: ApplePayPaymentPass;
  billingContact?: ApplePayPaymentContact;
}

interface ApplePayPaymentToken {
  paymentMethod: ApplePayPaymentMethod;
  transactionIdentifier?: string;
  paymentData?: PaymentTokenPaymentData;
}

interface ApplePayPayment {
  token: ApplePayPaymentToken;
  billingContact?: ApplePayPaymentContact;
  shippingContact?: ApplePayPaymentContact;
}

export type { ApplePayPayment };
