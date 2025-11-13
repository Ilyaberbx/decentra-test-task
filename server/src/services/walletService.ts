import type { IWalletService } from "../abstractions/iwallet-service.js";

export class WalletService implements IWalletService {
  private balances: Record<string, number> = {};

  constructor(address: string, balance: number) {
    this.balances[address] = balance;
  }

  public async balanceOf(address: string): Promise<number> {
    return this.balances[address] ?? 0;
  }

  public async withdraw(address: string, amount: number): Promise<void> {
    this.balances[address] = (this.balances[address] ?? 0) - amount;
  }

  public async deposit(address: string, amount: number): Promise<void> {
    this.balances[address] = (this.balances[address] ?? 0) + amount;
  }
}
