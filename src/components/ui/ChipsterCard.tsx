"use client";

import Link from "next/link";

export function ChipsterCard() {
  return (
    <div >
      <div className="relative overflow-hidden rounded-xl bg-[#4B2972] p-4">
        {/* Illustration */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illus/chipster.webp"
          alt="Chipster"
          className="absolute left-4 bottom-0 h-[104px] w-auto pointer-events-none select-none"
          
        />

        <div className="ml-[96px] pr-2">
          <div className="text-white text-md font-medium leading-snug mb-4">
            
            GM frens, Chipster here 🐇💸
          </div>
          <div className="text-white text-md leading-snug mt-1">
            DYOR, check out the <span className="font-medium">{"    "}</span>
            <Link href="https://basescan.org/address/0xE62c75eb9981BbcA724401C61e10C936f4E9773d" target="_blank" className="underline font-medium">
              Smart Contract
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
