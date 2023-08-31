import * as fs from 'fs';
import { ApplePaymentTokenContext, PaymentTokenPaymentData } from '../src';
import iosToken from './fixtures/token.ios.json';
import webToken from './fixtures/token.web.json';

describe('decrypt', () => {
  let certificatePem: Buffer,
    privateKeyPem: Buffer,
    context: ApplePaymentTokenContext;

  beforeEach(() => {
    certificatePem = fs.readFileSync(
      'test/fixtures/certificates/payment-processing/apple_pay.pem'
    );
    privateKeyPem = fs.readFileSync(
      'test/fixtures/certificates/payment-processing/private.key'
    );
    context = new ApplePaymentTokenContext({
      certificatePem,
      privateKeyPem,
    });
  });

  test('should throw unsupported payment data version', () => {
    expect(() =>
      context.decrypt({
        version: 'RSA_v1',
      } as PaymentTokenPaymentData)
    ).toThrow('Unsupported decryption for payment data version: RSA_v1');
  });

  test.each([
    [
      'Web',
      webToken,
      {
        applicationPrimaryAccountNumber: '4784000000380075',
        applicationExpirationDate: '231231',
        currencyCode: '840',
        transactionAmount: 100,
        deviceManufacturerIdentifier: '040010030273',
        paymentDataType: '3DSecure',
        paymentData: {
          onlinePaymentCryptogram: '/4hD3+cAE5A3VxSlUf4yMAACAAA=',
          eciIndicator: '7',
        },
      },
    ],
    [
      'iOS',
      iosToken,
      {
        applicationPrimaryAccountNumber: '5155272275025002',
        applicationExpirationDate: '260630',
        currencyCode: '840',
        transactionAmount: 1099,
        deviceManufacturerIdentifier: '050110030273',
        paymentDataType: '3DSecure',
        paymentData: {
          onlinePaymentCryptogram: 'AOPWdiKEcY85ALsfCxqBAoABFA==',
        },
      },
    ],
  ])(
    'should decrypt %p Apple Payment elliptic-curve encryption token',
    (_, token, decrypted) =>
      expect(
        context.decrypt(token.paymentData as PaymentTokenPaymentData)
      ).toStrictEqual(decrypted)
  );
});
