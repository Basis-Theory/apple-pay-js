import * as fs from 'fs';
import { ApplePaymentTokenContext, PaymentTokenPaymentData } from '../src';
import newToken from './fixtures/token.new.json';
import oldToken from './fixtures/token.old.json';

const oldCertificatePem = fs.readFileSync(
  'test/fixtures/certificates/payment-processing/apple_pay.old.pem'
);
const oldPrivateKeyPem = fs.readFileSync(
  'test/fixtures/certificates/payment-processing/private.old.key'
);
const newCertificatePem = fs.readFileSync(
  'test/fixtures/certificates/payment-processing/apple_pay.new.pem'
);
const newPrivateKeyPem = fs.readFileSync(
  'test/fixtures/certificates/payment-processing/private.new.key'
);

describe('decrypt', () => {
  let oldContext: ApplePaymentTokenContext,
    newContext: ApplePaymentTokenContext,
    fullContext: ApplePaymentTokenContext;

  beforeEach(() => {
    oldContext = new ApplePaymentTokenContext({
      certificatePem: oldCertificatePem,
      privateKeyPem: oldPrivateKeyPem,
    });
    newContext = new ApplePaymentTokenContext({
      certificatePem: newCertificatePem,
      privateKeyPem: newPrivateKeyPem,
    });
    fullContext = new ApplePaymentTokenContext({
      primaryCertificatePem: newCertificatePem,
      primaryPrivateKeyPem: oldPrivateKeyPem,
      secondaryCertificatePem: newCertificatePem,
      secondaryPrivateKeyPem: newPrivateKeyPem,
    });
  });

  test('should throw when using unsupported payment data version', () => {
    expect(() =>
      oldContext.decrypt({
        version: 'RSA_v1',
      } as PaymentTokenPaymentData)
    ).toThrow('Unsupported decryption for payment data version: RSA_v1');
  });

  test('should throw when using wrong old certificate', () => {
    expect(() =>
      oldContext.decrypt(newToken.paymentData as PaymentTokenPaymentData)
    ).toThrow(
      'Unexpected format of decrypted data. Please check payment processing certificate and its private key.'
    );
  });

  test('should throw when using wrong new certificate', () => {
    expect(() =>
      newContext.decrypt(oldToken.paymentData as PaymentTokenPaymentData)
    ).toThrow(
      'Unexpected format of decrypted data. Please check payment processing certificate and its private key.'
    );
  });

  test('should decrypt using right old certificate', () => {
    expect(
      oldContext.decrypt(oldToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
  });

  test('should decrypt using right new certificate', () => {
    expect(
      newContext.decrypt(newToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
  });

  test('should decrypt using fallback certificate', () => {
    expect(
      fullContext.decrypt(newToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
    expect(
      fullContext.decrypt(oldToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
  });
});
