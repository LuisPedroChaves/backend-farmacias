import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IEmployeeJob } from './employeeJob';
import { IRising } from './rising';
import { IDiscount } from './discount';

export interface IPayroll extends Document {
    _logDelete: ILogDelete['_id'],
    description: string,
    date: Date,
    details: IPayrollDetail[],
    total: number,
    state: string
    created: Date,
}

export interface IPayrollDetail extends Document {
    _employeeJob: IEmployeeJob['_id'],
    incentiveBonus: number,
    jobBonus: number,
    otherBonus: number,
    igss: number,
    productCharges: number,
    credits: number,
    foults: number,
    extraHours: number,
    holiday: number,
    total: number,
    risings: IRising[],
    discounts: IDiscount[]
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
    date: {
        type: Date
    },
    details: [{
        _employeeJob: {
            type: Schema.Types.ObjectId,
            ref: 'EmployeeJob',
            required: [true, 'El puesto del empleado es necesario'],
        },
        risings: [{
            type: Schema.Types.ObjectId,
            ref: 'Rising',
            default: null
        }],
        discounts: [{
            type: Schema.Types.ObjectId,
            ref: 'Discount',
            default: null
        }],
        incentiveBonus: {
            type: FLOAT,
            default: 0
        },
        jobBonus: {
            type: FLOAT,
            default: 0
        },
        otherBonus: {
            type: FLOAT,
            default: 0
        },
        igss: {
            type: FLOAT,
            default: 0
        },
        productCharges: {
            type: FLOAT,
            default: 0
        },
        credits: {
            type: FLOAT,
            default: 0
        },
        foults: {
            type: FLOAT,
            default: 0
        },
        extraHours: {
            type: FLOAT,
            default: 0
        },
        holiday: {
            type: FLOAT,
            default: 0
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
