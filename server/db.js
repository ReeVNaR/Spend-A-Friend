import mongoose from 'mongoose';
import dns from 'dns';

// Use Google DNS only on Windows dev machines where local ISP might block MongoDB Atlas SRV records
// In Linux / Vercel Serverless production, use native DNS resolution for maximum speed
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (e) {
    // fail silently if not permitted
  }
}

// Global cached connection for Serverless / Lambda environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const DEFAULT_MONGODB_URI =
  'mongodb+srv://ranveerghorpade16_db_user:Ranveer%401516@expencetracker.s8aiybj.mongodb.net/spend-a-friend?retryWrites=true&w=majority';

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  // If already connected and ready, return existing connection immediately (0ms)
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection dropped or closed, reset promise
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.promise = null;
  }

  // If a connection attempt is in progress, await it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
      maxIdleTimeMS: 60000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(`[MongoDB] Connected successfully to database: ${mongooseInstance.connection.name}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('[MongoDB Connection Failure]:', err.message);
    throw err;
  }

  return cached.conn;
}

export default connectDB;
