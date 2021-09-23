import mongoose, { Schema, Document } from 'mongoose';
import moment from 'moment-timezone';

import { IProvider } from './provider';
import { ICellar } from './cellar';
import { IUser } from './user';
import { IProduct } from './product';

export interface IPurchase extends Document {
    _cellar: ICellar['_id'];
    _user: IUser['_id'];
    _provider: IProvider['_id'];
    noBill: string,
    date: Date,
    requisition: string,
    details: string,
    detail: IPurchaseDetail[],
    adjust: IPurchaseAdjust[],
    payment: string,
    total: number
    file: string,
    state: string,
    created: Date,
    _userDeleted: IUser['_id'];
    textDeleted: string,
    deleted: boolean
}
export interface IPurchaseDetail extends Document {
    _product: IProduct['_id'];
    quantity: number,
    price: number,
    bonus: number,
    discount: number,
    cost: number,
    realQuantity: number,
    stockQuantity: number,
    expirationDate: Date,
    changedPrice: number
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
    values: ['CREADA', 'ACTUALIZADA', 'APLICADA'],
    message: '{VALUE} no es un estado permitido'
};

const purchaseSchema = new Schema({
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
        required: [true, 'El número de factura es necesario'],
    },
    date: {
        type: Date,
        required: [true, 'La fecha es necesaria'],
    },
    requisition: {
        type: String,
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
        stockQuantity: {
            type: Float,
            default: 0
        },
        expirationDate: {
            type: Date,
            default: null
        },
        changedPrice: {
            type: Float,
            default: 0
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
        default: 'CREADA'
    },
    created: {
        type: Date,
        default:  moment().tz("America/Guatemala").format()
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

export default mongoose.model<IPurchase>('Purchase', purchaseSchema);
