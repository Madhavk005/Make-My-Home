import "server-only";
import { fuzzyIncludes } from "./search";
import { cache } from "react";
import {
  assembleFacets,
  brandBySlugQuery,
  brandsQuery,
  brandsWithCountsQuery,
  buildAvailabilityFacetQuery,
  buildBrandFacetQuery,
  buildProductsQuery,
  buildSpecFacetQuery,
  categoriesQuery,
  featuredProductsQuery,
  homeBrandsQuery,
  productBySlugQuery,
  productCategoryRefsQuery,
  relatedProductsQuery,
  siteSettingsQuery,
  type CatalogQueryInput,
  type FacetProductRow,
  type ProductListResult,
} from "./queries";
import {
  attachProductCounts,
  buildCategoryTree,
  categoryBreadcrumb,
  countProductsByCategory,
  descendantIds,
  findCategoryByPath,
  findCategoryBySlug,
  flattenCategoryTree,
} from "./categories";
import { sanityFetch, isDemoDataEnabled } from "./sanity";
import {
  demoAllBrands,
  demoAllCategories,
  demoBrandBySlug,
  demoFacets,
  demoProductBySlug,
  demoProductList,
  demoProducts,
  demoProductsByCategory,
  demoSiteSettings,
} from "./demo-data";
import type {
  Availability,
  Brand,
  Category,
  CategoryNode,
  Facets,
  ProductDetail,
  SearchSuggestion,
  SiteSettings,
} from "./types";

const TAGS = {
  settings: "site-settings",
  categories: "categories",
  products: "products",
  brands: "brands",
};

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  if (isDemoDataEnabled) return demoSiteSettings;
  return sanityFetch<SiteSettings | null>({
    query: siteSettingsQuery,
    tags: [TAGS.settings],
    revalidate: 300,
  });
});

export const getAllCategories = cache(async (): Promise<Category[]> => {
  if (isDemoDataEnabled) return demoAllCategories();
  const categories = await sanityFetch<Category[]>({
    query: categoriesQuery,
    tags: [TAGS.categories],
    revalidate: 120,
  });
  return categories ?? [];
});

export const getAllBrands = cache(async (): Promise<Brand[]> => {
  if (isDemoDataEnabled) return demoAllBrands();
  const brands = await sanityFetch<Brand[]>({
    query: brandsQuery,
    tags: [TAGS.brands],
    revalidate: 300,
  });
  return brands ?? [];
});

export const getCatalogue = cache(async () => {
  if (isDemoDataEnabled) {
    const categories = demoAllCategories();
    const tree = buildCategoryTree(categories);
    const visibleCategories = flattenCategoryTree(tree);
    const counts = countProductsByCategory(
      visibleCategories,
      demoProducts.map((p) => ({ categoryId: p.category?._id ?? null })),
    );
    attachProductCounts(tree, counts);
    return {
      categories: visibleCategories,
      tree,
      counts,
      totalProducts: demoProducts.length,
    };
  }

  const [categories, productRefs] = await Promise.all([
    getAllCategories(),
    sanityFetch<Array<{ _id?: string; categoryId?: string | null }>>({
      query: productCategoryRefsQuery,
      tags: [TAGS.products],
      revalidate: 60,
    }),
  ]);

  const tree = buildCategoryTree(categories);
  // Public pages never see inactive branches. Keep the same filtered list for
  // counts, search and descendant lookups so dead categories cannot leak in.
  const visibleCategories = flattenCategoryTree(tree);
  const counts = countProductsByCategory(visibleCategories, productRefs ?? []);
  attachProductCounts(tree, counts);

  return {
    categories: visibleCategories,
    tree,
    counts,
    totalProducts: (productRefs ?? []).length,
  };
});

export const getTopLevelCategories = cache(async (): Promise<CategoryNode[]> => {
  if (isDemoDataEnabled) {
    const tree = buildCategoryTree(demoAllCategories());
    return tree.filter((node) => !node.parentId);
  }
  const { tree } = await getCatalogue();
  return tree;
});

