export interface IWalletService {
  balanceOf(address: string): Promise<number>;
  withdraw(address: string, amount: number): Promise<void>;
  deposit(address: string, amount: number): Promise<void>;
}
