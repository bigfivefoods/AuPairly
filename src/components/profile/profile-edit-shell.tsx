"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Globe2, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileSection = {
  id: string;
  label: string;
};

export function ProfileEditShell({
  role,
  title,
  description,
  status,
  userName,
  sections,
  actions,
  children,
}: {
  role: "AUPAIR" | "PARENT";
  title: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
  userName: string;
  sections: ProfileSection[];
  actions: ReactNode;
  children: ReactNode;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    const root = document.getElementById("profile-edit-scroll");
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActive(visible.target.id.replace("section-", ""));
        }
      },
      { root, rootMargin: "-15% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    for (const s of sections) {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  function jumpTo(id: string) {
    setActive(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const statusLabel =
    status === "ACTIVE" ? "Live" : status === "PAUSED" ? "Paused" : "Draft";
  const statusClass =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : status === "PAUSED"
        ? "bg-amber-100 text-amber-900"
        : "bg-stone-100 text-stone-700";

  // Full-bleed under sticky app top bar; offset for global AppShell side nav only
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-[#faf8f5] text-stone-900 top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] lg:left-[var(--app-sidebar-w,11.5rem)]">
      <header className="shrink-0 border-b border-stone-200/80 bg-white/95 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8 xl:px-10">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                {role === "AUPAIR" ? (
                  <Globe2 className="h-3 w-3" />
                ) : (
                  <Home className="h-3 w-3" />
                )}
                {role === "AUPAIR" ? "Sitter profile" : "Host listing"}
              </p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  statusClass
                )}
              >
                {statusLabel}
              </span>
            </div>
            <h1 className="mt-1.5 font-display text-xl font-semibold leading-tight text-stone-900 sm:text-2xl">
              {title}
            </h1>
            <p className="mt-0.5 max-w-2xl text-sm text-stone-500">
              {description}
              <span className="hidden sm:inline">
                {" "}
                · Editing as {userName.split(" ")[0]}
              </span>
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-semibold text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <nav
          className="scroll-thin flex gap-1.5 overflow-x-auto border-t border-stone-100 px-4 py-2.5 sm:px-6 lg:px-8 xl:px-10"
          aria-label="Profile sections"
        >
          {sections.map((s, i) => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => jumpTo(s.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                  isActive
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-white text-stone-500"
                  )}
                >
                  {isActive ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div
        id="profile-edit-scroll"
        className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10"
      >
        <div className="mx-auto w-full max-w-3xl xl:max-w-4xl">{children}</div>
      </div>

      <div className="shrink-0 border-t border-stone-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between xl:max-w-4xl">
          <p className="hidden text-xs text-stone-400 sm:block">
            Listing status: <strong className="text-stone-600">{statusLabel}</strong>
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSection({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div id={`section-${id}`} className={cn("scroll-mt-4", className)}>
      {children}
    </div>
  );
}
