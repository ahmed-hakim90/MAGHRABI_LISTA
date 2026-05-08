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
      <span className="mb-1 block text-sm font-medium text-[#2F3437]">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        type="file"
        accept={accept}
        className="block w-full text-sm text-[#6B6B6B] file:mr-3 file:rounded-lg file:border-0 file:bg-[#F7F6F3] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#2F3437]"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <p className="mt-1 text-xs text-[#6B6B6B]">Selected: {file.name}</p>
      ) : null}
    </label>
  );
}
