"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { buildCategoryTree } from "@/lib/categories";
import {
  CATEGORY_LEVEL_LABELS,
  nextOrderValue,
  slugify,
  type CategoryFieldErrors,
} from "@/lib/category-validation";
import type { Category, CategoryLevel, CategoryNode } from "@/lib/types";

type Draft = {
  id: string | null;
  mode: "create" | "edit";
  level: CategoryLevel;
  parentId: string | null;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

type Message = { type: "success" | "error"; text: string } | null;

const LEVEL_BADGE: Record<CategoryLevel, string> = {
  primary: "bg-primary text-white",
  secondary: "bg-accent-soft text-accent-dark",
  tertiary: "bg-sand text-ink-soft",
};

function emptyDraft(level: CategoryLevel, parentId: string | null, order: number): Draft {
  return {
    id: null,
    mode: "create",
    level,
    parentId,
    name: "",
    slug: "",
    order,
    isActive: true,
    description: "",
    seoTitle: "",
    seoDescription: "",
  };
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});

  const tree = useMemo(
    () => buildCategoryTree(categories, { includeInactive: true }),
    [categories],
  );

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/categories", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { categories?: Category[] };
    if (data.categories) setCategories(data.categories);
  }, []);

  const openCreate = (level: CategoryLevel, parentId: string | null) => {
    const siblings = categories.filter((category) => (category.parentId ?? null) === parentId);
    setDraft(emptyDraft(level, parentId, nextOrderValue(siblings)));
    setFieldErrors({});
    setMessage(null);
  };

  const openEdit = (node: CategoryNode) => {
    setDraft({
      id: node._id,
      mode: "edit",
      level: node.level,
      parentId: node.parentId ?? null,
      name: node.name,
      slug: node.slug,
      order: typeof node.order === "number" ? node.order : 100,
      isActive: node.isActive !== false,
      description: node.description ?? "",
      seoTitle: node.seoTitle ?? "",
      seoDescription: node.seoDescription ?? "",
    });
    setFieldErrors({});
    setMessage(null);
  };

  const parentOptions = useMemo(() => {
    if (!draft) return [];
    if (draft.level === "secondary") {
      return categories
        .filter((category) => !category.parentId)
        .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name));
    }
    if (draft.level === "tertiary") {
      const primaryIds = new Set(
        categories.filter((category) => !category.parentId).map((category) => category._id),
      );
      return categories
        .filter((category) => category.parentId && primaryIds.has(category.parentId))
        .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name));
    }
    return [];
  }, [categories, draft]);

  const changeLevel = (level: CategoryLevel) => {
    if (!draft) return;
    setDraft({ ...draft, level, parentId: null });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setMessage(null);
    setFieldErrors({});

    const payload = {
      name: draft.name,
      slug: draft.slug || slugify(draft.name),
      level: draft.level,
      parentId: draft.level === "primary" ? null : draft.parentId,
      order: Number(draft.order),
      isActive: draft.isActive,
      description: draft.description,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
    };

    try {
      const response = await fetch(
        draft.mode === "create" ? "/api/admin/categories" : `/api/admin/categories/${draft.id}`,
        {
          method: draft.mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: string[];
        fieldErrors?: CategoryFieldErrors;
      };

      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setMessage({
          type: "error",
          text: data.errors?.join(" ") || data.error || "Could not save the category.",
        });
        return;
      }

      await refresh();
      setDraft(null);
      setMessage({
        type: "success",
        text: draft.mode === "create" ? "Category created." : "Category updated.",
      });
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (node: CategoryNode) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/categories/${node._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: node.isActive === false }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Could not change visibility." });
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (node: CategoryNode) => {
    if (!window.confirm(`Delete “${node.name}”? This cannot be undone.`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/categories/${node._id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Could not delete the category." });
        return;
      }
      await refresh();
      if (draft?.id === node._id) setDraft(null);
      setMessage({ type: "success", text: "Category deleted." });
    } finally {
      setBusy(false);
    }
  };

  const move = async (node: CategoryNode, direction: -1 | 1) => {
    const siblings = categories
      .filter((category) => (category.parentId ?? null) === (node.parentId ?? null))
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name));
    const index = siblings.findIndex((category) => category._id === node._id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= siblings.length) return;

    const ordered = siblings.map((category) => category._id);
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: node.parentId ?? null, ids: ordered }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Could not reorder categories." });
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const renderNode = (node: CategoryNode, index: number, siblingCount: number) => (
    <li key={node._id} className="border-t border-line-soft first:border-t-0">
      <div
        className="flex flex-wrap items-center gap-2 py-2.5 pr-2 sm:flex-nowrap"
        style={{ paddingLeft: `${node.depth * 22 + 4}px` }}
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center text-ink-faint" aria-hidden="true">
          {node.children.length > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
        </span>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${LEVEL_BADGE[node.level]}`}
        >
          {node.level}
        </span>
        <span
          className={`min-w-0 flex-1 truncate text-sm ${
            node.isActive === false ? "text-ink-faint line-through" : "font-semibold text-ink"
          }`}
        >
          {node.name}
        </span>
        <span className="hidden shrink-0 font-mono text-[10px] text-ink-faint sm:inline">
          /{node.slug}
        </span>
        <span className="shrink-0 text-[10px] text-ink-faint">
          {node.children.length} {node.children.length === 1 ? "child" : "children"}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="btn btn-icon btn-sm"
            disabled={busy || index === 0}
            onClick={() => move(node, -1)}
            aria-label={`Move ${node.name} up`}
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            disabled={busy || index === siblingCount - 1}
            onClick={() => move(node, 1)}
            aria-label={`Move ${node.name} down`}
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          {node.level === "primary" ? (
            <button
              type="button"
              className="btn btn-icon btn-sm"
              onClick={() => openCreate("secondary", node._id)}
              aria-label={`Add secondary category under ${node.name}`}
              title="Add secondary category"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {node.level === "secondary" ? (
            <button
              type="button"
              className="btn btn-icon btn-sm"
              onClick={() => openCreate("tertiary", node._id)}
              aria-label={`Add tertiary category under ${node.name}`}
              title="Add tertiary category"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => openEdit(node)}
            aria-label={`Edit ${node.name}`}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => toggleActive(node)}
            aria-label={node.isActive === false ? `Activate ${node.name}` : `Deactivate ${node.name}`}
            title={node.isActive === false ? "Activate" : "Deactivate"}
          >
            <Power className={`h-3.5 w-3.5 ${node.isActive === false ? "text-ink-faint" : "text-success"}`} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            onClick={() => remove(node)}
            aria-label={`Delete ${node.name}`}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child, childIndex) =>
            renderNode(child, childIndex, node.children.length),
          )}
        </ul>
      ) : null}
    </li>
  );

  return (
    <div className="row row-deck row-cards">
      <div className="col-12 col-xl-7">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Category tree</h3>
            <div className="card-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openCreate("primary", null)}
              >
                <Plus className="h-4 w-4" />
                New primary
              </button>
            </div>
          </div>
          <div className="card-body">
            {message ? (
              <div
                role="status"
                className={`alert ${
                  message.type === "success" ? "alert-success" : "alert-danger"
                } mb-3`}
              >
                {message.text}
              </div>
            ) : null}

            {tree.length === 0 ? (
              <p className="text-secondary mb-0">
                No categories yet. Create the first primary category to start the hierarchy.
              </p>
            ) : (
              <ul>
                {tree.map((node, index) => renderNode(node, index, tree.length))}
              </ul>
            )}
          </div>
          <div className="card-footer text-secondary">
            Three levels only: primary → secondary → tertiary. Products are always assigned to a
            tertiary category. Inactive branches disappear from the website but remain here.
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-5">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {draft
                ? draft.mode === "create"
                  ? `New ${CATEGORY_LEVEL_LABELS[draft.level].toLowerCase()}`
                  : "Edit category"
                : "Category details"}
            </h3>
            {draft ? (
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-icon btn-sm"
                  onClick={() => setDraft(null)}
                  aria-label="Close form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="card-body">
            {!draft ? (
              <div className="empty">
                <p className="empty-title">Select a category</p>
                <p className="empty-subtitle text-secondary">
                  Choose a node to edit it, or add a primary category. New secondaries and
                  tertiaries can be added from the tree actions.
                </p>
                <div className="empty-action">
                  <Link href="/studio" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                    Open Sanity Studio
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="form-label" htmlFor="category-name">
                    Name
                  </label>
                  <input
                    id="category-name"
                    className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                    value={draft.name}
                    required
                    minLength={2}
                    maxLength={80}
                    onChange={(event) => {
                      const name = event.target.value;
                      setDraft({
                        ...draft,
                        name,
                        slug:
                          draft.mode === "create" || draft.slug === slugify(draft.name)
                            ? slugify(name)
                            : draft.slug,
                      });
                    }}
                  />
                  {fieldErrors.name ? <div className="invalid-feedback">{fieldErrors.name}</div> : null}
                </div>

                <div>
                  <label className="form-label" htmlFor="category-slug">
                    URL slug
                  </label>
                  <input
                    id="category-slug"
                    className={`form-control font-monospace ${fieldErrors.slug ? "is-invalid" : ""}`}
                    value={draft.slug}
                    required
                    maxLength={96}
                    onChange={(event) =>
                      setDraft({ ...draft, slug: event.target.value.toLowerCase() })
                    }
                  />
                  {fieldErrors.slug ? <div className="invalid-feedback">{fieldErrors.slug}</div> : null}
                  <p className="form-hint">
                    Unique across the whole catalogue. Changing it changes the category URL.
                  </p>
                </div>

                <div className="row">
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="category-level">
                      Level
                    </label>
                    <select
                      id="category-level"
                      className="form-select"
                      value={draft.level}
                      onChange={(event) => changeLevel(event.target.value as CategoryLevel)}
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="tertiary">Tertiary</option>
                    </select>
                    {fieldErrors.level ? (
                      <div className="invalid-feedback d-block">{fieldErrors.level}</div>
                    ) : null}
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label" htmlFor="category-order">
                      Display order
                    </label>
                    <input
                      id="category-order"
                      type="number"
                      min={0}
                      max={9999}
                      className={`form-control ${fieldErrors.order ? "is-invalid" : ""}`}
                      value={draft.order}
                      onChange={(event) =>
                        setDraft({ ...draft, order: Number(event.target.value) })
                      }
                    />
                    {fieldErrors.order ? (
                      <div className="invalid-feedback">{fieldErrors.order}</div>
                    ) : null}
                  </div>
                </div>

                {draft.level !== "primary" ? (
                  <div>
                    <label className="form-label" htmlFor="category-parent">
                      Parent category
                    </label>
                    <select
                      id="category-parent"
                      className={`form-select ${fieldErrors.parentId ? "is-invalid" : ""}`}
                      value={draft.parentId ?? ""}
                      required
                      onChange={(event) =>
                        setDraft({ ...draft, parentId: event.target.value || null })
                      }
                    >
                      <option value="">
                        {draft.level === "secondary"
                          ? "Choose a primary category"
                          : "Choose a secondary category"}
                      </option>
                      {parentOptions.map((option) => (
                        <option key={option._id} value={option._id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.parentId ? (
                      <div className="invalid-feedback">{fieldErrors.parentId}</div>
                    ) : null}
                  </div>
                ) : null}

                <div>
                  <label className="form-label" htmlFor="category-description">
                    Description
                  </label>
                  <textarea
                    id="category-description"
                    className="form-control"
                    rows={3}
                    maxLength={400}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                  />
                  <p className="form-hint">Shown on the category page. Keep it factual.</p>
                </div>

                <div>
                  <label className="form-label" htmlFor="category-seo-title">
                    SEO title
                  </label>
                  <input
                    id="category-seo-title"
                    className="form-control"
                    maxLength={60}
                    value={draft.seoTitle}
                    onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })}
                  />
                  <p className="form-hint">Optional. Falls back to the category name.</p>
                </div>

                <div>
                  <label className="form-label" htmlFor="category-seo-description">
                    SEO description
                  </label>
                  <textarea
                    id="category-seo-description"
                    className="form-control"
                    rows={2}
                    maxLength={160}
                    value={draft.seoDescription}
                    onChange={(event) =>
                      setDraft({ ...draft, seoDescription: event.target.value })
                    }
                  />
                  <p className="form-hint">Optional. Falls back to the category description.</p>
                </div>

                <label className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={draft.isActive}
                    onChange={(event) =>
                      setDraft({ ...draft, isActive: event.target.checked })
                    }
                  />
                  <span className="form-check-label">Active on the website</span>
                </label>

                {fieldErrors.form ? (
                  <div className="alert alert-danger">{fieldErrors.form}</div>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? "Saving…" : "Save category"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setDraft(null)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
