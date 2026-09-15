import type { BookingRequestInput, VipPackage } from './types';

// Client-side validation for the booking request.
//
// This is a courtesy to the person filling the form, not a security boundary —
// whatever backend eventually receives the request stays authoritative.

export type BookingFieldErrors = Partial<
  Record<'fullName' | 'email' | 'phone' | 'groupSize' | 'preferredBoothId' | 'bottleIds' | 'specialRequests', string>
>;

export const SPECIAL_REQUESTS_MAX = 500;

/**
 * Deliberately permissive: one @, something either side, a dot in the domain.
 * Tighter patterns reject addresses that are perfectly valid.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Digits, spaces and the usual punctuation, 6–20 digits. Kept loose on purpose
 * so international numbers are not rejected.
 */
function isPlausiblePhone(value: string): boolean {
  if (!/^[+0-9()\-.\s]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 20;
}

export function validateBookingRequest(
  input: Partial<BookingRequestInput>,
  pkg: VipPackage,
): { ok: boolean; errors: BookingFieldErrors } {
  const errors: BookingFieldErrors = {};

  const fullName = (input.fullName ?? '').trim();
  if (fullName.length === 0) {
    errors.fullName = 'Please enter your full name.';
  } else if (fullName.length < 2) {
    errors.fullName = 'Please enter your full name.';
  }

  const email = (input.email ?? '').trim();
  if (email.length === 0) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const phone = (input.phone ?? '').trim();
  if (phone.length === 0) {
    errors.phone = 'Please enter a phone number.';
  } else if (!isPlausiblePhone(phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  const groupSize = input.groupSize ?? 0;
  if (!Number.isInteger(groupSize) || groupSize < 1) {
    errors.groupSize = 'Please enter how many people are in your group.';
  }

  if (!input.preferredBoothId) {
    errors.preferredBoothId = 'Please choose a preferred booth.';
  }

  const bottleIds = input.bottleIds ?? [];
  if (bottleIds.length < pkg.minBottleSelections) {
    errors.bottleIds =
      pkg.minBottleSelections === 1
        ? 'Please choose at least one bottle.'
        : `Please choose at least ${pkg.minBottleSelections} bottles.`;
  } else if (bottleIds.length > pkg.maxBottleSelections) {
    errors.bottleIds = `You can choose up to ${pkg.maxBottleSelections} bottles.`;
  }

  const specialRequests = input.specialRequests ?? '';
  if (specialRequests.length > SPECIAL_REQUESTS_MAX) {
    errors.specialRequests = `Please keep this under ${SPECIAL_REQUESTS_MAX} characters.`;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * A group larger than the package is a warning, not an error — the team can
 * still review it, so submission is never blocked on this alone.
 */
export function groupSizeWarning(groupSize: number, pkg: VipPackage): string | null {
  if (groupSize > pkg.capacity) {
    return `This package is designed for up to ${pkg.capacity} people. Add a note and the team will review your request.`;
  }
  return null;
}
