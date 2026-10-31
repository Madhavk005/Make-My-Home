import { defineField, defineType } from "sanity";

const API_VERSION = "2025-01-01";

async function uniqueSlug(
  slug: string | undefined,
  context: { document?: { _id?: string }; getClient: (options: { apiVersion: string }) => { fetch: <T>(query: string, params: Record<string, unknown>) => Promise<T> } },
  type: string,
) {
  if (!slug) return true;
  const client = context.getClient({ apiVersion: API_VERSION });
  const id = context.document?._id?.replace(/^drafts\./, "") ?? "";
  const count = await client.fetch<number>(
    `count(*[_type == $type && slug.current == $slug && !(_id in [$id, "drafts." + $id])])`,
    { type, slug, id },
  );
  return count === 0 || "This slug is already used by another item. Slugs must be unique.";
}

async function validParent(
  parent: { _ref?: string } | undefined,
  context: { document?: { _id?: string }; getClient: (options: { apiVersion: string }) => { fetch: <T>(query: string, params: Record<string, unknown>) => Promise<T> } },
) {
  const ref = parent?._ref;
  if (!ref) return true;

  const selfId = context.document?._id?.replace(/^drafts\./, "");
  if (selfId && ref === selfId) return "A category cannot be its own parent.";

  const client = context.getClient({ apiVersion: API_VERSION });
  const seen = new Set<string>();
  let current: string | undefined = ref;

  for (let depth = 0; depth < 30 && current; depth += 1) {
    if (selfId && current === selfId) {
      return "This parent would create a circular category hierarchy.";
    }
    if (seen.has(current)) {
      return "A circular hierarchy was found in the selected parent chain.";
    }
    seen.add(current);

    const parentDoc: { parent?: { _ref?: string } } | null = await client.fetch(
      `*[_id in [$id, "drafts." + $id]][0]{parent}`,
      { id: current },
    );
    current = parentDoc?.parent?._ref;
  }

  if (current) return "Category nesting is too deep. Keep the hierarchy to 30 levels or fewer.";
  return true;
}

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required().min(2).max(80),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Used in the category URL. Keep it short and stable.",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          if (!value?.current) return "A slug is required.";
          return uniqueSlug(value.current, context, "category");
        }),
    }),
    defineField({
      name: "parent",
      title: "Parent category",
      type: "reference",
      to: [{ type: "category" }],
      description: "Leave empty for a top-level section. Circular hierarchies are blocked.",
      validation: (Rule) => Rule.custom(validParent),
    }),
    defineField({
      name: "stage",
      title: "Build stage",
      type: "string",
      description:
        "Where this top-level category belongs on the homepage. Sub-categories inherit their top-level section automatically.",
      options: {
        list: [
          { title: "Foundation & structure", value: "structure" },
          { title: "Finishing", value: "finishing" },
          { title: "Electrical & plumbing", value: "services" },
          { title: "Other", value: "other" },
        ],
        layout: "radio",
      },
      initialValue: "other",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(400),
    }),
    defineField({
      name: "specificationTemplate",
      title: "Suggested specification names",
      type: "array",
      of: [{ type: "string", validation: (Rule) => Rule.max(80) }],
      description:
        "Optional. Names staff should use for products in this category, for example Size, Colour, Material, Length. The import warns when a product omits them; it never invents values.",
      validation: (Rule) => Rule.max(20),
      options: { layout: "tags" },
    }),
    defineField({
      name: "image",
      title: "Category image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          description: "Describe the image for screen readers and search engines.",
          validation: (Rule) => Rule.max(160),
        }),
      ],
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first. Use gaps such as 10, 20, 30 to make reordering easier.",
      initialValue: 100,
      validation: (Rule) => Rule.integer().min(0).max(9999),
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrder",
      by: [
        { field: "order", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
    {
      title: "Name",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "slug.current",
      stage: "stage",
      media: "image",
      parent: "parent.name",
    },
    prepare: ({ title, subtitle, stage, media, parent }) => {
      const stageLabel =
        stage === "structure"
          ? "Foundation & structure"
          : stage === "finishing"
            ? "Finishing"
            : stage === "services"
              ? "Electrical & plumbing"
              : "Other";
      return {
        title,
        subtitle: [parent ? `in ${parent}` : null, stageLabel, subtitle]
          .filter(Boolean)
          .join(" · "),
        media,
      };
    },
  },
});

