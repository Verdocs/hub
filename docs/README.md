@verdocs/js-sdk - v1.0.1 / [Exports](modules.md)

# Verdocs JS SDK

> Verdocs SDK for Javascript / Typescript

This SDK provides convenience wrappers for both Browser-based and NodeJS applications with strong typing and documentation to help
you get started quickly developing for the Verdocs platform.

## Usage

We will shortly be adding code samples, tutorials, and guides. Until then, please refer to the
[API Documentation](https://github.com/Verdocs/js-sdk/tree/main/doc-md). Note that this package is namespaced into packages that organize
API calls into functional groups. A top-level `export *` is provided for simplicity, but to enable Tree Shaking to do its job, it is
recommended that you only import the package required for a given task, e.g.:

```typescript
import {Auth} from '@verdocs/js-sdk/Auth';
import {Endpoint} from '@verdocs/js-sdk/HTTP';

const {accessToken} = await Auth.authenticateUser({username: 'MY_USERNAME', password: 'MY_PASSWORD'});
Endpoint.setAuthToken(accessToken);
```

## HTTP Transport

The underlying transport uses `axios`, a cross-environment (NodeJS vs. Browser) HTTP transport layer. When this SDK is included in a
project, an `Endpoint` singleton Axios Instance will be created to support the API calls to Verdocs servers. This endpoint's operation
may be configured by importing it. Please see the [Axios Documentation](https://github.com/axios/axios) for more information on the
options available. For example, to override the default API call timeout of 3s:

```typescript
import {Endpoint} from '@verdocs/js-sdk/Auth/HTTP/Transport';

Endpoint.defaults.timeout = 5000;
```

## Contributing

Although we at Verdocs actively maintain this SDK, we welcome community contributions and suggestions! Please file a pull request
with any change requests and we will review them as soon as possible.
