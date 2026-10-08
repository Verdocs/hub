<script lang="ts">
import type { ICreateEnvelopeFromTemplateRequest, ICreateEnvelopeRecipientFromTemplate } from '@verdocs/js-sdk';
import type { IEnvelope, IRecipient, ITemplate, TRecipientAuthMethod, VerdocsEndpoint } from '@verdocs/js-sdk';
import { isValidEmail } from '@verdocs/js-sdk';

/**
 * Everything the component is about to send, exactly as it will be posted: recipients plus
 * brand_key, expires_at, no_contact, timezone, and locale. Hosts that cancel the send and
 * create the envelope themselves should forward it unchanged.
 */
export interface ISendEventDetail extends ICreateEnvelopeFromTemplateRequest {
  name: string;
  template_id: string;
  recipients: ICreateEnvelopeRecipientFromTemplate[];
  template: ITemplate;
}

/** The same payload once the envelope exists, reported through the send event. */
export interface ISentEventDetail extends ICreateEnvelopeFromTemplateRequest {
  name: string;
  template_id: string;
  recipients: ICreateEnvelopeRecipientFromTemplate[];
  envelope_id: string;
  envelope: IEnvelope;
}

export interface VerdocsSendProps {
  /** The endpoint to use. Defaults to the one supplied by the nearest VerdocsProvider. */
  endpoint?: VerdocsEndpoint;
  /** The ID of the template to create the envelope from. */
  templateId: string;
  /**
   * The environment the control is being called from, e.g. 'web'. This changes how notifications
   * are assembled so recipients get invitation URLs that work for them. Leave unset unless you
   * know the environment; unknown values produce incorrect behavior.
   */
  environment?: string;
  /**
   * Whether to show the cancel button. Turn it off where the embed sits in a flow that has its
   * own navigation for the user to back out.
   */
  showCancel?: boolean;
  /**
   * Preselect a brand by key. The sender can still change it in the brand chooser. Leave unset
   * for the organization default.
   */
  brandKey?: string;
}

type TSendView = 'main' | 'recipient' | 'brand' | 'expires' | 'notifications';

interface IRoleRow {
  /** Stable per-template row id: level plus position within that level. */
  id: string;
  roleName: string;
  level: number;
  /** Position in the template's role list, which drives the signer color. */
  signerIndex: number;
  defaults: Partial<IRecipient>;
}

const VERDOCS_LOGO_URL = 'https://app.verdocs.com/assets/blue-logo.svg';

// Product decision: web senders get a 120-day default and ceiling. The API keeps its own rules
// so developers calling it directly are not forced into these. The API refuses an expiration
// less than a day out, so one day is the floor here.
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 120;
const DEFAULT_EXPIRY_DAYS = 120;

// A swipe right on a detail view goes Back. It must start in the left quarter of the pane (so a
// drag across a text field or the pill rows never triggers it), travel at least this far, be
// more horizontal than vertical, and finish quickly.
const SWIPE_START_FRACTION = 0.25;
const SWIPE_MIN_DISTANCE = 60;
const SWIPE_MAX_DURATION = 500;

const AUTH_METHOD_LABELS: Record<TRecipientAuthMethod, string> = {
  email: 'Email',
  passcode: 'Passcode',
  sms: 'SMS',
  kba: 'KBA',
  id: 'ID check',
};

// Separator between a recipient's name and email. Escaped because the repo bans non-ASCII source.
const MIDDLE_DOT = '\u00b7';

const ROW_CLASSES =
  'vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-2.5 vdocs:border-0 vdocs:border-t '
  + 'vdocs:border-solid vdocs:border-edge-light vdocs:bg-transparent vdocs:text-left vdocs:font-sans vdocs:text-ink '
  + 'vdocs:last:border-b vdocs:focus-visible:outline-2 vdocs:focus-visible:-outline-offset-2 vdocs:focus-visible:outline-accent';

const DELIVERY_ROW_CLASSES = `${ROW_CLASSES} vdocs:h-10 vdocs:pr-1.5 vdocs:text-[13px]`;

const SECTION_TITLE_CLASSES = 'vdocs:mb-1.5 vdocs:text-xs vdocs:font-semibold vdocs:text-ink';

