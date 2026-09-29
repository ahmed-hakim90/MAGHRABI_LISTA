import type { ReactNode } from "react";

export const EL_MAGHRABY_LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ZMPNuyZs4CA6tw8s5zOxZpICr3odTB.png";

export function BrandGradient({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[linear-gradient(118deg,#ed1f26_0%,#b9141b_48%,#91050f_100%)] ${className}`}>
      {children}
    </div>
  );
}

export function BrandPattern({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -end-24 -top-28 size-80 rounded-[44%_44%_18%_18%] border-[26px] border-white/12 sm:size-[30rem]" />
      <div className="absolute -bottom-32 start-[42%] h-56 w-[38rem] -translate-x-1/2 rounded-[50%] border-[22px] border-white/12 sm:h-72" />
      <div className="absolute bottom-8 end-1/4 h-20 w-56 -rotate-[18deg] rounded-[50%] border-[10px] border-white/10" />
    </div>
  );
}

export function EmblemFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[42%_42%_16%_16%] ${className}`}>
      <div className="absolute inset-x-0 top-[42%] z-10 h-8 -skew-y-6 bg-white/90 sm:h-12" aria-hidden />
      <div className="absolute inset-x-0 top-[48%] z-10 h-8 skew-y-6 bg-[#ed1f26]/90 sm:h-12" aria-hidden />
      <div className="relative z-0 h-full w-full">{children}</div>
    </div>
  );
}

export function BrandSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`bg-[#fff2e3] ${className}`}>{children}</section>;
}

export function BrandLogo({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={`bg-white ${light ? "p-2" : ""} ${className}`}>
      <img
        src={EL_MAGHRABY_LOGO_URL}
        alt="المغربي — EL MAGHRABY"
        className="block h-full w-full object-contain"
      />
    </div>
  );
}
