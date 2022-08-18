import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IBank } from './bank';
import { ICellar } from './cellar';

export interface IEmployee extends Document {
    _logDelete: ILogDelete['_id'],
    _bank: IBank['_id'],
    _cellar: ICellar['_id'],
    code: string,
    name: string,
    lastName: string,
    nit: string,
    email: string,
    birth: Date,
    gender: string,
    maritalStatus: string,
    address: string,
    city: string,
    department: string,
    docType: string,
    document: string,
    profession: string,
    academicLavel: string,
    photo: string,
    igss: boolean,
    benefits: boolean,
    bankAccount: string,
    vacationDate: string,
    lastVacationDate: Date,
    details: string,
    fired: string,
}

const EMPLOYEE_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    _bank: {
        type: Schema.Types.ObjectId,
        ref: 'Bank',
        required: [true, 'El banco es necesario'],
    },
    _cellar: {
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        required: [true, 'La sucursal es necesaria'],
    },
    code: {
        type: String,
        required: [true, 'El código es necesario'],
    },
    name: {
        type: String,
        required: [true, 'El nombre es necesario'],
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es necesario'],
    },
    nit: {
        type: String,
    },
    email: {
        type: String,
    },
    birth: {
        type: Date,
    },
    gender: {
        type: String,
    },
    maritalStatus: {
        type: String,
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    department: {
        type: String,
    },
    docType: {
        type: String,
    },
    document: {
        type: String,
    },
    profession: {
        type: String,
    },
    academicLavel: {
        type: String,
    },
    photo: {
        type: String,
    },
    igss: {
        type: Boolean,
    },
    benefits: {
        type: Boolean,
    },
    bankAccount: {
        type: String,
    },
    vacationDate: {
        type: String,
    },
    lastVacationDate: {
        type: Date,
    },
    details: {
        type: String,
    },
    fired: {
        type: String,
    },
});

export default mongoose.model<IEmployee>('Employee', EMPLOYEE_SCHEMA);
