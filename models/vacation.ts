import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IEmployee } from './employee';

export interface IVacation extends Document {
    _logDelete: ILogDelete['_id'],
    _employee: IEmployee['_id'],
    start: Date,
    end: Date,
    constancy: string,
    details: string,
}

const VACATION_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    _employee: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'El empleado es necesario'],
    },
    start: {
        type: Date,
        default: null
    },
    end: {
        type: Date,
        default: null
    },
    constancy: {
        type: String,
    },
    details: {
        type: String,
    }
});

export default mongoose.model<IVacation>('Vacation', VACATION_SCHEMA);
