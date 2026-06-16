// Tipos compartilhados pela camada visual do portal.
export interface PortalPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  heroAlt: string | null;
  publishedAt: Date | null;
  authorName: string | null;
  readingMinutes: number | null;
  featured?: boolean;
  category: {
    id: string;
    slug: string;
    name: string;
    color: string | null;
  } | null;
}

export interface PortalSite {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  tagline: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}
