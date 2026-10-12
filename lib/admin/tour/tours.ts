/**
 * Guided tours for the admin. Each tour belongs to one kind of page and is a
 * list of steps anchored on stable selectors (mostly `data-tour`). Steps whose
 * element is not on the page (permissions, layout, empty lists) are dropped
 * before the tour starts, so the step count matches what the editor sees.
 */
export interface TourStep {
  /** CSS selector of the element to highlight; omit for a centred message. */
  target?: string;
  title: string;
  body: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export interface AdminTour {
  id: string;
  title: string;
  match: (pathname: string) => boolean;
  steps: TourStep[];
}

const UUID = '[0-9a-f-]{36}';
const route = (pattern: string) => {
  const regex = new RegExp(`^${pattern}/?$`, 'i');
  return (pathname: string) => regex.test(pathname);
};

/** Shell steps that exist on every admin page. */
const shellSteps: TourStep[] = [
  { target: '[data-tour="sidebar"]', title: 'Main menu', body: 'Every area of the admin lives here: events, ticketing, VIP tables, artists, merchandise, website content, navigation, team and settings. Click a group to open it.', side: 'right' },
  { target: '[data-tour="menu-search"]', title: 'Find a menu item', body: 'Type part of a name, e.g. “tiers” or “media”, to jump straight to that screen.', side: 'right' },
  { target: '[data-tour="nav-events"]', title: 'Events', body: 'Create and edit events: name, dates, venue, descriptions, lineup and images. Each event has its own tickets, VIP tables and page content.', side: 'right' },
  { target: '[data-tour="nav-ticketing"]', title: 'Ticketing', body: 'Choose an event, then set ticket tiers (types and prices), sale settings and the text of its tickets page.', side: 'right' },
  { target: '[data-tour="nav-vip"]', title: 'VIP / Tables', body: 'VIP packages, booths on the club map, bottle options and the text of the tables and booking pages.', side: 'right' },
  { target: '[data-tour="nav-content"]', title: 'Website content', body: 'Home, About, FAQ, legal pages and the media library. Long texts use the formatting editor (bold, lists, links).', side: 'right' },
  { target: '[data-tour="global-search"]', title: 'Search everything', body: 'Find events, artists, news and more by name from any page.', side: 'bottom' },
  { target: '[data-tour="guide-button"]', title: 'Open this guide again', body: 'Each main screen has its own short guide. Click Guide at any time to replay the one for the page you are on.', side: 'bottom' },
];

export const ADMIN_TOURS: AdminTour[] = [
  {
    id: 'dashboard',
    title: 'Admin overview',
    match: route('/admin'),
    steps: [
      { title: 'Welcome to the Connection Rave admin', body: 'A one-minute tour of where things are. Use Next and Back, or Skip tour to close it — you can replay it from the Guide button.' },
      ...shellSteps,
      { target: '#quick-actions', title: 'Quick actions', body: 'Shortcuts to the tasks used most often.', side: 'top' },
      { target: '#overview', title: 'Overview', body: 'A summary of events, content and orders that need attention.', side: 'top' },
    ],
  },
  {
    id: 'event-edit',
    title: 'Editing an event',
    match: route(`/admin/events/(${UUID}/edit|new)`),
    steps: [
      { target: '[role="tablist"][aria-label="Form sections"]', title: 'Sections', body: 'Overview, Schedule, Venue, Artists, Gallery, FAQ and SEO. Fields are saved together from any tab.', side: 'bottom' },
      { target: '[role="group"][aria-label="Content language"]', title: 'English and Vietnamese', body: 'Switch language to fill in the Vietnamese text. English is required; Vietnamese falls back to English when empty.', side: 'bottom' },
      { target: '[data-field="longDescription"]', title: 'Long description with formatting', body: 'Use the toolbar for bold, italic, links and lists. Enter starts a new paragraph, Shift+Enter a new line. The event page shows it exactly like this.', side: 'top' },
      { target: 'aside[aria-label="Save and publish"]', title: 'Save and publish', body: 'Save keeps your changes without making a draft public. Use Publish when the event should appear on the website.', side: 'left' },
    ],
  },
  {
    id: 'ticket-tiers',
    title: 'Ticket tiers',
    match: route(`/admin/events/${UUID}/tickets/tiers`),
    steps: [
      { target: '[data-tour="add-tier"]', title: 'Add a ticket type', body: 'Each tier is one kind of ticket on the tickets page, e.g. Early Bird, General Admission or VIP.', side: 'bottom' },
      { target: 'article[data-resource-id] [id$="-price"]', title: 'Price in dollars', body: 'Type the price as dollars and cents, e.g. 45.00. The line underneath shows exactly what visitors will see.', side: 'bottom' },
      { target: 'article[data-resource-id] [id$="-availabilityStatus"]', title: 'Availability', body: 'Available, On request, Not available, Sold out or To be announced.', side: 'bottom' },
      { target: 'article[data-resource-id] [data-tour="tier-toggles"]', title: 'Visibility and sales', body: 'Hide a tier, highlight it, and allow online or door sales. Online and door sales also need to be switched on in Ticket Settings.', side: 'top' },
      { target: 'article[data-resource-id] [data-tour="row-save"]', title: 'Save each tier', body: 'Every tier has its own Save button. If something is wrong, the message appears under that field.', side: 'left' },
    ],
  },
  {
    id: 'ticket-settings',
    title: 'Ticket settings',
    match: route(`/admin/events/${UUID}/tickets`),
    steps: [
      { target: 'section[aria-label="Ticket readiness"]', title: 'Is the tickets page ready?', body: 'A live checklist: content published, active tiers, sale status and the public link of this event’s tickets page.', side: 'bottom' },
      { target: 'select[aria-label="Sale status"]', title: 'Sale status', body: 'Coming soon, On sale, Paused, Sold out or Ended — shown to visitors on the tickets page.', side: 'bottom' },
      { target: 'input[aria-label="Sale opens (your local time)"]', title: 'Sale window', body: 'Optional opening and closing times, in your own time zone. Closing must be after opening.', side: 'bottom' },
      { target: '[data-tour="settings-save"]', title: 'Save settings', body: 'Changes apply to this event only.', side: 'left' },
    ],
  },
  {
    id: 'page-content',
    title: 'Page content',
    match: route(`/admin/(events/${UUID}/(tickets/content|vip/tables-content|vip/booking-content)|content/[a-z-]+|settings/global-content)`),
    steps: [
      { target: '[data-tour="cms-status"]', title: 'Draft or published', body: 'Shows whether this page’s text is saved and published. “Not saved yet” means you are looking at a starting draft.', side: 'bottom' },
      { target: '[data-rich-text-editor]', title: 'Formatted text', body: 'Longer texts support bold, italic and links (and lists where useful). Visitors see the same formatting.', side: 'top' },
      { target: '[data-tour="cms-actions"]', title: 'Save draft or Publish', body: 'Save draft keeps changes private. Publish updates the public page.', side: 'left' },
    ],
  },
  {
    id: 'media',
    title: 'Media library',
    match: route('/admin/media'),
    steps: [
      { target: '[role="search"][aria-label="Filter media"]', title: 'Find files', body: 'Filter by name or type. Click a file to see where it is used, edit its alt text or copy its link.', side: 'bottom' },
      { target: '[data-tour="media-upload"]', title: 'Upload', body: 'Add images, SVG animations, videos or PDFs. Images picked in any form come from this library.', side: 'left' },
    ],
  },
];

export function tourForPath(pathname: string): AdminTour | null {
  return ADMIN_TOURS.find((tour) => tour.match(pathname)) ?? null;
}

/** The general tour is the fallback for pages without their own guide. */
export function guideForPath(pathname: string): AdminTour {
  return tourForPath(pathname) ?? { ...ADMIN_TOURS[0], steps: shellSteps };
}

/** First element for the selector that is actually rendered (the sidebar exists in several layouts). */
export function visibleElement(selector: string): Element | null {
  for (const element of Array.from(document.querySelectorAll(selector))) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden') return element;
  }
  return null;
}

export type TourProgress = Record<string, 'done' | 'skipped'>;

export function tourStorageKey(userId: string) {
  return `connection-rave:admin-tour:v1:${userId}`;
}