const HINT_CLASSES = 'vdocs:mt-2.5 vdocs:text-xs/relaxed vdocs:text-muted';

const LINK_CLASSES = 'vdocs:font-medium vdocs:text-accent vdocs:no-underline';

const INPUT_CLASSES =
  'vdocs:box-border vdocs:h-9 vdocs:w-full vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge '
  + 'vdocs:bg-surface vdocs:pr-[52px] vdocs:pl-2.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none '
  + 'vdocs:placeholder:text-edge vdocs:focus:border-accent';

const BRAND_OPTION_CLASSES =
  'vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid '
  + 'vdocs:border-edge-light vdocs:bg-transparent vdocs:px-0 vdocs:py-2.5 vdocs:text-left vdocs:font-sans vdocs:text-[13px] '
  + 'vdocs:text-ink vdocs:first:border-t-0';

const SWATCH_CLASSES =
  'vdocs:flex vdocs:size-[22px] vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:overflow-hidden vdocs:rounded-row';

// Amber has no design token: the warning treatment is specific to this card, so it carries its
// own values rather than bending the danger or info tokens into a shade they do not mean.
const WARNING_TEXT = 'vdocs:text-[#78350f]';
const WARNING_ICON = 'vdocs:text-[#d97706]';

const clampExpiryDays = (digits: string) => (digits ? String(Math.min(Math.max(Number(digits), MIN_EXPIRY_DAYS), MAX_EXPIRY_DAYS)) : '');

const effectiveExpiryDays = (value: string) => {
  const days = Number(value);
  return days >= MIN_EXPIRY_DAYS ? Math.min(days, MAX_EXPIRY_DAYS) : DEFAULT_EXPIRY_DAYS;
};

const expiresAtFor = (value: string) => new Date(Date.now() + effectiveExpiryDays(value) * 24 * 60 * 60 * 1000);

const isConfigured = (recipient: Partial<IRecipient> | undefined) =>
  !!recipient?.first_name && !!recipient?.last_name && isValidEmail(recipient?.email || '');

// Only options the sender switched on are worth surfacing on the row. Email verification is the
// default for every recipient, so it is never listed.
const recipientOptionLabels = (recipient: Partial<IRecipient> | undefined) => {
  if (!recipient) {
    return [];
  }

  const labels = (recipient.auth_methods || []).filter(method => method !== 'email').map(method => AUTH_METHOD_LABELS[method] || method);
  if (recipient.delegator) {
    labels.push('May delegate');
  }

  if (recipient.name_locked) {
    labels.push('Name locked');
  }

  return labels;
};

const hasMoreBelow = (el: HTMLElement) => el.scrollHeight - el.clientHeight - el.scrollTop > 2;

const DETAIL_TITLES: Record<Exclude<TSendView, 'main'>, string> = {
  recipient: 'Recipient',
  brand: 'Brand',
  expires: 'Expiration',
  notifications: 'Notifications',
};
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { formatFullName } from '@verdocs/js-sdk';
import type { IBrand } from '@verdocs/js-sdk';
import VerdocsContactPicker, { type IContactSelectEvent } from '../envelopes/VerdocsContactPicker.vue';
import VerdocsComponentError from '../../controls/VerdocsComponentError.vue';
import { useOrganizationContacts } from '../../composables/useOrganizationContacts';
import { useCreateEnvelope } from '../../composables/useCreateEnvelope';
import { useEntitlements } from '../../composables/useEntitlements';
import { useOrganization } from '../../composables/useOrganization';
import VerdocsCheckbox from '../../controls/VerdocsCheckbox.vue';
import VerdocsSpinner from '../../controls/VerdocsSpinner.vue';
import { useTemplate } from '../../composables/useTemplateDetail';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsLoader from '../../controls/VerdocsLoader.vue';
import { getWebAppUrl } from '../../utils/environment';
import { useBrands } from '../../composables/useBrands';
import { signerClassName } from '../../fields/types';
import { useSession } from '../../composables/useSession';
import { showToast } from '../../utils/toast';
import { SDKError } from '../../types';

