using Verdocs.Helpers;
using Verdocs.Models;
using Xunit;

namespace Verdocs.Sdk.Tests;

/// <summary>
/// Covers the pure permission helpers (SessionPermissions, EnvelopePermissions,
/// TemplatePermissions) against the js-sdk's behavior, including the ported spec from the
/// js-sdk's __tests__/Sessions/Permissions.ts and the quirks the port keeps on purpose.
/// </summary>
public sealed class PermissionsTests
{
    private static Profile MakeProfile(
        string id = "profile-1",
        string email = "user@example.com",
        string organizationId = "org-1",
        IReadOnlyList<string>? permissions = null,
        IReadOnlyList<string>? roles = null,
        IReadOnlyList<GroupProfile>? groupProfiles = null) => new()
    {
        Id = id,
        Email = email,
        OrganizationId = organizationId,
        FirstName = "Test",
        LastName = "User",
        Permissions = permissions ?? [],
        Roles = roles ?? [],
        GroupProfiles = groupProfiles,
    };

    private static Envelope MakeEnvelope(
        string status = "pending",
        string ownerProfileId = "owner-1",
        IReadOnlyList<Recipient>? recipients = null) => new()
    {
        Id = "env-1",
        Status = status,
        ProfileId = ownerProfileId,
        OrganizationId = "org-1",
        Name = "Test Envelope",
        SenderName = "Sender",
        SenderEmail = "sender@example.com",
        Visibility = "private",
        Recipients = recipients,
    };

    private static Recipient MakeRecipient(
        string email = "r1@example.com",
        string? profileId = null,
        string status = "invited",
        int sequence = 1,
        string roleName = "Signer1") => new()
    {
        EnvelopeId = "env-1",
        RoleName = roleName,
        Email = email,
        ProfileId = profileId,
        Status = status,
        Sequence = sequence,
        FirstName = "R",
        LastName = "One",
        Type = "signer",
    };

    private static Template MakeTemplate(
        string profileId = "creator-1",
        string organizationId = "org-1",
        bool isPersonal = false,
        bool isPublic = false,
        string? visibility = "private",
        IReadOnlyList<Role>? roles = null,
        IReadOnlyList<TemplateField>? fields = null) => new()
    {
        Id = "tpl-1",
        ProfileId = profileId,
        OrganizationId = organizationId,
        Name = "Test Template",
        Sender = "envelope_creator",
        IsPersonal = isPersonal,
        IsPublic = isPublic,
        Visibility = visibility,
        Roles = roles,
        Fields = fields,
    };

    private static Role MakeRole(string name = "Signer1", string type = "signer") => new()
    {
        TemplateId = "tpl-1",
        Name = name,
        Type = type,
        Sequence = 1,
        Order = 1,
    };

    private static TemplateField MakeTemplateField(string roleName = "Signer1", string name = "field-1") => new()
    {
        Name = name,
        RoleName = roleName,
        TemplateId = "tpl-1",
        DocumentId = "doc-1",
        Type = "textbox",
        Page = 1,
    };

    // ------------------------------------------------------------------
    // SessionPermissions, including the spec ported from the js-sdk's
    // __tests__/Sessions/Permissions.ts.
    // ------------------------------------------------------------------

    [Fact]
    public void UserHasPermissions_JsSdkSpecProfile_MatchesExpectedGrants()
    {
        var mockProfile = MakeProfile(
            id: "BOGUS",
            email: "",
            organizationId: "",
            roles: ["member"],
            // Directly-applied permission that normal members don't have
            permissions: ["admin:add"],
            groupProfiles:
            [
                new GroupProfile
                {
                    GroupId = "BOGUS",
                    ProfileId = "BOGUS",
                    OrganizationId = "BOGUS",
                    Group = new Group
                    {
                        Id = "BOGUS",
                        Name = "",
                        OrganizationId = "BOGUS",
                        // Group-applied permission that normal members don't have
                        Permissions = ["admin:remove"],
                    },
                },
            ]);

        // Permission not applied by role, directly, or via group
        Assert.False(SessionPermissions.UserHasPermissions(mockProfile, ["org:delete"]));

        // Permission applied by group
        Assert.True(SessionPermissions.UserHasPermissions(mockProfile, ["admin:remove"]));

        // Permission applied directly
        Assert.True(SessionPermissions.UserHasPermissions(mockProfile, ["admin:add"]));

        // Permission applied by role
        Assert.True(SessionPermissions.UserHasPermissions(mockProfile, ["template:member:delete"]));
    }

    [Fact]
    public void UserHasPermissions_NullProfile_DeniesNonEmptyCheck()
    {
        Assert.False(SessionPermissions.UserHasPermissions(null, [OrganizationPermission.View]));
    }

    [Fact]
    public void UserHasPermissions_EmptyPermissionList_PassesEvenWithNullProfile()
    {
        Assert.True(SessionPermissions.UserHasPermissions(null, []));
        Assert.True(SessionPermissions.UserHasPermissions(MakeProfile(), []));
    }

    [Fact]
    public void UserHasPermissions_UnknownRole_IsIgnored()
    {
        var profile = MakeProfile(roles: ["superhero"]);
        Assert.False(SessionPermissions.UserHasPermissions(profile, [OrganizationPermission.View]));
    }

    [Fact]
    public void RolePermissions_MatchesJsSdk_RoleCounts()
    {
        Assert.Equal(25, SessionPermissions.RolePermissions[ProfileRole.Owner].Count);
        Assert.Equal(21, SessionPermissions.RolePermissions[ProfileRole.Admin].Count);
        Assert.Equal(15, SessionPermissions.RolePermissions[ProfileRole.Member].Count);
        Assert.Equal(4, SessionPermissions.RolePermissions[ProfileRole.BasicUser].Count);
        Assert.Equal(3, SessionPermissions.RolePermissions[ProfileRole.Contact].Count);
    }

