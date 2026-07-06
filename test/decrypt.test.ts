import * as fs from 'fs';
import { ApplePaymentTokenContext, PaymentTokenPaymentData } from '../src';
import newEcToken from './fixtures/ec/token.new.json';
import oldEcToken from './fixtures/ec/token.old.json';
import rsaToken from './fixtures/rsa/token.json';

const oldEcCert = fs.readFileSync('test/fixtures/ec/apple_pay.old.pem');
const oldEcKey = fs.readFileSync('test/fixtures/ec/private.old.key');
const newEcCert = fs.readFileSync('test/fixtures/ec/apple_pay.new.pem');
const newEcKey = fs.readFileSync('test/fixtures/ec/private.new.key');

const rsaCert = fs.readFileSync('test/fixtures/rsa/apple_pay.pem');
const rsaKey = fs.readFileSync('test/fixtures/rsa/private.key');

describe('decrypt', () => {
  let ecContext: ApplePaymentTokenContext,
    rsaContext: ApplePaymentTokenContext,
    fullContext: ApplePaymentTokenContext;

  beforeEach(() => {
    ecContext = new ApplePaymentTokenContext({
      merchants: [
        {
          identifier: 'ec',
          certificatePem: newEcCert,
          privateKeyPem: newEcKey,
        },
      ],
    });
    rsaContext = new ApplePaymentTokenContext({
      merchants: [
        {
          identifier: 'rsa',
          certificatePem: rsaCert,
          privateKeyPem: rsaKey,
        },
      ],
    });
    fullContext = new ApplePaymentTokenContext({
      merchants: [
        {
          identifier: 'oldEc',
          certificatePem: oldEcCert,
          privateKeyPem: oldEcKey,
        },
        {
          identifier: 'newEc',
          certificatePem: newEcCert,
          privateKeyPem: newEcKey,
        },
        {
          identifier: 'rsa',
          certificatePem: rsaCert,
          privateKeyPem: rsaKey,
        },
      ],
    });
  });

  test('should throw when no merchant configuration is provided', () => {
    expect(() => new ApplePaymentTokenContext({ merchants: [] })).toThrow(
      'No merchant configuration provided for decryption context.'
    );
  });

  test('should throw when using old certificate', () => {
    expect(() =>
      ecContext.decrypt(oldEcToken.paymentData as PaymentTokenPaymentData)
    ).toThrow(
      'Failed to decrypt payment data using provided merchant configuration(s).'
    );
  });

  test('should throw when using wrong certificate type', () => {
    expect(() =>
      rsaContext.decrypt(newEcToken.paymentData as PaymentTokenPaymentData)
    ).toThrow(
      'Failed to decrypt payment data using provided merchant configuration(s).'
    );
  });

  test('should decrypt using RSA', () => {
    expect(
      rsaContext.decrypt(rsaToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
  });

  test('should decrypt using EC', () => {
    expect(
      ecContext.decrypt(newEcToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
  });

  test('should support rotation', () => {
    expect(
      fullContext.decrypt(oldEcToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
    expect(
      fullContext.decrypt(newEcToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
    expect(
      fullContext.decrypt(rsaToken.paymentData as PaymentTokenPaymentData)
    ).toMatchSnapshot();
  });
});
