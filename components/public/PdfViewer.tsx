"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fetchBlobWithProgress } from "@/lib/utils/fetchBlobWithProgress";

type Props = { fileUrl: string; title: string };

function subscribeCoarsePointer(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getCoarsePointerSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window
  );
}

function getCoarsePointerServerSnapshot(): boolean {
  return false;
}

/** Hash params: mobile built-in viewers often ignore or mishandle some fragments. */
function pdfFrameSrc(src: string, coarseTouch: boolean): string {
  if (coarseTouch) {
    return `${src}#toolbar=1&navpanes=1`;
  }
  return `${src}#toolbar=1&navpanes=0`;
}

export function PdfViewer({ fileUrl, title }: Props) {
  const coarseTouch = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getCoarsePointerServerSnapshot,
  );

  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  /** 0–1 while downloading; `null` = size unknown (indeterminate) */
  const [progress, setProgress] = useState<number | null>(0);
  const [frameReady, setFrameReady] = useState(false);

  useEffect(() => {
    let blobUrl: string | null = null;
    let cancelled = false;
    setDisplaySrc(null);
    setFrameReady(false);
    setProgress(0);

    if (coarseTouch) {
      queueMicrotask(() => {
        if (!cancelled) {
          setDisplaySrc(fileUrl);
          setProgress(1);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const blob = await fetchBlobWithProgress(fileUrl, (r) => {
          if (!cancelled) setProgress(r);
        });
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        setDisplaySrc(blobUrl);
        setProgress(1);
      } catch {
        if (cancelled) return;
        setProgress(null);
        setDisplaySrc(fileUrl);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [fileUrl, coarseTouch]);

  const bar = (
    <div className="w-full max-w-md">
      <ProgressBar label="جاري تحميل المستند…" value={progress} />
    </div>
  );

  return (
    <div className="relative flex min-h-0 flex-1 touch-manipulation flex-col overflow-hidden overscroll-none bg-[#525659]">
      {!displaySrc ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6">
          {bar}
        </div>
      ) : (
        <>
          {!frameReady ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#525659] px-6">
              {bar}
            </div>
          ) : null}
          <iframe
            title={title}
            src={pdfFrameSrc(displaySrc, coarseTouch)}
            onLoad={() => setFrameReady(true)}
            className="min-h-0 w-full flex-1 border-0"
          />
        </>
      )}
    </div>
  );
}
