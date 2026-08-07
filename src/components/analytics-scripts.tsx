import Script from "next/script";

/**
 * Optional product analytics — set on Vercel:
 * - NEXT_PUBLIC_PLAUSIBLE_DOMAIN=www.aupairly.me
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
 */
export function AnalyticsScripts() {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <>
      {plausible ? (
        <Script
          defer
          data-domain={plausible}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
