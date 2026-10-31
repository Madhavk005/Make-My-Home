# Sample CSV files

These files are **format examples only**. They contain placeholder brands, products and
prices, and every row is marked `isDemo=true` so the storefront labels it as demo content.

They are never imported automatically. Do not import them into a live catalogue unless you
intend to publish clearly marked demo rows for testing.

## What the samples assume

The import tool does **not** create categories or brands. Before a real import:

1. Create the categories in Sanity Studio, matching the paths used in the `category` column.
   The samples use paths such as `Cement > OPC` and `Tiles > Floor Tiles`.
2. Create the brands used in the `brand` column, or leave the column blank.
3. Replace every row with real, business-confirmed data.

## Try a dry run

```bash
npm run import:products -- \
  --file samples/products.csv \
  --variants samples/variants.csv
```

This validates every row and writes `import-report.json` without writing to Sanity.

## Columns

See the "CSV import" section of the root `README.md` for the full column reference.
