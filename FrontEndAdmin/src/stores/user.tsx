import { makeAutoObservable } from 'mobx';
import { hydrateStore, makePersistable } from 'mobx-persist-store';
export type UserType = 'auctionHouse' | 'auctionHouseUser';
export type jobTitle = 'lister' | 'sales' | 'admin';
export class UserStore implements IStore {
  userType: UserType = 'auctionHouse';
  jobTitle: jobTitle = 'admin';
  user: any = null;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: UserStore.name,
      properties: ['userType', 'jobTitle', 'user'],
    });
  }

  set<T extends keyof UserStore>(what: T, value: UserStore[T]) {
    (this as UserStore)[what] = value;
  }
  setMany<T extends StoreKeysOf<UserStore>>(obj: Record<T, UserStore[T]>) {
    for (const [k, v] of Object.entries(obj)) {
      this.set(k as T, v as UserStore[T]);
    }
  }
  setUserType(userType: UserType) {
    this.userType = userType;
  }
  hydrate = async (): PVoid => {
    try {
      await hydrateStore(this);
      console.log('Hydrated user:', this.user);
    } catch (error) {
      console.error('Error during hydration:', error);
    }
  };
}
