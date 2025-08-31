import { makeAutoObservable } from 'mobx';
import { hydrateStore, makePersistable } from 'mobx-persist-store';

export class AuthStore implements IStore {
  token: string = '';
  expiresAt: string = '';
  deviceToken: string = '';
  walletBalance: number = 0;
  loggedInDate: Date | null = null;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: AuthStore.name,
      properties: ['token', 'expiresAt', 'deviceToken', 'walletBalance', 'loggedInDate'],
    });
  }

  set<T extends keyof AuthStore>(what: T, value: AuthStore[T]) {
    (this as AuthStore)[what] = value;
  }

  setMany<T extends StoreKeysOf<AuthStore>>(obj: Record<T, AuthStore[T]>) {
    for (const [k, v] of Object.entries(obj)) {
      this.set(k as T, v as AuthStore[T]);
    }
  }

  hydrate = async (): PVoid => {
    await hydrateStore(this);
  };

  parseDuration(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000; 
      case 'h':
        return value * 60 * 60 * 1000; 
      case 'm':
        return value * 60 * 1000; 
      default:
        throw new Error('Invalid duration format');
    }
  }

  isTokenExpired(): boolean {
  if (!this.loggedInDate || !this.expiresAt) return true;

  const loggedInDateObj = new Date(this.loggedInDate);

  const expiryDuration = this.parseDuration(this.expiresAt);
  const expiryTime = loggedInDateObj.getTime() + expiryDuration;

  return Date.now() > expiryTime;
}
}