    [Fact]
    public void RolePermissions_RoleDifferences_MatchJsSdk()
    {
        Assert.Contains(AccountPermission.OwnerAdd, SessionPermissions.RolePermissions[ProfileRole.Owner]);
        Assert.Contains(OrganizationPermission.Transfer, SessionPermissions.RolePermissions[ProfileRole.Owner]);
        Assert.Contains(OrganizationPermission.Delete, SessionPermissions.RolePermissions[ProfileRole.Owner]);
        Assert.DoesNotContain(AccountPermission.OwnerAdd, SessionPermissions.RolePermissions[ProfileRole.Admin]);
        Assert.DoesNotContain(OrganizationPermission.Transfer, SessionPermissions.RolePermissions[ProfileRole.Admin]);
        Assert.DoesNotContain(OrganizationPermission.Delete, SessionPermissions.RolePermissions[ProfileRole.Admin]);
        Assert.DoesNotContain(TemplatePermission.MemberVisibility, SessionPermissions.RolePermissions[ProfileRole.Member]);

        // envelope:org:view is only ever granted directly (or via a group), never by a role.
        foreach (var permissions in SessionPermissions.RolePermissions.Values)
        {
            Assert.DoesNotContain(EnvelopePermission.OrgView, permissions);
        }
    }

    // ------------------------------------------------------------------
    // EnvelopePermissions
    // ------------------------------------------------------------------

    [Fact]
    public void IsEnvelopeOwner_OwningProfileId_ReturnsTrue()
    {
        Assert.True(EnvelopePermissions.IsEnvelopeOwner("owner-1", MakeEnvelope()));
    }

    [Fact]
    public void IsEnvelopeOwner_OtherOrNullProfileId_ReturnsFalse()
    {
        Assert.False(EnvelopePermissions.IsEnvelopeOwner("someone-else", MakeEnvelope()));
        Assert.False(EnvelopePermissions.IsEnvelopeOwner(null, MakeEnvelope()));
    }

    [Fact]
    public void IsEnvelopeRecipient_RecipientProfileId_ReturnsTrue()
    {
        var envelope = MakeEnvelope(recipients: [MakeRecipient(profileId: "profile-1")]);
        Assert.True(EnvelopePermissions.IsEnvelopeRecipient("profile-1", envelope));
    }

    [Fact]
    public void IsEnvelopeRecipient_UnknownProfileIdOrNoRecipients_ReturnsFalse()
    {
        var envelope = MakeEnvelope(recipients: [MakeRecipient(profileId: "profile-1")]);
        Assert.False(EnvelopePermissions.IsEnvelopeRecipient("profile-2", envelope));
        Assert.False(EnvelopePermissions.IsEnvelopeRecipient("profile-1", MakeEnvelope()));
    }

    [Fact]
    public void CanAccessEnvelope_OwnerOrRecipient_ReturnsTrue()
    {
        var envelope = MakeEnvelope(recipients: [MakeRecipient(profileId: "profile-1")]);
        Assert.True(EnvelopePermissions.CanAccessEnvelope("owner-1", envelope));
        Assert.True(EnvelopePermissions.CanAccessEnvelope("profile-1", envelope));
    }

    [Fact]
    public void CanAccessEnvelope_Stranger_ReturnsFalse()
    {
        var envelope = MakeEnvelope(recipients: [MakeRecipient(profileId: "profile-1")]);
        Assert.False(EnvelopePermissions.CanAccessEnvelope("stranger", envelope));
    }

    [Fact]
    public void UserIsEnvelopeOwner_OwnerProfile_ReturnsTrue()
    {
        Assert.True(EnvelopePermissions.UserIsEnvelopeOwner(MakeProfile(id: "owner-1"), MakeEnvelope()));
    }

    [Fact]
    public void UserIsEnvelopeOwner_OtherOrNullProfile_ReturnsFalse()
    {
        Assert.False(EnvelopePermissions.UserIsEnvelopeOwner(MakeProfile(id: "someone-else"), MakeEnvelope()));
        Assert.False(EnvelopePermissions.UserIsEnvelopeOwner(null, MakeEnvelope()));
    }

    [Fact]
    public void UserIsEnvelopeRecipient_MatchingProfileId_ReturnsTrue()
    {
        var envelope = MakeEnvelope(recipients: [MakeRecipient(profileId: "profile-1")]);
        Assert.True(EnvelopePermissions.UserIsEnvelopeRecipient(MakeProfile(), envelope));
    }

    [Fact]
    public void UserIsEnvelopeRecipient_EmailOnlyMatch_ReturnsFalse()
    {
        // Matches by profile ID only, like the js-sdk; a recipient tied to the user by email
        // alone does not count.
        var envelope = MakeEnvelope(recipients: [MakeRecipient(email: "user@example.com")]);
        Assert.False(EnvelopePermissions.UserIsEnvelopeRecipient(MakeProfile(), envelope));
    }

    [Fact]
    public void EnvelopeIsActive_PendingEnvelope_ReturnsTrue()
    {
        Assert.True(EnvelopePermissions.EnvelopeIsActive(MakeEnvelope(status: EnvelopeStatus.Pending)));
        Assert.True(EnvelopePermissions.EnvelopeIsActive(MakeEnvelope(status: EnvelopeStatus.InProgress)));
    }

