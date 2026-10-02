import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot-reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, memoryServer: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    let uri = process.env.MONGODB_URI;

    // If no URI is supplied, or local URI isn't reachable, use MongoMemoryServer
    if (!uri) {
      console.log('⚡ Initializing embedded in-memory MongoDB instance for Chitral Food Hub...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        cached.memoryServer = await MongoMemoryServer.create();
        uri = cached.memoryServer.getUri();
        console.log(`✅ Embedded MongoDB running at: ${uri}`);
      } catch (memErr) {
        console.error('Failed to launch MongoMemoryServer:', memErr);
        uri = 'mongodb://127.0.0.1:27017/chitral_food_hub';
      }
    }

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('🚀 Connected to MongoDB successfully (Chitral Food Hub)');
      return mongooseInstance;
    }).catch(async (err) => {
      console.warn('Initial MongoDB connection failed. Attempting MongoMemoryServer fallback...', err.message);
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!cached.memoryServer) {
          cached.memoryServer = await MongoMemoryServer.create();
        }
        const fallbackUri = cached.memoryServer.getUri();
        console.log(`✅ Fallback embedded MongoDB active at: ${fallbackUri}`);
        return await mongoose.connect(fallbackUri, opts);
      } catch (fallbackErr) {
        console.error('Fatal: Could not connect to any MongoDB instance:', fallbackErr);
        throw fallbackErr;
      }
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Auto-seed if running in memory and empty
    if (cached.memoryServer) {
      const User = (await import('../models/User.js')).default;
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('🌱 Embedded DB is empty. Auto-seeding...');
        const { seedDatabase } = await import('../scripts/seed.js');
        await seedDatabase();
      }
    }
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