const {
  endpoint: endpointOverride,
  templateId,
  environment = '',
  showCancel = true,
  brandKey: initialBrandKey = '',
} = defineProps<VerdocsSendProps>();

const emit = defineEmits<{
  /**
   * Fired with the pending request just before it is posted. Call the second argument to stop
   * the send, e.g. `@before-send="(details, cancel) => cancel()"`. React's onBeforeSend returns
   * false for the same effect; Vue emits have no return value, so the veto is a function.
   */
  beforeSend: [details: ISendEventDetail, cancel: () => void];
  /** Fired once the envelope has been created. React's onSend. */
  send: [details: ISentEventDetail];
  /** Fired when the user clicks Cancel. React's onCancel. */
  cancel: [];
  /** Fired if the envelope could not be created. React's onSdkError. */
  sdkError: [error: SDKError];
  /** Fired as the sender types a name in the recipient form. React's onSearchContacts. */
  searchContacts: [query: string];
}>();

const { authenticated, profile, endpoint } = useSession(endpointOverride);

const view = ref<TSendView>('main');
const editingRoleId = ref('');
const brandKey = ref(initialBrandKey);
const expiresInDays = ref('');
const noContact = ref(false);
const recipientEdits = ref<Record<string, Partial<IRecipient>>>({});
const detailMoreBelow = ref(false);

const detailBody = ref<HTMLDivElement | null>(null);

// Plain locals, not refs: nothing here renders, and a swipe in progress must not schedule work.
let swipeStart: { x: number; y: number; time: number } | null = null;
let swallowNextClick = false;

const templateQuery = useTemplate(() => templateId, endpointOverride);
const template = computed(() => templateQuery.data.value);
const loadingTemplate = computed(() => templateQuery.isPending.value);
const organizationId = computed(() => template.value?.organization_id || '');

const brandsQuery = useBrands(() => organizationId.value || undefined, endpointOverride);
const organizationQuery = useOrganization(() => organizationId.value || undefined, endpointOverride);
const contactsQuery = useOrganizationContacts(endpointOverride);
const entitlementsQuery = useEntitlements(endpointOverride);
const createEnvelope = useCreateEnvelope(endpointOverride);

const brands = computed(() => brandsQuery.data.value || []);
const sending = computed(() => createEnvelope.isPending.value);

// A template that moves to another organization takes its brands with it, so the chosen brand
// and any half-finished edit no longer mean anything.
watch(organizationId, (_next, previous) => {
  if (!previous) {
    return;
  }

  brandKey.value = '';
  recipientEdits.value = {};
  editingRoleId.value = '';
  view.value = 'main';
});

const roleRows = computed<IRoleRow[]>(() => {
  const countByLevel: Record<number, number> = {};

  return (template.value?.roles || [])
    .map((role, index) => {
      const level = role.sequence;
      countByLevel[level] = (countByLevel[level] || 0) + 1;
      const id = `r-${level}-${countByLevel[level] - 1}`;

      return {
        id,
        roleName: role.name,
        level,
        signerIndex: index,
        defaults: { ...role, id, role_name: role.name } as Partial<IRecipient>,
      };
    })
    .sort((a, b) => a.level - b.level);
});

// Roles the template author already filled in count as configured, so the sender only has to
// touch the ones left open. Their own edits layer over the top.
const recipients = computed(() => {
  const merged: Record<string, Partial<IRecipient>> = {};
  roleRows.value.forEach(row => {
    if (row.defaults.first_name && isValidEmail(row.defaults.email || '')) {
      merged[row.id] = row.defaults;
    }
  });

  return { ...merged, ...recipientEdits.value };
});

const suggestions = computed(() => {
  const contacts = contactsQuery.data.value || [];
  if (!profile.value) {
    return contacts;
  }

  // The sender is the most likely recipient of their own envelope, so they ride at the end of
  // the address book rather than waiting for a search.
  return [ ...contacts, profile.value ];
});

