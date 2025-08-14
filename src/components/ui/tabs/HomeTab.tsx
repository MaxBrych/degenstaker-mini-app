"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits, zeroAddress, encodeFunctionData } from "viem";
import { useAccount, useReadContract, useWriteContract, useSendTransaction } from "wagmi";
import { base } from "wagmi/chains";
import { Button } from "../Button";
import { NumericFormat } from "react-number-format";
import NumberFlow from "@number-flow/react";
import AnimatedChart from "../AnimatedChart";
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

      {/* Mobile: horizontal scrollable row with snapping */}
      <div className="md:hidden">
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
      <div className="hidden md:grid md:grid-cols-3 md:gap-4">
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
        className={`relative h-[460px] rounded-xl p-6 transition-colors duration-500 overflow-hidden ${
          active ? 'text-black' : 'bg-gray-50 text-gray-900 border border-gray-200'
        }`}
        style={{ backgroundColor: active ? '#EDE6F7' as const : undefined }}
      >
        {active && (
          <div className="absolute inset-0">
            <AnimatedChart isActive={active} returnValue={profitNumber} color="purple" />
          </div>
        )}

        {/* Popular badge (centered) for plan 1 */}
        {planIndex === 1 && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
            <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Popular</span>
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-5 h-5 ${active ? 'text-black' : 'text-gray-700'}`}>
              {/* Simple upward trend icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 17l6-6 4 4 7-7"/><path d="M14 5h7v7"/></svg>
            </span>
            <h3 className={`font-semibold text-lg ${active ? 'text-black' : 'text-gray-900'}`}>Growth Plan</h3>
          </div>
          <p className={`text-sm ${active ? 'text-gray-700' : 'text-gray-500'}`}>{dailyPercent ?? '—'}% daily • {days ?? '—'} days</p>
        </div>

        {/* Expected Profit */}
        <div className="relative z-10 text-center mb-6">
          <p className={`text-sm mb-2 ${active ? 'text-gray-700' : 'text-gray-600'}`}>Expected Profit</p>
          <div className="mb-1">
            <NumberFlow
              value={profitNumber}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              className="text-4xl font-medium leading-tight"
              style={{ color: active ? '#240076' : '#9ca3af' }}
            />
          </div>
          <p className={`text-sm font-medium ${active ? 'text-gray-700' : 'text-gray-500'}`}>$DEGEN</p>
        </div>

        {/* Amount input */}
        <div className="relative z-10 mb-6">
          <label className={`block text-sm font-medium mb-2 ${active ? 'text-gray-700' : 'text-gray-700'}`}>Investment Amount</label>
          <NumericFormat
            placeholder="1 DEGEN"
            value={amount}
            onValueChange={(values)=> setAmount(values.value)}
            thousandSeparator
            decimalScale={2}
            allowNegative={false}
            className={`w-full px-4 py-2.5 rounded-md text-base font-medium transition-all bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-0`}
          />
        </div>

        {/* Actions */}
        <div className="relative z-10 space-y-2.5 mb-4">
          <button
            onClick={approveThenInvest}
            disabled={!address || isPending || depositAmount<=0n}
            className={`w-full py-2.5 px-4 rounded-md font-semibold text-sm transition-all ${
              active ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-black hover:bg-gray-800 text-white'
            }`}
          >
            Invest
          </button>
          <button
            onClick={withdraw}
            disabled={disabled || isPending}
            className={`w-full py-2.5 px-4 rounded-md font-semibold text-sm transition-all ${
              active ? 'bg-purple-300/30 hover:bg-purple-300/40 text-black border border-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300'
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Advanced options */}
        <div className="relative z-10">
          <button
            onClick={() => setAdvancedOpen(o=>!o)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              active ? 'text-gray-700 hover:text-black' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            Advanced options
          </button>

          {advancedOpen && (
            <div className={`mt-3 p-4 rounded-md space-y-3 ${active ? 'bg-white/50 border border-gray-300' : 'bg-white border border-gray-200'}`}>
              <div>
                <label className={`block text-xs font-medium mb-1 ${active ? 'text-gray-700' : 'text-gray-700'}`}>Extend Lock Period (days)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    value={snoozeDays}
                    onChange={(e)=>setSnoozeDays(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-md bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={snoozeAll}
                    disabled={disabled}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${active ? 'bg-purple-200 text-black hover:bg-purple-300 border border-gray-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}`}
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