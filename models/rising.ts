import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IEmployeeJob } from './employeeJob';
import { IUser } from './user';

export interface IRising extends Document {
    _logDelete: ILogDelete['_id'],
    _user: IUser['_id'],
    _employeeJob: IEmployeeJob['_id'],
    date: Date,
    type: string,
    details: string,
    hours: number,
    amount: number,
    approved: boolean,
    applied: boolean
}

const TIPOS_VALIDOS = {
    values: ['horasExtra', 'comisión', 'bono', 'aumentoSalario', 'asueto'],
    message: '{VALUE} no es un tipo permitido'
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const RISING_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es requerido']
    },
    _employeeJob: {
        type: Schema.Types.ObjectId,
        ref: 'EmployeeJob',
        required: [true, 'El puesto del empleado es requerido']
    },
    date: {
        type: Date,
        required: [true, 'La fecha es requerida']
    },
    type: {
        type: String,
        enum: TIPOS_VALIDOS.values,
        default: 'horasExtra'
    },
    details: {
        type: String
    },
    hours: {
        type: FLOAT,
        default: 0
    },
    amount: {
        type: FLOAT,
        default: 0
    },
    approved: {
        type: Boolean,
        default: false
    },
    applied: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model<IRising>('Rising', RISING_SCHEMA);
