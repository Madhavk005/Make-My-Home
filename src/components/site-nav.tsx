"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Home,
  Menu,
  PackageSearch,
  Phone,
  Tags,
  X,
} from "lucide-react";
import type { NavNode } from "@/lib/nav";
import { ContactActions } from "./contact-actions";
import { useLocale } from "./locale-provider";

type NavProps = {
  nodes: NavNode[];
  phone: string | null;
  whatsappNumber: string | null;
  businessName: string | null;
};

function MegaMenu({ nodes, onNavigate }: { nodes: NavNode[]; onNavigate: () => void }) {
  const { t } = useLocale();

  return (
    <div
      id="desktop-mega-menu"
      className="absolute left-0 top-full z-50 mt-1 max-h-[min(78vh,46rem)] w-[min(94vw,72rem)] overflow-y-auto border border-line bg-surface shadow-[0_30px_70px_-25px_rgb(19_37_28_/_0.35)]"
    >
      <div className="grid gap-x-10 gap-y-8 p-7 sm:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node, index) => (
          <div key={node.id}>
            <p className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              {String(index + 1).padStart(2, "0")}
            </p>
            <Link
              href={node.href}
              onClick={onNavigate}
              className="mt-1 flex min-h-11 items-center justify-between gap-2 border-b border-line pb-2 font-display text-lg font-medium tracking-tight text-ink transition-colors hover:text-clay"
            >
              <span>{node.name}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
            </Link>
            {node.children.length > 0 ? (
              <ul className="mt-2 grid gap-0.5">
                {node.children.slice(0, 8).map((child) => (
                  <li key={child.id}>
                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      className="flex min-h-10 items-center justify-between gap-2 py-1 text-sm text-ink-soft transition-colors hover:text-clay"
                    >
                      <span>{child.name}</span>
                      {child.productCount > 0 ? (
                        <span className="font-mono text-[10px] text-ink-faint">{child.productCount}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
                {node.children.length > 8 ? (
                  <li>
                    <Link
                      href={node.href}
                      onClick={onNavigate}
                      className="flex min-h-10 items-center gap-1 text-sm font-bold text-clay"
                    >
                      {t("viewAll")}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-canvas px-7 py-5">
        <p className="text-sm text-ink-soft">{t("homeBrowseCategories")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/categories"
            onClick={onNavigate}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-forest hover:text-clay"
          >
            {t("homeAllCategories")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/search"
            onClick={onNavigate}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-clay hover:text-clay-dark"
          >
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            {t("browseAllProducts")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DesktopNav({ nodes, phone, whatsappNumber, businessName }: NavProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={container} className="relative flex flex-1 items-center gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="desktop-mega-menu"
        onClick={() => setOpen((value) => !value)}
        className="nav-link"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        {t("categories")}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <Link href="/search" className="nav-link">
        <PackageSearch className="h-4 w-4" aria-hidden="true" />
        {t("allProducts")}
      </Link>

      <Link href="/brands" className="nav-link">
        <Tags className="h-4 w-4" aria-hidden="true" />
        {t("brands")}
      </Link>

      <Link href="/about" className="nav-link">
        <Home className="h-4 w-4" aria-hidden="true" />
        {t("navAbout")}
      </Link>

      <Link href="/contact" className="nav-link">
        <Phone className="h-4 w-4" aria-hidden="true" />
        {t("navContact")}
      </Link>

      <div className="ml-auto hidden items-center gap-2 xl:flex">
        <ContactActions
          phone={phone}
          whatsappNumber={whatsappNumber}
          businessName={businessName}
        />
      </div>

      {open ? <MegaMenu nodes={nodes} onNavigate={() => setOpen(false)} /> : null}
    </div>
  );
}

function NavAccordion({
  node,
  level,
  onNavigate,
}: {
  node: NavNode;
  level: number;
  onNavigate: () => void;
}) {
  const { t } = useLocale();

  if (node.children.length === 0) {
    return (
      <li>
        <Link
          href={node.href}
          onClick={onNavigate}
          className="flex min-h-12 items-center justify-between gap-2 border-b border-line/70 py-3 text-base font-semibold text-ink"
          style={{ paddingLeft: level > 0 ? `${level * 12}px` : undefined }}
        >
          <span>{node.name}</span>
          {node.productCount > 0 ? (
            <span className="font-mono text-xs text-ink-faint">{node.productCount}</span>
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <details className="group border-b border-line/70">
        <summary
          className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden"
          style={{ paddingLeft: level > 0 ? `${level * 12}px` : undefined }}
        >
          <span>{node.name}</span>
          <span className="inline-flex items-center gap-2 text-xs font-normal text-ink-faint">
            {node.productCount > 0 ? node.productCount : null}
            <ChevronDown
              className="h-4 w-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </span>
        </summary>
        <ul className="pb-2 pl-3">
          <li>
            <Link
              href={node.href}
              onClick={onNavigate}
              className="flex min-h-11 items-center gap-1.5 border-b border-line/50 py-2 text-sm font-bold text-clay"
            >
              <PackageSearch className="h-4 w-4" aria-hidden="true" />
              {t("seeProducts")} · {node.name}
            </Link>
          </li>
          {node.children.map((child) => (
            <NavAccordion key={child.id} node={child} level={level + 1} onNavigate={onNavigate} />
          ))}
        </ul>
      </details>
    </li>
  );
}

export function MobileNav({ nodes, phone, whatsappNumber, businessName }: NavProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = buttonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-sm font-bold text-ink transition-colors hover:border-ink/30 lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        <span className="inline">{t("menu")}</span>
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t("mobileNavigation")}
            >
              <button
                type="button"
                aria-label={t("closeMenu")}
                onClick={close}
                className="absolute inset-0 h-full w-full bg-forest-deep/55 backdrop-blur-[2px]"
              />
              <div
                ref={dialogRef}
                id="mobile-navigation"
                className="absolute inset-y-0 right-0 flex w-[min(94vw,380px)] flex-col bg-surface shadow-[var(--shadow-drawer)]"
              >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <button
                type="button"
                onClick={close}
                className="inline-flex min-h-12 items-center gap-2 text-base font-bold text-ink"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                {t("back")}
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="grid h-12 w-12 place-items-center rounded-sm text-ink-soft hover:bg-sand hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{t("closeMenu")}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-5">
              <p className="type-eyebrow no-rule mb-3">{t("mobileNavigation")}</p>

              <div className="grid gap-0.5 border-y border-line py-1">
                <Link
                  href="/search"
                  onClick={close}
                  className="flex min-h-12 items-center gap-3 py-3 text-lg font-semibold text-ink"
                >
                  <PackageSearch className="h-5 w-5 text-clay" aria-hidden="true" />
                  {t("allProducts")}
                </Link>
                <Link
                  href="/brands"
                  onClick={close}
                  className="flex min-h-12 items-center gap-3 py-3 text-lg font-semibold text-ink"
                >
                  <Tags className="h-5 w-5 text-clay" aria-hidden="true" />
                  {t("brands")}
                </Link>
                <Link
                  href="/about"
                  onClick={close}
                  className="flex min-h-12 items-center gap-3 py-3 text-lg font-semibold text-ink"
                >
                  <Home className="h-5 w-5 text-clay" aria-hidden="true" />
                  {t("navAbout")}
                </Link>
                <Link
                  href="/contact"
                  onClick={close}
                  className="flex min-h-12 items-center gap-3 py-3 text-lg font-semibold text-ink"
                >
                  <Phone className="h-5 w-5 text-clay" aria-hidden="true" />
                  {t("navContact")}
                </Link>
              </div>

              <p className="type-eyebrow no-rule mb-2 mt-6">{t("categories")}</p>
              <ul>
                {nodes.map((node) => (
                  <NavAccordion key={node.id} node={node} level={0} onNavigate={close} />
                ))}
              </ul>

              <Link
                href="/categories"
                onClick={close}
                className="btn btn-secondary mt-5 w-full"
              >
                {t("homeAllCategories")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="border-t border-line bg-canvas p-4">
              <p className="mb-2 text-sm font-bold text-ink">{t("storeContact")}</p>
              <ContactActions
                phone={phone}
                whatsappNumber={whatsappNumber}
                businessName={businessName}
                layout="stack"
                showMissing
              />
            </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
