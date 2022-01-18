import mongoose, { Schema, Document } from 'mongoose';
import moment from 'moment-timezone';
const Float = require('mongoose-float').loadType(mongoose, 2);

import { ICellar } from './cellar';
import { ICustomer } from './customer';
import { IUser } from './user';
import { IProduct } from './product';

export interface IOrder extends Document {
    _cellar: ICellar['_id'],
    _customer?: ICustomer['_id'],
    _user: IUser['_id'],
    _delivery?: IUser['_id'],
    _userDeleted?: IUser['_id'],
    noOrder: string,
    noBill: string,
    nit: string,
    name: string,
    phone: string,
    address: string,
    town: string,
    department: string,
    detail: IOrderDetail[],
    details: string,
    payment: string,
    sellerCode?: string,
    total: number,
    state: string,
    date: Date,
    timeOrder: string,
    timeDispatch: string,
    timeSend: string,
    timeDelivery: string,
    textReturned?: string,
    textDeleted?: string,
    deleted: boolean
}

export interface IOrderDetail extends Document {
    _product: IProduct['_id'],
    presentation: IOrderDetailPresentation,
    quantity: number,
    price: number,
}
export interface IOrderDetailPresentation extends Document {
    name: string,
    quantity: number
}

let pagosValidos = {
    values: ['EFECTIVO', 'TARJETA'],
    message: '{VALUE} no es un tipo de pago permitido'
};

let estadosValidos = {
    values: ['COTIZACION', 'ORDEN', 'DESPACHO', 'ENVIO', 'ENTREGA', 'DEVOLUCION'],
    message: '{VALUE} no es un estado permitido'
};

const PRESENTATION_SCHEMA = new Schema({
    name: {
        type: String,
    },
    quantity: {
        type: Float,
        default: 0
    },
});

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
    _userDeleted: {
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
    detail: [{
        _product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'El producto es necesario']
        },
        presentation: {
            type: PRESENTATION_SCHEMA,
            default: {}
        },
        quantity: {
            type: Float,
            default: 0
        },
        price: {
            type: Float,
            default: 0
        },
    }],
    details: {
        type: String,
    },
    payment: {
        type: String,
        enum: pagosValidos.values,
        default: 'EFECTIVO'
    },
    sellerCode: {
        type: String,
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
    textDeleted: {
        type: String,
    },
    textReturned: {
        type: String,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IOrder>('Order', orderSchema);