const availableAuthMethods = computed<TRecipientAuthMethod[]>(() => {
  const entitlements = entitlementsQuery.data.value;
  const methods: TRecipientAuthMethod[] = [ 'passcode', 'email' ];
  if (entitlements?.sms_auth) {
    methods.push('sms');
  }

  if (entitlements?.kba_auth) {
    methods.push('kba');
  }

  if (entitlements?.id_auth) {
    methods.push('id');
  }

  return methods;
});

const levels = computed(() => [ ...new Set(roleRows.value.map(row => row.level)) ]);

// One entry per sequence level, each carrying everything its rows display.
const levelGroups = computed(() =>
  levels.value.map(level => ({
    level,
    rows: roleRows.value
      .filter(row => row.level === level)
      .map(row => {
        const recipient = recipients.value[row.id];

        return {
          ...row,
          dotClass: signerClassName(row.signerIndex),
          configured: isConfigured(recipient),
          fullName: formatFullName(recipient || {}),
          email: recipient?.email || '',
          optionLabels: recipientOptionLabels(recipient),
        };
      }),
  })));

const configuredRecipients = computed(() => roleRows.value.map(row => recipients.value[row.id]).filter(isConfigured) as Partial<IRecipient>[]);
const allRolesConfigured = computed(() => roleRows.value.length > 0 && configuredRecipients.value.length === roleRows.value.length);
const hasDuplicateEmails = computed(() => {
  const emails = configuredRecipients.value.map(recipient => (recipient.email || '').toLowerCase());
  return new Set(emails).size < emails.length;
});

const defaultBrand = computed(() => brands.value.find(brand => brand.id === organizationQuery.data.value?.default_brand_id) || null);
// With no brand of its own the organization gets Verdocs styling, so that is what default means.
const defaultBrandLabel = computed(() => `Default (${defaultBrand.value?.name || 'Verdocs'})`);
const selectedBrandLabel = computed(() => {
  if (!brandKey.value) {
    return defaultBrandLabel.value;
  }

  const selected = brands.value.find(brand => brand.key === brandKey.value);
  return selected?.name || selected?.key || brandKey.value;
});

const swatchFor = (brand: IBrand | null, fallback: string) => ({
  image: brand?.favicon_url || brand?.thumbnail_url || (brand ? null : VERDOCS_LOGO_URL),
  color: brand?.primary_color || undefined,
  initials: fallback.substring(0, 2).toUpperCase(),
});

const brandOptions = computed(() => {
  const others = brands.value
    .filter(brand => brand.id !== defaultBrand.value?.id)
    .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key));

  return [
    {
      key: '',
      label: defaultBrandLabel.value,
      sub: 'Organization default',
      selected: !brandKey.value,
      swatch: swatchFor(defaultBrand.value, defaultBrand.value?.name || 'V'),
    },
    ...others.map(brand => ({
      key: brand.key,
      label: brand.name || brand.key,
      sub: brand.key,
      selected: brandKey.value === brand.key,
      swatch: swatchFor(brand, brand.name || brand.key),
    })),
  ];
});

const expiresAt = computed(() => expiresAtFor(expiresInDays.value));
const expiresShort = computed(() => expiresAt.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
const expiresLong = computed(() =>
  `${expiresAt.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at `
  + `${expiresAt.value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`);
const expiryHint = computed(() =>
  `This envelope will expire on ${expiresLong.value}. Expirations may be set from ${MIN_EXPIRY_DAYS}-${MAX_EXPIRY_DAYS} days. `
  + `If left blank, this will default to ${DEFAULT_EXPIRY_DAYS}.`);

const editingRow = computed(() => roleRows.value.find(row => row.id === editingRoleId.value));
const detailOpen = computed(() => view.value !== 'main');
const detailTitle = computed(() => (view.value === 'main' ? '' : DETAIL_TITLES[view.value]));
// Whichever pane is off-canvas is inert so its controls leave the tab order; a focused element
// out there would otherwise drag the track sideways. The attribute has to disappear entirely
// when the pane is live, so undefined rather than false.
const mainInert = computed(() => detailOpen.value || undefined);
const detailInert = computed(() => !detailOpen.value || undefined);
const brandingUrl = computed(() => `${getWebAppUrl(endpoint)}/settings/branding`);
const webhooksUrl = computed(() => `${getWebAppUrl(endpoint)}/settings/webhooks`);

// Only the browser knows whether the detail content overflowed, so the fade is measured. Views
// that grow after a click (the notifications warning opening) re-measure on the next tick.
const measureDetail = () => {
  detailMoreBelow.value = !!detailBody.value && hasMoreBelow(detailBody.value);
};

watch([ view, noContact, brandOptions ], () => {
  nextTick(measureDetail).catch(() => undefined);
});

const openDetail = (next: TSendView) => {
  view.value = next;
};

const handleEditRole = (rowId: string) => {
  editingRoleId.value = rowId;
  view.value = 'recipient';
};

const handleSubmitContact = (row: IRoleRow | undefined, contact: IContactSelectEvent) => {
  if (!row) {
    return;
  }

  recipientEdits.value = { ...recipientEdits.value, [row.id]: { ...row.defaults, ...contact } };
  editingRoleId.value = '';
  view.value = 'main';
};

const handleExpiryInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const clamped = clampExpiryDays((input.value || '').replace(/[^0-9]/g, ''));
  expiresInDays.value = clamped;
  // Vue will not rewrite a value it believes is unchanged, so stripped characters would
  // otherwise stay visible in the field.
  input.value = clamped;
};

