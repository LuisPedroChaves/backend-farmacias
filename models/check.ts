import mongoose, { Schema, Document } from 'mongoose';

import { IAccountsPayable } from './accountsPayable';
import { IBankAccount } from './bankAccount';
import { ICashRequisition } from './cashRequisition';
import { IUser } from './user';

export interface ICheck extends Document {
    _user: IUser['_id'],
    _bankAccount: IBankAccount['_id'],
    no: string,
    city: string,
    date: Date,
    name: string,
    amount: number,
    note: string,
    receipt: ICheckReceipt,
    accountsPayables: IAccountsPayable[],
    cashRequisitions: ICashRequisition[],
    paymentDate: Date | string,
    state: string,
    delivered: boolean,
    voided: boolean,
    created: Date,
}

export interface ICheckReceipt extends Document {
    no: string,
    name: string,
    file: string,
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const ESTADOS_VALIDOS = {
    values: ['CREADO', 'ACTUALIZADO', 'INTERBANCO', 'ESPERA', 'AUTORIZADO', 'PAGADO', 'RECHAZADO'],
    message: '{VALUE} no es un estado permitido'
};

const RECEIPT_SCHEMA = new Schema({
    no: {
        type: String,
    },
    name: {
        type: String,
    },
    file: {
        type: String,
    }
});

const checkSchema = new Schema({
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es necesario']
    },
    _bankAccount: {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: [true, 'La cuenta bancaria es necesaria']
    },
    no: {
        type: String,
    },
    city: {
        type: String,
    },
    date: {
        type: Date,
        default: null
    },
    name: {
        type: String,
    },
    amount: {
        type: FLOAT,
        default: 0
    },
    note: {
        type: String,
    },
    receipt: {
        type: RECEIPT_SCHEMA,
        default: {}
    },
    accountsPayables: [{
        type: Schema.Types.ObjectId,
        ref: 'AccountsPayable',
    }],
    cashRequisitions: [{
        type: Schema.Types.ObjectId,
        ref: 'CashRequisition',
    }],
    paymentDate: {
        type: Date,
        default: null
    },
    state: {
        type: String,
        enum: ESTADOS_VALIDOS.values,
        default: 'CREADO'
    },
    delivered: {
        type: Boolean,
        default: false
    },
    voided: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: null
    },
})

export default mongoose.model<ICheck>('Check', checkSchema)
