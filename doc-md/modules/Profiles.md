[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / Profiles

# Namespace: Profiles

## Table of contents

### Interfaces

- [CreateProfileRequest](../interfaces/Profiles.CreateProfileRequest.md)
- [IGroup](../interfaces/Profiles.IGroup.md)
- [IOrganization](../interfaces/Profiles.IOrganization.md)
- [IPermission](../interfaces/Profiles.IPermission.md)
- [IProfile](../interfaces/Profiles.IProfile.md)
- [IRole](../interfaces/Profiles.IRole.md)
- [IUpdateProfileRequest](../interfaces/Profiles.IUpdateProfileRequest.md)
- [SwitchProfileResponse](../interfaces/Profiles.SwitchProfileResponse.md)

### Type aliases

- [TPermission](Profiles.md#tpermission)
- [TPlan](Profiles.md#tplan)
- [TRole](Profiles.md#trole)

### Functions

- [createProfile](Profiles.md#createprofile)
- [deleteProfile](Profiles.md#deleteprofile)
- [getPermissions](Profiles.md#getpermissions)
- [getProfile](Profiles.md#getprofile)
- [getProfileGroups](Profiles.md#getprofilegroups)
- [getProfilePermissions](Profiles.md#getprofilepermissions)
- [getProfiles](Profiles.md#getprofiles)
- [getRoles](Profiles.md#getroles)
- [switchProfile](Profiles.md#switchprofile)
- [updateProfile](Profiles.md#updateprofile)

## Type aliases

### TPermission

Ƭ **TPermission**: ``"org:view"`` \| ``"member:view"`` \| ``"org:update"`` \| ``"member:add"`` \| ``"member:remove"`` \| ``"admin:add"`` \| ``"admin:remove"`` \| ``"org:delete"`` \| ``"org:transfer"`` \| ``"owner:add"`` \| ``"owner:remove"`` \| ``"template:creator:create:personal"`` \| ``"template:creator:visibility"`` \| ``"template:creator:create:org"`` \| ``"template:member:read"`` \| ``"template:member:write"`` \| ``"template:member:visibility"`` \| ``"template:creator:delete"`` \| ``"template:member:delete"`` \| ``"template:creator:create:public"`` \| ``"rform:access"`` \| ``"rcommon:access"`` \| ``"org:list"`` \| ``"org:create"``

#### Defined in

[Api/Profiles.ts:3](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L3)

___

### TPlan

Ƭ **TPlan**: ``"env:essential"`` \| ``"org:standard"``

#### Defined in

[Api/Profiles.ts:29](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L29)

___

### TRole

Ƭ **TRole**: ``"owner"`` \| ``"basic_user"`` \| ``"member"``

#### Defined in

[Api/Profiles.ts:31](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L31)

## Functions

### createProfile

▸ `Const` **createProfile**(`params`): `Promise`<[`IProfile`](../interfaces/Profiles.IProfile.md)\>

Create a profile. If the caller does not have a "current" profile set, the new profile will be made current.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const newProfile = await Profiles.createProfile({ first_name: 'FIRST', last_name: 'LAST', email: 'EMAIL' });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`CreateProfileRequest`](../interfaces/Profiles.CreateProfileRequest.md) |

#### Returns

`Promise`<[`IProfile`](../interfaces/Profiles.IProfile.md)\>

#### Defined in

[Api/Profiles.ts:147](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L147)

___

### deleteProfile

▸ `Const` **deleteProfile**(`profileId`): `Promise`<`any`\>

Delete a profile. If the requested profile is the caller's curent profile, the next available profile will be selected.

```typescript
import {Profiles} from '@verdocs/js-sdk';

await Profiles.deleteProfile('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:234](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L234)

___

### getPermissions

▸ `Const` **getPermissions**(): `Promise`<[`IPermission`](../interfaces/Profiles.IPermission.md)[]\>

Get a list of system roles.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const permissions = await Profiles.getPermissions();
```

#### Returns

`Promise`<[`IPermission`](../interfaces/Profiles.IPermission.md)[]\>

#### Defined in

[Api/Profiles.ts:129](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L129)

___

### getProfile

▸ `Const` **getProfile**(`profileId`): `Promise`<[`IProfile`](../interfaces/Profiles.IProfile.md)\>

Get a profile. The caller must have admin access to the given profile.
TODO: Add a "public" profile endpoint for public pages

```typescript
import {Profiles} from '@verdocs/js-sdk';

const profile = await Profiles.getProfile('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<[`IProfile`](../interfaces/Profiles.IProfile.md)\>

#### Defined in

[Api/Profiles.ts:160](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L160)

___

### getProfileGroups

▸ `Const` **getProfileGroups**(`profileId`): `Promise`<[`IGroup`](../interfaces/Profiles.IGroup.md)[]\>

Get a profile's groups.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const groups = await Profiles.getProfileGroups('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<[`IGroup`](../interfaces/Profiles.IGroup.md)[]\>

#### Defined in

[Api/Profiles.ts:183](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L183)

___

### getProfilePermissions

▸ `Const` **getProfilePermissions**(`profileId`): `Promise`<[`IPermission`](../interfaces/Profiles.IPermission.md)[]\>

Get a profile's permissions. The caller must have admin access to the given profile.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const permissions = await Profiles.getProfilePermissions('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<[`IPermission`](../interfaces/Profiles.IPermission.md)[]\>

#### Defined in

[Api/Profiles.ts:171](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L171)

___

### getProfiles

▸ `Const` **getProfiles**(): `Promise`<[`IProfile`](../interfaces/Profiles.IProfile.md)[]\>

Get the user's available profiles. The current profile will be marked with `current: true`.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const profiles = await Profiles.getProfiles()
```

#### Returns

`Promise`<[`IProfile`](../interfaces/Profiles.IProfile.md)[]\>

#### Defined in

[Api/Profiles.ts:93](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L93)

___

### getRoles

▸ `Const` **getRoles**(): `Promise`<[`IRole`](../interfaces/Profiles.IRole.md)[]\>

Get a list of system roles.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const roles = await Profiles.getRoles();
```

#### Returns

`Promise`<[`IRole`](../interfaces/Profiles.IRole.md)[]\>

#### Defined in

[Api/Profiles.ts:111](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L111)

___

### switchProfile

▸ `Const` **switchProfile**(`profileId`): `Promise`<[`SwitchProfileResponse`](../interfaces/Profiles.SwitchProfileResponse.md)\>

Switch the caller's "current" profile. The current profile is used for permissions checking and profile_id field settings
for most operations in Verdocs. It is important to select the appropropriate profile before calling other API functions.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const newProfile = await Profiles.switchProfile('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<[`SwitchProfileResponse`](../interfaces/Profiles.SwitchProfileResponse.md)\>

#### Defined in

[Api/Profiles.ts:203](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L203)

___

### updateProfile

▸ `Const` **updateProfile**(`profileId`, `params`): `Promise`<[`IProfile`](../interfaces/Profiles.IProfile.md)\>

Update a profile. For future expansion, the profile ID to update is required, but currently this must also be the
"current" profile for the caller.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const newProfile = await Profiles.updateProfile('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |
| `params` | [`IUpdateProfileRequest`](../interfaces/Profiles.IUpdateProfileRequest.md) |

#### Returns

`Promise`<[`IProfile`](../interfaces/Profiles.IProfile.md)\>

#### Defined in

[Api/Profiles.ts:222](https://github.com/Verdocs/js-sdk/blob/a85c709/src/Api/Profiles.ts#L222)
