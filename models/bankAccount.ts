import mongoose, { Schema, Document } from 'mongoose';

import { IBank } from './bank';
import { ILogDelete } from './logDelete';

export interface IBankAccount extends Document {
    _bank: IBank['_id'],
    _logDelete: ILogDelete['_id'],
    no: string,
    name: string,
    balance: number,
    type: string
}

const TIPOS_VALIDOS = {
    values: ['Monetaria', 'De ahorro', 'Otro'],
    message: '{VALUE} no es un tipo de cuenta permitido'
};

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const BANK_ACCOUNT_SCHEMA: Schema = new Schema({
    _bank: {
        type: Schema.Types.ObjectId,
        ref: 'Bank',
        required: [true, 'El banco es necesario']
    },
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    no: {
        type: String,
        required: [true, 'El numero es necesario']
    },
    name: {
        type: String,
        required: [true, 'El nombre es necesario'],
    },
    balance: {
        type: FLOAT,
        default: 0
    },
    type: {
        type: String,
        enum: TIPOS_VALIDOS.values,
        default: 'Monetaria'
    },
});

export default mongoose.model<IBankAccount>('BankAccount', BANK_ACCOUNT_SCHEMA);
