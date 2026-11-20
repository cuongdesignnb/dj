import { f, section } from '@/lib/admin/common/fields';
import type { SingletonDefinition } from '@/lib/admin/common/resource';
import type { FieldConfig, FormSection } from '@/lib/admin/common/schema';

// Page content editors. They edit content and data only — layout and motion
// stay in code.

const sectionSeed = (sortOrder: number, eyebrow: string, title: string, description = '', ctaLabel = '', ctaHref = '') => ({
  enabled: true,
  sortOrder,
  eyebrow: { en: eyebrow },
  title: { en: title },
  description: { en: description },
  ctaLabel,
  ctaHref,
});

/** A homepage section: shown or hidden, with its copy. The order is fixed in code. */
function homeBlock(id: string, title: string, extra: FieldConfig[] = [], description?: string): FormSection {
  return section(
    id,
    title,
    [
      f.toggle(`${id}.enabled`, 'Show this section'),
      f.loc(`${id}.eyebrow`, 'Eyebrow', { width: 'half', maxLength: 40 }),
      f.loc(`${id}.title`, 'Title', { width: 'half', maxLength: 80 }),
      f.locArea(`${id}.description`, 'Description', { maxLength: 600 }),
      f.text(`${id}.ctaLabel`, 'Button label', { width: 'half' }),
      f.url(`${id}.ctaHref`, 'Button link', { width: 'half' }),
      ...extra,
    ],
    { tab: title, description },
  );
}

/** Homepage order: Hero, Upcoming Events, About, Featured Artists, Past Events & Gallery, Aftermovies, Sponsors, Contact & Newsletter. */
export const HOME_SECTION_DEFAULTS = {
  hero: sectionSeed(1, 'Sound Meets Soul', 'CONNECTION', 'Uniting music, energy and people for unforgettable experiences.', 'Upcoming events', '#upcoming-events'),
  upcoming: sectionSeed(2, 'Upcoming Events', 'Choose Your Night', 'Pick an event to see its lineup, tickets, VIP tables, bar list and venue.', 'All events', '/events'),
  about: sectionSeed(3, 'About Connection', 'Sound Meets Soul', 'Uniting music, energy and people for unforgettable experiences.', 'Our story', '/about'),
  lineup: sectionSeed(4, 'Featured Artists', 'The Artists', '', 'View all artists', '/lineup'),
  pastEvents: sectionSeed(5, 'Past Events & Gallery', 'Relive The Nights', '', 'All past events', '/events/past'),
  aftermovies: sectionSeed(6, 'Aftermovies', 'Watch The Night Again'),
  partners: sectionSeed(7, 'In Partnership With', 'Sponsors & Partners'),
  contact: sectionSeed(8, 'Contact & Newsletter', 'Stay Connected', 'Questions about tickets, VIP tables or partnerships? The team is here to help.', 'Contact us', '/contact'),
};

export const homeContentDefinition: SingletonDefinition = {
  key: 'content-home',
  label: 'Homepage Content',
  description: 'Sections of the public homepage.',
  group: 'Content',
  path: '/admin/content/home',
  apiPath: 'content/home',
  permission: 'content',
  seed: () => ({
    hero: { ...HOME_SECTION_DEFAULTS.hero, secondaryLabel: 'About Connection', secondaryHref: '#about-connection', media: null, video: null, animation: null, eventId: '' },
    upcoming: HOME_SECTION_DEFAULTS.upcoming,
    about: { ...HOME_SECTION_DEFAULTS.about, media: null },
    lineup: { ...HOME_SECTION_DEFAULTS.lineup, featuredOnly: true },
    pastEvents: HOME_SECTION_DEFAULTS.pastEvents,
    aftermovies: { ...HOME_SECTION_DEFAULTS.aftermovies, items: [] },
    partners: HOME_SECTION_DEFAULTS.partners,
    contact: HOME_SECTION_DEFAULTS.contact,
  }),
  form: {
    titleKey: 'hero.title',
    seo: false,
    publish: null,
    tabs: ['Hero', 'Upcoming Events', 'About Connection', 'Featured Artists', 'Past Events & Gallery', 'Aftermovies', 'Sponsors & Partners', 'Contact & Newsletter'],
    sections: [
      section('hero', 'Hero', [
        f.loc('hero.eyebrow', 'Eyebrow', { width: 'half', maxLength: 40 }),
        f.loc('hero.title', 'Brand name', { width: 'half', maxLength: 80, help: 'Read by screen readers and search engines; the animated wordmark below is what people see.' }),
        f.locArea('hero.description', 'Description', { maxLength: 600 }),
        f.text('hero.ctaLabel', 'Main button label', { width: 'half' }),
        f.url('hero.ctaHref', 'Main button link', { width: 'half', help: '#upcoming-events scrolls to the events below.' }),
        f.text('hero.secondaryLabel', 'Second button label', { width: 'half' }),
        f.url('hero.secondaryHref', 'Second button link', { width: 'half' }),
        f.media('hero.media', 'Hero background image', { help: 'Shown behind the hero, and as the poster while the video loads.' }),
        f.videoMedia('hero.video', 'Hero background video', { help: 'Optional. Plays muted on a loop behind the hero. Visitors who prefer reduced motion see the background image instead.' }),
        f.svgMedia('hero.animation', 'Hero wordmark (animated SVG)', { help: 'The CONNECTION wordmark shown in the middle of the hero.' }),
        { key: 'hero.eventId', label: 'Default event', type: 'select', optionSource: 'events', width: 'full', help: 'The event that /tickets, /tables, /book-now and /event open when no event is chosen. Past or unpublished events are skipped. Empty: the next upcoming event.' },
      ], { tab: 'Hero', description: 'The top banner introduces Connection itself. Events are picked in Upcoming Events below.' }),
      homeBlock('upcoming', 'Upcoming Events', [], 'Every published, upcoming event is listed automatically, soonest first. Each card opens the event page.'),
      homeBlock('about', 'About Connection', [f.media('about.media', 'Image')]),
      homeBlock('lineup', 'Featured Artists', [f.toggle('lineup.featuredOnly', 'Only artists marked Featured', { help: 'Mark artists as Featured in Artist Management.' })]),
      homeBlock('pastEvents', 'Past Events & Gallery', [], 'The latest past events and published gallery albums are shown automatically.'),
      homeBlock('aftermovies', 'Aftermovies', [
        f.repeater('aftermovies.items', 'Films', [
          f.text('title', 'Title', { width: 'half' }),
          f.url('youtubeUrl', 'YouTube link', { width: 'half', help: 'Paste the YouTube video link. Or upload a video file below.' }),
          f.videoMedia('video', 'Video file'),
          f.media('poster', 'Cover image', { help: 'Optional for YouTube links; YouTube’s own thumbnail is used otherwise.' }),
        ], { itemLabelKey: 'title', itemNoun: 'Film' }),
      ], 'The section is hidden until at least one film is added.'),
      homeBlock('partners', 'Sponsors & Partners', [], 'Logos come from Sponsors / Partners.'),
      homeBlock('contact', 'Contact & Newsletter', [], 'Email, phone and address come from Settings › Social / Contact.'),
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
