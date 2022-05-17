import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IUser } from './user';

export interface ICash extends Document {
    _admin: IUser['_id'],
    _user: IUser['_id'],
    _logDelete: ILogDelete['_id'],
    type: string,
    balance: number,
    created: string,
    updated: string,
}

const TIPOS_VALIDOS = {
    values: ['INDEPENDIENTE', 'CONTABLE'],
    message: '{VALUE} no es un tipo de caja permitido'
};

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const CASH_SCHEMA = new Schema({
    _admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario admin es necesario']
    },
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es necesario']
    },
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    type: {
        type: String,
        enum: TIPOS_VALIDOS.values,
        default: 'INDEPENDIENTE'
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

export default mongoose.model<ICash>('Cash', CASH_SCHEMA);