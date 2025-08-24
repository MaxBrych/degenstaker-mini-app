"use client";

import { useCallback } from "react";
import { useWriteContract } from "wagmi";
import { STAKER_ABI, STAKER_ADDRESS } from "~/lib/staking";
import { base } from "wagmi/chains";

export type WithdrawCallbacks = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function useWithdraw() {
  const { writeContract, isPending } = useWriteContract();

  const withdraw = useCallback(
    (callbacks?: WithdrawCallbacks) => {
      writeContract(
        { address: STAKER_ADDRESS, abi: STAKER_ABI, functionName: "withdraw", args: [], chainId: base.id },
        {
          onSuccess: () => callbacks?.onSuccess?.(),
          onError: (e) => callbacks?.onError?.(e),
        }
      );
    },
    [writeContract]
  );

  return { withdraw, isPending } as const;
}
