import type { SeedContext } from './context';
import { EVENT_GENRES } from './context';

export async function seedEvent({ db }: SeedContext) {
  const poster = await db.mediaAsset.findUnique({ where: { storageKey: 'assets/event-poster.jpg' } });
  const hero = await db.mediaAsset.findUnique({ where: { storageKey: 'assets/hero-crowd.jpg' } });
  const event = await db.event.upsert({
    where: { slug: 'destiny' },
    update: {
      // Confirmed source facts are safe to reconcile on every bootstrap run.
      status: 'PUBLISHED',
      lifecycleStatus: 'UPCOMING',
      dateStatus: 'TBA',
      scheduleStatus: 'TBC',
      startAt: null,
      endAt: null,
      venueName: 'Metro City',
      city: 'Perth',
      region: null,
      country: 'Australia',
      address: null,
      mapUrl: null,
      featured: true,
      posterMediaId: poster?.id ?? undefined,
      heroMediaId: hero?.id ?? undefined,
      seoTitle: 'DESTINY | Connection Rave — Perth',
      seoDescription: 'DESTINY is a Connection Rave music experience at Metro City, Perth. Date and schedule to be announced.',
      ogMediaId: poster?.id ?? undefined,
      indexable: true,
      followLinks: true,
      deletedAt: null,
    },
    create: {
      slug: 'destiny',
      status: 'PUBLISHED',
      lifecycleStatus: 'UPCOMING',
      dateStatus: 'TBA',
      scheduleStatus: 'TBC',
      startAt: null,
      endAt: null,
      venueName: 'Metro City',
      city: 'Perth',
      country: 'Australia',
      posterMediaId: poster?.id,
      heroMediaId: hero?.id,
      seoTitle: 'DESTINY | Connection Rave — Perth',
      seoDescription: 'DESTINY is a Connection Rave music experience at Metro City, Perth. Date and schedule to be announced.',
      ogMediaId: poster?.id,
      indexable: true,
      followLinks: true,
    },
  });

  for (const locale of ['en', 'vi'] as const) {
    const isEnglish = locale === 'en';
    await db.eventTranslation.upsert({
      where: { eventId_locale: { eventId: event.id, locale } },
      update: {
        title: 'DESTINY',
        eyebrow: 'MUSIC MEETS SOUL',
        shortDescription: isEnglish ? 'Music, culture and people connect in Perth.' : 'Âm nhạc, văn hóa và con người kết nối tại Perth.',
        description: isEnglish
          ? 'DESTINY is a high-energy nightlife experience where music, culture and people meet on the dancefloor.'
          : 'DESTINY là trải nghiệm nightlife nơi âm nhạc, văn hóa và con người gặp nhau trên sàn nhảy.',
        seoTitle: isEnglish ? 'DESTINY | Connection Rave — Perth' : 'DESTINY | Connection Rave — Perth',
        seoDescription: isEnglish
          ? 'DESTINY is a Connection Rave music experience at Metro City, Perth. Date and schedule to be announced.'
          : 'DESTINY là trải nghiệm âm nhạc Connection Rave tại Metro City, Perth. Ngày và lịch sẽ được công bố sau.',
      },
      create: {
        eventId: event.id,
        locale,
        title: 'DESTINY',
        eyebrow: 'MUSIC MEETS SOUL',
        shortDescription: isEnglish ? 'Music, culture and people connect in Perth.' : 'Âm nhạc, văn hóa và con người kết nối tại Perth.',
        description: isEnglish
          ? 'DESTINY is a high-energy nightlife experience where music, culture and people meet on the dancefloor.'
          : 'DESTINY là trải nghiệm nightlife nơi âm nhạc, văn hóa và con người gặp nhau trên sàn nhảy.',
        seoTitle: isEnglish ? 'DESTINY | Connection Rave — Perth' : 'DESTINY | Connection Rave — Perth',
        seoDescription: isEnglish
          ? 'DESTINY is a Connection Rave music experience at Metro City, Perth. Date and schedule to be announced.'
          : 'DESTINY là trải nghiệm âm nhạc Connection Rave tại Metro City, Perth. Ngày và lịch sẽ được công bố sau.',
      },
    });
  }

  for (const [sortOrder, genre] of EVENT_GENRES.entries()) {
    const existing = await db.eventGenre.findFirst({ where: { eventId: event.id, genre } });
    if (existing) {
      await db.eventGenre.update({ where: { id: existing.id }, data: { sortOrder } });
    } else {
      await db.eventGenre.create({ data: { eventId: event.id, genre, sortOrder } });
    }
  }

  return event;
}
