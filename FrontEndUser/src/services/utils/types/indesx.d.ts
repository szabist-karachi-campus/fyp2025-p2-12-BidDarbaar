type PureFunc = () => void;
interface IService {
  init: () => PVoid;
}

type PVoid = Promise<void>;
interface IStore {
  hydrate?: () => PVoid;
}
type StoreKeysOf<S> = keyof Omit<S, StoreDefaultKeys>;
