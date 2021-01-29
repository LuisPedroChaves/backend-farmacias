import mongoose, { Schema, Document } from 'mongoose';
import moment from 'moment-timezone';
const Float = require('mongoose-float').loadType(mongoose, 2);

import { ICellar } from './cellar';
import { ICustomer } from './customer';
import { IUser } from './user';

export interface ISale extends Document {
    _cellar: ICellar['_id'],
    _customer?: ICustomer['_id'],
    _seller: IUser['_id'],
    date: Date,
    noBill: string,
    balance: ISaleBalance[],
    total: number,
    paid: boolean,
    deleted: boolean,
}

export interface ISaleBalance extends Document {
    date: Date,
    receipt: string,
    document: string,
    payment: string,
    amount: number
}

let pagosValidos = {
    values: ['EFECTIVO', 'TARJETA', 'CHEQUE', 'TRANSFERENCIA', 'DEPOSITO'],
    message: '{VALUE} no es un tipo de pago permitido'
};

const saleSchema: Schema = new Schema({
    _cellar: {
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        required: [true, 'La sucursal es necesaria']
    },
    _customer: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'El cliente es necesario']
    },
    _seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El vendedor es necesario']
    },
    date: {
        type: Date,
        default: moment().tz("America/Guatemala").format()
    },
    noBill: {
        type: String,
    },
    balance: [{
        date: {
            type: Date,
            default: moment().tz("America/Guatemala").format()
        },
        receipt: {
            type: String,
        },
        document: {
            type: String,
        },
        payment: {
            type: String,
            enum: pagosValidos.values,
            default: 'EFECTIVO'
        },
        amount: {
            type: Float,
            required: [true, 'El monto es necesario']
        },
    }],
    total: {
        type: Float,
        required: [true, 'El total es necesario']
    },
    paid: {
        type: Boolean,
        default: false,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<ISale>('Sale', saleSchema);
