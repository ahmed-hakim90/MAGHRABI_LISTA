"use client";

type Props = { fileUrl: string; title: string };

export function PdfViewer({ fileUrl, title }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#525659]">
      <iframe
        title={title}
        src={`${fileUrl}#toolbar=1&navpanes=0`}
        className="h-[calc(100dvh-3.5rem)] w-full flex-1 border-0 sm:h-[calc(100dvh-4rem)]"
      />
    </div>
  );
}
