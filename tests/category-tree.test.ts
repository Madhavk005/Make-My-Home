import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCategoryTree,
  categoryBreadcrumb,
  categoryPathFor,
  countProductsByCategory,
  attachProductCounts,
  findCategoryByPath,
  findCategoryBySlug,
  flattenCategoryTree,
} from "../src/lib/categories";
import type { Category } from "../src/lib/types";

const categories: Category[] = [
  { _id: "construction", name: "Construction", slug: "construction", parentId: null, order: 10 },
  { _id: "cement", name: "Cement", slug: "cement", parentId: "construction", order: 10 },
  { _id: "opc", name: "OPC Cement", slug: "opc-cement", parentId: "cement", order: 10 },
  { _id: "ppc", name: "PPC Cement", slug: "ppc-cement", parentId: "cement", order: 20 },
  { _id: "plumbing", name: "Plumbing", slug: "plumbing", parentId: null, order: 20 },
  { _id: "pipes", name: "Pipes", slug: "pipes", parentId: "plumbing", order: 10 },
  {
    _id: "hidden",
    name: "Hidden paint",
    slug: "hidden-paint",
    parentId: null,
    order: 30,
    isActive: false,
  },
  {
    _id: "hidden-child",
    name: "Hidden child",
    slug: "hidden-child",
    parentId: "hidden",
    order: 10,
  },
];

test("tree derives levels from the parent chain", () => {
  const tree = buildCategoryTree(categories);
  const opc = flattenCategoryTree(tree).find((node) => node._id === "opc");
  assert.ok(opc);
  assert.equal(opc.level, "tertiary");
  assert.equal(opc.depth, 2);
  assert.deepEqual(opc.path, ["construction", "cement", "opc-cement"]);
});

test("inactive branches are pruned by default and included for admins", () => {
  const publicTree = buildCategoryTree(categories);
  assert.equal(flattenCategoryTree(publicTree).some((node) => node._id === "hidden"), false);
  assert.equal(flattenCategoryTree(publicTree).some((node) => node._id === "hidden-child"), false);

  const adminTree = buildCategoryTree(categories, { includeInactive: true });
  assert.equal(flattenCategoryTree(adminTree).some((node) => node._id === "hidden"), true);
  assert.equal(flattenCategoryTree(adminTree).some((node) => node._id === "hidden-child"), true);
});

test("path and slug lookup use canonical paths", () => {
  const tree = buildCategoryTree(categories);
  assert.equal(findCategoryByPath(tree, ["construction", "cement", "opc-cement"])?._id, "opc");
  assert.equal(findCategoryByPath(tree, ["cement", "opc-cement"]), null);
  assert.equal(findCategoryBySlug(categories, "opc-cement")?._id, "opc");
  assert.deepEqual(categoryPathFor(categories, "opc"), [
    "construction",
    "cement",
    "opc-cement",
  ]);
});

test("breadcrumbs include root through tertiary", () => {
  const breadcrumb = categoryBreadcrumb(categories, "opc");
  assert.deepEqual(
    breadcrumb.map((node) => node.slug),
    ["construction", "cement", "opc-cement"],
  );
});

test("product counts roll up the tree", () => {
  const visible = categories.filter((category) => category._id !== "hidden-child");
  const counts = countProductsByCategory(visible, [
    { categoryId: "opc" },
    { categoryId: "opc" },
    { categoryId: "ppc" },
    { categoryId: "pipes" },
  ]);
  assert.equal(counts.get("opc"), 2);
  assert.equal(counts.get("cement"), 3);
  assert.equal(counts.get("construction"), 3);
  assert.equal(counts.get("plumbing"), 1);

  const tree = buildCategoryTree(visible);
  attachProductCounts(tree, counts);
  const cement = flattenCategoryTree(tree).find((node) => node._id === "cement");
  assert.equal(cement?.productCount, 3);
});
