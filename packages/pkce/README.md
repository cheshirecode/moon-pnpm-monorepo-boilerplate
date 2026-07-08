# @cheshirecode/pkce

PKCE (Proof Key for Code Exchange) library with refresh token rotation, plus a Vite demo app.

## Install

```sh
pnpm add @cheshirecode/pkce
```

## Usage

```js
import PKCE from '@cheshirecode/pkce';

const pkce = new PKCE({
  client_id: 'your-client-id',
  redirect_uri: 'https://example.com/callback',
});
```

## Demo app

The `src/` directory contains a Vite demo showing the PKCE flow with refresh
token rotation. Run it with `pnpm dev` from this package.

## Consumers

Used by applications implementing PKCE (Proof Key for Code Exchange) OAuth flows with refresh token rotation.

## License

MIT
