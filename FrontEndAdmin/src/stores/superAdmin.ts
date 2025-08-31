import { makeAutoObservable } from 'mobx';
import { hydrateStore, makePersistable } from 'mobx-persist-store';

export class SuperAdminStore implements IStore {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  superAdmin: boolean = false;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: SuperAdminStore.name,
      properties: ['firstName', 'lastName', 'email', 'superAdmin'],
    });
  }
  clearSuperAdmin() {
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.superAdmin = false;
  }
  set<T extends keyof SuperAdminStore>(what: T, value: SuperAdminStore[T]) {
    (this as SuperAdminStore)[what] = value;
  }
  setMany<T extends StoreKeysOf<SuperAdminStore>>(
    obj: Record<T, SuperAdminStore[T]>,
  ) {
    for (const [k, v] of Object.entries(obj)) {
      this.set(k as T, v as SuperAdminStore[T]);
    }
  }

  hydrate = async (): PVoid => {
    await hydrateStore(this);
  };
}
