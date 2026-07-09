# Verdocs JS SDK

> Verdocs SDK for Javascript / Typescript

This SDK provides convenience wrappers for both Browser-based and NodeJS applications to call the Verdocs API, with strong typing and
documentation to help you get started quickly developing for the Verdocs platform.

Please see the [Documentation](https://developers.verdocs.com/sdks/js-ts/overview) for installation
and usage instructions.

## Structure

Verdocs functions are organized into high-level modules that represent the main objects within the platform:

- Documents - An individual document to be signed. Documents are created from templates.
- HTTP - General support functionality for Verdocs' REST endpoints. Typically not used directly.
- Organizations - An Organization is a container for user profiles, templates, documents, billing, and other related objects.
- Templates - A template for a document containing a PDF file, metadata for signature fields, and other information.
- Users - All operations related to authentication and user-related operations.
- Utils - General support functions used by the other modules and exported for convenience.

Please see the [API Docs](https://github.com/Verdocs/js-sdk/tree/main/docs) for details on the functions provided by each module.

## Contributing

This repository is actively maintained and supported by [Verdocs](https://verdocs.com/). We welcome community contributions and
suggestions! Please file a pull request with any change requests and we will review them as soon as possible.

## TODO

Currently, we have placeholder tests for a number of functions but had to disable the test suite. See
https://jestjs.io/docs/ecmascript-modules and https://github.com/facebook/jest/issues/10025 for more information. Since we manage our
own transport endpoint, we can probably do this mocking ourselves and eliminate the dependency in the first place.
