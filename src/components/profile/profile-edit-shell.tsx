"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Globe2, Home, Menu, X } from "lucide-react";
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
  const [navOpen, setNavOpen] = useState(false);

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
    setNavOpen(false);
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

  // Sit below sticky site navbar (h-14 / sm:h-16 + safe-area) so Discover /
  // Messages / logo stay available while the teal section side-nav remains.
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-[#faf8f5] text-stone-900 top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))]"
    >
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="relative shrink-0 overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 px-5 py-4 text-white sm:px-8 sm:py-5 lg:flex lg:w-[36%] lg:max-w-md lg:flex-col lg:justify-between lg:px-10 lg:py-10 xl:w-[32%]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-200/90">
                  Complete your profile
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-white/90 lg:hidden">
                  {title}
                </p>
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", statusClass)}>
                  {statusLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setNavOpen((o) => !o)}
                  className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  aria-label={navOpen ? "Close sections" : "Open sections"}
                >
                  {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-100">
              {role === "AUPAIR" ? (
                <Globe2 className="h-3.5 w-3.5" />
              ) : (
                <Home className="h-3.5 w-3.5" />
              )}
              {role === "AUPAIR" ? "Sitter profile" : "Host listing"}
            </p>
            <h1 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl lg:text-[1.75rem] xl:text-3xl">
              {title}
            </h1>
            <p className="mt-2 hidden max-w-sm text-sm text-teal-100/90 sm:block">
              {description}
            </p>
            <p className="mt-3 hidden text-xs text-teal-200/80 lg:block">
              Editing as {userName.split(" ")[0]}
            </p>

            <nav className="mt-8 hidden lg:block" aria-label="Profile sections">
              <ol className="space-y-1">
                {sections.map((s, i) => {
                  const isActive = active === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => jumpTo(s.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                          isActive
                            ? "bg-white text-teal-900 shadow-sm"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            isActive ? "bg-teal-100 text-teal-800" : "bg-white/15"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="font-semibold">{s.label}</span>
                        {isActive && <Check className="ml-auto h-4 w-4 text-teal-600" />}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <div className="relative mt-6 hidden lg:block">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <span
              className={cn(
                "ml-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                statusClass
              )}
            >
              {statusLabel}
            </span>
          </div>
        </aside>

        {navOpen && (
          <div className="absolute inset-x-0 top-[4.5rem] z-20 border-b border-stone-200 bg-white px-4 py-3 shadow-lg sm:top-[5rem] lg:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Jump to section
            </p>
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jumpTo(s.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    active === s.id
                      ? "bg-teal-600 text-white"
                      : "bg-stone-100 text-stone-700"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#faf8f5]">
          <div className="hidden shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/70 px-6 py-4 backdrop-blur lg:flex xl:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Edit profile
              </p>
              <p className="mt-0.5 text-sm text-stone-500">
                Save a draft anytime, or publish when your listing is ready.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-stone-500 hover:text-stone-800"
            >
              Dashboard
            </Link>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200/80 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <p className="truncate text-xs text-stone-500 sm:text-sm">{description}</p>
          </div>

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
        </section>
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