    [Theory]
    [InlineData("complete")]
    [InlineData("declined")]
    [InlineData("canceled")]
    public void EnvelopeIsActive_EndStates_ReturnsFalse(string status)
    {
        Assert.False(EnvelopePermissions.EnvelopeIsActive(MakeEnvelope(status: status)));
    }

    [Fact]
    public void EnvelopeIsComplete_CompleteEnvelope_ReturnsFalse_KeptJsSdkInversion()
    {
        // The js-sdk's envelopeIsComplete compares with !==, so it reports the opposite of its
        // name; the port keeps that behavior for parity.
        Assert.False(EnvelopePermissions.EnvelopeIsComplete(MakeEnvelope(status: EnvelopeStatus.Complete)));
        Assert.True(EnvelopePermissions.EnvelopeIsComplete(MakeEnvelope(status: EnvelopeStatus.Pending)));
    }

    [Fact]
    public void UserCanCancelEnvelope_OwnerOfActiveEnvelope_ReturnsTrue()
    {
        Assert.True(EnvelopePermissions.UserCanCancelEnvelope(MakeProfile(id: "owner-1"), MakeEnvelope()));
    }

    [Fact]
    public void UserCanCancelEnvelope_CompleteEnvelopeOrNonOwner_ReturnsFalse()
    {
        Assert.False(EnvelopePermissions.UserCanCancelEnvelope(
            MakeProfile(id: "owner-1"), MakeEnvelope(status: EnvelopeStatus.Complete)));
        Assert.False(EnvelopePermissions.UserCanCancelEnvelope(MakeProfile(id: "someone-else"), MakeEnvelope()));
    }

    [Fact]
    public void UserCanFinishEnvelope_OwnerOfActiveEnvelope_ReturnsTrue()
    {
        Assert.True(EnvelopePermissions.UserCanFinishEnvelope(MakeProfile(id: "owner-1"), MakeEnvelope()));
    }

    [Fact]
    public void UserCanFinishEnvelope_CanceledEnvelopeOrNonOwner_ReturnsFalse()
    {
        Assert.False(EnvelopePermissions.UserCanFinishEnvelope(
            MakeProfile(id: "owner-1"), MakeEnvelope(status: EnvelopeStatus.Canceled)));
        Assert.False(EnvelopePermissions.UserCanFinishEnvelope(MakeProfile(id: "someone-else"), MakeEnvelope()));
    }

    [Theory]
    [InlineData("invited")]
    [InlineData("opened")]
    [InlineData("pending")]
    [InlineData("signed")]
    public void RecipientHasAction_PendingStatuses_ReturnsTrue(string status)
    {
        Assert.True(EnvelopePermissions.RecipientHasAction(MakeRecipient(status: status)));
    }

    [Theory]
    [InlineData("submitted")]
    [InlineData("canceled")]
    [InlineData("declined")]
    public void RecipientHasAction_SettledStatuses_ReturnsFalse(string status)
    {
        Assert.False(EnvelopePermissions.RecipientHasAction(MakeRecipient(status: status)));
    }

    [Fact]
    public void GetRecipientsWithActions_MixedRecipients_ReturnsOnlyPending()
    {
        var pending1 = MakeRecipient(email: "a@example.com", status: RecipientStatus.Invited);
        var settled = MakeRecipient(email: "b@example.com", status: RecipientStatus.Submitted);
        var pending2 = MakeRecipient(email: "c@example.com", status: RecipientStatus.Opened, sequence: 2);
        var envelope = MakeEnvelope(recipients: [pending1, settled, pending2]);

        var result = EnvelopePermissions.GetRecipientsWithActions(envelope);

        Assert.Equal(2, result.Count);
        Assert.Same(pending1, result[0]);
        Assert.Same(pending2, result[1]);
    }

    [Fact]
    public void GetRecipientsWithActions_CompleteEnvelope_ReturnsEmpty()
    {
        var envelope = MakeEnvelope(status: EnvelopeStatus.Complete, recipients: [MakeRecipient()]);
        Assert.Empty(EnvelopePermissions.GetRecipientsWithActions(envelope));
    }

    [Fact]
    public void GetRecipientsWithActions_NoRecipients_ReturnsEmpty()
    {
        Assert.Empty(EnvelopePermissions.GetRecipientsWithActions(MakeEnvelope()));
    }

    [Fact]
    public void RecipientCanAct_SharesFirstSequence_ReturnsTrue()
    {
        var first = MakeRecipient(email: "a@example.com", sequence: 1);
        var parallel = MakeRecipient(email: "b@example.com", sequence: 1);
        var later = MakeRecipient(email: "c@example.com", sequence: 2);
        IReadOnlyList<Recipient> withActions = [first, parallel, later];

        Assert.True(EnvelopePermissions.RecipientCanAct(first, withActions));
        Assert.True(EnvelopePermissions.RecipientCanAct(parallel, withActions));
    }

    [Fact]
    public void RecipientCanAct_LaterSequenceOrEmptyList_ReturnsFalse()
    {
        var first = MakeRecipient(email: "a@example.com", sequence: 1);
        var later = MakeRecipient(email: "c@example.com", sequence: 2);

        Assert.False(EnvelopePermissions.RecipientCanAct(later, [first, later]));
        Assert.False(EnvelopePermissions.RecipientCanAct(first, []));
    }

    [Fact]
    public void GetMyRecipient_ExactEmailMatch_ReturnsRecipient()
    {
        var mine = MakeRecipient(email: "signer@example.com");
        var envelope = MakeEnvelope(recipients: [MakeRecipient(email: "other@example.com"), mine]);
        var session = new VerdocsSession { SessionType = SessionType.Signing, Email = "signer@example.com" };

        Assert.Same(mine, EnvelopePermissions.GetMyRecipient(session, envelope));
    }

