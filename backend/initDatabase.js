
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const collections = [
  'users',
  'studentprofiles',
  'instructorprofiles',
  'examquestions',
  'examschedules',
  'notifications',
  'questionbanks',
  'studentexams'
];

async function initializeDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing');
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected:', mongoose.connection.name);

    for (const collectionName of collections) {
      const exists = await mongoose.connection.db
        .listCollections({ name: collectionName })
        .hasNext();

      if (!exists) {
        await mongoose.connection.db.createCollection(collectionName);
        console.log('Created:', collectionName);
      } else {
        console.log('Already exists:', collectionName);
      }
    }

    console.log('Database initialization completed.');

  } catch (error) {
    console.error('Initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

initializeDatabase();