export async function getCategoryPageData(slugPath: string[]) {
  if (isDemoDataEnabled) {
    const categories = demoAllCategories();
    const tree = buildCategoryTree(categories);
    const visibleCategories = flattenCategoryTree(tree);
    const counts = countProductsByCategory(
      visibleCategories,
      demoProducts.map((p) => ({ categoryId: p.category?._id ?? null })),
    );
    attachProductCounts(tree, counts);
    const category = findCategoryByPath(tree, slugPath);
    if (!category) return null;

    const ids = descendantIds(visibleCategories, category._id);
    const children: CategoryNode[] = category.children;
    const breadcrumb = categoryBreadcrumb(visibleCategories, category._id);

    return {
      category,
      categoryIds: ids,
      categories: visibleCategories,
      children,
      breadcrumb,
      totalProducts: category.productCount,
    };
  }

  const { categories, tree } = await getCatalogue();
  const category = findCategoryByPath(tree, slugPath);
  if (!category) return null;

  const ids = descendantIds(categories, category._id);
  const children: CategoryNode[] = category.children;
  const breadcrumb = categoryBreadcrumb(categories, category._id);

  return {
    category,
    categoryIds: ids,
    categories,
    children,
    breadcrumb,
    totalProducts: category.productCount,
  };
}

/**
 * Resolves an old category URL whose ancestors changed (for example when
 * `Cement` moved under `Construction`). Slugs are globally unique, so the last
 * segment is enough to find the category's new canonical path.
 */
export async function resolveCategoryLegacyPath(
  slugPath: string[],
): Promise<CategoryNode | null> {
  const slug = slugPath.filter(Boolean).at(-1);
  if (!slug) return null;

  if (isDemoDataEnabled) {
    const categories = demoAllCategories();
    const tree = buildCategoryTree(categories);
    const record = findCategoryBySlug(flattenCategoryTree(tree), slug);
    return record ?? null;
  }

  const { categories, tree } = await getCatalogue();
  const record = findCategoryBySlug(categories, slug);
  if (!record) return null;
  return flattenCategoryTree(tree).find((node) => node._id === record._id) ?? null;
}

export async function getProductList(input: CatalogQueryInput): Promise<ProductListResult> {
  if (isDemoDataEnabled) {
    return demoProductList(input);
  }

  const { query, params } = buildProductsQuery(input);
  const result = await sanityFetch<ProductListResult>({
    query,
    params,
    tags: [TAGS.products],
    revalidate: 30,
  });

  return result ?? { items: [], total: 0 };
}

export async function getFacets(
  input: CatalogQueryInput,
  options: { includeSpecs?: boolean } = {},
): Promise<Facets> {
  if (isDemoDataEnabled) {
    return demoFacets(input);
  }

  const includeSpecs = options.includeSpecs ?? true;
  const brandQuery = buildBrandFacetQuery(input);
  const availabilityQuery = buildAvailabilityFacetQuery(input);

  const [brands, availability, specRows] = await Promise.all([
    sanityFetch<Array<{ name?: string; slug?: string; count?: number }>>({
      query: brandQuery.query,
      params: brandQuery.params,
      tags: [TAGS.products, TAGS.brands],
      revalidate: 30,
    }),
    sanityFetch<Partial<Record<Availability, number>>>({
      query: availabilityQuery.query,
      params: availabilityQuery.params,
      tags: [TAGS.products],
      revalidate: 30,
    }),
    includeSpecs
      ? (() => {
          const specQuery = buildSpecFacetQuery(input);
          return sanityFetch<FacetProductRow[]>({
            query: specQuery.query,
            params: specQuery.params,
            tags: [TAGS.products],
            revalidate: 30,
          });
        })()
      : Promise.resolve(null),
  ]);

  return assembleFacets(brands ?? [], availability ?? null, specRows ?? null);
}

export async function getFeaturedProducts() {
  if (isDemoDataEnabled) {
    return demoProducts.filter((p) => p.featured ?? false);
  }
  const products = await sanityFetch<NonNullable<ProductListResult["items"]>>({
    query: featuredProductsQuery,
    tags: [TAGS.products],
    revalidate: 60,
  });
  return products ?? [];
}

