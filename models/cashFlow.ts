import mongoose, { Schema, Document } from 'mongoose';

import { ICash } from './cash';
import { IUser } from './user';

export interface ICashFlow extends Document {
    _user: IUser['_id'],
    _cash: ICash['_id'],
    details: string,
    state: string,
    income: number,
    expense: number,
    balance: number,
    created: string | Date,
    updated: string,
}

const ESTADOS_VALIDOS = {
    values: ['SOLICITADO', 'APROBADO', 'RECHAZADO'],
    message: '{VALUE} no es un estado de movimiento permitido'
};

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const CASH_FLOW_SCHEMA = new Schema({
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es necesario']
    },
    _cash: {
        type: Schema.Types.ObjectId,
        ref: 'Cash',
        required: [true, 'La caja es necesaria']
    },
    details: {
        type: String
    },
    state: {
        type: String,
        enum: ESTADOS_VALIDOS.values,
        default: 'SOLICITADO'
    },
    income: {
        type: FLOAT,
        default: 0
    },
    expense: {
        type: FLOAT,
        default: 0
    },
    balance: {
        type: FLOAT,
        default: 0
    },
    created: {
        type: Date,
        default: null
    },
    updated: {
        type: Date,
        default: null
    }
});

export default mongoose.model<ICashFlow>('CashFlow', CASH_FLOW_SCHEMA);