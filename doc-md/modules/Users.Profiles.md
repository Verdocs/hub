[@verdocs/js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / [Users](Users.md) / Profiles

# Namespace: Profiles

[Users](Users.md).Profiles

## Table of contents

### Functions

- [createProfile](Users.Profiles.md#createprofile)
- [deleteProfile](Users.Profiles.md#deleteprofile)
- [getPermissions](Users.Profiles.md#getpermissions)
- [getProfile](Users.Profiles.md#getprofile)
- [getProfileGroups](Users.Profiles.md#getprofilegroups)
- [getProfilePermissions](Users.Profiles.md#getprofilepermissions)
- [getProfiles](Users.Profiles.md#getprofiles)
- [getRoles](Users.Profiles.md#getroles)
- [switchProfile](Users.Profiles.md#switchprofile)
- [updateProfile](Users.Profiles.md#updateprofile)

## Functions

### createProfile

▸ `Const` **createProfile**(`params`): `Promise`<[`IProfile`](../interfaces/Users.Types.IProfile.md)\>

Create a profile. If the caller does not have a "current" profile set, the new profile will be made current.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const newProfile = await Profiles.createProfile({ first_name: 'FIRST', last_name: 'LAST', email: 'EMAIL' });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`ICreateProfileRequest`](../interfaces/Users.Types.ICreateProfileRequest.md) |

#### Returns

`Promise`<[`IProfile`](../interfaces/Users.Types.IProfile.md)\>

#### Defined in

[Users/Profiles.ts:54](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L54)

___

### deleteProfile

▸ `Const` **deleteProfile**(`profileId`): `Promise`<`any`\>

Delete a profile. If the requested profile is the caller's curent profile, the next available profile will be selected.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

await Profiles.deleteProfile('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<`any`\>

#### Defined in

[Users/Profiles.ts:128](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L128)

___

### getPermissions

▸ `Const` **getPermissions**(): `Promise`<[`IPermission`](../interfaces/Users.Types.IPermission.md)[]\>

Get a list of system roles.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const permissions = await Profiles.getPermissions();
```

#### Returns

`Promise`<[`IPermission`](../interfaces/Users.Types.IPermission.md)[]\>

#### Defined in

[Users/Profiles.ts:43](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L43)

___

### getProfile

▸ `Const` **getProfile**(`profileId`): `Promise`<[`IProfile`](../interfaces/Users.Types.IProfile.md)\>

Get a profile. The caller must have admin access to the given profile.
TODO: Add a "public" profile endpoint for public pages

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const profile = await Profiles.getProfile('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<[`IProfile`](../interfaces/Users.Types.IProfile.md)\>

#### Defined in

[Users/Profiles.ts:67](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L67)

___

### getProfileGroups

▸ `Const` **getProfileGroups**(`profileId`): `Promise`<[`IGroup`](../interfaces/Users.Types.IGroup.md)[]\>

Get a profile's groups.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const groups = await Profiles.getProfileGroups('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<[`IGroup`](../interfaces/Users.Types.IGroup.md)[]\>

#### Defined in

[Users/Profiles.ts:90](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L90)

___

### getProfilePermissions

▸ `Const` **getProfilePermissions**(`profileId`): `Promise`<[`IPermission`](../interfaces/Users.Types.IPermission.md)[]\>

Get a profile's permissions. The caller must have admin access to the given profile.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const permissions = await Profiles.getProfilePermissions('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<[`IPermission`](../interfaces/Users.Types.IPermission.md)[]\>

#### Defined in

[Users/Profiles.ts:78](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L78)

___

### getProfiles

▸ `Const` **getProfiles**(): `Promise`<[`IProfile`](../interfaces/Users.Types.IProfile.md)[]\>

Get the user's available profiles. The current profile will be marked with `current: true`.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const profiles = await Profiles.getProfiles()
```

#### Returns

`Promise`<[`IProfile`](../interfaces/Users.Types.IProfile.md)[]\>

#### Defined in

[Users/Profiles.ts:21](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L21)

___

### getRoles

▸ `Const` **getRoles**(): `Promise`<[`IRole`](../interfaces/Users.Types.IRole.md)[]\>

Get a list of system roles.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const roles = await Profiles.getRoles();
```

#### Returns

`Promise`<[`IRole`](../interfaces/Users.Types.IRole.md)[]\>

#### Defined in

[Users/Profiles.ts:32](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L32)

___

### switchProfile

▸ `Const` **switchProfile**(`profileId`): `Promise`<[`ISwitchProfileResponse`](../interfaces/Users.Types.ISwitchProfileResponse.md)\>

Switch the caller's "current" profile. The current profile is used for permissions checking and profile_id field settings
for most operations in Verdocs. It is important to select the appropropriate profile before calling other API functions.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const newProfile = await Profiles.switchProfile('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |

#### Returns

`Promise`<[`ISwitchProfileResponse`](../interfaces/Users.Types.ISwitchProfileResponse.md)\>

#### Defined in

[Users/Profiles.ts:103](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L103)

___

### updateProfile

▸ `Const` **updateProfile**(`profileId`, `params`): `Promise`<[`IProfile`](../interfaces/Users.Types.IProfile.md)\>

Update a profile. For future expansion, the profile ID to update is required, but currently this must also be the
"current" profile for the caller.

```typescript
import {Profiles} from '@verdocs/js-sdk/Users';

const newProfile = await Profiles.updateProfile('PROFILEID');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `profileId` | `string` |
| `params` | [`IUpdateProfileRequest`](../interfaces/Users.Types.IUpdateProfileRequest.md) |

#### Returns

`Promise`<[`IProfile`](../interfaces/Users.Types.IProfile.md)\>

#### Defined in

[Users/Profiles.ts:116](https://github.com/Verdocs/js-sdk/blob/4c3fec6/src/Users/Profiles.ts#L116)
