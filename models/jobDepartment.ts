import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';

export interface IJobDepartment extends Document {
    _logDelete: ILogDelete['_id'],
    name: string,
}

const JOB_DEPARTMENT_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    name: {
        type: String,
        required: [true, 'El nombre es necesario'],
    },
});

export default mongoose.model<IJobDepartment>('JobDepartment', JOB_DEPARTMENT_SCHEMA);
