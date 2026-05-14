import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(ts: any): string {
  if (!ts) return 'Just now';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function timeAgo(ts: any): string {
  if (!ts) return 'Just now';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min ago";
  return Math.floor(seconds) + " sec ago";
}

export const AGENCY_COLORS: Record<string, string> = {
  Fire: '#E63946',
  Crime: '#F4A261',
  Accident: '#E9C46A',
  Flood: '#2A9D8F',
  Medical: '#4895EF',
  Explosion: '#D00000',
  Other: '#6C757D'
};

export const SEVERITY_COLORS: Record<string, string> = {
  Low: '#2A9D8F',
  Medium: '#E9C46A',
  High: '#F4A261',
  Critical: '#E63946'
};