    [Fact]
    public void GetMyRecipient_CaseMismatchOrNullSession_ReturnsNull()
    {
        // The js-sdk compares this one exactly (no lowercasing), unlike its other email
        // lookups; the port keeps the exact comparison.
        var envelope = MakeEnvelope(recipients: [MakeRecipient(email: "signer@example.com")]);
        var session = new VerdocsSession { SessionType = SessionType.Signing, Email = "SIGNER@example.com" };

        Assert.Null(EnvelopePermissions.GetMyRecipient(session, envelope));
        Assert.Null(EnvelopePermissions.GetMyRecipient(null, envelope));
    }

    [Fact]
    public void UserCanAct_NextUpEmail_ReturnsTrue()
    {
        var first = MakeRecipient(email: "a@example.com", sequence: 1);
        var later = MakeRecipient(email: "b@example.com", sequence: 2);
        IReadOnlyList<Recipient> withActions = [first, later];

        Assert.True(EnvelopePermissions.UserCanAct("a@example.com", withActions));
        Assert.True(EnvelopePermissions.UserCanAct("A@EXAMPLE.COM", withActions));
    }

    [Fact]
    public void UserCanAct_LaterSequenceOrUnknownEmail_ReturnsFalse()
    {
        var first = MakeRecipient(email: "a@example.com", sequence: 1);
        var later = MakeRecipient(email: "b@example.com", sequence: 2);
        IReadOnlyList<Recipient> withActions = [first, later];

        Assert.False(EnvelopePermissions.UserCanAct("b@example.com", withActions));
        Assert.False(EnvelopePermissions.UserCanAct("nobody@example.com", withActions));
    }

    [Fact]
    public void GetRecipient_CaseInsensitiveMatch_ReturnsRecipient()
    {
        var mine = MakeRecipient(email: "signer@example.com");
        var envelope = MakeEnvelope(recipients: [mine]);

        Assert.Same(mine, EnvelopePermissions.GetRecipient("SIGNER@example.com", envelope));
    }

    [Fact]
    public void GetRecipient_UnknownEmail_ReturnsNull()
    {
        var envelope = MakeEnvelope(recipients: [MakeRecipient(email: "signer@example.com")]);
        Assert.Null(EnvelopePermissions.GetRecipient("nobody@example.com", envelope));
    }

    [Fact]
    public void GetRecipientWithActions_NextUpEmail_ReturnsTrue()
    {
        var first = MakeRecipient(email: "a@example.com", sequence: 1);
        var later = MakeRecipient(email: "b@example.com", sequence: 2);
        var envelope = MakeEnvelope(recipients: [first, later]);

        Assert.True(EnvelopePermissions.GetRecipientWithActions("a@example.com", envelope));
    }

    [Fact]
    public void GetRecipientWithActions_NotNextOrAbsent_ReturnsFalse()
    {
        var first = MakeRecipient(email: "a@example.com", sequence: 1);
        var later = MakeRecipient(email: "b@example.com", sequence: 2);
        var envelope = MakeEnvelope(recipients: [first, later]);

        Assert.False(EnvelopePermissions.GetRecipientWithActions("b@example.com", envelope));
        Assert.False(EnvelopePermissions.GetRecipientWithActions("nobody@example.com", envelope));
    }

    [Fact]
    public void UserCanSignNow_RecipientsTurn_ReturnsTrue()
    {
        var envelope = MakeEnvelope(recipients: [MakeRecipient(profileId: "profile-1", sequence: 1)]);
        Assert.True(EnvelopePermissions.UserCanSignNow(MakeProfile(), envelope));
    }

    [Fact]
    public void UserCanSignNow_NullProfile_ReturnsFalse()
    {
        var envelope = MakeEnvelope(recipients: [MakeRecipient(profileId: "profile-1")]);
        Assert.False(EnvelopePermissions.UserCanSignNow(null, envelope));
    }

    [Fact]
    public void UserCanSignNow_NotTheirTurn_ReturnsFalse()
    {
        var envelope = MakeEnvelope(recipients:
        [
            MakeRecipient(email: "first@example.com", sequence: 1),
            MakeRecipient(email: "user@example.com", profileId: "profile-1", sequence: 2),
        ]);

        Assert.False(EnvelopePermissions.UserCanSignNow(MakeProfile(), envelope));
    }

    [Fact]
    public void UserCanSignNow_EmailOnlyRecipient_ReturnsFalse_MatchesJsSdk()
    {
        // The turn lookup matches by email, but userIsEnvelopeRecipient only matches by
        // profile ID, so a recipient tied to the user by email alone never passes. The
        // js-sdk behaves the same way.
        var envelope = MakeEnvelope(recipients: [MakeRecipient(email: "user@example.com", sequence: 1)]);
        Assert.False(EnvelopePermissions.UserCanSignNow(MakeProfile(), envelope));
    }

    [Fact]
    public void UserCanSignNow_CompleteEnvelope_ReturnsFalse()
    {
        var envelope = MakeEnvelope(
            status: EnvelopeStatus.Complete,
            recipients: [MakeRecipient(profileId: "profile-1", sequence: 1)]);

        Assert.False(EnvelopePermissions.UserCanSignNow(MakeProfile(), envelope));
    }

