import test from "node:test";
import assert from "node:assert/strict";
import {
  categoryDeleteBlockers,
  descendantCategoryIds,
  searchCategoryRecords,
  slugify,
  validateCategoryDraft,
  validateProductCategory,
  type CategoryRecordLike,
} from "../src/lib/category-validation";

const categories: CategoryRecordLike[] = [
  { _id: "construction", name: "Construction", slug: "construction", parentId: null, level: "primary" },
  { _id: "cement", name: "Cement", slug: "cement", parentId: "construction", level: "secondary" },
  { _id: "opc", name: "OPC Cement", slug: "opc-cement", parentId: "cement", level: "tertiary" },
  { _id: "plumbing", name: "Plumbing", slug: "plumbing", parentId: null, level: "primary" },
];

test("slugify creates stable URL slugs", () => {
  assert.equal(slugify("Hiring / Equipment Rental"), "hiring-equipment-rental");
  assert.equal(slugify("  Cement  "), "cement");
});

test("valid tertiary category under a secondary parent", () => {
  const result = validateCategoryDraft(
    { name: "PPC Cement", slug: "ppc-cement", level: "tertiary", parentId: "cement" },
    categories,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.level, "tertiary");
    assert.equal(result.value.parentId, "cement");
  }
});

test("secondary cannot sit under a secondary", () => {
  const result = validateCategoryDraft(
    { name: "Bad", slug: "bad", level: "secondary", parentId: "cement" },
    categories,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.fieldErrors.parentId ?? "", /primary/i);
});

test("a fourth level is rejected", () => {
  const result = validateCategoryDraft(
    { name: "Too deep", slug: "too-deep", level: "tertiary", parentId: "opc" },
    categories,
  );
  assert.equal(result.ok, false);
});

test("circular parent chains are rejected", () => {
  const result = validateCategoryDraft(
    { id: "cement", name: "Cement", slug: "cement", level: "secondary", parentId: "opc" },
    categories,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.fieldErrors.parentId ?? "", /circular/i);
});

test("slugs are globally unique", () => {
  const result = validateCategoryDraft(
    { name: "Duplicate", slug: "cement", level: "primary", parentId: null },
    categories,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.fieldErrors.slug ?? "", /already used/i);
});

test("products must reference an active tertiary category", () => {
  assert.equal(validateProductCategory(categories, "opc").ok, true);

  const secondary = validateProductCategory(categories, "cement");
  assert.equal(secondary.ok, false);
  assert.equal(secondary.reason, "not-tertiary");

  const inactive = validateProductCategory(
    [...categories, { _id: "paint", name: "Paint", slug: "paint", parentId: "construction", level: "secondary", isActive: false }],
    "paint",
  );
  assert.equal(inactive.ok, false);
  assert.equal(inactive.reason, "not-tertiary");
});

test("inactive tertiary categories are blocked for new products", () => {
  const withInactive = categories.map((category) =>
    category._id === "opc" ? { ...category, isActive: false } : category,
  );
  const result = validateProductCategory(withInactive, "opc");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "inactive");
});

test("delete blockers list children and products", () => {
  const result = categoryDeleteBlockers("cement", categories, [{ _id: "p1", categoryId: "opc" }]);
  assert.equal(result.canDelete, false);
  assert.deepEqual(result.childIds, ["opc"]);

  const productOnly = categoryDeleteBlockers("opc", categories, [{ _id: "p1", categoryId: "opc" }]);
  assert.equal(productOnly.canDelete, false);
  assert.deepEqual(productOnly.productIds, ["p1"]);

  assert.equal(categoryDeleteBlockers("plumbing", categories, []).canDelete, true);
});

test("descendants and category search include ancestors", () => {
  assert.deepEqual(descendantCategoryIds(categories, "construction"), [
    "construction",
    "cement",
    "opc",
  ]);
  const matches = searchCategoryRecords(categories, "construction");
  assert.deepEqual(
    matches.map((category) => category._id),
    ["construction", "cement", "opc"],
  );
});
