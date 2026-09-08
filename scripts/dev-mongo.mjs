import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), '.mongo-data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

console.log(`Starting MongoDB daemon on port 27017 with dbPath: ${dbPath}...`);

const mongod = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: 'dpd_arsip_db',
    dbPath: dbPath,
    storageEngine: 'wiredTiger',
  },
});

const uri = mongod.getUri();
console.log(`[MongoDB Service] Ready and listening at: ${uri}dpd_arsip_db`);

// Keep process running
process.on('SIGINT', async () => {
  console.log('Stopping MongoDB...');
  await mongod.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Stopping MongoDB...');
  await mongod.stop();
  process.exit(0);
});
