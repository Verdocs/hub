[verdocs-js-sdk - v1.0.0](../README.md) / [Exports](../modules.md) / Profiles

# Namespace: Profiles

## Table of contents

### Interfaces

- [CreateProfileRequest](../interfaces/Profiles.CreateProfileRequest.md)
- [IGroup](../interfaces/Profiles.IGroup.md)
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

[Api/Profiles.ts:4](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L4)

___

### TPlan

Ƭ **TPlan**: ``"env:essential"`` \| ``"org:standard"``

#### Defined in

[Api/Profiles.ts:30](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L30)

___

### TRole

Ƭ **TRole**: ``"owner"`` \| ``"basic_user"`` \| ``"member"``

#### Defined in

[Api/Profiles.ts:32](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L32)

## Functions

### createProfile

▸ `Const` **createProfile**(`params`): `Promise`<`any`\>

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

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:131](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L131)

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

[Api/Profiles.ts:219](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L219)

___

### getPermissions

▸ `Const` **getPermissions**(): `Promise`<`any`\>

Get a list of system roles.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const permissions = await Profiles.getPermissions();
```

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:113](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L113)

___

### getProfile

▸ `Const` **getProfile**(`profileId`): `Promise`<`any`\>

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

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:144](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L144)

___

### getProfileGroups

▸ `Const` **getProfileGroups**(`profileId`): `Promise`<`any`\>

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

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:168](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L168)

___

### getProfilePermissions

▸ `Const` **getProfilePermissions**(`profileId`): `Promise`<`any`\>

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

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:156](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L156)

___

### getProfiles

▸ `Const` **getProfiles**(): `Promise`<`any`\>

Get the user's available profiles. The current profile will be marked with `current: true`.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const profiles = await Profiles.getProfiles()
```

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:77](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L77)

___

### getRoles

▸ `Const` **getRoles**(): `Promise`<`any`\>

Get a list of system roles.

```typescript
import {Profiles} from '@verdocs/js-sdk';

const roles = await Profiles.getRoles();
```

#### Returns

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:95](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L95)

___

### switchProfile

▸ `Const` **switchProfile**(`profileId`): `Promise`<`any`\>

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

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:188](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L188)

___

### updateProfile

▸ `Const` **updateProfile**(`profileId`, `params`): `Promise`<`any`\>

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

`Promise`<`any`\>

#### Defined in

[Api/Profiles.ts:207](https://github.com/Verdocs/js-sdk/blob/458266e/src/Api/Profiles.ts#L207)
