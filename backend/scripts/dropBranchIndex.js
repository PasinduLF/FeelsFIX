import mongoose from 'mongoose';
import Payment from '../models/PaymentSchema.js';

const dropBranchIndex = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/feesfix');

        // Drop the unique index
        await Payment.collection.dropIndex('branch_1');
        console.log('Successfully dropped the unique index on branch field');

        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

dropBranchIndex(); 