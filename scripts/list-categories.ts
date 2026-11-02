import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-01-01" });

async function main() {
  const categories = await client.fetch(`*[_type == "category"]{_id, name, "slug": slug.current, parent, order, stage}`);
  console.log(JSON.stringify(categories, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});