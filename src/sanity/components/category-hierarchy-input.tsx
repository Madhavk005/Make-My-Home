"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Select, Stack, Text } from "@sanity/ui";
import { PatchEvent, set, unset, useClient } from "sanity";

type CategoryRow = {
  _id: string;
  name: string;
  parentId: string | null;
  slug: string;
  order?: number | null;
};

type HierarchyInputProps = {
  value?: { _ref?: string } | null;
  onChange: (patch: PatchEvent) => void;
  readOnly?: boolean;
};

const API_VERSION = "2025-01-01";

const query = `*[_type == "category" && defined(slug.current)] | order(order asc, name asc){
  _id,
  name,
  "parentId": parent._ref,
  "slug": slug.current,
  order
}`;

function bareId(id: string): string {
  return id.replace(/^drafts\./, "");
}

function buildChain(rows: CategoryRow[], id: string | null): CategoryRow[] {
  if (!id) return [];
  const byId = new Map(rows.map((row) => [bareId(row._id), row]));
  const chain: CategoryRow[] = [];
  const seen = new Set<string>();
  let current = byId.get(bareId(id));

  while (current && !seen.has(bareId(current._id))) {
    seen.add(bareId(current._id));
    chain.unshift(current);
    current = current.parentId ? byId.get(bareId(current.parentId)) : undefined;
  }

  return chain;
}

/**
 * Cascading primary → secondary → tertiary selector for products.
 *
 * Only the tertiary reference is written to the document. The parent selects
 * are UI state reconstructed from the category tree, so no duplicated product
 * fields are created.
 */
export function CategoryHierarchyInput({ value, onChange, readOnly }: HierarchyInputProps) {
  const client = useClient({ apiVersion: API_VERSION });
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<{
    /** Reference value the draft selection belongs to (empty while picking). */
    valueRef: string;
    primaryId: string;
    secondaryId: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    client
      .fetch<CategoryRow[]>(query)
      .then((result) => {
        if (cancelled) return;
        // Preview-drafts can return both a draft and its published twin.
        const deduped = new Map<string, CategoryRow>();
        for (const row of result) {
          const id = bareId(row._id);
          if (!deduped.has(id) || !row._id.startsWith("drafts.")) {
            deduped.set(id, { ...row, _id: id });
          }
        }
        setRows(Array.from(deduped.values()));
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  const selectedRef = value?._ref ? bareId(value._ref) : "";
  const selectedChain = useMemo(() => buildChain(rows, selectedRef), [rows, selectedRef]);

  // The selects keep a local draft while the editor picks a new branch and the
  // reference is cleared. Once the reference changes, the saved chain wins.
  const draft = selection && selection.valueRef === selectedRef ? selection : null;
  const primaryId = draft
    ? draft.primaryId
    : selectedChain[0]
      ? bareId(selectedChain[0]._id)
      : "";
  const secondaryId = draft
    ? draft.secondaryId
    : selectedChain[1]
      ? bareId(selectedChain[1]._id)
      : "";

  const primaries = useMemo(() => rows.filter((row) => !row.parentId), [rows]);
  const secondaries = useMemo(
    () =>
      rows.filter(
        (row) => row.parentId && bareId(row.parentId) === primaryId,
      ),
    [rows, primaryId],
  );
  const tertiaries = useMemo(
    () =>
      rows.filter(
        (row) => row.parentId && bareId(row.parentId) === secondaryId,
      ),
    [rows, secondaryId],
  );

  const selectedPath = selectedChain.map((row) => row.name).join(" › ");

  const choosePrimary = (id: string) => {
    setSelection({ valueRef: "", primaryId: id, secondaryId: "" });
    onChange(PatchEvent.from(unset()));
  };

  const chooseSecondary = (id: string) => {
    setSelection({ valueRef: "", primaryId, secondaryId: id });
    onChange(PatchEvent.from(unset()));
  };

  const chooseTertiary = (id: string) => {
    onChange(PatchEvent.from(set({ _type: "reference", _ref: id })));
  };

  return (
    <Card padding={3} border radius={2} tone="transparent">
      <Stack gap={3}>
        <Stack gap={2}>
          <Text size={1} weight="semibold">
            Primary category
          </Text>
          <Select
            value={primaryId}
            onChange={(event) => choosePrimary(event.currentTarget.value)}
            disabled={readOnly || loading}
          >
            <option value="">{loading ? "Loading categories…" : "Choose a primary category"}</option>
            {primaries.map((row) => (
              <option key={row._id} value={row._id}>
                {row.name}
              </option>
            ))}
          </Select>
        </Stack>

        <Stack gap={2}>
          <Text size={1} weight="semibold">
            Secondary category
          </Text>
          <Select
            value={secondaryId}
            onChange={(event) => chooseSecondary(event.currentTarget.value)}
            disabled={readOnly || !primaryId || secondaries.length === 0}
          >
            <option value="">
              {primaryId
                ? secondaries.length === 0
                  ? "No secondary categories under this primary"
                  : "Choose a secondary category"
                : "Choose a primary category first"}
            </option>
            {secondaries.map((row) => (
              <option key={row._id} value={row._id}>
                {row.name}
              </option>
            ))}
          </Select>
        </Stack>

        <Stack gap={2}>
          <Text size={1} weight="semibold">
            Tertiary category (saved on the product)
          </Text>
          <Select
            value={selectedRef}
            onChange={(event) => chooseTertiary(event.currentTarget.value)}
            disabled={readOnly || !secondaryId || tertiaries.length === 0}
          >
            <option value="">
              {secondaryId
                ? tertiaries.length === 0
                  ? "No tertiary categories under this secondary"
                  : "Choose a tertiary category"
                : "Choose a secondary category first"}
            </option>
            {tertiaries.map((row) => (
              <option key={row._id} value={row._id}>
                {row.name}
              </option>
            ))}
          </Select>
        </Stack>

        <Text size={1} muted>
          {selectedPath
            ? `Stored: ${selectedPath}`
            : "Products can only be saved against a tertiary category."}
        </Text>
      </Stack>
    </Card>
  );
}
