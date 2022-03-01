import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    name: string
}

const EXPENSE_SCHEMA = new Schema({
    name: {
        type: String,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IExpense>('Expense', EXPENSE_SCHEMA);