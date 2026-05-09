/** Placeholder when a catalog card has no custom thumbnail — generic PDF-style document. */
export function PdfThumbnailPlaceholder({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 ${className}`}
      role="img"
      aria-label="PDF"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 56"
        className="h-[62%] w-auto max-w-[72%] drop-shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
        fill="none"
      >
        <path
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="1.25"
          d="M8 3.5h19.5L38 14v38.5a3.5 3.5 0 0 1-3.5 3.5H8a3.5 3.5 0 0 1-3.5-3.5v-45A3.5 3.5 0 0 1 8 3.5Z"
        />
        <path
          fill="#dc2626"
          d="M27.5 3.5H28L38 13.5v.5H31a3.5 3.5 0 0 1-3.5-3.5v-7Z"
        />
        <path
          fill="#dc2626"
          fillOpacity={0.88}
          d="M11 28.5h22v3H11v-3Zm0 7h22v3H11v-3Zm0 7h15v3H11v-3Z"
        />
      </svg>
    </div>
  );
}
