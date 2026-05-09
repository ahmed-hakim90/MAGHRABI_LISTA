"use client";

type Props = {
  label: string;
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
  required?: boolean;
};

export function UploadField({
  label,
  accept,
  file,
  onFile,
  required,
}: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        type="file"
        accept={accept}
        className="block w-full text-sm text-muted file:me-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <p className="mt-1 text-xs text-muted">المحدد: {file.name}</p>
      ) : null}
    </label>
  );
}