    [Fact]
    public void GetNextRecipient_PendingRecipients_ReturnsFirstStoredPending()
    {
        // The js-sdk returns the first pending recipient in stored order, not the lowest
        // sequence; it relies on the server returning recipients ordered by sequence.
        var storedFirst = MakeRecipient(email: "a@example.com", status: RecipientStatus.Invited, sequence: 3);
        var lowerSequence = MakeRecipient(email: "b@example.com", status: RecipientStatus.Invited, sequence: 2);
        var envelope = MakeEnvelope(recipients:
        [
            MakeRecipient(email: "done@example.com", status: RecipientStatus.Submitted, sequence: 1),
            storedFirst,
            lowerSequence,
        ]);

        Assert.Same(storedFirst, EnvelopePermissions.GetNextRecipient(envelope));
    }

    [Fact]
    public void GetNextRecipient_CompleteEnvelope_ReturnsNull()
    {
        var envelope = MakeEnvelope(status: EnvelopeStatus.Complete, recipients: [MakeRecipient()]);
        Assert.Null(EnvelopePermissions.GetNextRecipient(envelope));
    }

    // ------------------------------------------------------------------
    // TemplatePermissions
    // ------------------------------------------------------------------

    [Fact]
    public void UserIsTemplateCreator_Creator_ReturnsTrue()
    {
        Assert.True(TemplatePermissions.UserIsTemplateCreator(MakeProfile(id: "creator-1"), MakeTemplate()));
    }

