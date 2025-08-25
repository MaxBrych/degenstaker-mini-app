import { parseAbi } from "viem";

export const STAKER_ADDRESS = "0xE62c75eb9981BbcA724401C61e10C936f4E9773d" as const;
export const DEGEN_ADDRESS = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" as const;

export const STAKER_ABI = parseAbi([
  "function INVEST_MIN_AMOUNT() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function totalUsers() view returns (uint256)",
  "function getContractBalance() view returns (uint256)",
  "function getPlanInfo(uint8 plan) view returns (uint256 time, uint256 percent)",
  "function getResult(uint8 plan, uint256 deposit) view returns (uint256 percent, uint256 profit, uint256 finish, uint256 tax)",
  // Use unnamed tuple for compatibility with abitype parser
  "function getUserDeposits(address user) view returns ((uint8,uint256,uint256,uint256,uint256,uint256,uint256)[])",
  "function getUserAvailable(address user) view returns (uint256)",
  "function getUserReferralBonus(address user) view returns (uint256)",
  "function getUserAmountOfDeposits(address user) view returns (uint256)",
  "function getUserCheckpoint(address user) view returns (uint256)",
  "function invest(address referrer, uint8 plan, uint256 amount)",
  "function withdraw()",
  "function snoozeAll(uint256 days)",
  "function snoozeAt(uint256 index, uint256 days)",
]);

export const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
]);
