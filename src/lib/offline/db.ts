import Dexie, { Table } from "dexie";
import { OfflineSyncItem, EnterpriseDTO, CategoryDTO, ReceivableDTO } from "../types";

export class FarmPulseDexieDB extends Dexie {
  pendingTransactions!: Table<OfflineSyncItem, string>;
  cachedEnterprises!: Table<EnterpriseDTO, string>;
  cachedCategories!: Table<CategoryDTO, string>;
  cachedReceivables!: Table<ReceivableDTO, string>;

  constructor() {
    super("FarmPulseOfflineDB");
    this.version(1).stores({
      pendingTransactions: "localId, farmId, status, createdAt",
      cachedEnterprises: "id, farmId, enterpriseTypeCode",
      cachedCategories: "id, farmId, type",
      cachedReceivables: "id, farmId, status",
    });
  }
}

export const offlineDB = typeof window !== "undefined" ? new FarmPulseDexieDB() : (null as any);