const handleSend = () => {
  const currentTemplate = template.value;
  if (sending.value || !currentTemplate) {
    return;
  }

  const localeData = Intl.DateTimeFormat().resolvedOptions();
  const request: ICreateEnvelopeFromTemplateRequest = {
    template_id: templateId,
    name: currentTemplate.name || 'New Envelope',
    environment,
    initial_reminder: 0,
    followup_reminders: 0,
    recipients: roleRows.value.map(row => recipients.value[row.id]).filter(Boolean) as ICreateEnvelopeRecipientFromTemplate[],
    timezone: localeData.timeZone,
    locale: localeData.locale,
    expires_at: expiresAtFor(expiresInDays.value).toISOString(),
    no_contact: noContact.value,
  };

  if (brandKey.value) {
    request.brand_key = brandKey.value;
  }

  let cancelled = false;
  emit('beforeSend', { ...request, name: request.name!, template: currentTemplate }, () => {
    cancelled = true;
  });

  if (cancelled) {
    return;
  }

  createEnvelope.mutate(request, {
    onSuccess: envelope => {
      recipientEdits.value = {};
      view.value = 'main';
      editingRoleId.value = '';
      brandKey.value = '';
      expiresInDays.value = '';
      noContact.value = false;
      emit('send', { ...request, name: request.name!, envelope_id: envelope.id, envelope });
    },
    onError: (mutationError: unknown) => {
      const details = mutationError as { message: string; response?: { status?: number; data?: { error?: string } } };
      showToast(details.response?.data?.error || 'Error creating envelope, please try again later.', { style: 'error' });
      emit('sdkError', new SDKError(details.message, details.response?.status, details.response?.data));
    },
  });
};

const handleSwipeStart = (e: PointerEvent) => {
  swallowNextClick = false;
  const pane = e.currentTarget as HTMLElement;
  const rect = pane.getBoundingClientRect();
  const onTextEntry = !!(e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable]');
  if (!detailOpen.value || onTextEntry || e.clientX - rect.left > rect.width * SWIPE_START_FRACTION) {
    swipeStart = null;
    return;
  }

  swipeStart = { x: e.clientX, y: e.clientY, time: Date.now() };
};

const handleSwipeEnd = (e: PointerEvent) => {
  const start = swipeStart;
  swipeStart = null;
  if (!start) {
    return;
  }

  const dx = e.clientX - start.x;
  const dy = Math.abs(e.clientY - start.y);
  if (dx >= SWIPE_MIN_DISTANCE && dx > dy && Date.now() - start.time <= SWIPE_MAX_DURATION) {
    // A wide button under the finger would otherwise take the click that ends the swipe.
    swallowNextClick = true;
    view.value = 'main';
  }
};

const handleSwipeCancel = () => {
  swipeStart = null;
};

const handleClickCapture = (e: MouseEvent) => {
  if (swallowNextClick) {
    swallowNextClick = false;
    e.stopPropagation();
    e.preventDefault();
  }
};
</script>