export async function getHomeBrands() {
  if (isDemoDataEnabled) {
    return demoAllBrands()
      .map((brand) => ({
        ...brand,
        count: demoProducts.filter((product) => product.brand?.slug === brand.slug).length,
      }))
      .filter((brand) => (brand.count ?? 0) > 0);
  }
  const brands = await sanityFetch<Array<Brand & { count?: number }>>({
    query: homeBrandsQuery,
    tags: [TAGS.brands, TAGS.products],
    revalidate: 120,
  });
  return brands ?? [];
}

export async function getBrandsWithCounts() {
  if (isDemoDataEnabled) {
    return demoAllBrands().map((brand) => ({
      ...brand,
      count: demoProducts.filter((product) => product.brand?.slug === brand.slug).length,
    }));
  }
  const brands = await sanityFetch<Array<Brand & { count?: number }>>({
    query: brandsWithCountsQuery,
    tags: [TAGS.brands, TAGS.products],
    revalidate: 300,
  });
  return brands ?? [];
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (isDemoDataEnabled) {
    return demoProductBySlug(slug);
  }
  return sanityFetch<ProductDetail | null>({
    query: productBySlugQuery,
    params: { slug },
    tags: [TAGS.products],
    revalidate: 60,
  });
}

export async function getRelatedProducts(
  categoryId: string,
  slug: string,
  categoryIds?: string[],
) {
  const ids = categoryIds?.length ? categoryIds : [categoryId];

  if (isDemoDataEnabled) {
    const products = demoProductsByCategory(ids, slug);
    return products
      .sort((a, b) => {
        const sameCategoryA = a.category?._id === categoryId ? 0 : 1;
        const sameCategoryB = b.category?._id === categoryId ? 0 : 1;
        return (
          sameCategoryA - sameCategoryB ||
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          a.name.localeCompare(b.name)
        );
      })
      .slice(0, 4);
  }

  const products = await sanityFetch<NonNullable<ProductListResult["items"]>>({
    query: relatedProductsQuery,
    params: { categoryId, categoryIds: ids, slug },
    tags: [TAGS.products],
    revalidate: 60,
  });
  return products ?? [];
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  if (isDemoDataEnabled) {
    return demoBrandBySlug(slug);
  }
  return sanityFetch<Brand | null>({
    query: brandBySlugQuery,
    params: { slug },
    tags: [TAGS.brands],
    revalidate: 300,
  });
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion> {
  const needle = query.trim();
  if (needle.length < 1) {
    return { products: [], categories: [], brands: [] };
  }

  const [catalogue, brands, products] = await Promise.all([
    getCatalogue(),
    getBrandsWithCounts(),
    getProductList({
      q: needle,
      sort: "recommended",
      page: 1,
      pageSize: 5,
    }),
  ]);

  const lower = needle.toLowerCase();
  const categories = flattenCategoryTree(catalogue.tree)
    .filter(
      (category) =>
        fuzzyIncludes(category.name, needle) ||
        fuzzyIncludes(category.slug, needle),
    )
    .sort((a, b) => {
      const aExact = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
      const bExact = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
      return aExact - bExact || b.productCount - a.productCount;
    })
    .slice(0, 4)
    .map((category) => ({
      id: category._id,
      name: category.name,
      href: `/category/${category.path.map(encodeURIComponent).join("/")}`,
      count: category.productCount,
    }));

  const brandMatches = brands
    .filter((brand) => fuzzyIncludes(brand.name, needle))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 3)
    .map((brand) => ({
      id: brand._id,
      name: brand.name,
      slug: brand.slug,
      count: brand.count ?? 0,
    }));

  const productMatches = products.items.map((product) => ({
    id: product._id,
    name: product.name,
    slug: product.slug,
    brand: product.brand?.name ?? null,
    category: product.category?.name ?? null,
    price: product.price ?? null,
    priceStatus: product.priceStatus,
    unit: product.unit,
  }));

  return {
    products: productMatches,
    categories,
    brands: brandMatches,
  };
}

export function tagsForRevalidation() {
  return TAGS;
}
