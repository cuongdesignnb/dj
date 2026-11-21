import { f, opts, section } from '@/lib/admin/common/fields';
import { SITE_THEMES, SITE_THEME_LABELS } from '@/lib/site-theme';
import { SMTP_SECURITY, SMTP_SECURITY_LABELS, emailSettingsDefaults } from '@/lib/email/smtp-config';
import type { SingletonDefinition } from '@/lib/admin/common/resource';

// Settings. Secrets are never returned to the browser: the integration record
// only says whether a key is configured, and a new key is write-only.

export const siteSettingsDefinition: SingletonDefinition = {
  key: 'settings-site',
  label: 'Website Settings',
  description: 'Brand, identity, default SEO and site-wide switches.',
  group: 'Settings',
  path: '/admin/settings/site',
  apiPath: 'settings/site',
  permission: 'settings',
  seed: () => ({
    siteName: 'Connection Rave',
    tagline: 'Sound Meets Soul',
    logo: { src: '/assets/logo-connection.svg', alt: 'Connection logo', mediaId: null },
    favicon: null,
    theme: 'connection',
    defaultTitle: 'Connection Rave',
    defaultDescription: '',
    ogImage: null,
    defaultEventId: '',
    footerTagline: 'Music Connects Us All',
    termsPath: '/terms',
    privacyPath: '/privacy',
    maintenance: false,
    maintenanceMessage: '',
  }),
  form: {
    titleKey: 'siteName',
    seo: false,
    publish: null,
    sections: [
      section('brand', 'Brand', [
        f.text('siteName', 'Site name', { required: true, width: 'half' }),
        f.text('tagline', 'Tagline', { width: 'half' }),
        f.media('logo', 'Logo'),
        f.media('favicon', 'Favicon'),
        f.select('theme', 'Site colour theme', opts(...SITE_THEMES.map((value) => [value, SITE_THEME_LABELS[value]] as [string, string])), { help: 'Colours of the public website. Admin keeps its own colours.' }),
      ]),
      section('seo', 'Default SEO', [
        f.text('defaultTitle', 'Default title', { required: true, maxLength: 70 }),
        f.textarea('defaultDescription', 'Default description', { maxLength: 170 }),
        f.media('ogImage', 'Default social image'),
      ]),
      section('defaults', 'Event defaults', [
        { key: 'defaultEventId', label: 'Featured event (fallback)', type: 'select', optionSource: 'events', width: 'half', help: 'Used only when Content › Homepage › Current event is empty.' },
      ]),
      section('footer', 'Footer & legal links', [
        f.text('footerTagline', 'Footer tagline', { width: 'half' }),
        f.url('termsPath', 'Terms link', { width: 'half' }),
        f.url('privacyPath', 'Privacy link', { width: 'half' }),
      ]),
      section('maintenance', 'Maintenance', [
        f.toggle('maintenance', 'Maintenance mode', { help: 'Stored only; the public site does not read this switch yet.' }),
        f.textarea('maintenanceMessage', 'Maintenance message', { showWhen: { key: 'maintenance', in: [true] } }),
      ]),
    ],
  },
};

export const socialSettingsDefinition: SingletonDefinition = {
  key: 'settings-social',
  label: 'Social / Contact',
  description: 'Public contact details and social profiles.',
  group: 'Settings',
  path: '/admin/settings/social',
  apiPath: 'settings/social',
  permission: 'settings',
  // Nothing confirmed yet — empty values hide the link on the site.
  seed: () => ({ email: '', phone: '', address: '', instagram: '', facebook: '', youtube: '', tiktok: '', spotify: '' }),
  form: {
    titleKey: 'email',
    seo: false,
    publish: null,
    sections: [
      section('contact', 'Contact', [
        f.email('email', 'Email'),
        f.text('phone', 'Phone', { width: 'half' }),
        f.textarea('address', 'Address'),
      ], { description: 'Empty fields are hidden on the public site.' }),
      section('social', 'Social profiles', [
        f.url('instagram', 'Instagram', { width: 'half' }),
        f.url('facebook', 'Facebook', { width: 'half' }),
        f.url('youtube', 'YouTube', { width: 'half' }),
        f.url('tiktok', 'TikTok', { width: 'half' }),
        f.url('spotify', 'Spotify', { width: 'half' }),
      ]),
    ],
  },
};

export const TRANSLATION_MODULES = ['Events', 'Artists', 'Products', 'News', 'Homepage', 'About', 'FAQ', 'Legal'];
export const TRANSLATION_STATUS = opts(['complete', 'Complete'], ['partial', 'Partial'], ['missing', 'Missing']);

