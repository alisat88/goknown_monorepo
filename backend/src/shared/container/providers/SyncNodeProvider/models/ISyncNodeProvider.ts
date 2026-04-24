import { ISyncNodeDTO } from '../dtos/ISyncNodeDTO';

export default interface ISyncNodeProvider {
  sync(syncData: ISyncNodeDTO): void;
}
