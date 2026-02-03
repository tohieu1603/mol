/**
 * Type declarations for pg module
 */
declare namespace pg {
  interface PoolConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  interface QueryResult<T = unknown> {
    rows: T[];
    rowCount: number | null;
    command: string;
    oid: number;
    fields: unknown[];
  }

  interface PoolClient {
    query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    release(err?: Error | boolean): void;
  }

  class Pool {
    constructor(config?: PoolConfig);
    query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "connect", listener: () => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }
}

declare module "pg" {
  export = pg;
}
