# Basis Theory Apple Pay JS

Utility for decrypting Apple Pay Tokens.

## Usage

```typescript
import fs from "fs";
import {
  ApplePayPaymentToken,
  ECPaymentTokenDecrypt,
  ECPaymentTokenPaymentData,
} from "@basis-theory/apple-pay";

const decryptApplePayToken = (token: ApplePayPaymentToken) => {
  const cert = fs.readFileSync(
    "./certificates/apple/payment-processing/apple_pay.pem"
  );
  const key = fs.readFileSync(
    "./certificates/apple/payment-processing/private.key"
  );

  const decrypt = new ECPaymentTokenDecrypt(
    token.paymentData as ECPaymentTokenPaymentData
  );
  const decrypted = decrypt.decrypt(cert, key);

  return decrypted;
};

```

### Inspiration

This package was inspired by this fork:

https://github.com/Foxy/foxy-node-apple-pay-decrypt
