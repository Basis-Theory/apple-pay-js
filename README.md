# Basis Theory Apple Pay JS

Utility for decrypting Apple Pay Tokens.

## Usage

```typescript
import {
  ApplePayPaymentToken,
  ECPaymentTokenDecrypt,
  ECPaymentTokenPaymentData,
} from '@basis-theory/apple-pay';
import fs from 'fs';

const decryptApplePayToken = (token: ApplePayPaymentToken) => {
  const cert = fs.readFileSync(
    './certificates/apple/payment-processing/apple_pay.pem'
  );
  const key = fs.readFileSync(
    './certificates/apple/payment-processing/private.key'
  );

  const decrypt = new ECPaymentTokenDecrypt(
    token.paymentData as ECPaymentTokenPaymentData
  );
  const decrypted = decrypt.decrypt(cert, key);

  return decrypted;
};
```

### Inspiration

This package was inspired by [Spreedly Gala](https://github.com/spreedly/gala), particularly [this fork](https://github.com/Foxy/foxy-node-apple-pay-decrypt).
