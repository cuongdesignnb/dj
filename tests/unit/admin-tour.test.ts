import { describe, expect, it } from 'vitest';
import { ADMIN_TOURS, guideForPath, tourForPath, tourStorageKey } from '@/lib/admin/tour/tours';

const id = '0c0ecab3-23af-4aad-8599-b3df9f012ded';

describe('admin tours', () => {
  it.each([
    ['/admin', 'dashboard'],
    ['/admin/', 'dashboard'],
    [`/admin/events/${id}/edit`, 'event-edit'],
    ['/admin/events/new', 'event-edit'],
    [`/admin/events/${id}/tickets/tiers`, 'ticket-tiers'],
    [`/admin/events/${id}/tickets`, 'ticket-settings'],
    [`/admin/events/${id}/tickets/content`, 'page-content'],
    [`/admin/events/${id}/vip/booking-content`, 'page-content'],
    ['/admin/content/events', 'page-content'],
    ['/admin/settings/global-content', 'page-content'],
    ['/admin/media', 'media'],
  ])('%s → %s', (path, tour) => {
    expect(tourForPath(path)?.id).toBe(tour);
  });

  it('pages without their own guide fall back to the general overview without dashboard-only steps', () => {
    expect(tourForPath('/admin/events')).toBeNull();
    const guide = guideForPath('/admin/events');
    expect(guide.id).toBe('dashboard');
    expect(guide.steps.some((step) => step.target === '#quick-actions')).toBe(false);
    expect(guide.steps.some((step) => step.target === '[data-tour="guide-button"]')).toBe(true);
  });

  it('every tour has unique ids, titled steps and stores progress per editor', () => {
    expect(new Set(ADMIN_TOURS.map((tour) => tour.id)).size).toBe(ADMIN_TOURS.length);
    for (const tour of ADMIN_TOURS) for (const step of tour.steps) expect(step.title && step.body).toBeTruthy();
    expect(tourStorageKey('user-1')).toBe('connection-rave:admin-tour:v1:user-1');
  });
});
