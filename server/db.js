import mongoose from 'mongoose';
import dns from 'dns';

// Ensure Google DNS servers are used if ISP blocks SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // In some environments, changing DNS servers may not be allowed; ignore silently
}

// Global cached connection for Serverless / Lambda environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  // If already connected and ready, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection attempt is in progress, await it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose buffering for immediate feedback in serverless
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
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
    throw err;
  }

  return cached.conn;
}

export default connectDB;
