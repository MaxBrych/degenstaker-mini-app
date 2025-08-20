"use client";

import { useMemo } from "react";
import { useMiniApp } from "@neynar/react";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

export function Header({ neynarUser: _neynarUser }: HeaderProps) {
  const { context } = useMiniApp();

  const displayPfp = (context as any)?.user?.pfpUrl || "";
  const displayHandle = (context as any)?.user?.username || "";

  const subtitle = useMemo(() => {
    if (displayHandle) return `@${displayHandle}`;
    return "@anonymous";
  }, [displayHandle]);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-4">
        {displayPfp ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayPfp} alt="pfp" className="w-12 h-12 rounded-full ring-2 ring-white/20" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 ring-2 ring-white/10" />
        )}
        <div className="flex flex-col">
          <span className="text-white/80 text-sm">GM Degen</span>
          <span className="text-white text-lg font-semibold leading-tight">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
