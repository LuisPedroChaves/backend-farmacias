import mongoose, { Schema, Document } from 'mongoose';

import { IBankAccount } from './bankAccount';
import { ICheck } from './check';

export interface IBankFlow extends Document {
    _bankAccount: IBankAccount['_id'],
    _check: ICheck['_id'],
    date: Date,
    document: string,
    details: string,
    credit: number,
    debit: number,
    balance: number,
    type: string
}

const TIPOS_VALIDOS = {
    values: ['Cheque', 'Deposito', 'Transferencia', 'Efectivo'],
    message: '{VALUE} no es un tipo de movimiento permitido'
};

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const BANK_FLOW_SCHEMA: Schema = new Schema({
    _bankAccount: {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: [true, 'La cuenta bancaria es necesaria']
    },
    _check: {
        type: Schema.Types.ObjectId,
        ref: 'Check',
        default: null
    },
    date: {
        type: Date,
        required: [true, 'La fecha es necesaria']
    },
    document: {
        type: String,
    },
    details: {
        type: String,
    },
    credit: {
        type: FLOAT,
        default: 0
    },
    debit: {
        type: FLOAT,
        default: 0
    },
    balance: {
        type: FLOAT,
        default: 0
    },
    type: {
        type: String,
        enum: TIPOS_VALIDOS.values,
        default: 'Deposito'
    },
});

export default mongoose.model<IBankFlow>('BankFlow', BANK_FLOW_SCHEMA);
