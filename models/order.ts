import mongoose, { Schema, Document } from 'mongoose';
import moment from 'moment-timezone';
const Float = require('mongoose-float').loadType(mongoose, 2);

import { ICellar } from './cellar';
import { ICustomer } from './customer';
import { IUser } from './user';

export interface IOrder extends Document {
    _cellar: ICellar['_id'],
    _customer?: ICustomer['_id'],
    _user: IUser['_id'],
    _delivery?: IUser['_id'],
    noOrder: string,
    noBill: string,
    nit: string,
    name: string,
    phone: string,
    address: string,
    town: string,
    department: string,
    details: string,
    payment: string,
    total: number,
    state: string,
    date: Date,
    timeOrder: string,
    timeDispatch: Date,
    timeSend: Date,
    timeDelivery: Date,
    deleted: boolean
}

let pagosValidos = {
    values: ['EFECTIVO', 'TARJETA'],
    message: '{VALUE} no es un tipo de pago permitido'
};

let estadosValidos = {
    values: ['ORDEN', 'DESPACHO', 'ENVIO', 'ENTREGA', 'FIN'],
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
        default: null
    },
    _delivery: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    noOrder: {
        type: Number,
        required: [true, 'El número de orden es necesaria'],
    },
    noBill: {
        type: String,
    },
    nit: {
        type: String,
    },
    name: {
        type: String,
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
    },
    town: {
        type: String,
    },
    department: {
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
        type: Date,
        default:  moment().tz("America/Guatemala").format()
    },
    timeOrder: {
        type: String,
        default: ''
    },
    timeDispatch: {
        type: Date,
        default: null
    },
    timeSend: {
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

export default mongoose.model<IOrder>('Order', orderSchema);