import { f, section } from '@/lib/admin/common/fields';
import type { SingletonDefinition } from '@/lib/admin/common/resource';
import type { FieldConfig, FormSection } from '@/lib/admin/common/schema';

// Page content editors. They edit content and data only — layout and motion
// stay in code.

function block(id: string, title: string, extra: FieldConfig[] = [], description?: string): FormSection {
  return section(
    id,
    title,
    [
      f.toggle(`${id}.enabled`, 'Show this section'),
      f.number(`${id}.sortOrder`, 'Sort order', { min: 0 }),
      f.loc(`${id}.eyebrow`, 'Eyebrow', { width: 'half', maxLength: 40 }),
      f.loc(`${id}.title`, 'Title', { width: 'half', maxLength: 80 }),
      f.locArea(`${id}.description`, 'Description', { maxLength: 300 }),
      f.text(`${id}.ctaLabel`, 'CTA label', { width: 'half' }),
      f.url(`${id}.ctaHref`, 'CTA link', { width: 'half' }),
      ...extra,
    ],
    { tab: title, description },
  );
}

const sectionSeed = (sortOrder: number, eyebrow: string, title: string, description = '', ctaLabel = '', ctaHref = '') => ({
  enabled: true,
  sortOrder,
  eyebrow: { en: eyebrow },
  title: { en: title },
  description: { en: description },
  ctaLabel,
  ctaHref,
});

export const homeContentDefinition: SingletonDefinition = {
  key: 'content-home',
  label: 'Homepage Content',
  description: 'Sections of the public homepage.',
  group: 'Content',
  path: '/admin/content/home',
  apiPath: 'content/home',
  permission: 'content',
  seed: () => ({
    hero: { ...sectionSeed(1, '', '', '', 'Get Tickets', '/tickets'), media: null },
    overview: { ...sectionSeed(2, '', ''), media: null },
    lineup: sectionSeed(3, 'Lineup / Music', 'The Artists', '', 'View Lineup', '/lineup'),
    tickets: sectionSeed(4, 'Tickets & Pricing', 'Get Your Tickets', 'Choose your tier. Lock it in. Be part of the night.', 'Get Tickets', '/tickets'),
    vip: sectionSeed(5, 'Book The Table', 'VIP Table Bookings', 'Reserve your booth. Choose your bottle package. Pick your preferred table location.', 'Book Now', '/book-now'),
    partners: sectionSeed(6, 'In Partnership With', 'Partners'),
    footerCta: sectionSeed(7, '', 'Music Connects Us All'),
  }),
  form: {
    titleKey: 'hero.title',
    seo: false,
    publish: null,
    tabs: ['Hero', 'Event Overview', 'Lineup Preview', 'Tickets', 'VIP Tables', 'Partners', 'Footer CTA'],
    sections: [
      block('hero', 'Hero', [f.media('hero.media', 'Hero image')]),
      block('overview', 'Event Overview', [f.media('overview.media', 'Section image')]),
      block('lineup', 'Lineup Preview', [], 'Artists come from Artist Management.'),
      block('tickets', 'Tickets', [], 'Tiers come from the event’s ticket settings.'),
      block('vip', 'VIP Tables', [], 'Package details come from the event’s VIP settings.'),
      block('partners', 'Partners', [], 'Logos come from Sponsors / Partners.'),
      block('footerCta', 'Footer CTA'),
    ],
  },
};

export const aboutContentDefinition: SingletonDefinition = {
  key: 'content-about',
  label: 'About Content',
  description: 'Sections of the About page.',
  group: 'Content',
  path: '/admin/content/about',
  apiPath: 'content/about',
  permission: 'content',
  seed: () => ({
    hero: { eyebrow: { en: '' }, titleLines: [], description: { en: '' }, image: null },
    story: { eyebrow: { en: '' }, title: { en: '' }, body: { en: '' }, quote: { en: '' }, image: null },
    values: [],
    ecosystem: { title: { en: '' }, description: { en: '' } },
    why: { title: { en: '' }, description: { en: '' } },
    partners: { enabled: false, title: { en: '' } },
    finalCta: { title: { en: '' }, ctaLabel: '', ctaHref: '' },
  }),
  form: {
    titleKey: 'story.title',
    seo: false,
    publish: null,
    tabs: ['Hero', 'Our Story', 'Values', 'Ecosystem', 'Why People Connect', 'Partners', 'Final CTA'],
    sections: [
      section('hero', 'Hero', [
        f.loc('hero.eyebrow', 'Eyebrow', { width: 'half' }),
        f.tags('hero.titleLines', 'Title lines'),
        f.locArea('hero.description', 'Description'),
        f.media('hero.image', 'Hero image'),
      ], { tab: 'Hero' }),
      section('story', 'Our Story', [
        f.loc('story.eyebrow', 'Eyebrow', { width: 'half' }),
        f.loc('story.title', 'Title', { width: 'half' }),
        f.locArea('story.body', 'Body', { help: 'Separate paragraphs with a blank line.' }),
        f.loc('story.quote', 'Quote'),
        f.media('story.image', 'Image'),
      ], { tab: 'Our Story' }),
      section('values', 'Values', [
        f.repeater('values', 'Values', [
          f.text('title', 'Title', { required: true, width: 'half' }),
          f.textarea('description', 'Description'),
        ], { itemLabelKey: 'title', itemNoun: 'Value' }),
      ], { tab: 'Values' }),
      section('ecosystem', 'Ecosystem', [
        f.loc('ecosystem.title', 'Title'),
        f.locArea('ecosystem.description', 'Description'),
      ], { tab: 'Ecosystem' }),
      section('why', 'Why People Connect', [
        f.loc('why.title', 'Title'),
        f.locArea('why.description', 'Description'),
      ], { tab: 'Why People Connect' }),
      section('partners', 'Partners', [
        f.toggle('partners.enabled', 'Show partners'),
        f.loc('partners.title', 'Title'),
      ], { tab: 'Partners', description: 'Logos come from Sponsors / Partners.' }),
      section('finalCta', 'Final CTA', [
        f.loc('finalCta.title', 'Title'),
        f.text('finalCta.ctaLabel', 'CTA label', { width: 'half' }),
        f.url('finalCta.ctaHref', 'CTA link', { width: 'half' }),
      ], { tab: 'Final CTA' }),
    ],
  },
};

export const contactContentDefinition: SingletonDefinition = {
  key: 'content-contact',
  label: 'Contact Content',
  description: 'Contact page details and form introduction.',
  group: 'Content',
  path: '/admin/content/contact',
  apiPath: 'content/contact',
  permission: 'content',
  // Nothing is confirmed yet, so every contact detail starts empty.
  seed: () => ({
    generalEnquiries: { en: '' },
    vipContact: { en: '' },
    eventLocation: '',
    email: '',
    phone: '',
    address: '',
    mapUrl: '',
    formIntro: { en: '' },
  }),
  form: {
    titleKey: 'eventLocation',
    seo: false,
    publish: null,
    sections: [
      section('details', 'Contact details', [
        f.email('email', 'Email'),
        f.text('phone', 'Phone', { width: 'half' }),
        f.textarea('address', 'Address'),
        f.url('mapUrl', 'Map URL', { width: 'half' }),
        f.text('eventLocation', 'Event location', { width: 'half' }),
      ], { description: 'Leave a field empty until it is confirmed — empty fields are hidden on the site.' }),
      section('copy', 'Page copy', [
        f.locArea('generalEnquiries', 'General enquiries'),
        f.locArea('vipContact', 'VIP contact'),
        f.locArea('formIntro', 'Form introduction'),
      ]),
    ],
  },
};
