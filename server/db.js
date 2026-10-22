import mongoose from 'mongoose';
import dns from 'dns';

// Ensure Google DNS servers are used if ISP blocks SRV records (Windows & dev environments)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // In serverless environments where custom DNS is restricted, fail gracefully
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

  // If already connected and ready, return existing connection
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
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
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
