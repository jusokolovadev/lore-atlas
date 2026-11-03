export interface DatabaseMigration {
  version: number;
  up: (database: IDBDatabase) => void;
}
