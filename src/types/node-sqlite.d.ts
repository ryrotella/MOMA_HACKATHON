declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    prepare(query: string): StatementSync;
    close(): void;
  }

  export class StatementSync {
    all(...params: Array<string | number>): unknown[];
  }
}