    [Fact]
    public void UserIsTemplateCreator_OtherProfileOrNulls_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserIsTemplateCreator(MakeProfile(id: "someone-else"), MakeTemplate()));
        Assert.False(TemplatePermissions.UserIsTemplateCreator(null, MakeTemplate()));
        Assert.False(TemplatePermissions.UserIsTemplateCreator(MakeProfile(), null));
    }

    [Fact]
    public void UserHasSharedTemplate_SameOrgSharedTemplate_ReturnsTrue()
    {
        Assert.True(TemplatePermissions.UserHasSharedTemplate(MakeProfile(), MakeTemplate(isPersonal: false)));
    }

    [Fact]
    public void UserHasSharedTemplate_PersonalOrOtherOrg_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserHasSharedTemplate(MakeProfile(), MakeTemplate(isPersonal: true)));
        Assert.False(TemplatePermissions.UserHasSharedTemplate(
            MakeProfile(organizationId: "org-2"), MakeTemplate()));
    }

    [Fact]
    public void UserCanCreatePersonalTemplate_WithPermission_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.CreatePersonal]);
        Assert.True(TemplatePermissions.UserCanCreatePersonalTemplate(profile));
    }

    [Fact]
    public void UserCanCreatePersonalTemplate_WithoutPermission_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanCreatePersonalTemplate(MakeProfile()));
    }

    [Fact]
    public void UserCanCreateOrgTemplate_WithPermission_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.CreateOrg]);
        Assert.True(TemplatePermissions.UserCanCreateOrgTemplate(profile));
    }

    [Fact]
    public void UserCanCreateOrgTemplate_WithoutPermission_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanCreateOrgTemplate(MakeProfile()));
    }

    [Fact]
    public void UserCanCreatePublicTemplate_WithPermission_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.CreatePublic]);
        Assert.True(TemplatePermissions.UserCanCreatePublicTemplate(profile));
    }

    [Fact]
    public void UserCanCreatePublicTemplate_WithoutPermission_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanCreatePublicTemplate(MakeProfile()));
    }

    [Fact]
    public void UserCanCreateTemplate_AnySingleCreatePermission_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.CreateOrg]);
        Assert.True(TemplatePermissions.UserCanCreateTemplate(profile));
    }

    [Fact]
    public void UserCanCreateTemplate_NoCreatePermissions_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanCreateTemplate(MakeProfile()));
        Assert.False(TemplatePermissions.UserCanCreateTemplate(null));
    }

    [Fact]
    public void UserCanReadTemplate_PublicTemplate_AnyoneCanRead()
    {
        var template = MakeTemplate(isPublic: true);
        Assert.True(TemplatePermissions.UserCanReadTemplate(MakeProfile(organizationId: "org-2"), template));
        Assert.True(TemplatePermissions.UserCanReadTemplate(null, template));
    }

    [Fact]
    public void UserCanReadTemplate_Creator_ReturnsTrue()
    {
        Assert.True(TemplatePermissions.UserCanReadTemplate(MakeProfile(id: "creator-1"), MakeTemplate()));
    }

    [Fact]
    public void UserCanReadTemplate_SharedWithMemberRead_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.MemberRead]);
        Assert.True(TemplatePermissions.UserCanReadTemplate(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanReadTemplate_SharedWithoutMemberReadOrPersonal_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanReadTemplate(MakeProfile(), MakeTemplate()));
        Assert.False(TemplatePermissions.UserCanReadTemplate(
            MakeProfile(permissions: [TemplatePermission.MemberRead]), MakeTemplate(isPersonal: true)));
    }

    [Fact]
    public void UserCanUpdateTemplate_Creator_ReturnsTrue()
    {
        Assert.True(TemplatePermissions.UserCanUpdateTemplate(MakeProfile(id: "creator-1"), MakeTemplate()));
    }

    [Fact]
    public void UserCanUpdateTemplate_SharedWithReadWrite_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.MemberRead, TemplatePermission.MemberWrite]);
        Assert.True(TemplatePermissions.UserCanUpdateTemplate(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanUpdateTemplate_SharedWithReadOnly_ReturnsFalse()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.MemberRead]);
        Assert.False(TemplatePermissions.UserCanUpdateTemplate(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanMakeTemplatePrivate_CreatorWithCreatePersonal_ReturnsTrue()
    {
        var profile = MakeProfile(id: "creator-1", permissions: [TemplatePermission.CreatePersonal]);
        Assert.True(TemplatePermissions.UserCanMakeTemplatePrivate(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanMakeTemplatePrivate_NonCreatorWithMemberVisibility_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.MemberVisibility]);
        Assert.True(TemplatePermissions.UserCanMakeTemplatePrivate(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanMakeTemplatePrivate_WithoutPermissions_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanMakeTemplatePrivate(MakeProfile(id: "creator-1"), MakeTemplate()));
        Assert.False(TemplatePermissions.UserCanMakeTemplatePrivate(MakeProfile(), MakeTemplate()));
    }

    [Fact]
    public void UserCanMakeTemplateShared_CreatorWithCreateOrg_ReturnsTrue()
    {
        var profile = MakeProfile(id: "creator-1", permissions: [TemplatePermission.CreateOrg]);
        Assert.True(TemplatePermissions.UserCanMakeTemplateShared(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanMakeTemplateShared_WithoutPermissions_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanMakeTemplateShared(MakeProfile(id: "creator-1"), MakeTemplate()));
        Assert.False(TemplatePermissions.UserCanMakeTemplateShared(MakeProfile(), MakeTemplate()));
    }

    [Fact]
    public void UserCanMakeTemplatePublic_CreatorWithCreatePublic_ReturnsTrue()
    {
        var profile = MakeProfile(id: "creator-1", permissions: [TemplatePermission.CreatePublic]);
        Assert.True(TemplatePermissions.UserCanMakeTemplatePublic(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanMakeTemplatePublic_NonCreatorWithMemberVisibility_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.MemberVisibility]);
        Assert.True(TemplatePermissions.UserCanMakeTemplatePublic(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanMakeTemplatePublic_WithoutPermissions_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanMakeTemplatePublic(MakeProfile(id: "creator-1"), MakeTemplate()));
        Assert.False(TemplatePermissions.UserCanMakeTemplatePublic(MakeProfile(), MakeTemplate()));
    }

    [Fact]
    public void UserCanChangeOrgVisibility_CreatorWithCreatePersonal_ReturnsTrue()
    {
        var profile = MakeProfile(id: "creator-1", permissions: [TemplatePermission.CreatePersonal]);
        Assert.True(TemplatePermissions.UserCanChangeOrgVisibility(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanChangeOrgVisibility_NonCreatorOrNoPermission_ReturnsFalse()
    {
        var nonCreator = MakeProfile(permissions: [TemplatePermission.CreatePersonal, TemplatePermission.MemberVisibility]);
        Assert.False(TemplatePermissions.UserCanChangeOrgVisibility(nonCreator, MakeTemplate()));
        Assert.False(TemplatePermissions.UserCanChangeOrgVisibility(MakeProfile(id: "creator-1"), MakeTemplate()));
    }

    [Fact]
    public void UserCanDeleteTemplate_CreatorWithCreatorDelete_ReturnsTrue()
    {
        var profile = MakeProfile(id: "creator-1", permissions: [TemplatePermission.Delete]);
        Assert.True(TemplatePermissions.UserCanDeleteTemplate(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanDeleteTemplate_NonCreatorWithMemberDelete_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [TemplatePermission.MemberDelete]);
        Assert.True(TemplatePermissions.UserCanDeleteTemplate(profile, MakeTemplate()));
    }

    [Fact]
    public void UserCanDeleteTemplate_WithoutPermissions_ReturnsFalse()
    {
        Assert.False(TemplatePermissions.UserCanDeleteTemplate(MakeProfile(id: "creator-1"), MakeTemplate()));
        Assert.False(TemplatePermissions.UserCanDeleteTemplate(MakeProfile(), MakeTemplate()));
    }

    [Fact]
    public void UserCanSendTemplate_PrivateVisibility_OnlyCreator()
    {
        var template = MakeTemplate(visibility: TemplateVisibility.Private);
        Assert.True(TemplatePermissions.UserCanSendTemplate(MakeProfile(id: "creator-1"), template));
        Assert.False(TemplatePermissions.UserCanSendTemplate(MakeProfile(), template));
    }

    [Fact]
    public void UserCanSendTemplate_SharedVisibility_SameOrgOnly()
    {
        var template = MakeTemplate(visibility: TemplateVisibility.Shared);
        Assert.True(TemplatePermissions.UserCanSendTemplate(MakeProfile(), template));
        Assert.False(TemplatePermissions.UserCanSendTemplate(MakeProfile(organizationId: "org-2"), template));
    }

    [Fact]
    public void UserCanSendTemplate_PublicVisibility_ReturnsTrue()
    {
        var template = MakeTemplate(visibility: TemplateVisibility.Public);
        Assert.True(TemplatePermissions.UserCanSendTemplate(MakeProfile(organizationId: "org-2"), template));
        Assert.True(TemplatePermissions.UserCanSendTemplate(null, template));
    }

    [Fact]
    public void UserCanSendTemplate_UnknownVisibility_ReturnsFalse_JsSdkDeadTail()
    {
        // For unrecognized visibility the js-sdk falls into roles/fields checks that can only
        // produce a falsy result, so a fully-built template is still unsendable.
        var template = MakeTemplate(
            profileId: "profile-1",
            visibility: "unrecognized",
            roles: [MakeRole()],
            fields: [MakeTemplateField()]);

        Assert.False(TemplatePermissions.UserCanSendTemplate(MakeProfile(), template));
        Assert.False(TemplatePermissions.UserCanSendTemplate(MakeProfile(), MakeTemplate(visibility: null)));
    }

    [Fact]
    public void UserCanBuildTemplate_CreatorWithSignerRole_ReturnsTrue()
    {
        var template = MakeTemplate(roles: [MakeRole()]);
        Assert.True(TemplatePermissions.UserCanBuildTemplate(MakeProfile(id: "creator-1"), template));
    }

    [Fact]
    public void UserCanBuildTemplate_NoSignerRolesOrNoWriteAccess_ReturnsFalse()
    {
        var noSigners = MakeTemplate(roles: [MakeRole(type: "cc")]);
        Assert.False(TemplatePermissions.UserCanBuildTemplate(MakeProfile(id: "creator-1"), noSigners));

        var withSigner = MakeTemplate(roles: [MakeRole()]);
        Assert.False(TemplatePermissions.UserCanBuildTemplate(MakeProfile(), withSigner));
    }

    [Fact]
    public void GetFieldsForRole_MatchingFields_ReturnsThem()
    {
        var mine = MakeTemplateField(roleName: "Signer1", name: "f1");
        var other = MakeTemplateField(roleName: "Signer2", name: "f2");
        var template = MakeTemplate(fields: [mine, other]);

        var result = TemplatePermissions.GetFieldsForRole(template, "Signer1");

        Assert.Single(result);
        Assert.Same(mine, result[0]);
    }

    [Fact]
    public void GetFieldsForRole_NoFields_ReturnsEmpty()
    {
        Assert.Empty(TemplatePermissions.GetFieldsForRole(MakeTemplate(), "Signer1"));
    }

    [Fact]
    public void UserCanPreviewTemplate_SignersWithFields_ReturnsTrue()
    {
        var template = MakeTemplate(
            roles: [MakeRole(name: "Signer1"), MakeRole(name: "Signer2")],
            fields: [MakeTemplateField(roleName: "Signer1"), MakeTemplateField(roleName: "Signer2", name: "f2")]);

        Assert.True(TemplatePermissions.UserCanPreviewTemplate(MakeProfile(id: "creator-1"), template));
    }

    [Fact]
    public void UserCanPreviewTemplate_SignerWithoutFields_ReturnsFalse()
    {
        var template = MakeTemplate(
            roles: [MakeRole(name: "Signer1"), MakeRole(name: "Signer2")],
            fields: [MakeTemplateField(roleName: "Signer1")]);

        Assert.False(TemplatePermissions.UserCanPreviewTemplate(MakeProfile(id: "creator-1"), template));
    }

    [Fact]
    public void UserCanPreviewTemplate_NoSigners_ReturnsFalse()
    {
        var template = MakeTemplate(roles: [MakeRole(type: "cc")], fields: [MakeTemplateField()]);
        Assert.False(TemplatePermissions.UserCanPreviewTemplate(MakeProfile(id: "creator-1"), template));
    }

    // ------------------------------------------------------------------
    // TemplatePermissions: canPerformTemplateAction / hasRequiredPermissions
    // ------------------------------------------------------------------

    [Fact]
    public void CanPerformTemplateAction_NonCreateActionWithoutTemplate_Denied()
    {
        var (canPerform, message) = TemplatePermissions.CanPerformTemplateAction(MakeProfile(), TemplateAction.Delete);

        Assert.False(canPerform);
        Assert.Equal("Missing required template object", message);
    }

    [Fact]
    public void CanPerformTemplateAction_CreateActionWithoutTemplate_UsesDirectPermissions()
    {
        var allowed = MakeProfile(permissions: [TemplatePermission.CreatePersonal]);
        Assert.True(TemplatePermissions.CanPerformTemplateAction(allowed, TemplateAction.CreatePersonal).CanPerform);

        var (canPerform, message) = TemplatePermissions.CanPerformTemplateAction(MakeProfile(), TemplateAction.CreatePersonal);
        Assert.False(canPerform);
        Assert.Equal(
            "Insufficient access to perform 'create_personal'. Needed permissions: template:creator:create:personal",
            message);
    }

    [Fact]
    public void CanPerformTemplateAction_ReadAsCreator_AllowedWithoutPermissions()
    {
        var (canPerform, message) = TemplatePermissions.CanPerformTemplateAction(
            MakeProfile(id: "creator-1"), TemplateAction.Read, MakeTemplate());

        Assert.True(canPerform);
        Assert.Equal(string.Empty, message);
    }

    [Fact]
    public void CanPerformTemplateAction_ReadAsSameOrgMember_RequiresMemberRead()
    {
        var withPermission = MakeProfile(permissions: [TemplatePermission.MemberRead]);
        Assert.True(TemplatePermissions.CanPerformTemplateAction(withPermission, TemplateAction.Read, MakeTemplate()).CanPerform);

        Assert.False(TemplatePermissions.CanPerformTemplateAction(MakeProfile(), TemplateAction.Read, MakeTemplate()).CanPerform);
    }

    [Fact]
    public void CanPerformTemplateAction_ReadPublicOtherOrgTemplate_AllowedWithoutPermissions()
    {
        var template = MakeTemplate(organizationId: "org-2", isPublic: true);
        Assert.True(TemplatePermissions.CanPerformTemplateAction(MakeProfile(), TemplateAction.Read, template).CanPerform);
    }

    [Fact]
    public void CanPerformTemplateAction_ReadPublicSameOrgTemplate_StillRequiresMemberRead_JsSdkQuirk()
    {
        // In the js-sdk, a shared same-org template requires template:member:read even when it
        // is public, because the (!isPersonal && isSameOrg) branch wins the OR.
        var template = MakeTemplate(isPublic: true);
        Assert.False(TemplatePermissions.CanPerformTemplateAction(MakeProfile(), TemplateAction.Read, template).CanPerform);
    }

    [Fact]
    public void CanPerformTemplateAction_WriteAsNonCreator_RequiresReadAndWrite()
    {
        var template = MakeTemplate();
        var readOnly = MakeProfile(permissions: [TemplatePermission.MemberRead]);
        var readWrite = MakeProfile(permissions: [TemplatePermission.MemberRead, TemplatePermission.MemberWrite]);

        Assert.True(TemplatePermissions.CanPerformTemplateAction(readWrite, TemplateAction.Write, template).CanPerform);

        var (canPerform, message) = TemplatePermissions.CanPerformTemplateAction(readOnly, TemplateAction.Write, template);
        Assert.False(canPerform);
        Assert.Equal(
            "Insufficient access to perform 'write'. Needed permissions: template:member:read,template:member:write",
            message);
    }

    [Fact]
    public void CanPerformTemplateAction_WriteAsCreator_AllowedWithoutPermissions()
    {
        Assert.True(TemplatePermissions.CanPerformTemplateAction(
            MakeProfile(id: "creator-1"), TemplateAction.Write, MakeTemplate()).CanPerform);
    }

    [Fact]
    public void CanPerformTemplateAction_ChangeVisibilityPersonal_RequiresRespectivePermission()
    {
        var template = MakeTemplate();
        var creator = MakeProfile(id: "creator-1", permissions: [TemplatePermission.CreatePersonal]);
        var member = MakeProfile(permissions: [TemplatePermission.MemberVisibility]);

        Assert.True(TemplatePermissions.CanPerformTemplateAction(creator, TemplateAction.ChangeVisibilityPersonal, template).CanPerform);
        Assert.True(TemplatePermissions.CanPerformTemplateAction(member, TemplateAction.ChangeVisibilityPersonal, template).CanPerform);
        Assert.False(TemplatePermissions.CanPerformTemplateAction(MakeProfile(), TemplateAction.ChangeVisibilityPersonal, template).CanPerform);
    }

    [Fact]
    public void CanPerformTemplateAction_ChangeVisibilityOrg_RequiresRespectivePermission()
    {
        var template = MakeTemplate();
        var creator = MakeProfile(id: "creator-1", permissions: [TemplatePermission.CreateOrg]);

        Assert.True(TemplatePermissions.CanPerformTemplateAction(creator, TemplateAction.ChangeVisibilityOrg, template).CanPerform);
        Assert.False(TemplatePermissions.CanPerformTemplateAction(
            MakeProfile(id: "creator-1"), TemplateAction.ChangeVisibilityOrg, template).CanPerform);
    }

    [Fact]
    public void CanPerformTemplateAction_ChangeVisibilityPublicAsCreator_RequiresBothPermissions()
    {
        var template = MakeTemplate();
        var createOnly = MakeProfile(id: "creator-1", permissions: [TemplatePermission.CreatePublic]);
        var both = MakeProfile(id: "creator-1", permissions: [TemplatePermission.CreatePublic, TemplatePermission.Visibility]);

        Assert.False(TemplatePermissions.CanPerformTemplateAction(createOnly, TemplateAction.ChangeVisibilityPublic, template).CanPerform);
        Assert.True(TemplatePermissions.CanPerformTemplateAction(both, TemplateAction.ChangeVisibilityPublic, template).CanPerform);
    }

    [Fact]
    public void CanPerformTemplateAction_Delete_RequiresRespectivePermission()
    {
        var template = MakeTemplate();
        var creator = MakeProfile(id: "creator-1", permissions: [TemplatePermission.Delete]);
        var member = MakeProfile(permissions: [TemplatePermission.MemberDelete]);

        Assert.True(TemplatePermissions.CanPerformTemplateAction(creator, TemplateAction.Delete, template).CanPerform);
        Assert.True(TemplatePermissions.CanPerformTemplateAction(member, TemplateAction.Delete, template).CanPerform);
        Assert.False(TemplatePermissions.CanPerformTemplateAction(MakeProfile(), TemplateAction.Delete, template).CanPerform);
    }

    [Fact]
    public void CanPerformTemplateAction_UnknownAction_Denied()
    {
        var (canPerform, message) = TemplatePermissions.CanPerformTemplateAction(
            MakeProfile(), "reticulate", MakeTemplate());

        Assert.False(canPerform);
        Assert.Equal("Action is not defined", message);
    }

    [Fact]
    public void CanPerformTemplateAction_RoleConferredPermissions_Ignored_JsSdkQuirk()
    {
        // canPerformTemplateAction checks directly-assigned permissions only; an owner role
        // (which confers every template permission) does not help. The js-sdk behaves the
        // same way because hasRequiredPermissions never expands roles.
        var owner = MakeProfile(roles: [ProfileRole.Owner]);
        Assert.False(TemplatePermissions.CanPerformTemplateAction(owner, TemplateAction.CreatePersonal).CanPerform);
    }

    [Fact]
    public void HasRequiredPermissions_DirectPermission_ReturnsTrue()
    {
        var profile = MakeProfile(permissions: [EnvelopePermission.Create]);
        Assert.True(TemplatePermissions.HasRequiredPermissions(profile, [EnvelopePermission.Create]));
    }

    [Fact]
    public void HasRequiredPermissions_RoleConferredPermission_ReturnsFalse()
    {
        var profile = MakeProfile(roles: [ProfileRole.Owner]);
        Assert.False(TemplatePermissions.HasRequiredPermissions(profile, [EnvelopePermission.Create]));
    }

    [Fact]
    public void HasRequiredPermissions_EmptyList_ReturnsTrue()
    {
        Assert.True(TemplatePermissions.HasRequiredPermissions(null, []));
        Assert.True(TemplatePermissions.HasRequiredPermissions(MakeProfile(), []));
    }
}
