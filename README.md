# Bloop NFC Scanner Browser SDK

[![Release](https://github.com/bloop-box/nfc-scanner-client-browser/actions/workflows/release.yml/badge.svg)](https://github.com/bloop-box/nfc-scanner-client-browser/actions/workflows/release.yml)

SDK to ease the integration of the Bloop NFC Scanner into browser applications.

## Installation

```bash
npm i bloop-nfc-scanner
```

## Usage

The SDK has two modes of operations. You can either register a UID capture to continuously capture incoming UIDs or you
can capture a single UID via a promise.

### Continuous capture

```typescript
import {registerUidCapture} from 'bloop-nfc-scanner';

registerUidCapture(uid => {
    console.log(uid);
});
```

The register function returns a callback to unregister the capture again.

### Single capture

```typescript
import {captureUid} from 'bloop-nfc-scanner';

const uid = await captureUid();
console.log(uid);
```

You can also pass in an AbortSignal in order to cancel a running capture.

## Demo

To see the full functionality including error handling and such, clone this repository and run the following commands:

```bash
npm i
npm start
```
