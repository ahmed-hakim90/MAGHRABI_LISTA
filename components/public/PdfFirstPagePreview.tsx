"use client";

import { useEffect, useRef, useState } from "react";
import { PdfThumbnailPlaceholder } from "./PdfThumbnailPlaceholder";

type Props = {
  cardId: string;
  /** App PDF proxy path, e.g. `/wholesale/file/{id}/pdf` */
  pdfUrl: string;
  className?: string;
};

/**
 * Renders the first PDF page into a canvas (Google Drive–style preview) when no
 * custom `thumbnailUrl` is set. Loads only when the card scrolls near the viewport.
 */
export function PdfFirstPagePreview({
  cardId,
  pdfUrl,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<{ destroy: () => Promise<void> } | null>(null);

  const [shouldLoad, setShouldLoad] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setShouldLoad(true), 0);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setShouldLoad(true);
      },
      { rootMargin: "240px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || rendered || failed) return;

    const ac = new AbortController();
    let cancelled = false;

    const run = async () => {
      const container = wrapRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const measure = () => ({
        cw: container.clientWidth,
        ch: container.clientHeight,
      });

      let { cw, ch } = measure();
      if (cw < 4 || ch < 4) {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        ({ cw, ch } = measure());
      }
      if (cw < 4 || ch < 4) return;

      try {
        const res = await fetch(pdfUrl, { signal: ac.signal });
        if (!res.ok) throw new Error("pdf fetch");

        const buf = await res.arrayBuffer();
        const data = new Uint8Array(buf);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument({
          data,
          disableRange: true,
          disableStream: true,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) {
          await pdf.destroy().catch(() => {});
          return;
        }

        docRef.current = pdf;

        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(cw / base.width, ch / base.height);
        const viewport = page.getViewport({ scale });

        const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
        const rw = Math.floor(viewport.width * dpr);
        const rh = Math.floor(viewport.height * dpr);

        canvas.width = rw;
        canvas.height = rh;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");

        const task = page.render({
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });

        await task.promise;

        page.cleanup();
        docRef.current = null;
        await pdf.destroy().catch(() => {});

        if (!cancelled) setRendered(true);
      } catch (e) {
        if (ac.signal.aborted || (e as Error).name === "AbortError") return;
        const d = docRef.current;
        docRef.current = null;
        if (d) void d.destroy().catch(() => {});
        if (!cancelled) setFailed(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
      ac.abort();
      const d = docRef.current;
      docRef.current = null;
      if (d) void d.destroy().catch(() => {});
    };
  }, [shouldLoad, rendered, failed, cardId, pdfUrl]);

  return (
    <div
      ref={wrapRef}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[#eceff1] ${className}`}
    >
      {(!rendered || failed) && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <PdfThumbnailPlaceholder className="from-[#eceff1] via-[#f5f6f8] to-[#eceff1]" />
        </div>
      )}
      {!failed ? (
        <canvas
          ref={canvasRef}
          className={`relative z-0 max-h-full max-w-full rounded-[1px] object-contain shadow-[0_1px_4px_rgb(0_0_0/0.12)] transition-opacity duration-300 ease-out ${
            rendered ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
