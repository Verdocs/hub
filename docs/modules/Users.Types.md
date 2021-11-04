[@verdocs/js-sdk - v1.0.8](../README.md) / [Exports](../modules.md) / [Users](Users.md) / Types

# Namespace: Types

[Users](Users.md).Types

## Table of contents

### Interfaces

- [IAuthenticateAppRequest](../interfaces/Users.Types.IAuthenticateAppRequest.md)
- [IAuthenticateResponse](../interfaces/Users.Types.IAuthenticateResponse.md)
- [IAuthenticateUserRequest](../interfaces/Users.Types.IAuthenticateUserRequest.md)
- [ICreateProfileRequest](../interfaces/Users.Types.ICreateProfileRequest.md)
- [IPermission](../interfaces/Users.Types.IPermission.md)
- [IProfile](../interfaces/Users.Types.IProfile.md)
- [IRole](../interfaces/Users.Types.IRole.md)
- [ISwitchProfileResponse](../interfaces/Users.Types.ISwitchProfileResponse.md)
- [IUpdateProfileRequest](../interfaces/Users.Types.IUpdateProfileRequest.md)
- [TokenValidationRequest](../interfaces/Users.Types.TokenValidationRequest.md)
- [TokenValidationResponse](../interfaces/Users.Types.TokenValidationResponse.md)
- [UpdateEmailRequest](../interfaces/Users.Types.UpdateEmailRequest.md)
- [UpdateEmailResponse](../interfaces/Users.Types.UpdateEmailResponse.md)
- [UpdatePasswordRequest](../interfaces/Users.Types.UpdatePasswordRequest.md)
- [UpdatePasswordResponse](../interfaces/Users.Types.UpdatePasswordResponse.md)

### Type aliases

- [TPermission](Users.Types.md#tpermission)
- [TPlan](Users.Types.md#tplan)
- [TRole](Users.Types.md#trole)

## Type aliases

### TPermission

Ƭ **TPermission**: ``"org:view"`` \| ``"member:view"`` \| ``"org:update"`` \| ``"member:add"`` \| ``"member:remove"`` \| ``"admin:add"`` \| ``"admin:remove"`` \| ``"org:delete"`` \| ``"org:transfer"`` \| ``"owner:add"`` \| ``"owner:remove"`` \| ``"template:creator:create:personal"`` \| ``"template:creator:visibility"`` \| ``"template:creator:create:org"`` \| ``"template:member:read"`` \| ``"template:member:write"`` \| ``"template:member:visibility"`` \| ``"template:creator:delete"`` \| ``"template:member:delete"`` \| ``"template:creator:create:public"`` \| ``"rform:access"`` \| ``"rcommon:access"`` \| ``"org:list"`` \| ``"org:create"``

#### Defined in

[Users/Types.ts:4](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Types.ts#L4)

___

### TPlan

Ƭ **TPlan**: ``"env:essential"`` \| ``"org:standard"``

#### Defined in

[Users/Types.ts:30](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Types.ts#L30)

___

### TRole

Ƭ **TRole**: ``"owner"`` \| ``"basic_user"`` \| ``"member"``

#### Defined in

[Users/Types.ts:32](https://github.com/Verdocs/js-sdk/blob/main/src/Users/Types.ts#L32)
