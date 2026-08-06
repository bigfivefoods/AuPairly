"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { useI18n } from "@/components/i18n-provider";
import { ContactUs } from "@/components/contact-us";

export function NavbarAuthLabels({
  part,
}: {
  part: "login" | "getStarted" | "signOut" | "admin";
}) {
  const { t } = useI18n();
  if (part === "login") return <>{t("nav_login")}</>;
  if (part === "getStarted") return <>{t("nav_get_started")}</>;
  if (part === "signOut") return <>{t("nav_sign_out")}</>;
  return <>{t("nav_admin")}</>;
}

export function FooterI18n() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
                A
              </span>
              <BrandWordmark className="text-lg font-semibold text-stone-900" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">{t("footer_blurb")}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">{t("footer_marketplace")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <Link href="/childcare" className="hover:text-teal-700">
                  {t("footer_childcare")}
                </Link>
              </li>
              <li>
                <Link href="/caregiving" className="hover:text-teal-700">
                  {t("footer_caregiving")}
                </Link>
              </li>
              <li>
                <Link href="/house-sitting" className="hover:text-teal-700">
                  {t("footer_house")}
                </Link>
              </li>
              <li>
                <Link href="/pet-sitting" className="hover:text-teal-700">
                  {t("footer_pets")}
                </Link>
              </li>
              <li>
                <Link href="/browse/aupairs" className="hover:text-teal-700">
                  {t("footer_all_sitters")}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-teal-700">
                  {t("footer_how")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">{t("footer_trust")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <Link href="/trust" className="hover:text-teal-700">
                  {t("footer_trust_centre")}
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-teal-700">
                  {t("footer_safety")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-teal-700">
                  {t("footer_privacy")}
                </Link>
              </li>
              <li>
                <Link href="/verification" className="hover:text-teal-700">
                  {t("footer_verify")}
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-teal-700">
                  {t("reviews_inbox")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">{t("footer_company")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <Link href="/pricing" className="hover:text-teal-700">
                  {t("footer_pricing")}
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-teal-700">
                  {t("footer_guides")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-700">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-teal-700">
                  {t("footer_support")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-teal-700">
                  {t("footer_join")}
                </Link>
              </li>
            </ul>
            <div className="mt-5">
              <ContactUs compact />
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-stone-100 pt-6 text-sm text-stone-400 sm:flex-row">
          <p>© {new Date().getFullYear()} AuPairly</p>
          <p className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-rose-400" /> {t("brand_tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
