export interface ICronService {
  startJobs(): void;
  syncCards(): Promise<void>;
  isSyncing(): boolean;
}
