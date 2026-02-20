// Web stub — expo-sqlite is not available on web.
// All operations are no-ops; data is fetched directly from the API on web.

const noopDb = {
    execAsync: async (_sql: string) => {},
    runAsync: async (_sql: string, _params?: any[]) => ({ lastInsertRowId: 0, changes: 0 }),
    getAllAsync: async <T>(_sql: string, _params?: any[]): Promise<T[]> => [],
    getFirstAsync: async <T>(_sql: string, _params?: any[]): Promise<T | null> => null,
};

type NoopDb = typeof noopDb;

export async function getDatabase(): Promise<NoopDb> {
    return noopDb;
}

export async function initDatabase(): Promise<NoopDb> {
    return noopDb;
}
