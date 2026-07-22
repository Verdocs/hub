"""Resource namespaces that hang off the endpoint classes."""

from .api_keys import ApiKeys, AsyncApiKeys
from .auth import AsyncAuth, Auth
from .brands import AsyncBrands, Brands
from .contacts import AsyncContacts, Contacts
from .envelopes import AsyncEnvelopes, Envelopes, sort_documents, sort_fields, sort_recipients
from .groups import AsyncGroups, Groups
from .initials import AsyncInitials, Initials
from .invitations import AsyncInvitations, Invitations
from .kba import KBA, AsyncKBA
from .members import AsyncMembers, Members
from .notification_templates import AsyncNotificationTemplates, NotificationTemplates
from .organizations import AsyncOrganizations, Organizations
from .profiles import AsyncProfiles, Profiles
from .recipients import AsyncRecipients, Recipients
from .signatures import AsyncSignatures, Signatures
from .template_documents import AsyncTemplateDocuments, TemplateDocuments
from .template_fields import AsyncTemplateFields, TemplateFields
from .template_roles import AsyncTemplateRoles, TemplateRoles
from .templates import AsyncTemplates, Templates
from .users import AsyncUsers, Users
from .webhooks import AsyncWebhooks, Webhooks

__all__ = [
    "KBA",
    "ApiKeys",
    "AsyncApiKeys",
    "AsyncAuth",
    "AsyncBrands",
    "AsyncContacts",
    "AsyncEnvelopes",
    "AsyncGroups",
    "AsyncInitials",
    "AsyncInvitations",
    "AsyncKBA",
    "AsyncMembers",
    "AsyncNotificationTemplates",
    "AsyncOrganizations",
    "AsyncProfiles",
    "AsyncRecipients",
    "AsyncSignatures",
    "AsyncTemplateDocuments",
    "AsyncTemplateFields",
    "AsyncTemplateRoles",
    "AsyncTemplates",
    "AsyncUsers",
    "AsyncWebhooks",
    "Auth",
    "Brands",
    "Contacts",
    "Envelopes",
    "Groups",
    "Initials",
    "Invitations",
    "Members",
    "NotificationTemplates",
    "Organizations",
    "Profiles",
    "Recipients",
    "Signatures",
    "TemplateDocuments",
    "TemplateFields",
    "TemplateRoles",
    "Templates",
    "Users",
    "Webhooks",
    "sort_documents",
    "sort_fields",
    "sort_recipients",
]
