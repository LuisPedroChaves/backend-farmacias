import mongoose, { Schema, Document } from 'mongoose';
import moment from 'moment-timezone';
const Float = require('mongoose-float').loadType(mongoose, 2);

import { ICellar } from './cellar';
import { ICustomer } from './customer';
import { IUser } from './user';

export interface IOrder extends Document {
    _cellar: ICellar['_id'],
    _customer: ICustomer['_id'],
    _user: IUser['_id'],
    noOrder: string,
    noBill: string,
    details: string,
    payment: string,
    total: number,
    state: string,
    createdAt: string,
    timeOrder: string,
    timeDispatch: string,
    timeSend: string,
    timeDelivery: string,
    deleted: boolean
}

let pagosValidos = {
    values: ['EFECTIVO', 'TARJETA'],
    message: '{VALUE} no es un tipo de pago permitido'
};

let estadosValidos = {
    values: ['ORDEN', 'DESPACHO', 'ENVIO', 'ENTREGA'],
    message: '{VALUE} no es un tipo de pago permitido'
};

const orderSchema: Schema = new Schema({
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
    _customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'El cliente es necesario']
    },
    noOrder: {
        type: Number,
        required: [true, 'El número de orden es necesaria'],
    },
    noBill: {
        type: String,
    },
    details: {
        type: String,
    },
    payment: {
        type: String,
        enum: pagosValidos.values,
        default: 'EFECTIVO'
    },
    total: {
        type: Float,
        required: [true, 'El total es necesario']
    },
    state: {
        type: String,
        enum: estadosValidos.values,
        default: 'ORDEN'
    },
    date: {
        type: String,
        default:  moment().tz("America/Guatemala").format()
    },
    timeOrder: {
        type: String,
        default: ''
    },
    timeDispatch: {
        type: String,
        default: ''
    },
    timeSend: {
        type: String,
        default: ''
    },
    timeDelivery: {
        type: String,
        default: ''
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IOrder>('Order', orderSchema);