export const languageSettingsDefinition: SingletonDefinition = {
  key: 'settings-languages',
  label: 'Languages EN / VI',
  description: 'Default language, enabled languages and translation status.',
  group: 'Settings',
  path: '/admin/settings/languages',
  apiPath: 'settings/languages',
  permission: 'settings',
  seed: () => ({
    defaultLanguage: 'en',
    enabled: ['en', 'vi'],
    // English is the source; Vietnamese has not been written yet.
    translations: TRANSLATION_MODULES.map((module) => ({ module, en: 'complete', vi: 'missing' })),
  }),
  form: {
    titleKey: 'defaultLanguage',
    seo: false,
    publish: null,
    sections: [
      section('languages', 'Languages', [
        f.select('defaultLanguage', 'Default language', opts(['en', 'English'], ['vi', 'Tiếng Việt']), { required: true }),
        { key: 'enabled', label: 'Enabled languages', type: 'multiselect', options: opts(['en', 'English'], ['vi', 'Tiếng Việt']) },
      ]),
      section('translations', 'Content translation status', [
        f.repeater('translations', 'Modules', [
          f.readonly('module', 'Module'),
          f.select('en', 'English', TRANSLATION_STATUS),
          f.select('vi', 'Vietnamese', TRANSLATION_STATUS),
        ], { itemLabelKey: 'module', itemNoun: 'Module' }),
      ], { description: 'Set manually for now. No machine translation is used.' }),
    ],
  },
};

export const emailSettingsDefinition: SingletonDefinition = {
  key: 'settings-email',
  label: 'Email (SMTP)',
  description: 'The mail server the website sends from, and who is told about new contact messages, VIP table requests and reviews.',
  group: 'Settings',
  path: '/admin/settings/email',
  apiPath: 'settings/email',
  permission: 'settings',
  seed: () => ({ ...emailSettingsDefaults(), password: '', passwordStatus: 'Not set', source: 'Not configured', lastCheck: 'Not tested yet' }),
  form: {
    titleKey: 'host',
    seo: false,
    publish: null,
    sections: [
      section('sending', 'Sending', [
        f.toggle('enabled', 'Send emails from the website', { width: 'full', help: 'Off: forms still save to Admin, but nobody is emailed.' }),
        f.readonly('source', 'Mail server in use'),
        f.readonly('lastCheck', 'Last check'),
      ]),
      section('server', 'SMTP server', [
        f.text('host', 'SMTP host', { width: 'half', placeholder: 'smtp.gmail.com', help: 'Leave empty to use SMTP_HOST from the server .env.' }),
        f.number('port', 'Port', { min: 1, max: 65535, help: '587 for STARTTLS, 465 for SSL/TLS.' }),
        f.select('security', 'Security', opts(...SMTP_SECURITY.map((value) => [value, SMTP_SECURITY_LABELS[value]] as [string, string])), { required: true }),
        f.text('username', 'Username', { width: 'half', placeholder: 'usually your full email address' }),
        { key: 'password', label: 'Password', type: 'secret', width: 'half', help: 'Stored encrypted and never shown again. Leave empty to keep the stored one. Gmail and Outlook need an app password.' },
        f.readonly('passwordStatus', 'Stored password'),
      ], { description: 'Use the SMTP details from your email provider (Gmail / Google Workspace, Outlook, Zoho, your web host…).' }),
      section('sender', 'Sender & look', [
        f.text('fromName', 'From name', { width: 'half', placeholder: 'Connection Rave' }),
        f.email('fromEmail', 'From email', { help: 'Most providers only allow the address you log in with.' }),
        f.email('replyTo', 'Reply-to email', { help: 'Optional. Notifications reply to the visitor instead.' }),
        f.media('emailLogo', 'Logo in emails', { help: 'Shown at the top of every email, on a dark background. Empty: the site logo (Settings › Website) is used. A PNG with a transparent background looks best.' }),
      ]),
      section('notifications', 'Notifications to the team', [
        f.textarea('notifyTo', 'Send notifications to', { placeholder: 'bookings@example.com, owner@example.com', help: 'One or more addresses, separated by commas or new lines (up to 10).' }),
        f.toggle('notifyContact', 'New contact message'),
        f.toggle('notifyBooking', 'New VIP table request'),
        f.toggle('notifyReview', 'New review waiting for approval'),
        f.toggle('notifyNewsletter', 'New newsletter signup'),
      ]),
      section('autoreply', 'Automatic replies to visitors', [
        f.toggle('autoReplyContact', 'Confirm contact messages', { help: 'Sends the visitor a copy of their message.' }),
        f.toggle('autoReplyBooking', 'Confirm VIP table requests', { help: 'Says the request was received and is not a reservation yet.' }),
      ]),
    ],
  },
};

