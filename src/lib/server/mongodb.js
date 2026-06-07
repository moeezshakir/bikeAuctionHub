import dns from "dns";
import mongoose from "mongoose";

const globalForMongoose = globalThis;

if (!globalForMongoose.__mongooseConnection) {
  globalForMongoose.__mongooseConnection = { conn: null, promise: null };
}

if (process.env.FORCE_DNS === "true") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

export async function connectToDatabase() {
  if (globalForMongoose.__mongooseConnection.conn) {
    return globalForMongoose.__mongooseConnection.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (!globalForMongoose.__mongooseConnection.promise) {
    globalForMongoose.__mongooseConnection.promise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "ride_rental_hub",
    });
  }

  globalForMongoose.__mongooseConnection.conn = await globalForMongoose.__mongooseConnection.promise;
  return globalForMongoose.__mongooseConnection.conn;
}
