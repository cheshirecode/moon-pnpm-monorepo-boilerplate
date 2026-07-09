# @cheshirecode/pkce

PKCE (Proof Key for Code Exchange) library with refresh token rotation, plus a Vite demo app.

## Install

```sh
pnpm add @cheshirecode/pkce
```

## Usage

```js
import PKCEWrapper from '@cheshirecode/pkce';

const pkce = new PKCEWrapper({
  authz_uri: 'https://example.com/authorize',
  token_uri: 'https://example.com/token',
  redirect_uri: 'https://example.com/callback',
  requested_scopes: 'openid profile',
});
```

## Demo app

The `src/` directory contains a Vite demo showing the PKCE flow with refresh
token rotation. Run it with `pnpm dev` from this package.

## Consumers

Used by applications implementing PKCE (Proof Key for Code Exchange) OAuth flows with refresh token rotation.

## License

MIT
