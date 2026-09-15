'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Clock, MapPin, Users, Wine } from 'lucide-react';
import Container from '@/components/ui/Container';
import { vipReveal, vipStagger } from '@/lib/animations';
import { formatMoney } from '@/lib/money';
import type { VipPageData, VipSelection } from '@/lib/vip/types';
import { buildVipBookingUrl, toggleBottle } from '@/lib/vip/selection';
import ClubMap from './ClubMap';
import BottleSelector from './BottleSelector';

function SectionHeading({
  title,
  titleId,
  context,
}: {
  title: string;
  titleId: string;
  context?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2
          id={titleId}
          className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
        >
          {title}
        </h2>
        <span
          aria-hidden
          className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
          style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
        />
      </div>
      {context && (
        <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:pb-2 sm:text-xs">
          {context}
        </p>
      )}
    </div>
  );
}

/**
 * The interactive half of /tables: pick a booth, pick up to three bottles, and
 * carry both to /book-now as identifiers in the URL.
 *
 * State lives here so the page itself stays a Server Component. Nothing is
 * persisted — a selection is only meaningful once it reaches the booking form,
 * and the URL is what makes that survive a refresh or a shared link.
 */
export default function VipConfigurator({
  data,
  initialSelection,
}: {
  data: VipPageData;
  initialSelection: VipSelection;
}) {
  const reduced = useReducedMotion();
  const [boothId, setBoothId] = useState<string | null>(initialSelection.boothId ?? null);
  const [bottleIds, setBottleIds] = useState<string[]>(initialSelection.bottleIds);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const selectedBooth = useMemo(
    () => data.booths.find((booth) => booth.id === boothId) ?? null,
    [data.booths, boothId],
  );

  const bookingUrl = buildVipBookingUrl({ boothId, bottleIds });

  const handleToggleBottle = (id: string) => {
    const result = toggleBottle(bottleIds, id, data.package);
    setBottleIds(result.bottleIds);
    setLimitMessage(
      result.rejected ? `You can choose up to ${data.package.maxBottleSelections} bottles.` : null,
    );
  };

  const availabilityLabel =
    selectedBooth?.availability === 'available'
      ? 'Available'
      : selectedBooth?.availability === 'unavailable'
        ? 'Unavailable'
        : 'On request';

  return (
    <>
      <section
        id="club-map"
        aria-labelledby="club-map-title"
        className="relative scroll-mt-[100px] bg-rave-black py-16 md:py-24"
      >
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
            {/* Map */}
            <div>
              <SectionHeading
                title="Club Map"
                titleId="club-map-title"
                context="Select Your Preferred Area"
              />
              <div className="mt-8">
                <ClubMap
                  booths={data.booths}
                  selectedBoothId={boothId}
                  onSelect={setBoothId}
                  disclaimer={data.mapDisclaimer}
                />
              </div>
            </div>

            {/* Package */}
            <aside aria-labelledby="booth-package-title">
              <div className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h2
                    id="booth-package-title"
                    className="font-heading text-2xl font-black uppercase tracking-tight text-white sm:text-[26px]"
                  >
                    Booth Package
                  </h2>
                  <p className="text-right font-heading text-[9px] uppercase leading-tight tracking-[0.22em] text-rave-muted sm:text-[10px]">
                    Premium Nights
                    <br />
                    Bigger Together
                  </p>
                </div>
                <span
                  aria-hidden
                  className="mt-3 block h-[3px] w-16 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
                  style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
                />

                {/* Event mini visual */}
                <div className="relative mt-5 h-28 overflow-hidden rounded-[16px] border border-white/[0.08] sm:h-32">
                  {data.event.image.src && (
                    <Image
                      src={data.event.image.src}
                      alt={data.event.image.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 320px"
                      className="object-cover"
                    />
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(3,3,5,0.55) 0%, rgba(3,3,5,0.80) 100%)',
                    }}
                  />
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="font-heading text-2xl font-black uppercase leading-none tracking-tight text-white sm:text-3xl">
                        {data.event.title}
                      </p>
                      {data.event.subtitle && (
                        <p className="mt-1.5 font-heading text-[9px] uppercase tracking-[0.3em] text-white/70 sm:text-[10px]">
                          {data.event.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price + capacity */}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/[0.08] pb-5">
                  <p className="font-heading text-4xl font-black leading-none text-white sm:text-[42px]">
                    {formatMoney(data.package.price)}
                  </p>
                  <dl className="flex flex-col gap-1.5 text-sm text-rave-muted">
                    <div className="flex items-center gap-2">
                      <dt className="sr-only">Capacity</dt>
                      <Users aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                      <dd className="font-heading uppercase tracking-wide text-white">
                        {data.package.capacity} People
                      </dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="sr-only">Bottles</dt>
                      <Wine aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                      <dd>Includes {data.package.includedBottleCount} bottles</dd>
                    </div>
                  </dl>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-rave-muted">
                  {data.package.description}
                </p>

                <dl className="mt-5 flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-rave-muted">
                      <MapPin aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                      Preferred location
                    </dt>
                    <dd className="font-heading uppercase tracking-wide text-white">
                      {selectedBooth ? `Booth ${selectedBooth.label}` : 'Not selected'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-rave-muted">
                      <Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                      Availability
                    </dt>
                    <dd className="font-heading uppercase tracking-wide text-rave-red">
                      {availabilityLabel}
                    </dd>
                  </div>
                </dl>

                {/* Announce selection changes without shouting. */}
                <p aria-live="polite" className="sr-only">
                  {selectedBooth ? `Booth ${selectedBooth.label} selected.` : 'No booth selected.'}{' '}
                  {bottleIds.length} of {data.package.maxBottleSelections} bottles selected.
                </p>

                <motion.div whileHover={reduced ? undefined : { y: -2 }} className="mt-6">
                  <Link
                    href={bookingUrl}
                    className="group/cta inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_26px_rgba(255,23,61,0.4)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
                  >
                    <span>Request This Booth</span>
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 transition-transform group-hover/cta:translate-x-1"
                    />
                  </Link>
                </motion.div>
                <p className="mt-2 text-center text-xs text-rave-muted/80">
                  Sends a request. Availability is confirmed by the team.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* Bottles */}
      <section
        id="bottle-options"
        aria-labelledby="bottle-options-title"
        className="relative scroll-mt-[100px] bg-rave-black pb-16 md:pb-24"
      >
        <Container>
          <SectionHeading
            title="Bottle Options"
            titleId="bottle-options-title"
            context="Premium Selections For Your Night"
          />
          <motion.div
            variants={vipStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-8"
          >
            <motion.p
              variants={vipReveal}
              id="bottle-options-help"
              className="mb-5 text-sm text-rave-muted"
            >
              Choose up to {data.package.maxBottleSelections} bottles
              {' '}({bottleIds.length} of {data.package.maxBottleSelections} selected).
            </motion.p>
            <BottleSelector
              bottles={data.bottles}
              selected={bottleIds}
              pkg={data.package}
              onToggle={handleToggleBottle}
              limitMessage={limitMessage}
              describedBy="bottle-options-help"
            />
          </motion.div>
        </Container>
      </section>
    </>
  );
}
