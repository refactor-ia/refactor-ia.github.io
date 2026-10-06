/**
 * Single source of truth for every public link of RefactorIA and its founder.
 * Pages, the footer, the JSON-LD graph and the /links hub all read from here.
 */

export type LinkGroup = "community" | "music" | "founder";

export type LinkIcon =
  | "youtube"
  | "discord"
  | "github"
  | "web"
  | "spotify"
  | "apple-music"
  | "youtube-music"
  | "blog"
  | "x"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "facebook";

export interface SiteLink {
  id: string;
  group: LinkGroup;
  /** Row title. */
  title: string;
  /** Short Spanish label shown under the title. */
  label: string;
  /** Short display form of the URL. */
  display: string;
  href: string;
  icon: LinkIcon;
  /** Include in the Organization `sameAs` list of the JSON-LD graph. */
  sameAs?: boolean;
}

export const LINK_GROUPS: { id: LinkGroup; title: string; blurb: string }[] = [
  {
    id: "community",
    title: "Comunidad y contenido",
    blurb: "Dónde pasa todo: videos, streams, código y charla.",
  },
  {
    id: "music",
    title: "RefactorIA Music",
    blurb: "Música original, hecha con IA y dicho sin vueltas.",
  },
  {
    id: "founder",
    title: "Juan Barbat",
    blurb: "El fundador, en sus redes personales.",
  },
];

export const LINKS: SiteLink[] = [
  {
    id: "youtube-devs",
    group: "community",
    title: "YouTube RefactorIA Devs",
    label: "Tutoriales y contenido curado",
    display: "youtube.com/@RefactorIADevs",
    href: "https://www.youtube.com/@RefactorIADevs",
    icon: "youtube",
    sameAs: true,
  },
  {
    id: "youtube-labs",
    group: "community",
    title: "YouTube RefactorIA Labs",
    label: "Streams y experimentos en vivo",
    display: "youtube.com/@RefactorIA",
    href: "https://www.youtube.com/@RefactorIA",
    icon: "youtube",
    sameAs: true,
  },
  {
    id: "discord",
    group: "community",
    title: "Discord",
    label: "La comunidad, en español",
    display: "discord.gg/PT5EHv6nMM",
    href: "https://discord.gg/PT5EHv6nMM",
    icon: "discord",
    sameAs: true,
  },
  {
    id: "github-org",
    group: "community",
    title: "GitHub",
    label: "Organización y proyectos open source",
    display: "github.com/refactor-ia",
    href: "https://github.com/refactor-ia",
    icon: "github",
    sameAs: true,
  },
  {
    id: "web",
    group: "community",
    title: "Web",
    label: "El sitio oficial",
    display: "refactoria.dev",
    href: "https://refactoria.dev",
    icon: "web",
  },
  {
    id: "spotify",
    group: "music",
    title: "Spotify",
    label: "Artista RefactorIA",
    display: "open.spotify.com",
    href: "https://open.spotify.com/artist/22Udt5YIZaGRDuGVfSN03w",
    icon: "spotify",
    sameAs: true,
  },
  {
    id: "apple-music",
    group: "music",
    title: "Apple Music",
    label: "Artista RefactorIA",
    display: "music.apple.com",
    href: "https://music.apple.com/us/artist/refactoria/6811690240",
    icon: "apple-music",
    sameAs: true,
  },
  {
    id: "youtube-music",
    group: "music",
    title: "YouTube Music",
    label: "Canal de RefactorIA",
    display: "music.youtube.com",
    href: "https://music.youtube.com/channel/UCqDys5rhEVdb2_Of2ZeHMEw",
    icon: "youtube-music",
    sameAs: true,
  },
  {
    id: "blog",
    group: "founder",
    title: "Blog",
    label: "Artículos de Juan",
    display: "barbat.dev",
    href: "https://barbat.dev",
    icon: "blog",
  },
  {
    id: "github-personal",
    group: "founder",
    title: "GitHub personal",
    label: "Código y proyectos propios",
    display: "github.com/barbatdev",
    href: "https://github.com/barbatdev",
    icon: "github",
    sameAs: true,
  },
  {
    id: "x",
    group: "founder",
    title: "X",
    label: "@juan_barbat",
    display: "x.com/juan_barbat",
    href: "https://x.com/juan_barbat",
    icon: "x",
  },
  {
    id: "linkedin",
    group: "founder",
    title: "LinkedIn",
    label: "Perfil profesional",
    display: "linkedin.com/in/juan-barbat",
    href: "https://www.linkedin.com/in/juan-barbat",
    icon: "linkedin",
  },
  {
    id: "instagram",
    group: "founder",
    title: "Instagram",
    label: "@juan.barbat",
    display: "instagram.com/juan.barbat",
    href: "https://www.instagram.com/juan.barbat",
    icon: "instagram",
  },
  {
    id: "tiktok",
    group: "founder",
    title: "TikTok",
    label: "@juan_barbat",
    display: "tiktok.com/@juan_barbat",
    href: "https://www.tiktok.com/@juan_barbat",
    icon: "tiktok",
  },
  {
    id: "facebook",
    group: "founder",
    title: "Facebook",
    label: "Juan Barbat Dev",
    display: "facebook.com/juanbarbat.dev",
    href: "https://www.facebook.com/juanbarbat.dev",
    icon: "facebook",
  },
];

/** Look up a link by id; throws so a typo fails the build, not production. */
export function link(id: string): SiteLink {
  const found = LINKS.find((l) => l.id === id);
  if (!found) throw new Error(`Unknown link id: ${id}`);
  return found;
}

export const href = (id: string): string => link(id).href;

/** Organization `sameAs` URLs for the JSON-LD graph. */
export const SAME_AS: string[] = LINKS.filter((l) => l.sameAs).map(
  (l) => l.href,
);

/** Inline SVG bodies (24x24, stroke based), keyed by icon. */
export const ICON_PATHS: Record<LinkIcon, string> = {
  youtube:
    '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
  discord:
    '<path d="M5 6.5A12 12 0 0 1 9 5l.6 1.2a10 10 0 0 1 4.8 0L15 5a12 12 0 0 1 4 1.5c2 3 2.7 6 2.4 9a12 12 0 0 1-4.4 2.2l-1-1.7M7 18.7a12 12 0 0 1-4.4-2.2c-.3-3 .4-6 2.4-9"/><circle cx="9.2" cy="12.2" r="1.1"/><circle cx="14.8" cy="12.2" r="1.1"/>',
  github:
    '<circle cx="6" cy="5.5" r="2"/><circle cx="6" cy="18.5" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7.5v9M18 11c0 4-6 2-11.4 6"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
  spotify:
    '<circle cx="12" cy="12" r="9"/><path d="M7 9.5c3.5-1 7-.7 10 1M7.8 12.7c2.8-.7 5.6-.5 8.2 1M8.6 15.7c2.2-.5 4.3-.3 6.4.7"/>',
  "apple-music":
    '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  "youtube-music":
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m11 10.5 2.5 1.5-2.5 1.5z"/>',
  blog: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14.5 7.5 3 3"/>',
  x: '<path d="m4 4 16 16M20 4 4 20"/>',
  linkedin:
    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.5v.01M12 17v-6.5m0 2.5c0-1.7 1.2-2.5 2.5-2.5S17 11.3 17 13v4"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.3 6.7v.01"/>',
  tiktok:
    '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.3 2.4 1.9 4 4.5 4.2"/>',
  facebook:
    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M15.5 8H14a2 2 0 0 0-2 2v11M9.5 13h5"/>',
};
