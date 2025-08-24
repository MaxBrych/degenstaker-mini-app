"use client";

import { useMemo, useState } from "react";
import { formatUnits, parseUnits, zeroAddress, encodeFunctionData } from "viem";
import { useAccount, useReadContract, useWriteContract, useSendTransaction } from "wagmi";
import { base } from "wagmi/chains";
import { NumericFormat } from "react-number-format";
import NumberFlow from "@number-flow/react";
import AnimatedChart from "../AnimatedChart";
import { STAKER_ABI, STAKER_ADDRESS, ERC20_ABI, DEGEN_ADDRESS } from "~/lib/staking";
import { useWithdraw } from "~/hooks/useWithdraw";
// import { NeynarAuthButton } from "../NeynarAuthButton";

export function HomeTab() {
  const { address } = useAccount();

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

  // lightweight toast system
  type ToastType = 'success' | 'error';
  type ToastItem = { id: number; type: ToastType; message: string };
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notify = (type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  // mini app context not required for this view

  // On-chain stats for header cards
  const totalStaked = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'totalStaked', chainId: base.id });
  const totalUsers = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'totalUsers', chainId: base.id });

  return (
    <div className="space-y-6 px-0 w-full max-w-md mx-auto">
      {/* Stats cards row */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg p-4 bg-[#3B2887]">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/staked_icon.webp" alt="staked" className="h-10 w-10" />
              <div>
                <div className="text-white/70 text-xs">Total Stacked</div>
                <div className="text-white text-xl font-semibold">
                  {totalStaked.data ? Number(formatUnits(totalStaked.data as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4 bg-[#3B2887]">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/investors_icon.webp" alt="investors" className="h-10 w-10" />
              <div>
                <div className="text-white/70 text-xs">Investors</div>
                <div className="text-white text-xl font-semibold">{totalUsers.data?.toString() ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Plan card follows */}

      {/* Mobile: horizontal scrollable row with snapping */}
      <div className="md:hidden ">
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
      <div className="hidden md:grid md:grid-cols-3 md:gap-4 px-4">
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

      <div className="px-4">
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

  // snooze removed in new UI

  // Minimal design only exposes Snooze All for extended days

  const time = planInfo.data ? (planInfo.data as any)[0] as bigint : undefined;
  const percent = planInfo.data ? (planInfo.data as any)[1] as bigint : undefined;

  const active = depositAmount > 0n && profitNumber > 0;
  const dailyPercent = percent ? (Number(percent) / 10).toFixed(1) : undefined;
  const days = time ? Number(time) : undefined;

  return (
    <div className="relative max-w-sm mx-auto">
      <div
        className={`relative min-h-[520px] rounded-md p-6 transition-all duration-300 overflow-hidden ${
          active
            ? 'bg-gradient-to-b from-[#342768] to-[#854CFE] text-white border border-white/20'
            : 'bg-[#342768] text-white'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedChart isActive={true} returnValue={profitNumber} color="purple" />
        </div>

        {/* Popular badge (centered) for plan 1 */}
        {planIndex === 1 && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
            <span className="bg-white text-purple-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Popular</span>
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 mb-4 flex items-center gap-3">
        <img src={planIndex === 0 ? '/illus/plan01.webp' : planIndex === 1 ? '/illus/plan02.webp' : '/illus/plan03.webp'} alt="plan" className="w-12 h-12" />

          <div >
            <h3 className="font-semibold text-xl text-white">
              {planIndex === 0 ? 'Low risk' : planIndex === 1 ? 'Medium risk' : 'High risk'}
            </h3>
            <p className="text-white/70 text-sm">{dailyPercent ?? '—'}% daily • {days ?? '—'} days</p>
          </div>
        </div>

        {/* Expected Profit */}
        <div className="relative z-10 text-center mb-6 py-6">
          <p className="text-white/80 text-sm mb-2">Expected Profit</p>
          <div className="mb-1 inline-block max-w-full">
            <NumberFlow
              value={profitNumber}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              className="text-6xl font-medium leading-tight tracking-tight drop-shadow-lg break-words"
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
        </div>

        {/* Advanced options removed per new design */}
      </div>
    </div>
  );
}

function DepositsList({ address }: { address?: `0x${string}` }) {
  const deposits = useReadContract({ address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: 'getUserDeposits', args: [address ?? zeroAddress], chainId: base.id });
  const data = (deposits.data as any[] | undefined) || [];

  // Pick latest deposit by finish time if multiple
  const latest = data.length
    ? [...data].sort((a,b)=> Number(b[5]) - Number(a[5]))[0]
    : undefined;

  if (!latest) {
    return (
      <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-white/70 text-sm">No deposits yet.</div>
    );
  }

  const { withdraw } = useWithdraw();
  const planIndex = Number(latest[0]) as 0|1|2;
  const amount = Number(formatUnits(latest[2] as bigint, 18));
  const profit = Number(formatUnits(latest[3] as bigint, 18));
  const finish = Number(latest[5]);
  const now = Math.floor(Date.now()/1000);
  const remaining = Math.max(0, finish - now);
  const hrs = String(Math.floor(remaining / 3600)).padStart(2,'0');
  const mins = String(Math.floor((remaining % 3600) / 60)).padStart(2,'0');
  const title = planIndex === 0 ? 'Low risk' : planIndex === 1 ? 'Medium risk' : 'High risk';
  const illus = planIndex === 0 ? '/illus/plan01.webp' : planIndex === 1 ? '/illus/plan02.webp' : '/illus/plan03.webp';

  const canWithdraw = now > finish;

  return (
    <div className="relative overflow-hidden bg-white/10 border border-white/15 rounded-xl p-5">
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={illus} alt={title} className="w-14 h-14" />
        <div className="flex-1">
          <div className="text-white/80 text-sm">{title}</div>
          <div className="text-white text-2xl font-medium tracking-tight">
            {profit.toLocaleString(undefined,{ maximumFractionDigits: 2 })} $DEGEN
          </div>
        </div>
        {canWithdraw ? (
          <button onClick={() => withdraw()} className="px-4 py-2 rounded bg-white text-purple-900 font-semibold">Withdraw</button>
        ) : (
          <div className="inline-flex items-center gap-2 bg-[#2c1e6b] border border-transparent rounded px-3 py-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="font-mono tracking-wider text-white">{hrs}:{mins}</span>
          </div>
        )}
      </div>
    </div>
  );
}