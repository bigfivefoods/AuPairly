/**
 * Inject JSON-LD structured data for Google rich results.
 * Accepts one object or an array of schema graphs.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      // Structured data must be raw JSON in the document
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          payload.length === 1 ? payload[0] : payload
        ).replace(/</g, "\\u003c"),
      }}
    />
  );
}
