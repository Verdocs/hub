@verdocs/js-sdk - v1.0.3 / [Exports](modules.md)

# Verdocs JS SDK

> Verdocs SDK for Javascript / Typescript

This SDK provides convenience wrappers for both Browser-based and NodeJS applications to call the Verdocs API, with strong typing and
documentation to help you get started quickly developing for the Verdocs platform.

## Getting Started

First add this module to your project:

    npm install --save @verdocs/js-sdk

or:

    yarn add @verdocs/js-sdk

This package is namespaced into packages that organize API calls into functional groups. A top-level `export *` is provided for simplicity,
but to enable Tree Shaking to do its job, it is recommended that you only import the package required for a given task. For example, to
perform a simple authentication request:

```typescript
import {Auth} from '@verdocs/js-sdk/Auth';
import {Endpoint} from '@verdocs/js-sdk/HTTP';

const {accessToken} = await Auth.authenticateUser({username: 'MY_USERNAME', password: 'MY_PASSWORD'});
Endpoint.setAuthToken(accessToken);
```

## Documentation

Verdocs functions are organized into high-level modules that represent the main objects within the platform:

- Documents - An individual document to be signed. Documents are created from templates.
- HTTP - General support functionality for Verdocs' REST endpoints. Typically not used directly.
- Organizations - An Organization is a container for user profiles, templates, documents, billing, and other related objects.
- Templates - A template for a document containing a PDF file, metadata for signature fields, and other information.
- Users - All operations related to authentication and user-related operations.
- Utils - General support functions used by the other modules and exported for convenience.

Please see the [API Docs](https://github.com/Verdocs/js-sdk/tree/main/docs) for details on the functions provided by each module.

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

This repository is actively maintained and supported by [Verdocs](https://verdocs.com/). We welcome community contributions and
suggestions! Please file a pull request with any change requests and we will review them as soon as possible.
