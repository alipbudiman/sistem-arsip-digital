import dns from 'dns';
import { MongoClient, Db, GridFSBucket } from 'mongodb';

export const DEFAULT_MONGODB_URI =
  'mongodb+srv://alifbudiman_db_user:Ek6ElbNc6PWttEkO@cluster0.v57ssra.mongodb.net/dpd_arsip_db?retryWrites=true&w=majority';

const rawUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

interface GlobalMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

declare const global: GlobalMongo & typeof globalThis;

async function createClient(): Promise<MongoClient> {
  // First attempt: direct connection with the provided URI
  try {
    const client = new MongoClient(rawUri, {
      serverSelectionTimeoutMS: 8000,
    });
    await client.connect();
    return client;
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || '';
    // If on Windows and router DNS rejects SRV records (querySrv ECONNREFUSED)
    if (rawUri.startsWith('mongodb+srv://') && errorMsg.includes('querySrv')) {
      console.warn(
        '[MongoDB] Local DNS failed to resolve SRV record. Resolving via 8.8.8.8 / 1.1.1.1...'
      );
      try {
        const resolver = new dns.promises.Resolver();
        resolver.setServers(['8.8.8.8', '1.1.1.1']);

        // Extract hostname from mongodb+srv://...@[hostname]/...
        const match = rawUri.match(/@([^/?#]+)/);
        const hostname = match ? match[1] : 'cluster0.v57ssra.mongodb.net';

        const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${hostname}`);
        const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(',');

        // Extract credentials and path/query
        const authPart = rawUri.substring(rawUri.indexOf('://') + 3, rawUri.indexOf('@'));
        const restPart = rawUri.includes('/')
          ? rawUri.substring(rawUri.indexOf(hostname) + hostname.length)
          : '/dpd_arsip_db?retryWrites=true&w=majority';

        const directUri = `mongodb://${authPart}@${hosts}${restPart}&ssl=true&authSource=admin`;
        const fallbackClient = new MongoClient(directUri);
        await fallbackClient.connect();
        console.log('[MongoDB] Connected successfully via DNS fallback resolver.');
        return fallbackClient;
      } catch (fallbackErr) {
        console.error('[MongoDB] DNS fallback also failed:', fallbackErr);
        throw err;
      }
    }
    throw err;
  }
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClient();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = createClient();
}

export default clientPromise;

export async function getDatabase(dbName?: string): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName || 'dpd_arsip_db');
}

export async function getGridFSBucket(bucketName: string = 'fs'): Promise<GridFSBucket> {
  const db = await getDatabase();
  return new GridFSBucket(db, { bucketName });
}
