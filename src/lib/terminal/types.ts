/** Shape of the JSON the terminal reads. Built at compile time by data.ts. */
export type TerminalEntry = { slug: string; title: string; href: string; summary: string; meta?: string };

export type TerminalSection = { name: string; title: string; href: string };

export type TerminalData = {
  host: string;
  site: { name: string; role: string; location: string; tagline: string; availability?: string; email: string };
  socials: { name: string; href: string }[];
  sections: TerminalSection[];
  /** Listable directories: `ls work`, `ls blog`, `ls photos`. */
  dirs: Record<string, TerminalEntry[]>;
  games: { name: string; href: string; summary: string }[];
};
