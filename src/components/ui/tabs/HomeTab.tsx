"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits, zeroAddress, encodeFunctionData } from "viem";
import { useAccount, useReadContract, useWriteContract, useSendTransaction } from "wagmi";
import { base } from "wagmi/chains";
import { Button } from "../Button";
import { STAKER_ABI, STAKER_ADDRESS, ERC20_ABI, DEGEN_ADDRESS } from "~/lib/staking";
import { useMiniApp } from "@neynar/react";
import { useSession } from "next-auth/react";
import { NeynarAuthButton } from "../NeynarAuthButton";

export function HomeTab() {
  const { context } = useMiniApp();
  const { address } = useAccount();
  const { data: session } = useSession();

  const isNeynarAuthed = (session as any)?.provider === 'neynar' || Boolean((session as any)?.user);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileState, setProfileState] = useState<'idle'|'loading'|'ok'|'error'>('idle');

  // Per-card state handled inside StakingCard components

  const investMin = useReadContract({
    address: STAKER_ADDRESS,
    abi: STAKER_ABI,
    functionName: "INVEST_MIN_AMOUNT",
    chainId: base.id,
  });

  const { writeContract, isPending } = useWriteContract();

  // Read user's deposits and checkpoint once to share with plan cards
  const userDeposits = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getUserDeposits', args: [address ?? zeroAddress], chainId: base.id });
  const userCheckpoint = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getUserCheckpoint', args: [address ?? zeroAddress], chainId: base.id });

  // Fetch Farcaster profile from Neynar using context FID first, fallback to EVM address
  useEffect(() => {
    let active = true;
    async function fetchProfile() {
      // Prefer Neynar user by FID (more reliable when inside Farcaster)
      const fid = (context as any)?.user?.fid;
      if (fid) {
        setProfileState('loading');
        try {
          const res = await fetch(`/api/user-by-fid?fid=${fid}`);
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error || 'lookup failed');
          const user = json?.result?.user || json?.user || null;
          if (active) { setProfile(user); setProfileState('ok'); }
          return;
        } catch (e) {
          // fall through to address lookup
        }
      }
      if (!address) { setProfile(null); setProfileState('idle'); return; }
      setProfileState('loading');
      try {
        const res = await fetch(`/api/user-by-eth?address=${address}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'lookup failed');
        // Try multiple shapes
        const user = json?.user || json?.result?.user || (Array.isArray(json?.users) ? json.users[0] : null);
        if (active) { setProfile(user); setProfileState('ok'); }
      } catch (e) {
        if (active) { setProfile(null); setProfileState('error'); }
      }
    }
    fetchProfile();
    return () => { active = false; };
  }, [address, context?.user?.fid]);

  // lightweight toast system
  type ToastType = 'success' | 'error';
  type ToastItem = { id: number; type: ToastType; message: string };
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notify = (type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  // Prefer immediate values from mini-app context for UI, then fallback to fetched profile
  const displayPfp = (context as any)?.user?.pfpUrl || (profile as any)?.pfp_url || '';
  const displayHandle = (context as any)?.user?.username || (profile as any)?.username || '';
  const displayFid = (context as any)?.user?.fid || (profile as any)?.fid || '-';

  return (
    <div className="space-y-4 px-4 w-full max-w-md mx-auto">
      {!isNeynarAuthed && !address && (
        <div className="rounded-md border border-gray-700 p-3 text-center space-y-2">
          <div className="text-sm font-medium">Sign in with Neynar to interact</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">You can explore plans and returns. Connect with Farcaster to invest, withdraw, or snooze.</p>
          <div className="flex justify-center">
            <NeynarAuthButton />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        {displayPfp ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayPfp} alt="pfp" className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700" />
        )}
        <div>
          <div className="text-sm font-medium">{displayHandle ? `@${displayHandle}` : 'Unknown user'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">FID: {displayFid}</div>
        </div>
      </div>
      <Stats address={address as `0x${string}` | undefined} />

      <div className="grid gap-3">
        {[0,1,2].map((idx) => (
          <StakingCard
            key={idx}
            planIndex={idx as 0|1|2}
            investMin={investMin.data as bigint | undefined}
            writeContract={writeContract}
            isPending={isPending}
            address={address as `0x${string}` | undefined}
            disabled={!address}
            notify={notify}
            deposits={userDeposits.data as any[] | undefined}
            checkpoint={userCheckpoint.data as bigint | undefined}
          />
        ))}
      </div>

      <DepositsList address={address as `0x${string}` | undefined} />

      {/* Toasts */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 space-y-2 z-50 w-[92%] max-w-sm">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-lg px-3 py-2 text-sm text-white shadow ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stats({ address }: { address?: `0x${string}` }) {
  const totalStaked = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'totalStaked', chainId: base.id });
  const totalUsers = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'totalUsers', chainId: base.id });
  const vault = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getContractBalance', chainId: base.id });
  const available = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getUserAvailable', args: [address ?? zeroAddress], chainId: base.id });
  const refBonus = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getUserReferralBonus', args: [address ?? zeroAddress], chainId: base.id });
  const deposits = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getUserAmountOfDeposits', args: [address ?? zeroAddress], chainId: base.id });

  const fmt = (v?: bigint) => (typeof v === 'bigint' ? formatUnits(v, 18) : '-');

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="text-xs text-gray-400">Total Staked</div>
        <div className="text-sm font-medium">{fmt(totalStaked.data as bigint)}</div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="text-xs text-gray-400">Users</div>
        <div className="text-sm font-medium">{totalUsers.data?.toString() ?? '-'}</div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="text-xs text-gray-400">Vault</div>
        <div className="text-sm font-medium">{fmt(vault.data as bigint)}</div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="text-xs text-gray-400">Available</div>
        <div className="text-sm font-medium">{fmt(available.data as bigint)}</div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="text-xs text-gray-400">Referral Bonus</div>
        <div className="text-sm font-medium">{fmt(refBonus.data as bigint)}</div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="text-xs text-gray-400"># Deposits</div>
        <div className="text-sm font-medium">{deposits.data?.toString() ?? '-'}</div>
      </div>
    </div>
  );
}

function StakingCard({ planIndex, investMin, writeContract, isPending, address, disabled, notify, deposits, checkpoint }: {
  planIndex: 0|1|2;
  investMin?: bigint;
  writeContract: ReturnType<typeof useWriteContract>['writeContract'];
  isPending: boolean;
  address?: `0x${string}`;
  disabled?: boolean;
  notify: (type: 'success' | 'error', message: string) => void;
  deposits?: any[];
  checkpoint?: bigint;
}) {
  const [amount, setAmount] = useState<string>('');
  const [referrer, setReferrer] = useState<string>('');
  const [snoozeDays, setSnoozeDays] = useState<string>('1');
  const [snoozeIndex, setSnoozeIndex] = useState<string>('0');
  const { sendTransaction } = useSendTransaction();

  const planInfo = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getPlanInfo', args: [planIndex], chainId: base.id });
  const allowance = useReadContract({ address: DEGEN_ADDRESS, abi: ERC20_ABI, functionName: 'allowance', args: [address ?? zeroAddress, STAKER_ADDRESS], chainId: base.id });
  const depositAmount = useMemo(() => { try { return parseUnits(amount && amount.length>0 ? amount : '0', 18);} catch { return 0n;} }, [amount]);
  const result = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getResult', args: [planIndex, depositAmount], chainId: base.id });

  // Animated profit number derived from contract result
  const rawProfit = (result.data ? (result.data as any)[1] as bigint : 0n);
  const profitNumber = useMemo(() => {
    try { return Number(formatUnits(rawProfit, 18)); } catch { return 0; }
  }, [rawProfit]);
  const [animatedProfit, setAnimatedProfit] = useState<number>(0);
  useEffect(() => {
    // Smooth animate between previous and next values
    let raf = 0;
    const start = performance.now();
    const startVal = animatedProfit;
    const delta = profitNumber - startVal;
    const duration = 600;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedProfit(startVal + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [profitNumber]);

  const approveThenInvest = async () => {
    if (!address || depositAmount <= 0n) return;
    try {
      const currentAllowance = (allowance.data as bigint | undefined) ?? 0n;
      if (currentAllowance < depositAmount) {
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [STAKER_ADDRESS, depositAmount],
        });
        await new Promise<void>((resolve, reject) => sendTransaction(
          { to: DEGEN_ADDRESS, data: approveData, chainId: base.id },
          { onSuccess: () => { notify('success', 'Approval successful'); resolve(); }, onError: (e) => { notify('error', `Approval failed: ${String((e as any)?.message || e)}`); reject(e); } }
        ));
      }
      const ref = /^0x[0-9a-fA-F]{40}$/.test(referrer) ? (referrer as `0x${string}`) : (zeroAddress as `0x${string}`);
      const investData = encodeFunctionData({
        abi: STAKER_ABI,
        functionName: 'invest',
        args: [ref, planIndex, depositAmount],
      });
      await new Promise<void>((resolve, reject) => sendTransaction(
        { to: STAKER_ADDRESS, data: investData, chainId: base.id },
        { onSuccess: () => { notify('success', `Invested in plan ${planIndex}`); resolve(); }, onError: (e) => { notify('error', `Invest failed: ${String((e as any)?.message || e)}`); reject(e); } }
      ));
    } catch {}
  };

  const withdraw = () => {
    // Check if any deposit is withdrawable according to contract logic
    // A deposit becomes withdrawable when block.timestamp > finish AND user.checkpoint < finish
    const nowSec = BigInt(Math.floor(Date.now() / 1000));
    const hasMatured = (deposits || []).some((d) => {
      const finish = BigInt(d[5]);
      return nowSec > finish && (checkpoint ?? 0n) < finish;
    });
    if (!hasMatured) {
      // Show earliest remaining time for this plan if any deposits of this plan exist
      const planDeposits = (deposits || []).filter((d) => Number(d[0]) === planIndex);
      if (planDeposits.length > 0) {
        const nextFinish = planDeposits.map((d) => BigInt(d[5])).sort((a,b)=> Number(a-b))[0];
        const msLeft = Number((nextFinish - BigInt(Math.floor(Date.now()/1000))) * 1000n);
        if (msLeft > 0) {
          const hrs = Math.ceil(msLeft / (1000 * 60 * 60));
          notify('error', `You can withdraw after the staking period ends. Time remaining: ~${hrs}h`);
        } else {
          notify('error', 'No dividends available yet. Try again later.');
        }
      } else {
        notify('error', 'No matured deposits to withdraw yet.');
      }
      return;
    }
    writeContract(
      { address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'withdraw', args: [], chainId: base.id },
      { onSuccess: () => notify('success', 'Withdrawn successfully'), onError: (e) => notify('error', `Withdraw failed: ${String((e as any)?.message || e)}`) }
    );
  };

  const snoozeAll = () => {
    const data = encodeFunctionData({ abi: STAKER_ABI, functionName: 'snoozeAll', args: [BigInt(Number(snoozeDays||'1'))] });
    sendTransaction(
      { to: STAKER_ADDRESS, data, chainId: base.id },
      { onSuccess: () => notify('success', `Snoozed all by ${snoozeDays} day(s)`), onError: (e) => notify('error', `Snooze all failed: ${String((e as any)?.message || e)}`) }
    );
  };

  const snoozeAt = () => {
    const data = encodeFunctionData({ abi: STAKER_ABI, functionName: 'snoozeAt', args: [BigInt(Number(snoozeIndex||'0')), BigInt(Number(snoozeDays||'1'))] });
    sendTransaction(
      { to: STAKER_ADDRESS, data, chainId: base.id },
      { onSuccess: () => notify('success', `Snoozed #${snoozeIndex} by ${snoozeDays} day(s)`), onError: (e) => notify('error', `Snooze failed: ${String((e as any)?.message || e)}`) }
    );
  };

  const time = planInfo.data ? (planInfo.data as any)[0] as bigint : undefined;
  const percent = planInfo.data ? (planInfo.data as any)[1] as bigint : undefined;

  const active = depositAmount > 0n;
  const dailyPercent = percent ? (Number(percent) / 10).toFixed(1) : undefined;
  const days = time ? Number(time) : undefined;

  // Chart scale reacts to profit and animates with CSS transform
  const normalizedForChart = Math.max(0.08, Math.min(1, (profitNumber || 0) / 1000));

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 space-y-4 transition-colors ${active ? 'border-violet-400 bg-gradient-to-b from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/20' : 'border-gray-200 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800'}`}>
      {/* Popular pill when active */}
      {active && (
        <div className="absolute -top-2 left-4">
          <span className="text-[10px] uppercase tracking-wide bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-2 py-1 rounded-full shadow">Popular</span>
        </div>
      )}

      {/* Decorative chart shape */}
      <div className="pointer-events-none absolute -bottom-14 -right-10 h-48 w-48">
        <svg viewBox="0 0 100 100" className="h-full w-full opacity-60">
          <defs>
            <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={active ? '#8B5CF6' : '#D1D5DB'} stopOpacity="0.8" />
              <stop offset="100%" stopColor={active ? '#A78BFA' : '#E5E7EB'} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <g style={{ transform: `scaleY(${normalizedForChart})`, transformOrigin: '100% 100%', transition: 'transform 400ms ease' }}>
            <path d="M0,80 C20,60 40,90 60,70 C75,60 85,70 100,55 L100,100 L0,100 Z" fill="url(#g1)" />
          </g>
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className={`flex items-center gap-2 text-sm font-semibold ${active ? 'text-violet-900 dark:text-violet-100' : 'text-gray-800 dark:text-gray-200'}`}>
          <span>Growth Plan</span>
        </div>
        <div className={`text-xs ${active ? 'text-violet-700/80 dark:text-violet-300/80' : 'text-gray-500'}`}>
          {dailyPercent && days ? `${dailyPercent}% daily • ${days} days` : '—'}
        </div>
      </div>

      {/* Expected Profit */}
      <div className="relative z-10 text-center py-2">
        <div className={`text-xs ${active ? 'text-violet-800/80 dark:text-violet-200/80' : 'text-gray-500'}`}>Expected Profit</div>
        <div className={`font-extrabold tracking-tight ${active ? 'text-violet-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`} style={{ fontSize: '40px', lineHeight: 1 }}>
          {Number.isFinite(animatedProfit) ? animatedProfit.toFixed(2) : '0.00'}
        </div>
        <div className={`text-xs ${active ? 'text-violet-900/70 dark:text-violet-200/70' : 'text-gray-500'}`}>$DEGEN</div>
      </div>

      {/* Amount input */}
      <div className="relative z-10">
        <label className={`block text-[11px] mb-1 ${active ? 'text-violet-900/80 dark:text-violet-100/80' : 'text-gray-600'}`}>Investment Amount</label>
        <input
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          placeholder={investMin? `${formatUnits(investMin,18)} DEGEN` : '1 DEGEN'}
          className={`input text-sm ${active ? 'bg-white/90 border-violet-300 focus:border-violet-500 focus:ring-violet-500' : ''}`}
        />
      </div>

      {/* Actions */}
      <div className="relative z-10 grid grid-cols-2 gap-2">
        <Button
          onClick={approveThenInvest}
          disabled={!address || isPending || depositAmount<=0n}
          className={`${active ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white' : 'bg-black text-white hover:bg-gray-900'} border-0 w-full`}
        >
          Invest
        </Button>
        <Button
          onClick={withdraw}
          disabled={disabled || isPending}
          className={`${active ? 'bg-violet-300/50 text-violet-900 border border-violet-400 hover:bg-violet-300/70' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-100'} w-full`}
        >
          Withdraw
        </Button>
      </div>

      {/* Advanced options */}
      <details className="relative z-10">
        <summary className={`text-xs cursor-pointer ${active ? 'text-violet-900/80 dark:text-violet-200/80' : 'text-gray-600'}`}>Advanced options</summary>
        <div className="mt-2 grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="block text-xs mb-1">Days</label>
            <input value={snoozeDays} onChange={(e)=>setSnoozeDays(e.target.value)} className="input text-sm" />
          </div>
          <Button onClick={snoozeAll} className="w-full" variant="outline" disabled={disabled}>Snooze All</Button>
          <div>
            <label className="block text-xs mb-1">Index</label>
            <input value={snoozeIndex} onChange={(e)=>setSnoozeIndex(e.target.value)} className="input text-sm" />
          </div>
          <div className="col-span-2">
            <Button onClick={snoozeAt} className="w_full" variant="outline" disabled={disabled}>Snooze At</Button>
          </div>
        </div>
      </details>
    </div>
  );
}

function DepositsList({ address }: { address?: `0x${string}` }) {
  const deposits = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getUserDeposits', args: [address ?? zeroAddress], chainId: base.id });
  const data = deposits.data as any[] | undefined;
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Your Deposits</div>
      {!data?.length && <div className="text-xs text-gray-500">No deposits yet.</div>}
      {data?.map((d, i) => (
        <div key={i} className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs grid grid-cols-2 gap-2">
          <div><span className="text-gray-400">Plan</span><div className="font-medium">{Number(d[0])}</div></div>
          <div><span className="text-gray-400">Amount</span><div className="font-medium">{formatUnits(d[2] as bigint, 18)} DEGEN</div></div>
          <div><span className="text-gray-400">Profit</span><div className="font-medium">{formatUnits(d[3] as bigint, 18)} DEGEN</div></div>
          <div className="flex items-center gap-2">
            <div>
              <span className="text-gray-400">Finish</span>
              <div className="font-medium">{new Date(Number(d[5]) * 1000).toLocaleDateString()}</div>
            </div>
            {(() => {
              const now = Math.floor(Date.now()/1000);
              const finish = Number(d[5]);
              const remaining = finish - now;
              const ready = remaining <= 0;
              return (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${ready ? 'bg-green-600 text-white' : 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300'}`}>
                  {ready ? 'Ready' : `~${Math.ceil(remaining/3600)}h`}
                </span>
              );
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}