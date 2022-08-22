import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IEmployeeJob } from './employeeJob';

export interface IPayroll extends Document {
    _logDelete: ILogDelete['_id'],
    description: string,
    details: IPayrollDetail[],
    total: number,
    created: Date,
    state: string
}

export interface IPayrollDetail extends Document {
    _employeeJob: IEmployeeJob['_id'],
    hoursWorked: number,
    offenses: number,
    withholdings: number,
    suspension: number,
    tempSuspension: number,
    permit: number,
    callForAttention: number,
    igss: number,
    isr: number,
    overtime: number,
    commissions: number,
    bonus: number,
    bonusOfLaw: number,
    receipt: string,
    total: number,
}

const ESTADOS_VALIDOS = {
    values: ['draft', 'created', 'pay'],
    message: '{VALUE} no es un estado permitido'
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const PAYROLL_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    description: {
        type: String,
    },
    details: [{
        _employeeJob: {
            type: Schema.Types.ObjectId,
            ref: 'EmployeeJob',
            required: [true, 'El puesto del empleado es necesario'],
        },
        hoursWorked: {
            type: FLOAT,
            default: 0
        },
        offenses: {
            type: FLOAT,
            default: 0
        },
        withholdings: {
            type: FLOAT,
            default: 0
        },
        suspension: {
            type: FLOAT,
            default: 0
        },
        tempSuspension: {
            type: FLOAT,
            default: 0
        },
        permit: {
            type: FLOAT,
            default: 0
        },
        callForAttention: {
            type: FLOAT,
            default: 0
        },
        igss: {
            type: FLOAT,
            default: 0
        },
        isr: {
            type: FLOAT,
            default: 0
        },
        overtime: {
            type: FLOAT,
            default: 0
        },
        commissions: {
            type: FLOAT,
            default: 0
        },
        bonus: {
            type: FLOAT,
            default: 0
        },
        bonusOfLaw: {
            type: FLOAT,
            default: 0
        },
        receipt: {
            type: String
        },
        total: {
            type: FLOAT,
            default: 0
        },
    }],
    total: {
        type: FLOAT,
        default: 0
    },
    created: {
        type: Date,
    },
    state: {
        type: String,
        enum: ESTADOS_VALIDOS.values,
        default: 'draft'
    },
});

export default mongoose.model<IPayroll>('Payroll', PAYROLL_SCHEMA);
