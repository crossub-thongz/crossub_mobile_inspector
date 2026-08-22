import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  dayKey,
  formatDate,
  formatDateMedium,
  formatDateTime,
  formatDateTimeMedium,
  formatTime,
  formatTimeShort,
} from '@/lib/format-datetime';

export {
  dayKey,
  formatDate,
  formatDateMedium,
  formatDateTime,
  formatDateTimeMedium,
  formatTime,
  formatTimeShort,
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Scroll the inspector workspace back to the top after changing areas. */
export function scrollInspectionWorkspaceToTop() {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function displayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email;
}

/**
 * Avatar letters: first initial of given name + first initial of family name.
 * "Daniel ZHOU" → "DZ". Falls back to splitting a full name, then the email.
 */
export function personInitials(person: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
}): string {
  const first = person.firstName?.trim() ?? '';
  const last = person.lastName?.trim() ?? '';
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  const tokens = (person.fullName?.trim() || `${first} ${last}`.trim())
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length >= 2) {
    const given = tokens[0] ?? '';
    const family = tokens[tokens.length - 1] ?? '';
    return `${given.charAt(0)}${family.charAt(0)}`.toUpperCase();
  }
  if (tokens.length === 1 && tokens[0] && tokens[0].length >= 2) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  const local = person.email?.split('@')[0]?.replace(/[^a-zA-Z]/g, '') ?? '';
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local.toUpperCase();
  return '?';
}

/** dd/mm/yyyy — form / calendar input layouts only (not general UI display). */
export function formatDateSlash(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Google Calendar “create event” deep link for a scheduled inspection. */
export function buildGoogleCalendarUrl(
  title: string,
  startIso: string,
  durationHours: number,
  location: string,
): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-AU')}`;
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Job-card schedule line. Example: "Today, 1:30 PM". */
export function formatScheduleWhen(iso: string): string {
  const time = formatTime(iso).replace(/\b(am|pm)\b/gi, (part) => part.toUpperCase());
  if (isToday(iso)) return `Today, ${time}`;
  return `${formatDate(iso)}, ${time}`;
}

export function isThisWeek(iso: string): boolean {
  const d = new Date(iso).getTime();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return d >= weekAgo;
}

/**
 * Read a File as base64, stripped of the `data:<mime>;base64,` prefix — the inline shape
 * the inspector photo-upload endpoint (`POST .../photos/upload`) expects in `contentBase64`.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
