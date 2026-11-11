"use client";

import { useState } from "react";
import { TrashIcon } from "@sanity/icons/Trash";
import { useClient, type DocumentActionComponent } from "sanity";

/**
 * Deletion guard for categories.
 *
 * The Studio's built-in delete button happily removes a parent and leaves
 * children/products orphaned. This action checks dependencies first and only
 * deletes an empty category.
 */
export const CategoryDeleteAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: "2025-01-01" });
  const [busy, setBusy] = useState(false);

  const documentId = props.id.replace(/^drafts\./, "");

  return {
    label: busy ? "Checking…" : "Delete",
    icon: TrashIcon,
    tone: "critical",
    disabled: busy,
    onHandle: async () => {
      setBusy(true);
      try {
        const [childCount, productCount] = await Promise.all([
          client.fetch<number>(
            `count(*[_type == "category" && parent._ref == $id])`,
            { id: documentId },
          ),
          client.fetch<number>(
            `count(*[_type == "product" && category._ref == $id])`,
            { id: documentId },
          ),
        ]);

        if (childCount > 0 || productCount > 0) {
          const reasons = [
            childCount > 0
              ? `${childCount} child ${childCount === 1 ? "category" : "categories"}`
              : null,
            productCount > 0
              ? `${productCount} ${productCount === 1 ? "product" : "products"}`
              : null,
          ].filter(Boolean);

          window.alert(
            `This category cannot be deleted because it contains ${reasons.join(
              " and ",
            )}. Move them first.`,
          );
          return;
        }

        if (!window.confirm(`Delete “${props.published?.name ?? props.draft?.name ?? "this category"}”?`)) {
          return;
        }

        await client.delete(documentId);
        props.onComplete();
      } finally {
        setBusy(false);
      }
    },
  };
};

CategoryDeleteAction.action = "delete";