<template>
  <VerdocsComponentError
    v-if="!authenticated"
    message="You must be authenticated to use this module."
  />

  <div
    v-else-if="loadingTemplate"
    class="vdocs:relative vdocs:min-h-[480px] vdocs:w-full vdocs:max-w-[480px]"
  >
    <VerdocsLoader />
  </div>

  <div
    v-else-if="template?.is_sendable"
    class="vdocs:relative vdocs:box-border vdocs:w-full vdocs:max-w-[480px] vdocs:overflow-hidden vdocs:rounded-lg vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:font-sans vdocs:text-sm vdocs:text-ink"
    @click.capture="handleClickCapture"
  >
    <!-- The main pane sets the card's height. The detail pane sits beside it, off-canvas to the
         right, and the track slides one pane-width left when a detail view opens. -->
    <div
      :class="[
        'vdocs:relative vdocs:flex vdocs:min-h-[480px] vdocs:flex-col vdocs:transition-transform vdocs:duration-[220ms] vdocs:ease-out vdocs:motion-reduce:transition-none',
        detailOpen ? 'vdocs:-translate-x-full' : '',
      ]"
    >
      <div
        :inert="mainInert"
        class="vdocs:flex vdocs:flex-1 vdocs:flex-col vdocs:p-4"
      >
        <div :class="SECTION_TITLE_CLASSES">
          Recipients
        </div>
        <div class="vdocs:flex vdocs:flex-col">
          <div
            v-for="group in levelGroups"
            :key="group.level"
            class="vdocs:flex vdocs:flex-col"
          >
            <div
              v-if="levelGroups.length > 1"
              class="vdocs:pt-2.5 vdocs:pb-1 vdocs:text-[11px] vdocs:text-muted"
            >
              Step {{ group.level }}
            </div>
            <button
              v-for="row in group.rows"
              :key="row.id"
              type="button"
              :data-rn="row.roleName"
              :class="[ROW_CLASSES, 'vdocs:py-2 vdocs:pr-1.5 vdocs:pl-0']"
              @click="handleEditRole(row.id)"
            >
              <span :class="[row.dotClass, 'vdocs:size-2.5 vdocs:shrink-0 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-[rgba(0,0,0,0.1)]']" />
              <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col">
                <span class="vdocs:text-[13px] vdocs:font-semibold">
                  {{ row.roleName }}
                </span>
                <span
                  v-if="row.configured"
                  class="vdocs:truncate vdocs:text-xs vdocs:text-muted"
                >
                  {{ row.fullName }} {{ MIDDLE_DOT }} {{ row.email }}
                </span>
                <span
                  v-else
                  class="vdocs:truncate vdocs:text-xs vdocs:font-medium vdocs:text-accent"
                >
                  Configure recipient
                </span>
                <span
                  v-if="row.optionLabels.length > 0"
                  class="vdocs:mt-[3px] vdocs:flex vdocs:flex-wrap vdocs:gap-1"
                >
                  <span
                    v-for="label in row.optionLabels"
                    :key="label"
                    class="vdocs:inline-flex vdocs:h-[18px] vdocs:items-center vdocs:rounded-full vdocs:bg-accent-tint vdocs:px-1.5 vdocs:text-[10px] vdocs:font-medium vdocs:text-ink"
                  >
                    {{ label }}
                  </span>
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        <div :class="[SECTION_TITLE_CLASSES, 'vdocs:mt-4']">
          Delivery
        </div>
        <div class="vdocs:flex vdocs:flex-col">
          <button
            type="button"
            :disabled="sending"
            :class="DELIVERY_ROW_CLASSES"
            @click="openDetail('brand')"
          >
            <span class="vdocs:flex-[0_0_84px] vdocs:text-muted">Brand</span>
            <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium">
              {{ selectedBrandLabel }}
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            :disabled="sending"
            :class="DELIVERY_ROW_CLASSES"
            @click="openDetail('expires')"
          >
            <span class="vdocs:flex-[0_0_84px] vdocs:text-muted">Expires</span>
            <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium">
              {{ effectiveExpiryDays(expiresInDays) }} days
              <small class="vdocs:text-[13px] vdocs:font-normal vdocs:text-muted">
                {{ MIDDLE_DOT }} {{ expiresShort }}
              </small>
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            :disabled="sending"
            :class="DELIVERY_ROW_CLASSES"
            @click="openDetail('notifications')"
          >
            <span class="vdocs:flex-[0_0_84px] vdocs:text-muted">Notifications</span>
            <span :class="['vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium', noContact ? WARNING_ICON : '']">
              {{ noContact ? 'Off' : 'On' }}
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>

        <div class="vdocs:flex-1" />

        <div class="vdocs:mt-3.5 vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:justify-end vdocs:gap-2.5">
          <div
            v-if="hasDuplicateEmails"
            role="alert"
            class="vdocs:mb-2.5 vdocs:w-full vdocs:text-[13px] vdocs:text-danger"
          >
            Recipients cannot share the same email.
          </div>
          <VerdocsSpinner
            v-if="sending"
            :size="20"
            mode="dark"
          />
          <VerdocsButton
            v-if="showCancel"
            label="Cancel"
            size="small"
            variant="outline"
            :disabled="sending"
            @click="emit('cancel')"
          />
          <VerdocsButton
            label="Send"
            size="small"
            :disabled="!allRolesConfigured || sending || hasDuplicateEmails"
            @click="handleSend"
          />
        </div>
      </div>

      <div
        :inert="detailInert"
        class="vdocs:absolute vdocs:top-0 vdocs:bottom-0 vdocs:left-full vdocs:flex vdocs:w-full vdocs:flex-col vdocs:overflow-hidden vdocs:p-4"
        @pointerdown="handleSwipeStart"
        @pointerup="handleSwipeEnd"
        @pointercancel="handleSwipeCancel"
      >
        <template v-if="detailOpen">
          <div class="vdocs:mb-3.5 vdocs:flex vdocs:items-center vdocs:gap-2">
            <button
              type="button"
              class="vdocs:flex vdocs:flex-[0_0_52px] vdocs:cursor-pointer vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:p-0 vdocs:font-sans vdocs:text-[13px] vdocs:font-medium vdocs:text-accent"
              @click="view = 'main'"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                class="vdocs:size-4"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </button>
            <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2 vdocs:text-sm vdocs:font-semibold">
              <span
                v-if="view === 'recipient' && editingRow"
                :class="[signerClassName(editingRow?.signerIndex), 'vdocs:size-2.5 vdocs:shrink-0 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-[rgba(0,0,0,0.1)]']"
              />
              {{ view === 'recipient' && editingRow ? editingRow.roleName : detailTitle }}
            </div>
            <div class="vdocs:flex-[0_0_52px]" />
          </div>

          <VerdocsContactPicker
            v-if="view === 'recipient' && editingRow"
            :key="editingRow.id"
            :show-cancel="false"
            :suggestions="suggestions"
            :available-auth-methods="availableAuthMethods"
            :template-role="recipients[editingRow.id] ?? editingRow.defaults"
            @search-contacts="emit('searchContacts', $event)"
            @submit="handleSubmitContact(editingRow, $event)"
          />

          <template v-else-if="view !== 'recipient'">
            <div class="vdocs:relative vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col">
              <div
                ref="detailBody"
                class="vdocs:min-h-0 vdocs:flex-1 vdocs:overflow-y-auto"
                @scroll="measureDetail"
              >
                <div
                  v-if="view === 'brand'"
                  role="radiogroup"
                  aria-label="Brand"
                  class="vdocs:flex vdocs:flex-col"
                >
                  <template
                    v-for="(option, index) in brandOptions"
                    :key="option.key || 'default'"
                  >
                    <div
                      v-if="index === 1"
                      class="vdocs:my-0.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge"
                    />
                    <button
                      type="button"
                      role="radio"
                      :aria-checked="option.selected"
                      :class="BRAND_OPTION_CLASSES"
                      @click="brandKey = option.key"
                    >
                      <span
                        :class="[
                          'vdocs:flex vdocs:size-4 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:border vdocs:border-solid',
                          option.selected ? 'vdocs:border-accent' : 'vdocs:border-edge',
                        ]"
                      >
                        <span
                          v-if="option.selected"
                          class="vdocs:size-2 vdocs:rounded-full vdocs:bg-accent"
                        />
                      </span>
                      <span
                        v-if="option.swatch.image"
                        :class="[SWATCH_CLASSES, 'vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface']"
                      >
                        <img
                          :src="option.swatch.image"
                          alt=""
                          class="vdocs:size-full vdocs:object-contain"
                        >
                      </span>
                      <span
                        v-else
                        :style="{ backgroundColor: option.swatch.color }"
                        :class="[SWATCH_CLASSES, 'vdocs:bg-accent-dark vdocs:text-[9px] vdocs:font-bold vdocs:text-white']"
                      >
                        {{ option.swatch.initials }}
                      </span>
                      <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col">
                        {{ option.label }}
                        <small class="vdocs:truncate vdocs:text-[11px] vdocs:text-muted">
                          {{ option.sub }}
                        </small>
                      </span>
                    </button>
                  </template>
                </div>

                <p
                  v-if="view === 'brand' && brands.length === 0"
                  :class="HINT_CLASSES"
                >
                  Configure the look and feel of the signing experience by
                  <a
                    :href="brandingUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    :class="LINK_CLASSES"
                  >
                    Creating a Brand
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      class="vdocs:ml-0.5 vdocs:inline-block vdocs:size-[11px] vdocs:align-[-1px]"
                    >
                      <path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7" />
                    </svg>
                  </a>.
                </p>

                <template v-if="view === 'expires'">
                  <div class="vdocs:relative">
                    <input
                      type="text"
                      inputmode="numeric"
                      aria-label="Expires in days"
                      :placeholder="String(DEFAULT_EXPIRY_DAYS)"
                      :value="expiresInDays"
                      :disabled="sending"
                      :class="INPUT_CLASSES"
                      @input="handleExpiryInput"
                    >
                    <span class="vdocs:pointer-events-none vdocs:absolute vdocs:top-0 vdocs:right-2.5 vdocs:flex vdocs:h-9 vdocs:items-center vdocs:text-[13px] vdocs:text-muted">
                      days
                    </span>
                  </div>
                  <p :class="HINT_CLASSES">
                    {{ expiryHint }}
                  </p>
                </template>

                <template v-if="view === 'notifications'">
                  <VerdocsCheckbox
                    v-model:checked="noContact"
                    size="small"
                    label="Disable notifications"
                    class="vdocs:py-1"
                  />
                  <div
                    v-if="noContact"
                    :class="[
                      'vdocs:mt-3 vdocs:flex vdocs:gap-2.5 vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-[#fde68a] vdocs:bg-[#fffbeb] vdocs:px-3 vdocs:py-2.5 vdocs:text-xs/relaxed',
                      WARNING_TEXT,
                    ]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                      :class="['vdocs:mt-px vdocs:size-[18px] vdocs:shrink-0', WARNING_ICON]"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                    <div>
                      Disabling notifications turns off invitations and reminders to recipients as well as status updates to you. You may obtain invite links in
                      the recipient summary or via an API call. We strongly recommend enabling
                      <a
                        :href="webhooksUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        :class="LINK_CLASSES"
                      >
                        Webhooks
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                          class="vdocs:ml-0.5 vdocs:inline-block vdocs:size-[11px] vdocs:align-[-1px]"
                        >
                          <path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7" />
                        </svg>
                      </a>
                      to facilitate this step.
                    </div>
                  </div>
                </template>
              </div>
              <div
                aria-hidden="true"
                :class="[
                  'vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-0 vdocs:bottom-0 vdocs:h-9 vdocs:bg-linear-to-b vdocs:from-[rgba(255,255,255,0)] vdocs:to-surface vdocs:transition-opacity',
                  detailMoreBelow ? 'vdocs:opacity-100' : 'vdocs:opacity-0',
                ]"
              />
            </div>

            <div class="vdocs:mt-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:pt-3">
              <VerdocsButton
                label="Done"
                size="small"
                class="vdocs:w-full"
                @click="view = 'main'"
              />
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