export const brand = defineType({
  name: "brand",
  title: "Brand",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Brand name",
      type: "string",
      description: "Use the spelling confirmed by the business.",
      validation: (Rule) => Rule.required().min(1).max(80),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          if (!value?.current) return "A slug is required.";
          return uniqueSlug(value.current, context, "brand");
        }),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          validation: (Rule) => Rule.max(160),
        }),
      ],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(400),
    }),
    defineField({
      name: "website",
      title: "Website",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      initialValue: 100,
      validation: (Rule) => Rule.integer().min(0).max(9999),
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrder",
      by: [
        { field: "order", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
    {
      title: "Name",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "slug.current", media: "logo" },
  },
});

export const specification = defineType({
  name: "specification",
  title: "Specification",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "string",
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: "group",
      title: "Group",
      type: "string",
      description: "Optional grouping such as Dimensions, Finish or Electrical.",
      validation: (Rule) => Rule.max(60),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "value" },
  },
});

export const variantAttribute = defineType({
  name: "variantAttribute",
  title: "Variant attribute",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "For example: Colour, Size, Wattage.",
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "value" },
  },
});

export const productVariant = defineType({
  name: "productVariant",
  title: "Variant",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Variant label",
      type: "string",
      description: "What the customer selects, for example: 2.5 sq mm · Red.",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "sku",
      title: "Variant SKU",
      type: "string",
      description: "Preferred for variant-level identification and imports.",
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: "attributes",
      title: "Attributes",
      type: "array",
      of: [{ type: "variantAttribute" }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "price",
      title: "Price (₹)",
      type: "number",
      validation: (Rule) => Rule.min(0).precision(2),
    }),
    defineField({
      name: "priceStatus",
      title: "Price status",
      type: "string",
      description: "Leave blank to inherit the product-level price status.",
      options: {
        list: [
          { title: "Fixed price", value: "fixed" },
          { title: "Price on request", value: "on_request" },
          { title: "Price not supplied", value: "not_supplied" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "unit",
      title: "Selling unit",
      type: "string",
      description: "Leave blank to inherit the product unit. Examples: piece, metre, kg, bag, box, coil, roll.",
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: "availability",
      title: "Availability",
      type: "string",
      description: "Leave blank to inherit the product-level availability.",
      options: {
        list: [
          { title: "Available", value: "available" },
          { title: "On request", value: "on_request" },
          { title: "Unavailable", value: "unavailable" },
          { title: "Not confirmed", value: "not_confirmed" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "image",
      title: "Variant image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          validation: (Rule) => Rule.max(160),
        }),
      ],
    }),
  ],
  validation: (Rule) =>
    Rule.custom((value) => {
      if (!value || typeof value !== "object") return true;
      const variant = value as {
        label?: string;
        price?: number;
        priceStatus?: string;
        attributes?: unknown[];
      };
      if (!variant.label) return "Every variant needs a label.";
      if (!Array.isArray(variant.attributes) || variant.attributes.length === 0) {
        return "Every variant needs at least one attribute.";
      }
      if (
        variant.priceStatus === "fixed" &&
        (typeof variant.price !== "number" || variant.price <= 0)
      ) {
        return "A variant with a fixed price needs a price greater than zero.";
      }
      return true;
    }),
  preview: {
    select: { title: "label", subtitle: "sku" },
  },
});

export const blockContent = defineType({
  name: "blockContent",
  title: "Rich text",
  type: "array",
  of: [
    {
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              defineField({
                name: "href",
                title: "URL",
                type: "url",
                validation: (Rule) => Rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
              }),
            ],
          },
        ],
      },
    },
  ],
});

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  groups: [
    { name: "overview", title: "Overview", default: true },
    { name: "pricing", title: "Price & availability" },
    { name: "variants", title: "Variants" },
    { name: "specifications", title: "Specifications" },
    { name: "media", title: "Media" },
    { name: "search", title: "Search & visibility" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Product name",
      type: "string",
      group: "overview",
      options: { search: { weight: 10 } },
      validation: (Rule) => Rule.required().min(2).max(160),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "overview",
      options: { source: "name", maxLength: 120 },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          if (!value?.current) return "A slug is required.";
          return uniqueSlug(value.current, context, "product");
        }),
    }),
    defineField({
      name: "sku",
      title: "SKU / product code",
      type: "string",
      group: "overview",
      description: "Stable identifier (preferred). The import process uses this to detect duplicates.",
      options: { search: { weight: 10 } },
      validation: (Rule) =>
        Rule.required()
          .max(80)
          .custom(async (value, context) => {
            if (!value) return "A SKU is required.";
            const client = context.getClient({ apiVersion: API_VERSION });
            const id = context.document?._id?.replace(/^drafts\./, "") ?? "";
            const count = await client.fetch<number>(
              `count(*[_type == "product" && sku == $sku && !(_id in [$id, "drafts." + $id])])`,
              { sku: value, id },
            );
            return count === 0 || "This SKU is already used by another product.";
          }),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      group: "overview",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "brand",
      title: "Brand",
      type: "reference",
      to: [{ type: "brand" }],
      group: "overview",
      description: "Leave empty only when the product genuinely has no brand.",
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "text",
      rows: 2,
      group: "overview",
      description: "Shown on product cards and search results. Keep it factual.",
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: "description",
      title: "Long description",
      type: "blockContent",
      group: "overview",
    }),
    defineField({
      name: "unit",
      title: "Selling unit",
      type: "string",
      group: "pricing",
      description: "Required. Examples: piece, metre, kg, bag, box, coil, roll, square metre.",
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: "priceStatus",
      title: "Price status",
      type: "string",
      group: "pricing",
      options: {
        list: [
          { title: "Fixed price", value: "fixed" },
          { title: "Price on request", value: "on_request" },
          { title: "Price not supplied", value: "not_supplied" },
        ],
        layout: "radio",
      },
      initialValue: "not_supplied",
      validation: (Rule) =>
        Rule.required().custom((value, context) => {
          const doc = context.document as { price?: number } | undefined;
          if (value === "fixed" && (typeof doc?.price !== "number" || doc.price <= 0)) {
            return "A fixed price must be greater than zero.";
          }
          return true;
        }),
    }),
    defineField({
      name: "price",
      title: "Price (₹)",
      type: "number",
      group: "pricing",
      description: "Only enter a price confirmed by the business. Never infer a price.",
      validation: (Rule) => Rule.min(0).precision(2),
    }),
    defineField({
      name: "originalPrice",
      title: "Original / list price (₹)",
      type: "number",
      group: "pricing",
      description: "Only use when the business confirms a genuine list price. Do not invent discounts.",
      validation: (Rule) => Rule.min(0).precision(2),
    }),
    defineField({
      name: "availability",
      title: "Availability",
      type: "string",
      group: "pricing",
      options: {
        list: [
          { title: "Available", value: "available" },
          { title: "On request", value: "on_request" },
          { title: "Unavailable", value: "unavailable" },
          { title: "Not confirmed", value: "not_confirmed" },
        ],
        layout: "radio",
      },
      initialValue: "not_confirmed",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "variants",
      title: "Variants",
      type: "array",
      group: "variants",
      description:
        "Use variants when size, colour, wattage, material or another attribute changes the SKU, price, unit or availability.",
      of: [{ type: "productVariant" }],
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value || !Array.isArray(value)) return true;
          const seen = new Set<string>();
          for (const [index, item] of value.entries()) {
            const variant = item as { label?: string; sku?: string };
            if (!variant.label) return `Variant ${index + 1} needs a label.`;
            if (variant.sku) {
              const key = variant.sku.trim().toLowerCase();
              if (seen.has(key)) return `Variant SKU "${variant.sku}" is used more than once.`;
              seen.add(key);
            }
          }
          return true;
        }),
    }),
    defineField({
      name: "specifications",
      title: "Technical specifications",
      type: "array",
      group: "specifications",
      description: "Only add specifications supplied or confirmed by the business.",
      of: [{ type: "specification" }],
    }),
    defineField({
      name: "images",
      title: "Product images",
      type: "array",
      group: "media",
      description: "The first image is used on product cards.",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alternative text",
              type: "string",
              description: "Describe what is visible. Do not repeat the product name only.",
              validation: (Rule) => Rule.max(160),
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: "keywords",
      title: "Search aliases / keywords",
      type: "array",
      group: "search",
      description: "Add spellings, local names and alternate terms customers may search for.",
      of: [
        {
          type: "string",
          validation: (Rule) => Rule.max(60),
          options: { search: { weight: 5 } },
        },
      ],
      options: { layout: "tags" },
    }),
    defineField({
      name: "featured",
      title: "Feature on homepage",
      type: "boolean",
      group: "search",
      initialValue: false,
      description: "Only feature products with genuine, approved data.",
    }),
    defineField({
      name: "isDemo",
      title: "Sample / demo content",
      type: "boolean",
      group: "search",
      readOnly: true,
      initialValue: false,
      description: "Set by the optional demo seed script. Remove demo content before launch.",
    }),
  ],
  orderings: [
    {
      title: "Name",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
    {
      title: "Recently updated",
      name: "updatedDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
    },
    {
      title: "SKU",
      name: "skuAsc",
      by: [{ field: "sku", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "sku",
      media: "images.0",
      brand: "brand.name",
    },
    prepare: ({ title, subtitle, media, brand }) => ({
      title,
      subtitle: [brand, subtitle].filter(Boolean).join(" · "),
      media,
    }),
  },
});

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "business", title: "Business", default: true },
    { name: "contact", title: "Contact & WhatsApp" },
    { name: "storefront", title: "Storefront copy" },
  ],
  fields: [
    defineField({
      name: "businessName",
      title: "Business name",
      type: "string",
      group: "business",
      initialValue: "Make My Home",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      group: "business",
      validation: (Rule) => Rule.max(140),
    }),
    defineField({
      name: "taglineEn",
      title: "Tagline (English)",
      type: "string",
      group: "business",
      description: "Optional. Shown when a visitor switches the site to English.",
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "business",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          validation: (Rule) => Rule.max(160),
        }),
      ],
    }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp number",
      type: "string",
      group: "contact",
      description:
        "The real business number, including country code. Digits only is safest, e.g. 919876543210. A 10-digit local number will not work with WhatsApp links. Do not enter a placeholder.",
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true;
          const digits = value.replace(/\D/g, "").replace(/^00/, "");
          return digits.length >= 11 && digits.length <= 15
            ? true
            : "Enter a real WhatsApp number with country code (11–15 digits, e.g. 919876543210).";
        }),
    }),
    defineField({
      name: "phone",
      title: "Phone number",
      type: "string",
      group: "contact",
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      group: "contact",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "text",
      rows: 3,
      group: "contact",
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: "addressEn",
      title: "Address (English)",
      type: "text",
      rows: 3,
      group: "contact",
      description: "Optional. Shown when a visitor switches the site to English.",
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: "serviceArea",
      title: "Service area",
      type: "string",
      group: "contact",
      description: "For example: Jaipur and nearby areas. Only state areas the business serves.",
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "serviceAreaEn",
      title: "Service area (English)",
      type: "string",
      group: "contact",
      description: "Optional. Shown when a visitor switches the site to English.",
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "openingHours",
      title: "Opening hours",
      type: "string",
      group: "contact",
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "openingHoursEn",
      title: "Opening hours (English)",
      type: "string",
      group: "contact",
      description: "Optional. Shown when a visitor switches the site to English.",
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "announcement",
      title: "Announcement bar",
      type: "string",
      group: "storefront",
      description: "Optional. Leave empty to hide the announcement bar.",
      validation: (Rule) => Rule.max(180),
    }),
    defineField({
      name: "announcementEn",
      title: "Announcement bar (English)",
      type: "string",
      group: "storefront",
      description: "Optional. Shown when a visitor switches the site to English.",
      validation: (Rule) => Rule.max(180),
    }),
    defineField({
      name: "priceNote",
      title: "Price note",
      type: "string",
      group: "storefront",
      initialValue: "Prices are indicative and subject to confirmation.",
      validation: (Rule) => Rule.max(220),
    }),
    defineField({
      name: "priceNoteEn",
      title: "Price note (English)",
      type: "string",
      group: "storefront",
      description: "Optional. Shown when a visitor switches the site to English.",
      validation: (Rule) => Rule.max(220),
    }),
    defineField({
      name: "footerNote",
      title: "Footer note",
      type: "text",
      rows: 2,
      group: "storefront",
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: "footerNoteEn",
      title: "Footer note (English)",
      type: "text",
      rows: 2,
      group: "storefront",
      description: "Optional. Shown when a visitor switches the site to English.",
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: "instagram",
      title: "Instagram URL",
      type: "url",
      group: "storefront",
      validation: (Rule) => Rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "facebook",
      title: "Facebook URL",
      type: "url",
      group: "storefront",
      validation: (Rule) => Rule.uri({ scheme: ["https"] }),
    }),
  ],
  preview: {
    select: { title: "businessName", media: "logo" },
    prepare: ({ title, media }) => ({ title: title || "Site settings", media }),
  },
});

export const schemaTypes = [
  siteSettings,
  category,
  brand,
  product,
  specification,
  variantAttribute,
  productVariant,
  blockContent,
];
