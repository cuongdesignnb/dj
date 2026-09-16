'use client';

import { useId, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CircleAlert,
  Clock,
  Info,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  User,
  Users,
  Wine,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import { vipReveal, vipStagger } from '@/lib/animations';
import { formatMoney } from '@/lib/money';
import type { BookingRequestInput, BookingRequestResult, VipPageData, VipSelection } from '@/lib/vip/types';
import { getVipRepository, isBookingSubmissionConnected } from '@/lib/vip/repository';
import { toggleBottle } from '@/lib/vip/selection';
import {
  SPECIAL_REQUESTS_MAX,
  groupSizeWarning,
  validateBookingRequest,
} from '@/lib/vip/validation';
import type { BookingFieldErrors } from '@/lib/vip/validation';
import BottleSelector from './BottleSelector';
import GroupSizeControl from './GroupSizeControl';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-rave-red">
      <CircleAlert aria-hidden className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

const INPUT_CLASS =
  'w-full rounded-[12px] border bg-[#0B0B12] px-4 py-3.5 text-base text-white placeholder:text-rave-muted/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black';

/**
 * The booking request form and its live summary.
 *
 * This sends a request — it never reserves anything. Submission goes through
 * the same repository the page reads from, and reports an unavailable state
 * when the backend cannot accept the request.
 *
 * Contact details stay in component state and the submit payload. Nothing
 * personal is written to the URL or to storage.
 */
export default function BookingRequestForm({
  data,
  initialSelection,
}: {
  data: VipPageData;
  initialSelection: VipSelection;
}) {
  const reduced = useReducedMotion();
  // Both read the same NEXT_PUBLIC_* configuration the server used.
  const submissionConnected = isBookingSubmissionConnected();
  const ids = {
    fullName: useId(),
    email: useId(),
    phone: useId(),
    groupSize: useId(),
    booth: useId(),
    bottles: useId(),
    special: useId(),
  };

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [groupSize, setGroupSize] = useState(data.package.capacity);
  const [boothId, setBoothId] = useState<string | null>(initialSelection.boothId ?? null);
  const [bottleIds, setBottleIds] = useState<string[]>(initialSelection.bottleIds);
  const [specialRequests, setSpecialRequests] = useState('');

  const [errors, setErrors] = useState<BookingFieldErrors>({});
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingRequestResult | null>(null);

  const selectedBooth = useMemo(
    () => data.booths.find((booth) => booth.id === boothId) ?? null,
    [data.booths, boothId],
  );
  const capacityWarning = groupSizeWarning(groupSize, data.package);

  const handleToggleBottle = (id: string) => {
    const toggled = toggleBottle(bottleIds, id, data.package);
    setBottleIds(toggled.bottleIds);
    setLimitMessage(
      toggled.rejected ? `You can choose up to ${data.package.maxBottleSelections} bottles.` : null,
    );
    if (!toggled.rejected) setErrors((prev) => ({ ...prev, bottleIds: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const input: BookingRequestInput = {
      eventId: data.event.id,
      packageId: data.package.id,
      experienceType: 'vip-table',
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      groupSize,
      preferredBoothId: boothId,
      bottleIds,
      specialRequests: specialRequests.trim() || undefined,
    };

    const validation = validateBookingRequest(input, data.package);
    setErrors(validation.errors);
    if (!validation.ok) {
      setResult(null);
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const selection = getVipRepository();
      if (!selection.ok) {
        setResult({ status: 'error', message: selection.error.message });
        return;
      }
      const outcome = await selection.repository.submitBookingRequest(input);
      setResult(outcome);
      if (outcome.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...outcome.fieldErrors }));
      }
    } catch {
      setResult({
        status: 'error',
        message: 'Could not send your request. Please try again shortly.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="booking-form"
      aria-labelledby="booking-form-title"
      className="relative scroll-mt-[100px] bg-rave-black py-16 md:py-24"
    >
      <Container>
        <h2 id="booking-form-title" className="sr-only">
          Booking request
        </h2>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          {/* Form */}
          {/*
            method="post" matters even though submission is handled in JS: if the
            handler has not attached yet, the browser's own submit must not
            append the name, email and phone to the URL as a GET query.
          */}
          <form
            method="post"
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-6"
          >
            {/* Contact details */}
            <fieldset className="rounded-[20px] border border-white/[0.08] bg-rave-panel/70 p-5 sm:p-6">
              <legend className="sr-only">Contact details</legend>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-heading text-2xl font-black uppercase tracking-tight text-white sm:text-[28px]">
                    Contact Details
                  </p>
                  <span
                    aria-hidden
                    className="mt-3 block h-[3px] w-16 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
                    style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
                  />
                </div>
                <p className="font-heading text-[10px] uppercase tracking-[0.26em] text-rave-muted sm:text-[11px]">
                  Let&apos;s Get You On The List
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-5">
                <div>
                  <label
                    htmlFor={ids.fullName}
                    className="mb-2 flex items-center gap-2 text-sm text-rave-muted"
                  >
                    <User aria-hidden className="h-4 w-4 text-rave-red" />
                    Full Name <span className="text-rave-red">*</span>
                  </label>
                  <input
                    id={ids.fullName}
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={errors.fullName ? true : undefined}
                    aria-describedby={errors.fullName ? `${ids.fullName}-error` : undefined}
                    placeholder="Enter your full name"
                    className={`${INPUT_CLASS} ${errors.fullName ? 'border-rave-red' : 'border-white/[0.12] hover:border-white/25'}`}
                  />
                  <FieldError id={`${ids.fullName}-error`} message={errors.fullName} />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={ids.email}
                      className="mb-2 flex items-center gap-2 text-sm text-rave-muted"
                    >
                      <Mail aria-hidden className="h-4 w-4 text-rave-red" />
                      Email <span className="text-rave-red">*</span>
                    </label>
                    <input
                      id={ids.email}
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={errors.email ? `${ids.email}-error` : undefined}
                      placeholder="you@example.com"
                      className={`${INPUT_CLASS} ${errors.email ? 'border-rave-red' : 'border-white/[0.12] hover:border-white/25'}`}
                    />
                    <FieldError id={`${ids.email}-error`} message={errors.email} />
                  </div>

                  <div>
                    <label
                      htmlFor={ids.phone}
                      className="mb-2 flex items-center gap-2 text-sm text-rave-muted"
                    >
                      <Phone aria-hidden className="h-4 w-4 text-rave-red" />
                      Phone <span className="text-rave-red">*</span>
                    </label>
                    <input
                      id={ids.phone}
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-invalid={errors.phone ? true : undefined}
                      aria-describedby={errors.phone ? `${ids.phone}-error` : undefined}
                      placeholder="+61 412 345 678"
                      className={`${INPUT_CLASS} ${errors.phone ? 'border-rave-red' : 'border-white/[0.12] hover:border-white/25'}`}
                    />
                    <FieldError id={`${ids.phone}-error`} message={errors.phone} />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Experience */}
            <fieldset className="rounded-[20px] border border-white/[0.08] bg-rave-panel/70 p-5 sm:p-6">
              <legend className="sr-only">Your experience</legend>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-heading text-2xl font-black uppercase tracking-tight text-white sm:text-[28px]">
                    Your Experience
                  </p>
                  <span
                    aria-hidden
                    className="mt-3 block h-[3px] w-16 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
                    style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
                  />
                </div>
                <p className="font-heading text-[10px] uppercase tracking-[0.26em] text-rave-muted sm:text-[11px]">
                  Tailor Your Night
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={ids.groupSize}
                    className="mb-2 flex items-center gap-2 text-sm text-rave-muted"
                  >
                    <Users aria-hidden className="h-4 w-4 text-rave-red" />
                    Group Size <span className="text-rave-red">*</span>
                  </label>
                  <div id={ids.groupSize}>
                    <GroupSizeControl
                      value={groupSize}
                      onChange={setGroupSize}
                      invalid={!!errors.groupSize}
                      describedBy={capacityWarning ? `${ids.groupSize}-warning` : undefined}
                    />
                  </div>
                  <FieldError id={`${ids.groupSize}-error`} message={errors.groupSize} />
                  {capacityWarning && (
                    <p
                      id={`${ids.groupSize}-warning`}
                      className="mt-1.5 text-sm text-rave-muted"
                    >
                      {capacityWarning}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={ids.booth}
                    className="mb-2 flex items-center gap-2 text-sm text-rave-muted"
                  >
                    <MapPin aria-hidden className="h-4 w-4 text-rave-red" />
                    Preferred Booth <span className="text-rave-red">*</span>
                  </label>
                  <select
                    id={ids.booth}
                    name="preferredBooth"
                    required
                    value={boothId ?? ''}
                    onChange={(e) => {
                      setBoothId(e.target.value || null);
                      setErrors((prev) => ({ ...prev, preferredBoothId: undefined }));
                    }}
                    aria-invalid={errors.preferredBoothId ? true : undefined}
                    aria-describedby={
                      errors.preferredBoothId ? `${ids.booth}-error` : undefined
                    }
                    className={`${INPUT_CLASS} appearance-none ${errors.preferredBoothId ? 'border-rave-red' : 'border-white/[0.12] hover:border-white/25'}`}
                  >
                    <option value="">Select a booth</option>
                    {data.booths
                      .filter((booth) => booth.requestable)
                      .map((booth) => (
                        <option key={booth.id} value={booth.id}>
                          Booth {booth.label}
                        </option>
                      ))}
                  </select>
                  <FieldError id={`${ids.booth}-error`} message={errors.preferredBoothId} />
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rave-muted">
                  <Wine aria-hidden className="h-4 w-4 text-rave-red" />
                  <span>
                    Bottle Preferences <span className="text-rave-red">*</span>
                  </span>
                  <span id={ids.bottles} className="text-rave-muted/70">
                    (Choose up to {data.package.maxBottleSelections} bottles &mdash;{' '}
                    {bottleIds.length} of {data.package.maxBottleSelections} selected)
                  </span>
                </p>
                <BottleSelector
                  bottles={data.bottles}
                  selected={bottleIds}
                  pkg={data.package}
                  onToggle={handleToggleBottle}
                  limitMessage={limitMessage}
                  describedBy={ids.bottles}
                  columnsClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
                />
                <FieldError id={`${ids.bottles}-error`} message={errors.bottleIds} />
              </div>

              <div className="mt-6">
                <label
                  htmlFor={ids.special}
                  className="mb-2 flex items-center gap-2 text-sm text-rave-muted"
                >
                  <MessageSquare aria-hidden className="h-4 w-4 text-rave-red" />
                  Special Requests
                </label>
                <textarea
                  id={ids.special}
                  name="specialRequests"
                  rows={4}
                  maxLength={SPECIAL_REQUESTS_MAX}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  aria-describedby={`${ids.special}-counter`}
                  placeholder="Tell us about your celebration, special requests, or any additional details (e.g. birthday, group type, seating preferences)"
                  className={`${INPUT_CLASS} resize-y border-white/[0.12] hover:border-white/25`}
                />
                <p
                  id={`${ids.special}-counter`}
                  className="mt-1.5 text-right text-xs tabular-nums text-rave-muted/70"
                >
                  {specialRequests.length}/{SPECIAL_REQUESTS_MAX}
                </p>
              </div>

              {/* Disclaimer + submit */}
              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
                <p className="flex flex-1 items-start gap-3 rounded-[14px] border border-white/[0.10] bg-white/[0.02] p-4 text-sm text-rave-muted">
                  <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-rave-red" />
                  <span>
                    <strong className="font-semibold text-white">
                      This is a booking request, not a confirmed reservation.
                    </strong>{' '}
                    Our team will contact you to confirm availability and next steps.
                  </span>
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group/cta inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_26px_rgba(255,23,61,0.4)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black disabled:cursor-wait disabled:opacity-70 sm:text-base"
                >
                  <span>{submitting ? 'Sending…' : 'Send Booking Request'}</span>
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover/cta:translate-x-1"
                  />
                </button>
              </div>

              {!submissionConnected && (
                <p className="mt-3 text-sm text-rave-muted/80">
                  Booking requests are not connected to a system yet. Sending will tell you how to
                  reach the organiser directly.
                </p>
              )}

              {/* Result */}
              <div aria-live="polite" className="mt-4">
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`rounded-[14px] border p-4 text-sm ${
                        result.status === 'received'
                          ? 'border-rave-red/50 bg-rave-red/[0.07] text-white'
                          : 'border-white/[0.14] bg-white/[0.03] text-rave-muted'
                      }`}
                    >
                      {result.status === 'received' ? (
                        <>
                          <p className="font-heading text-base uppercase tracking-wide text-white">
                            Request received
                          </p>
                          <p className="mt-1.5">
                            {result.message ??
                              'Thanks. The team will review your VIP request and contact you with availability and next steps.'}
                          </p>
                        </>
                      ) : (
                        <p>{result.message ?? 'Something went wrong. Please try again shortly.'}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </fieldset>
          </form>

          {/* Summary */}
          <aside
            aria-labelledby="your-request-title"
            className="flex flex-col gap-5 lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-124px)] lg:overflow-y-auto"
          >
            <div className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2
                  id="your-request-title"
                  className="font-heading text-2xl font-black uppercase tracking-tight text-white sm:text-[28px]"
                >
                  Your Request
                </h2>
                <p className="text-right font-heading text-[9px] uppercase leading-tight tracking-[0.22em] text-rave-muted sm:text-[10px]">
                  Same People
                  <br />
                  Brighter Tomorrow
                </p>
              </div>
              <span
                aria-hidden
                className="mt-3 block h-[3px] w-16 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
                style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
              />

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

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
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

              <p className="mt-4 text-sm leading-relaxed text-rave-muted">
                Premium booth, dedicated space and bottle service for an elevated night at{' '}
                {data.event.title}.
              </p>

              <motion.dl
                key={`${boothId}-${bottleIds.length}-${groupSize}`}
                initial={reduced ? false : { opacity: 0.6, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22 }}
                className="mt-5 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-rave-muted">
                    <Star aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                    Experience
                  </dt>
                  <dd className="font-heading uppercase tracking-wide text-white">VIP Table</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-rave-muted">
                    <Users aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                    Group Size
                  </dt>
                  <dd className="font-heading tabular-nums text-white">{groupSize}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-rave-muted">
                    <MapPin aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                    Preferred Area
                  </dt>
                  <dd className="font-heading uppercase tracking-wide text-white">
                    {selectedBooth ? `Booth ${selectedBooth.label}` : 'Not selected'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-rave-muted">
                    <Wine aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                    Bottle Selection
                  </dt>
                  <dd className="font-heading tabular-nums text-white">
                    {bottleIds.length} of {data.package.maxBottleSelections}
                  </dd>
                </div>
              </motion.dl>

              <p className="mt-5 flex items-center gap-2 border-t border-white/[0.08] pt-5 font-heading text-sm uppercase tracking-wide text-rave-red">
                <Clock aria-hidden className="h-4 w-4 shrink-0" />
                Availability on request
              </p>
            </div>

            {/* What happens next */}
            {data.processSteps.length > 0 && (
              <div className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-heading text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                    What Happens Next
                  </h2>
                  <p className="text-right font-heading text-[9px] uppercase leading-tight tracking-[0.22em] text-rave-muted">
                    Three Steps
                    <br />
                    To Your Night
                  </p>
                </div>
                <span
                  aria-hidden
                  className="mt-3 block h-[3px] w-14 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
                  style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
                />

                <motion.ol
                  variants={vipStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="mt-5 flex flex-col gap-4"
                >
                  {data.processSteps.map((step, index) => (
                    <motion.li key={step.id} variants={vipReveal} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rave-red/40 bg-rave-red/10 font-heading text-sm font-bold text-rave-red"
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-heading text-sm font-bold uppercase tracking-wide text-white">
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-rave-muted">
                          {step.description}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </motion.ol>

                <Link
                  href="/contact"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-white/15 bg-white/[0.02] px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                >
                  <Mail aria-hidden className="h-3.5 w-3.5" />
                  Need help? Contact Us
                </Link>
              </div>
            )}
          </aside>
        </div>
      </Container>
    </section>
  );
}
