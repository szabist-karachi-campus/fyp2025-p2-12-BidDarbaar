import { makeAutoObservable } from 'mobx';
import { hydrateStore, makePersistable } from 'mobx-persist-store';

export class AuthStore implements IStore {
  user: any;
  logout() {
    this.setMany({
      token: '',
      expiresAt: '',
      user: null,
      superAdmin: false,
    });
  }
  token: string = '';
  expiresAt: string = '';
  loggedInAt: Date = new Date();
  superAdmin: boolean = false;
  deviceToken: string = '';
  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: AuthStore.name,
      properties: ['token', 'expiresAt', 'deviceToken', 'superAdmin'],
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
}
