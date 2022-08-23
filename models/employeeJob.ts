import mongoose, { Schema, Document, Decimal128 } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IJob } from './job';
import { IEmployee } from './employee';

export interface IEmployeeJob extends Document {
    _logDelete: ILogDelete['_id'],
    _job: IJob['_id'],
    _employee: IEmployee['_id'],
    initialSalary: number,
    salaryPerHour: number,
    monthlyHours: number,
    salaryExtraHours: number,
    lawBonus: boolean,
    bonus: number,
    startDate: Date,
    contractType: string,
    contract: string,
    paymentType: string,
    workPlace: string
}

const TIPOS_PAGO_VALIDOS = {
    values: ['cheque', 'efectivo', 'cuenta'],
    message: '{VALUE} no es un tipo de pago permitido'
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const EMPLOYEE_JOB_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    _job: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: [true, 'El puesto es necesario'],
    },
    _employee: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'El empleado es necesario'],
    },
    initialSalary: {
        type: FLOAT,
        default: 0
    },
    salaryPerHour: {
        type: FLOAT,
        default: 0
    },
    monthlyHours: {
        type: Number,
        default: 0
    },
    salaryExtraHours: {
        type: Number,
        default: 0
    },
    lawBonus: {
        type: Boolean,
        default: false
    },
    bonus: {
        type: FLOAT,
        default: false
    },
    startDate: {
        type: Date,
    },
    contractType: {
        type: String
    },
    contract: {
        thpe: String
    },
    paymentType: {
        type: String,
        enum: TIPOS_PAGO_VALIDOS.values,
        default: 'cheque'
    },
    workPlace: {
        type: String
    }
})

export default mongoose.model<IEmployeeJob>('EmployeeJob', EMPLOYEE_JOB_SCHEMA);
