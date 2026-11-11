import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { CategoryDeleteAction } from "./src/sanity/components/category-delete-action";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "make-my-home";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";

export default defineConfig({
  name: "make-my-home",
  title: "Make My Home — Catalogue",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => [
      ...templates.filter((template) => template.schemaType !== "siteSettings"),
      {
        id: "category-primary",
        title: "Primary category",
        schemaType: "category",
        value: { level: "primary", isActive: true },
      },
      {
        id: "category-secondary",
        title: "Secondary category",
        schemaType: "category",
        value: (params: { parentId?: string }) => ({
          level: "secondary",
          isActive: true,
          ...(params?.parentId
            ? { parent: { _type: "reference", _ref: params.parentId } }
            : {}),
        }),
      },
      {
        id: "category-tertiary",
        title: "Tertiary category",
        schemaType: "category",
        value: (params: { parentId?: string }) => ({
          level: "tertiary",
          isActive: true,
          ...(params?.parentId
            ? { parent: { _type: "reference", _ref: params.parentId } }
            : {}),
        }),
      },
    ],
  },
  document: {
    actions: (prev, context) =>
      context.schemaType === "category"
        ? prev.map((action) => (action.action === "delete" ? CategoryDeleteAction : action))
        : prev,
  },
});
