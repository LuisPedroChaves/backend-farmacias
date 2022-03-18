import mongoose, { Schema, Document } from 'mongoose';

import { IAccountsPayable } from './accountsPayable';
import { IUser } from './user';

export interface ICheck extends Document {
    _user: IUser['_id'],
    no: string,
    city: string,
    date: Date,
    name: string,
    amount: number,
    note: string,
    accountsPayables: IAccountsPayable[],
    state: string,
    delivered: boolean
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const ESTADOS_VALIDOS = {
    values: ['CREADO', 'INTERBANCO', 'ESPERA', 'AUTORIZADO', 'PAGADO', 'ANULADO', 'RECHAZADO'],
    message: '{VALUE} no es un estado permitido'
};

const checkSchema = new Schema({
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es necesario']
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
    accountsPayables: [{
        type: Schema.Types.ObjectId,
        ref: 'AccountsPayable',
    }],
    state: {
        type: String,
        enum: ESTADOS_VALIDOS.values,
        default: 'CREADO'
    },
    delivered: {
        type: Boolean,
        default: false
    }
})

export default mongoose.model<ICheck>('Check', checkSchema)
