const PATHS = {
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  lab: 'M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7.5 14h9',
  gallery: 'M4 5h16v14H4z M4 15l4-4 4 4 3-3 5 5 M15 9.5a1.5 1.5 0 1 0 0-.01',
  analog: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 12l4-5 M12 3v2 M3 12h2 M19 12h2',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-2.1 1.2L14.7 21h-4l-.3-2.4a7 7 0 0 1-2.1-1.2l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-2.9L4.4 9.4l2-3.4 1.9.7a7 7 0 0 1 2.1-1.2L10.7 3h4l.3 2.4a7 7 0 0 1 2.1 1.2l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 2.9z',
  flip: 'M4 12a8 8 0 0 1 14-5.3L20 9 M20 4v5h-5 M20 12a8 8 0 0 1-14 5.3L4 15 M4 20v-5h5',
  flash: 'M13 2L5 14h6l-1 8 8-12h-6z',
  flashOff: 'M13 2L5 14h6l-1 8 8-12h-6z M3 3l18 18',
  timer: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 10v4l2 2 M9 2h6',
  grid: 'M4 4h16v16H4z M9.3 4v16 M14.7 4v16 M4 9.3h16 M4 14.7h16',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  close: 'M6 6l12 12 M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  share: 'M12 3v12 M7 8l5-5 5 5 M5 14v6h14v-6',
  download: 'M12 4v11 M7 10l5 5 5-5 M5 20h14',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  sliders: 'M4 6h10 M18 6h2 M16 4v4 M4 12h4 M12 12h8 M10 10v4 M4 18h12 M20 18h0 M18 16v4',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 11v6 M12 7.5v.01',
  plus: 'M12 5v14 M5 12h14',
  import: 'M4 16v4h16v-4 M12 4v12 M7 11l5 5 5-5',
  rewind: 'M11 19l-8-7 8-7z M21 19l-8-7 8-7z',
  sheet: 'M3 4h18v16H3z M3 9h18 M3 15h18 M9 4v16 M15 4v16',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  check: 'M5 12l5 5 9-10',
  chevron: 'M9 5l7 7-7 7',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={1.8}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
