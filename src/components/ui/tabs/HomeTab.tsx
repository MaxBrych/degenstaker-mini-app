"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits, zeroAddress, encodeFunctionData } from "viem";
import { useAccount, useReadContract, useWriteContract, useSendTransaction } from "wagmi";
import { base } from "wagmi/chains";
import { NumericFormat } from "react-number-format";
import NumberFlow from "@number-flow/react";
import { STAKER_ABI, STAKER_ADDRESS, ERC20_ABI, DEGEN_ADDRESS } from "~/lib/staking";
import { useMiniApp } from "@neynar/react";
import { useSession } from "next-auth/react";
// import { NeynarAuthButton } from "../NeynarAuthButton";

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
  }, [address, context]);

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
    <div className="space-y-6 px-0 w-full max-w-md mx-auto">
      {/* Stats cards row */}
      <div className="px-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/staked_icon.png" alt="staked" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-white/70 text-xs">Total Stackd</div>
                <div className="text-white text-xl font-semibold">
                  {(() => {
                    const v = investMin?.data ? Number(formatUnits(investMin.data as bigint, 18)) : 233.342;
                    return v.toLocaleString(undefined, { maximumFractionDigits: 3 });
                  })()}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/investors_icon.png" alt="investors" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-white/70 text-xs">Investors</div>
                <div className="text-white text-xl font-semibold">233</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Plan card follows */}

      {/* Mobile: horizontal scrollable row with snapping */}
      <div className="md:hidden px-6">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4">
          {[0,1,2].map((idx) => (
            <div key={idx} className="snap-center shrink-0 w-[85%]">
              <StakingCard
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
            </div>
          ))}
        </div>
      </div>
      {/* Desktop: three-column grid */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-4 px-6">
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

      <div className="px-6">
        <DepositsList address={address as `0x${string}` | undefined} />
      </div>

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
  const [snoozeDays, setSnoozeDays] = useState<string>('0');
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const { sendTransaction } = useSendTransaction();

  const planInfo = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getPlanInfo', args: [planIndex], chainId: base.id });
  const allowance = useReadContract({ address: DEGEN_ADDRESS, abi: ERC20_ABI, functionName: 'allowance', args: [address ?? zeroAddress, STAKER_ADDRESS], chainId: base.id });
  const depositAmount = useMemo(() => { try { return parseUnits(amount && amount.length>0 ? amount : '0', 18);} catch { return 0n;} }, [amount]);
  const result = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getResult', args: [planIndex, depositAmount], chainId: base.id });

  // Profit number from contract result (animated via AnimatedNumber)
  const rawProfit = (result.data ? (result.data as any)[1] as bigint : 0n);
  const profitNumber = useMemo(() => {
    try { return Number(formatUnits(rawProfit, 18)); } catch { return 0; }
  }, [rawProfit]);

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
      const ref = zeroAddress as `0x${string}`;
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

  // Minimal design only exposes Snooze All for extended days

  const time = planInfo.data ? (planInfo.data as any)[0] as bigint : undefined;
  const percent = planInfo.data ? (planInfo.data as any)[1] as bigint : undefined;

  const active = depositAmount > 0n && profitNumber > 0;
  const dailyPercent = percent ? (Number(percent) / 10).toFixed(1) : undefined;
  const days = time ? Number(time) : undefined;

  return (
    <div className="relative max-w-sm mx-auto">
      <div
        className={`relative h-[520px] rounded-3xl p-6 transition-colors duration-500 overflow-hidden border border-white/15 ${
          active ? 'text-white bg-white/10' : 'bg-white/5 text-white'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-10 top-24 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl" />
          <div className="absolute -left-10 bottom-10 w-56 h-56 bg-purple-400/20 rounded-full blur-3xl" />
        </div>

        {/* Popular badge (centered) for plan 1 */}
        {planIndex === 1 && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
            <span className="bg-white text-purple-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Popular</span>
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illus/plan01.png" alt="plan" className="w-7 h-7" />
            <h3 className="font-semibold text-xl text-white">Growth Plan</h3>
          </div>
          <p className="text-white/70 text-sm">{dailyPercent ?? '—'}% daily • {days ?? '—'} days</p>
        </div>

        {/* Expected Profit */}
        <div className="relative z-10 text-center mb-6">
          <p className="text-white/80 text-sm mb-2">Expected Profit</p>
          <div className="mb-1">
            <NumberFlow
              value={profitNumber}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              className="text-6xl font-extrabold leading-tight drop-shadow-lg"
              style={{ color: '#d3b5ff' }}
            />
          </div>
          <p className="text-white/80 text-sm font-medium">$DEGEN</p>
        </div>

        {/* Amount input */}
        <div className="relative z-10 mb-6">
          <label className="block text-sm font-medium mb-2 text-white/80">Investment Amount</label>
          <NumericFormat
            placeholder="1 DEGEN"
            value={amount}
            onValueChange={(values)=> setAmount(values.value)}
            thousandSeparator
            decimalScale={2}
            allowNegative={false}
            className={`w-full px-4 py-3 rounded-xl text-base font-semibold transition-all bg-white/10 text-white placeholder-white/60 border border-white/20 focus:border-white/40 focus:outline-none focus:ring-0`}
          />
        </div>

        {/* Actions */}
        <div className="relative z-10 space-y-3 mb-4">
          <button
            onClick={approveThenInvest}
            disabled={!address || isPending || depositAmount<=0n}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-base transition-all bg-white text-purple-900 hover:bg-white/90`}
          >
            Invest
          </button>
          <button
            onClick={withdraw}
            disabled={disabled || isPending}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-base transition-all bg-white/10 hover:bg-white/15 text-white border border-white/20`}
          >
            Withdraw
          </button>
        </div>

        {/* Advanced options */}
        <div className="relative z-10">
          <button
            onClick={() => setAdvancedOpen(o=>!o)}
            className={`flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors`}
          >
            <span className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            Advanced options
          </button>

          {advancedOpen && (
            <div className={`mt-3 p-4 rounded-2xl space-y-3 bg-white/5 border border-white/15`}>
              <div>
                <label className={`block text-xs font-medium mb-1 text-white/80`}>Extend Lock Period (days)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    value={snoozeDays}
                    onChange={(e)=>setSnoozeDays(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 focus:border-white/40 focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={snoozeAll}
                    disabled={disabled}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-white text-purple-900 hover:bg-white/90`}
                  >
                    Snooze
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DepositsList({ address }: { address?: `0x${string}` }) {
  const deposits = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getUserDeposits', args: [address ?? zeroAddress], chainId: base.id });
  const data = deposits.data as any[] | undefined;
  return (
    <div className="space-y-4">
      {!data?.length && (
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-white/70 text-sm">No deposits yet.</div>
      )}
      {data?.map((d, i) => {
        const now = Math.floor(Date.now()/1000);
        const finish = Number(d[5]);
        const remaining = Math.max(0, finish - now);
        const hrs = Math.floor(remaining / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        const amount = formatUnits(d[2] as bigint, 18);
        return (
          <div key={i} className="relative overflow-hidden bg-white/10 border border-white/15 rounded-3xl p-5">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illus/plan02.png" alt="chips" className="w-20 h-20" />
            </div>
            <div className="text-white/80 text-sm">Time remaining</div>
            <div className="text-white text-2xl font-extrabold tracking-tight">{Number(amount).toLocaleString()} $DEGEN</div>
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              <span className="w-5 h-5 text-white/80">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              <span className="text-white font-semibold tracking-wider">{String(hrs).padStart(2,'0')}:{String(mins).padStart(2,'0')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}