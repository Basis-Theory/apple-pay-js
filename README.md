# Basis Theory Apple Pay JS

Utility for decrypting Apple Pay Tokens.

## Usage

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
