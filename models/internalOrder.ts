import mongoose, { Schema, Document } from 'mongoose';
import moment from 'moment-timezone';
const Float = require('mongoose-float').loadType(mongoose, 2);

import { ICellar } from './cellar';
import { IUser } from './user';

export interface IInternalOrder extends Document {
    _cellar: ICellar['_id'],
    _user: IUser['_id'],
    _delivery?: IUser['_id'],
    _destination: ICellar['_id'],
    noOrder: string,
    date: Date,
    details: string,
    type: string,
    state: string,
    timeInit: string,
    timeDispatch: string,
    timeDelivery: string,
    deleted: boolean
}

let tiposValidos = {
    values: ['PEDIDO', 'TRASLADO'],
    message: '{VALUE} no es un tipo permitido'
};

let estadosValidos = {
    values: ['ENVIO', 'CONFIRMACION', 'RECHAZO', 'DESPACHO', 'ENTREGA'],
    message: '{VALUE} no es un estado permitido'
};

const internalOrderSchema: Schema = new Schema({
    _cellar: {
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        required: [true, 'La sucursal es necesaria']
    },
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es necesario']
    },
    _delivery: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    _destination: {
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        required: [true, 'El destino es necesario']
    },
    noOrder: {
        type: Number,
        required: [true, 'El número de orden es necesaria'],
    },
    date: {
        type: Date,
        default:  moment().tz("America/Guatemala").format()
    },
    details: {
        type: String,
    },
    type: {
        type: String,
        enum: tiposValidos.values,
        default: 'PEDIDO'
    },
    state: {
        type: String,
        enum: estadosValidos.values,
        default: 'ENVIO'
    },
    timeInit: {
        type: String,
        default: null
    },
    timeDispatch: {
        type: Date,
        default: null
    },
    timeDelivery: {
        type: Date,
        default: null
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IInternalOrder>('InternalOrder', internalOrderSchema);
