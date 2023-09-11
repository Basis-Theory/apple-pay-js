# Basis Theory Apple Pay JS

Utility library for decrypting Apple Payment Tokens in Node.js environments.

| Encryption | Region     | Support |
| ---------- | ---------- | ------- |
| RSA        | China      | ❌      |
| ECC        | All Others | ✅      |

## Reactors Usage

The example below can be used as a template for decrypting the Apple Payment Token using [Reactors](https://developers.basistheory.com/docs/concepts/what-are-reactors).

```javascript
const { ApplePaymentTokenContext } = require('@basis-theory/apple-pay-js');

module.exports = async function (req) {
  const {
    bt,
    args: {
      applePayToken: { paymentData, ...applePayToken },
    },
    configuration: {
      CERTIFICATE_PEM: certificatePem,
      PRIVATE_KEY_PEM: privateKeyPem,
    },
  } = req;

  // creates token context from certificate / key configured in Reactor
  const context = new ApplePaymentTokenContext({
    certificatePem,
    privateKeyPem,
  });

  // decrypts Apple's PKPaymentToken paymentData
  const {
    applicationPrimaryAccountNumber,
    applicationExpirationDate,
    ...restPaymentData
  } = context.decrypt(paymentData);

  // vaults Apple Device PAN (DPAN)
  const token = await bt.tokens.create({
    type: 'card',
    data: {
      number: applicationPrimaryAccountNumber,
      expiration_month: applicationExpirationDate.slice(2, 4),
      expiration_year: `20${applicationExpirationDate.slice(-2)}`,
    },
  });

  return {
    raw: {
      token,
      applePayToken: {
        paymentData: restPaymentData,
        ...applePayToken,
      },
    },
  };
};
```

## Local Usage

The example below shows how to decrypt the Apple Payment Token using locally loaded certificates, useful in development and debugging scenarios.

If you need help understanding the risks associated with decrypting and manipulating the various forms of cardholder data in your own systems, [reach out to us](https://basistheory.com/contact).

```typescript
import {
  ApplePaymentTokenContext,
  ApplePayPaymentToken,
} from '@basis-theory/apple-pay-js';
import fs from 'fs';

const decryptApplePayToken = (token: ApplePayPaymentToken) => {
  const certificatePem = fs.readFileSync(
    './certificates/apple/payment-processing/apple_pay.pem'
  );
  const privateKeyPem = fs.readFileSync(
    './certificates/apple/payment-processing/private.key'
  );

  const context = new ApplePaymentTokenContext({
    certificatePem,
    privateKeyPem,
  });
  const decrypted = context.decrypt(token.paymentData);

  return decrypted;
};
```

### Inspiration

This package was inspired by [Spreedly Gala](https://github.com/spreedly/gala), particularly [this fork](https://github.com/Foxy/foxy-node-apple-pay-decrypt).
