import { Injectable, Logger } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';

@Injectable()
export class LoggerService {
  // rename to avoid colliding with a public .log() method
  private readonly nlog = new Logger(LoggerService.name);
  private client: MongoClient | null = null;
  private db!: Db;
  private col!: Collection;

  // Simple console passthroughs so app.get(LoggerService).log/warn work
  log(message: string) {
    console.log(`[LoggerService] ${message}`);
  }
  info(message: string) {
    console.log(`[LoggerService] ${message}`);
  }
  warn(message: string) {
    console.warn(`[LoggerService] ${message}`);
  }
  error(message: string, trace?: string) {
    console.error(`[LoggerService] ${message}`);
    if (trace) console.error(trace);
  }

  private async connect() {
    if (this.client) return;
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'nest_logs';
    if (!uri) {
      this.nlog.warn('MONGODB_URI not set; HTTP logs will be skipped');
      return;
    }
    this.client = new MongoClient(uri, { maxPoolSize: 5 });
    await this.client.connect();
    this.db = this.client.db(dbName);
    this.col = this.db.collection('http_logs');
    await this.col.createIndexes([
      { key: { timestamp: -1 } },
      { key: { requestId: 1 } },
      { key: { userId: 1 } },
      { key: { path: 1, method: 1 } },
      { key: { statusCode: 1 } },
    ]);
    this.nlog.log(`Mongo logger ready: db=${dbName}, col=http_logs`);
  }

  async write(entry: {
    method: string;
    path: string;
    params: any;
    query: any;
    body: any;
    statusCode: number;
    responseTimeMs: number;
    ip?: string;
    userAgent?: string;
    userId?: string | null;
    requestId?: string;
    error?: { code?: string; message?: string; stack?: string | null };
    prisma?: Array<{ model?: string | null; action: string; ms: number; changed: string[]; where?: any }>;
  }) {
    try {
      await this.connect();
      if (!this.col) return;

      const redacted = { ...entry };
      if (redacted.body?.password) redacted.body.password = '[REDACTED]';
      if (redacted.body?.refresh_token) redacted.body.refresh_token = '[REDACTED]';

      // Let Mongo assign _id (ObjectId) to avoid TS type issues
      await this.col.insertOne({ timestamp: new Date(), ...redacted });
    } catch (e) {
      this.nlog.error(`Failed to write http log: ${(e as Error).message}`);
    }
  }
}
