import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AuPairly — Trusted care for your family, loved ones, home & pets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Twitter/X share image — same branding as opengraph-image (must not re-export config). */
export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f766e 0%, #134e4a 45%, #1c1917 100%)",
          padding: "64px 72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(135deg, #14b8a6, #0d9488)",
              color: "white",
              fontSize: 40,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            A
          </div>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>
            <span style={{ color: "#ffffff" }}>Au</span>
            <span style={{ color: "#5eead4" }}>Pair</span>
            <span style={{ color: "#ffffff" }}>ly</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -1.2,
            }}
          >
            Trusted care for your family, loved ones, home & pets
          </div>
          <div style={{ color: "#99f6e4", fontSize: 28, lineHeight: 1.35 }}>
            Childcare · Caregiving · House sitting · Pet sitting
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#ccfbf1",
            fontSize: 24,
          }}
        >
          <span>Verified people. One marketplace.</span>
          <span style={{ fontWeight: 600, color: "#ffffff" }}>aupairly.me</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
