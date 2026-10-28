
const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null
    };
}

const connectDB = async () => {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing in environment variables');
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000
        });
    }

    try {
        cached.conn = await cached.promise;

        console.log('MongoDB Atlas Connected Successfully');
        console.log('Database:', cached.conn.connection.name);

        return cached.conn;

    } catch (error) {
        cached.promise = null;
        cached.conn = null;

        console.error('MongoDB Connection Failed:', error.message);

        throw error;
    }
};

module.exports = connectDB;
