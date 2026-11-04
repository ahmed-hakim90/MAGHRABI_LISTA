"use client";

import Image from "next/image";

const CAMPAIGN_SRC = "/campaigns/sokany-white-friday.jpg";
const CAMPAIGN_ALT =
  "سوكاني وايت فرايداي — رغم غلاء الدولار مكملين معاكم بنفس الأسعار";

/**
 * Wholesale home campaign banner. Replaces the previous compact text intro
 * on `/wholesale` with the current Sokany White Friday artwork.
 */
export function WholesaleMasthead() {
  return (
    <section className="relative bg-black" aria-label={CAMPAIGN_ALT}>
      <div className="relative mx-auto w-full max-w-[1320px]">
        <Image
          src={CAMPAIGN_SRC}
          alt={CAMPAIGN_ALT}
          width={1024}
          height={341}
          priority
          className="h-auto w-full"
          sizes="(min-width: 1320px) 1320px, 100vw"
        />
      </div>
    </section>
  );
}