export type IntegrationState = 'not-connected' | 'configured' | 'connected' | 'error';

export interface IntegrationRecord {
  id: string;
  name: string;
  description: string;
  state: IntegrationState;
  /** True when a key is stored server-side. The key itself never comes back. */
  keyConfigured: boolean;
  /** Write-only: a new key to store. Always empty when read. */
  newKey: string;
  endpoint: string;
}

export const INTEGRATION_STATES = opts(['not-connected', 'Not Connected'], ['configured', 'Configured'], ['connected', 'Connected'], ['error', 'Error']);

export const integrationsDefinition: SingletonDefinition = {
  key: 'settings-integrations',
  label: 'Newsletter / Integrations',
  description: 'Connected services and third-party integrations.',
  group: 'Settings',
  path: '/admin/settings/integrations',
  apiPath: 'settings/integrations',
  permission: 'settings',
  // Nothing is connected in this build — every card says so.
  seed: () => ({
    items: [
      { id: 'ticket-provider', name: 'Ticket Provider', description: 'Hosted ticket sales for events.', state: 'not-connected', keyConfigured: false, newKey: '', endpoint: '' },
      { id: 'square', name: 'Square', description: 'Card payments, orders, refunds and webhooks.', state: 'not-connected', keyConfigured: false, newKey: '', endpoint: '/api/v1/webhooks/square' },
      { id: 'mailchimp', name: 'Mailchimp', description: 'Newsletter audience.', state: 'not-connected', keyConfigured: false, newKey: '', endpoint: '' },
      { id: 'brevo', name: 'Brevo', description: 'Transactional and newsletter email.', state: 'not-connected', keyConfigured: false, newKey: '', endpoint: '' },
      { id: 'social', name: 'Social Links', description: 'Public profile links (Social / Contact).', state: 'not-connected', keyConfigured: false, newKey: '', endpoint: '' },
      { id: 'analytics', name: 'Analytics', description: 'Site analytics.', state: 'not-connected', keyConfigured: false, newKey: '', endpoint: '' },
    ] satisfies IntegrationRecord[],
  }),
  form: {
    titleKey: 'items',
    seo: false,
    publish: null,
    sections: [],
  },
};

export const shippingDefinition: SingletonDefinition = {
  key: 'shipping',
  label: 'Shipping Settings',
  description: 'How merchandise is delivered and charged.',
  group: 'Merchandise',
  path: '/admin/shipping',
  apiPath: 'shipping',
  permission: 'products',
  // Not configured: no rates are invented.
  seed: () => ({ mode: 'not-configured', regions: [], freeShippingThreshold: null, handlingNotes: '', provider: 'none' }),
  form: {
    titleKey: 'mode',
    seo: false,
    publish: null,
    sections: [
      section('mode', 'Shipping mode', [
        f.select('mode', 'Mode', opts(['not-configured', 'Not configured'], ['flat', 'Flat rates by region'], ['provider', 'Carrier-calculated'], ['pickup', 'Pickup only']), { required: true }),
        f.select('provider', 'Provider integration', opts(['none', 'None'], ['auspost', 'Australia Post'], ['sendle', 'Sendle'], ['other', 'Other']), { showWhen: { key: 'mode', in: ['provider'] } }),
      ], { description: 'Checkout shows “Shipping to be confirmed” until this is configured and connected.' }),
      section('regions', 'Regions & rates', [
        f.repeater('regions', 'Regions', [
          f.text('name', 'Region', { required: true, width: 'half' }),
          f.money('rate', 'Rate', { required: true }),
          f.text('eta', 'Delivery estimate', { width: 'half' }),
        ], { itemLabelKey: 'name', itemNoun: 'Region', showWhen: { key: 'mode', in: ['flat'] } }),
      ]),
      section('free', 'Free shipping', [
        f.money('freeShippingThreshold', 'Free shipping over', { help: 'Leave empty for none.' }),
      ]),
      section('notes', 'Handling notes', [f.textarea('handlingNotes', 'Notes shown at checkout')]),
    ],
  },
};
