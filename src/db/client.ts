import { useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { getPersistentSqliteDb } from './init';

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

let drizzleDbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getSqliteDb = (): SQLite.SQLiteDatabase => {
  return getPersistentSqliteDb();
};

export const getDb = (): AppDatabase => {
  if (!drizzleDbInstance) {
    const sqlite = getSqliteDb();
    drizzleDbInstance = drizzle(sqlite, { schema });
  }
  return drizzleDbInstance;
};

export interface UseDatabaseResult {
  db: AppDatabase;
  isReady: boolean;
  error: Error | null;
}

export const useDatabase = (): UseDatabaseResult => {
  const [db, setDb] = useState<AppDatabase>(() => getDb());
  const [isReady, setIsReady] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const database = getDb();
      setDb(database);
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsReady(false);
    }
  }, []);

  return { db, isReady, error };
};
