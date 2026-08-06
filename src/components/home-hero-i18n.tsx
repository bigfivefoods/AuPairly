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
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-teal-50 backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              {t("home_hero_badge")}
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("home_hero_title")}
              <span className="block text-teal-200">{t("home_hero_title_accent")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-teal-100/90">
              {t("home_hero_body")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register?role=PARENT" className="btn-accent text-base !px-8 !py-3.5">
                {t("home_cta_need")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register?role=AUPAIR"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {t("home_cta_offer")}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-teal-100 transition hover:bg-white/10"
              >
                {t("home_cta_plans")}
              </Link>
            </div>
            <div className="mt-14 grid grid-cols-3 gap-4 border-t border-white/10 pt-10 text-center">
              <div>
                <p className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  {stats.aupairs || "50+"}
                </p>
                <p className="mt-1 text-xs text-teal-100/80 sm:text-sm">{t("home_stat_sitters")}</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  {stats.families || "40+"}
                </p>
                <p className="mt-1 text-xs text-teal-100/80 sm:text-sm">{t("home_stat_hosts")}</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  {stats.verified || "90%"}
                </p>
                <p className="mt-1 text-xs text-teal-100/80 sm:text-sm">{t("home_stat_verified")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
