"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function HomeHeroI18n({
  stats,
}: {
  stats: { aupairs: number | string; families: number | string; verified: number | string };
}) {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-orange-400 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-400 blur-3xl" />
      </div>
      <div className="grain relative">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-teal-50 backdrop-blur sm:mb-6 sm:px-4 sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300 sm:h-4 sm:w-4" />
              <span className="truncate">{t("home_hero_badge")}</span>
            </div>
            <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white min-[380px]:text-3xl sm:text-5xl lg:text-6xl">
              {t("home_hero_title")}
              <span className="mt-1 block text-teal-200 sm:mt-0">
                {t("home_hero_title_accent")}
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-teal-100/90 sm:mt-6 sm:text-lg">
              {t("home_hero_body")}
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-2.5 sm:mt-10 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/register?role=PARENT"
                className="btn-accent btn-inline w-full justify-center text-sm !px-6 !py-3.5 sm:w-auto sm:text-base sm:!px-8"
              >
                {t("home_cta_need")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register?role=AUPAIR"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto sm:px-8 sm:text-base"
              >
                {t("home_cta_offer")}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-teal-100 transition hover:bg-white/10 sm:w-auto"
              >
                {t("home_cta_plans")}
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-2 border-t border-white/10 pt-8 text-center sm:mt-14 sm:gap-4 sm:pt-10">
              <div className="min-w-0 px-0.5">
                <p className="font-display text-xl font-semibold text-white sm:text-3xl">
                  {stats.aupairs || "50+"}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-teal-100/80 sm:text-sm">
                  {t("home_stat_sitters")}
                </p>
              </div>
              <div className="min-w-0 px-0.5">
                <p className="font-display text-xl font-semibold text-white sm:text-3xl">
                  {stats.families || "40+"}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-teal-100/80 sm:text-sm">
                  {t("home_stat_hosts")}
                </p>
              </div>
              <div className="min-w-0 px-0.5">
                <p className="font-display text-xl font-semibold text-white sm:text-3xl">
                  {stats.verified || "90%"}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-teal-100/80 sm:text-sm">
                  {t("home_stat_verified")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
