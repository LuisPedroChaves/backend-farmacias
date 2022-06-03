import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';

export interface IBank extends Document {
    _logDelete: ILogDelete['_id'],
    image: string,
    name: string,
}

const BANK_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    image: {
        type: String,
    },
    name: {
        type: String,
        required: [true, 'El nombre es necesario'],
    },
});

export default mongoose.model<IBank>('Bank', BANK_SCHEMA);
