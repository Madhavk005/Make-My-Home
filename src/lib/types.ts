export type PriceStatus = "fixed" | "on_request" | "not_supplied";

/**
 * Where a top-level category sits in the customer's build journey. Used for
 * homepage grouping and category discovery. Optional so existing content keeps
 * working; the UI falls back to display order when it is empty.
 */
export type CategoryStage =
  | "structure"
  | "finishing"
  | "services"
  | "other";

export type Availability =
  | "available"
  | "on_request"
  | "unavailable"
  | "not_confirmed";

export type SortKey =
  | "recommended"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc";

export type SanityImage = {
  _type?: "image";
  asset?: { _ref?: string; _type?: string };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
};

export type BrandRef = {
  name: string;
  slug: string;
  logo?: SanityImage | null;
};

export type CategoryRef = {
  _id?: string;
  name: string;
  slug: string;
};

export type Brand = {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: SanityImage | null;
  website?: string | null;
  order?: number | null;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: SanityImage | null;
  parentId?: string | null;
  order?: number | null;
  stage?: CategoryStage | null;
  specificationTemplate?: string[] | null;
};

export type CategoryNode = Category & {
  children: CategoryNode[];
  path: string[];
  depth: number;
  productCount: number;
};

export type Specification = {
  name: string;
  value: string;
  group?: string | null;
};

export type VariantAttribute = {
  name: string;
  value: string;
};

export type ProductVariant = {
  label: string;
  sku?: string | null;
  attributes: VariantAttribute[];
  price?: number | null;
  priceStatus?: PriceStatus | null;
  unit?: string | null;
  availability?: Availability | null;
  image?: SanityImage | null;
};

export type ProductCardData = {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  brand?: BrandRef | null;
  category?: CategoryRef | null;
  image?: SanityImage | null;
  price?: number | null;
  priceStatus: PriceStatus;
  unit: string;
  availability: Availability;
  shortDescription?: string | null;
  featured?: boolean | null;
  isDemo?: boolean | null;
  variantCount?: number | null;
  fromPrice?: number | null;
  specSummary?: Specification[] | null;
};

export type ProductDetail = ProductCardData & {
  images?: SanityImage[] | null;
  originalPrice?: number | null;
  description?: unknown[] | null;
  specifications?: Specification[] | null;
  variants?: ProductVariant[] | null;
  keywords?: string[] | null;
};

export type SiteSettings = {
  businessName?: string | null;
  tagline?: string | null;
  taglineEn?: string | null;
  logo?: SanityImage | null;
  whatsappNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  addressEn?: string | null;
  serviceArea?: string | null;
  serviceAreaEn?: string | null;
  openingHours?: string | null;
  openingHoursEn?: string | null;
  announcement?: string | null;
  announcementEn?: string | null;
  priceNote?: string | null;
  priceNoteEn?: string | null;
  footerNote?: string | null;
  footerNoteEn?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

export type EnquiryItem = {
  /** Stable key for the line item, including the chosen variant. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  brand?: string | null;
  sku?: string | null;
  variantLabel?: string | null;
  attributes?: VariantAttribute[];
  price?: number | null;
  priceStatus: PriceStatus;
  unit: string;
  availability: Availability;
  quantity: number;
  notes?: string | null;
  imageUrl?: string | null;
};

export type FacetOption = {
  value: string;
  label: string;
  count: number;
};

export type SpecFacet = {
  name: string;
  values: FacetOption[];
};

export type Facets = {
  brands: FacetOption[];
  availability: FacetOption[];
  specs: SpecFacet[];
};

/** Capped, serialisable payload for the header typeahead. */
export type SearchSuggestion = {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    category: string | null;
    price: number | null;
    priceStatus: PriceStatus;
    unit: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    href: string;
    count: number;
  }>;
  brands: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
};
