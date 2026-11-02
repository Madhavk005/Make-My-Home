import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-01-01" });

const parentSpec = {
  name: "Cement",
  slug: "cement",
  stage: "structure",
  description: "Cement for construction — OPC, PPC, PSC, white and speciality grades.",
  order: 10,
  specificationTemplate: ["Grade", "Weight", "Standard", "Setting time"],
};

const subSpecs = [
  { name: "OPC Cement", slug: "opc-cement", order: 1 },
  { name: "PPC Cement", slug: "ppc-cement", order: 2 },
  { name: "PSC Cement", slug: "psc-cement", order: 3 },
  { name: "White Cement", slug: "white-cement", order: 4 },
  { name: "Rapid Hardening Cement", slug: "rapid-hardening-cement", order: 5 },
  { name: "Sulphate Resistant Cement", slug: "sulphate-resistant-cement", order: 6 },
  { name: "Low Heat Cement", slug: "low-heat-cement", order: 7 },
  { name: "Masonry Cement", slug: "masonry-cement", order: 8 },
  { name: "Ready Mix / Speciality Cement", slug: "ready-mix-speciality-cement", order: 9 },
];

async function main() {
  const existing = await client.fetch<Array<{ _id: string; name: string; "slug": string }>>(
    `*[_type == "category"]{_id, name, "slug": slug.current}`,
  );
  const bySlug = new Map(existing.map((item) => [item.slug, item]));
  const byName = new Map(existing.map((item) => [item.name.toLowerCase(), item]));

  const created: string[] = [];
  const reused: string[] = [];
  const skipped: string[] = [];

  // Parent
  let parentId: string;
  const parentExisting = bySlug.get(parentSpec.slug) ?? byName.get(parentSpec.name.toLowerCase());
  if (parentExisting) {
    parentId = parentExisting._id;
    reused.push(parentSpec.name);
  } else {
    const doc = await client.create({
      _type: "category",
      name: parentSpec.name,
      slug: { _type: "slug", current: parentSpec.slug },
      stage: parentSpec.stage,
      description: parentSpec.description,
      order: parentSpec.order,
      specificationTemplate: parentSpec.specificationTemplate,
    });
    parentId = doc._id;
    created.push(parentSpec.name);
  }

  // Subcategories
  for (const sub of subSpecs) {
    const existingSub = bySlug.get(sub.slug) ?? byName.get(sub.name.toLowerCase());
    if (existingSub) {
      reused.push(sub.name);
      continue;
    }
    await client.create({
      _type: "category",
      name: sub.name,
      slug: { _type: "slug", current: sub.slug },
      parent: { _type: "reference", _ref: parentId },
      stage: "structure",
      order: sub.order,
    });
    created.push(sub.name);
  }

  console.log("Created:", created);
  console.log("Reused:", reused);
  console.log("Skipped:", skipped);
  console.log("Parent ID:", parentId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});