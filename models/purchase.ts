import mongoose, { Schema, Document } from 'mongoose';

import { IProvider } from './provider';
import { ICellar } from './cellar';
import { IUser } from './user';
import { IProduct } from './product';

export interface IPurchase extends Document {
    _cellar: ICellar['_id'],
    _user: IUser['_id'],
    _provider: IProvider['_id'],
    noBill: string,
    date: Date,
    requisition: number,
    details: string,
    detail: IPurchaseDetail[],
    adjust: IPurchaseAdjust[],
    payment: string,
    total: number,
    file: string,
    state: string,
    created: Date,
    _lastUpdate: IUser['_id']
    _userDeleted: IUser['_id'];
    textDeleted: string,
    deleted: boolean
}
export interface IPurchaseDetail extends Document {
    _product: IProduct['_id'],
    presentation: IPurchaseDetailPresentation,
    requested: number,
    quantity: number,
    price: number,
    bonus: number,
    discount: number,
    cost: number,
    realQuantity: number,
    expirationDate: Date,
    lastCost: number,
    updated: boolean
}
export interface IPurchaseDetailPresentation extends Document {
    name: string,
    quantity: number
}
export interface IPurchaseAdjust extends Document {
    _user: IUser['_id'];
    _product: IProduct['_id'];
    date: Date,
    quantity: number,
    details: string
}

const Float = require('mongoose-float').loadType(mongoose, 2);
const PAGOS_VALIDOS = {
    values: ['CONTADO', 'CREDITO'],
    message: '{VALUE} no es un tipo de pago permitido'
};
const ESTADOS_VALIDOS = {
    values: ['REQUISITION', 'CREATED', 'UPDATED', 'APPLIED'],
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

const PURCHASE_SCHEMA = new Schema({
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
    _provider: {
        type: Schema.Types.ObjectId,
        ref: 'Provider',
        required: [true, 'El proveedor es necesario']
    },
    noBill: {
        type: String,
    },
    date: {
        type: Date,
        default: null
    },
    requisition: {
        type: Number,
    },
    details: {
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
        requested: {
            type: Float,
            default: 0
        },
        quantity: {
            type: Float,
            default: 0
        },
        price: {
            type: Float,
            default: 0
        },
        bonus: {
            type: Float,
            default: 0
        },
        discount: {
            type: Float,
            default: 0
        },
        cost: {
            type: Float,
            default: 0
        },
        realQuantity: {
            type: Float,
            default: 0
        },
        expirationDate: {
            type: Date,
            default: null
        },
        lastCost: {
            type: Float,
            default: 0
        },
        // Bandera para verificar si ya se actualizo el precio
        updated: {
            type: Boolean,
            default: false,
        },
    }],
    adjust: [{
        _user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario es necesario']
        },
        _product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'El producto es necesario']
        },
        date: {
            type: Date,
            required: [true, 'La fecha es necesaria'],
        },
        quantity: {
            type: Float,
            default: 0
        },
        details: {
            type: String,
        },
    }],
    payment: {
        type: String,
        enum: PAGOS_VALIDOS.values,
        default: 'CONTADO'
    },
    total: {
        type: Float,
        default: 0
    },
    file: {
        type: String,
    },
    state: {
        type: String,
        enum: ESTADOS_VALIDOS.values,
        default: 'REQUISITION'
    },
    created: {
        type: Date,
    },
    _lastUpdate: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    _userDeleted: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    textDeleted: {
        type: String
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IPurchase>('Purchase', PURCHASE_SCHEMA);
