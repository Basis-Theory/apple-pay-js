import * as fs from 'fs';
import { ApplePaymentTokenContext, PaymentTokenPaymentData } from '../src';
import token from './fixtures/token.json';

describe('decrypt', () => {
  let certificatePem: Buffer,
    privatePem: Buffer,
    context: ApplePaymentTokenContext;

  beforeEach(() => {
    certificatePem = fs.readFileSync(
      'test/fixtures/certificates/payment-processing/apple_pay.pem'
    );
    privatePem = fs.readFileSync(
      'test/fixtures/certificates/payment-processing/private.key'
    );
    context = new ApplePaymentTokenContext({
      certificatePem,
      privatePem,
    });
  });

  test('should throw unsupported payment data version', () => {
    expect(() =>
      context.decrypt({
        version: 'RSA_v1',
      } as PaymentTokenPaymentData)
    ).toThrow('Unsupported decryption for payment data version: RSA_v1');
  });

  test('should decrypt Apple Pay JS elliptic-curve encrypted token', () => {
    const decrypted = context.decrypt(
      token.paymentData as PaymentTokenPaymentData
    );

    expect(decrypted).toStrictEqual({
      applicationPrimaryAccountNumber: '4784000000380075', // this is a DPAN, only works with a cryptogram
      applicationExpirationDate: '231231',
      currencyCode: '840',
      transactionAmount: 100,
      deviceManufacturerIdentifier: '040010030273',
      paymentDataType: '3DSecure',
      paymentData: {
        onlinePaymentCryptogram: '/4hD3+cAE5A3VxSlUf4yMAACAAA=', // this cryptogram was issued for an expired transaction
        eciIndicator: '7',
      },
    });
  });
});
