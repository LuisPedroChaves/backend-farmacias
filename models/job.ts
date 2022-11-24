import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IJobDepartment } from './jobDepartment';

export interface IJob extends Document {
    _logDelete: ILogDelete['_id'],
    _jobDepartment: IJobDepartment['_id'],
    name: string,
}

const JOB_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    _jobDepartment: {
        type: Schema.Types.ObjectId,
        ref: 'JobDepartment',
        required: [true, 'El puesto es necesario'],
    },
    name: {
        type: String,
        required: [true, 'El nombre es necesario'],
    },
});

export default mongoose.model<IJob>('Job', JOB_SCHEMA);
