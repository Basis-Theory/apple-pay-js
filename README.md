# Basis Theory Apple Pay JS

![Version](https://img.shields.io/npm/v/%40basis-theory/apple-pay-js) ![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/Basis-Theory/apple-pay-js/release.yml) ![License](https://img.shields.io/npm/l/%40basis-theory%2Fapple-pay-js)

Utility library for decrypting Apple Payment Tokens in Node.js environments.

## Features

- **Apple Pay [PKPaymentToken](https://developer.apple.com/documentation/passkit/apple_pay/payment_token_format_reference) Decryption**: Securely decrypt user-authorized Apple Pay transaction tokens using easy-to-interact interfaces.

  | Encryption | Region     | Support |
  | ---------- | ---------- | ------- |
  | RSA_v1     | China      | ✅      |
  | EC_v1      | All Others | ✅      |

- **Payment Processing Certificate Rotation**: Never worry about missing payments because Apple's certificate rotation has unpredictable behavior. Just add both certificates to the decryption context and rest assured that both new and old tokens will be decrypted during rotation window.
- **Automatic Decryption Strategy Detection**: Transparent integration for decrypting Apple's Payment Token regardless of the employed encryption standard.

## Apple Pay Setup

A pre-requisite to use this package is that you must have completed your Merchant Apple Pay Setup. This can be a time-consuming process, so the guides below will help you with step-by-step instructions to obtain the necessary files to issue and decrypt Apple Pay Tokens:

1. [Apple Developer Program Enrollment](./guides/apple-developer-program-enrollment.md)
2. [Create a Merchant ID](./guides/create-merchant-id.md)
3. [Create a Payment Processing Certificate](./guides/create-payment-processing-certificate.md)
4. [Create a Merchant Identity Certificate](./guides/create-merchant-identity-certificate.md)

To collect payments with Apple Pay in your frontend, Apple has specific guides for:

- [Web](https://applepaydemo.apple.com/)
- [iOS](https://developer.apple.com/documentation/passkit/apple_pay/offering_apple_pay_in_your_app)

## Installation

Install the package using NPM:

```shell
npm install @basis-theory/apple-pay-js --save
```

Or Yarn:

```shell
yarn add @basis-theory/apple-pay-js
```

## Node.js

The examples below show how to load certificates from the File System into Buffers, using samples from this repository. But you can load them from your KMS, secret manager, configuration, etc.

If you need help understanding the risks associated with decrypting and manipulating the various forms of cardholder data in your own systems, [reach out to us](https://basistheory.com/contact).

```javascript
import { ApplePaymentTokenContext } from '@basis-theory/apple-pay-js';
import fs from 'fs';
import token from './test/fixtures/ec/token.new.json';

// create the decryption context
const context = new ApplePaymentTokenContext({
  // add as many merchant certificates you need
  merchants: [
    {
      // optional certificate identifier
      identifier: 'merchant.basistheory.com-old',
      // the certificate and the private key are Buffers in PEM format
      certificatePem: fs.readFileSync(
        './test/fixtures/ec/apple/apple_pay.new.pem'
      ),
      privateKeyPem: fs.readFileSync(
        './test/fixtures/ec/apple/private.new.key'
      ),
    },
    {
      identifier: 'merchant.basistheory.com-new',
      certificatePem: fs.readFileSync(
        './test/fixtures/ec/apple/apple_pay.new.pem'
      ),
      privateKeyPem: fs.readFileSync(
        './test/fixtures/ec/apple/private.new.key'
      ),
    },
    {
      identifier: 'merchant.basistheory.china',
      certificatePem: fs.readFileSync(
        './test/fixtures/rsa/apple/apple_pay.pem'
      ),
      privateKeyPem: fs.readFileSync('./test/fixtures/rsa/apple/private.key'),
    },
  ],
});

try {
  // decrypts Apple's PKPaymentToken paymentData
  console.log(context.decrypt(token.paymentData));
} catch (error) {
  // couldn't decrypt the token with given merchant certificates
}
```

## Reactors

This package is available to use in [Reactors](https://developers.basistheory.com/docs/concepts/what-are-reactors) context. The example below shows how to decrypt Apple Pay tokens and vault the DPAN compliantly.

```javascript
const { Buffer } = require('buffer');
const { ApplePaymentTokenContext } = require('@basis-theory/apple-pay-js');
const {
  CustomHttpResponseError,
} = require('@basis-theory/basis-theory-reactor-formulas-sdk-js');

module.exports = async function (req) {
  const {
    bt,
    args: {
      applePayToken: { paymentData, ...applePayToken },
    },
    configuration: {
      PRIMARY_CERTIFICATE_PEM,
      PRIMARY_PRIVATE_KEY_PEM,
      SECONDARY_CERTIFICATE_PEM,
      SECONDARY_PRIVATE_KEY_PEM,
    },
  } = req;

  // creates token context from certificates / keys configured in Reactor
  const context = new ApplePaymentTokenContext({
    merchants: [
      {
        certificatePem: Buffer.from(PRIMARY_CERTIFICATE_PEM),
        privateKeyPem: Buffer.from(PRIMARY_PRIVATE_KEY_PEM),
      },
      {
        certificatePem: Buffer.from(SECONDARY_CERTIFICATE_PEM),
        privateKeyPem: Buffer.from(SECONDARY_PRIVATE_KEY_PEM),
      },
    ],
  });

  try {
    // decrypts Apple's PKPaymentToken paymentData
    const {
      applicationPrimaryAccountNumber,
      applicationExpirationDate,
      ...restPaymentData
    } = context.decrypt(paymentData);

    // vaults Apple Device PAN (DPAN)
    const btToken = await bt.tokens.create({
      type: 'card',
      data: {
        number: applicationPrimaryAccountNumber,
        expiration_month: applicationExpirationDate.slice(2, 4),
        expiration_year: `20${applicationExpirationDate.slice(-2)}`,
      },
    });

    // returns transaction details and vaulted token without sensitive DPAN
    return {
      raw: {
        btToken,
        applePayToken: {
          paymentData: restPaymentData,
          ...applePayToken,
        },
      },
    };
  } catch (error) {
    throw new CustomHttpResponseError({
      status: 500,
      body: {
        message: error.message,
      },
    });
  }
};
```

## 💡 Inspiration

This package was inspired by [Spreedly Gala](https://github.com/spreedly/gala), particularly [this fork](https://github.com/Foxy/foxy-node-apple-pay-decrypt).
