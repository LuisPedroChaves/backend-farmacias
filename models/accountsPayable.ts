import mongoose, { Schema, Document } from 'mongoose';

import { IPurchase } from './purchase';
import { IUser } from "./user";
import { IProvider } from "./provider";
import { IExpense } from './expense';
import { ICheck } from './check';

export interface IAccountsPayable extends Document {
    _user: IUser['_id'],
    _provider: IProvider['_id'],
    _purchase: IPurchase['_id'],
    _expense: IExpense['_id'],
    date: Date,
    serie: string,
    noBill: string,
    docType: string,
    balance: IAccountsPayableBalance[],
    unaffectedAmount: number,
    exemptAmount: number,
    netPurchaseAmount: number,
    netServiceAmount: number,
    otherTaxes: number,
    iva: number,
    total: number,
    type: string,
    file: string,
    withholdingIVA: string,
    withholdingISR: string,
    toCredit: boolean,
    expirationCredit: Date,
    paid: boolean,
    deleted: boolean
}

export interface IAccountsPayableBalance extends Document {
    _check: ICheck['_id'],
    date: Date,
    document: string,
    credit: string,
    amount: number,
    file: string,
}

const DOCUMENTOS_VALIDOS = {
    values: ['FACTURA', 'CAMBIARIA', 'PEQUEÑO', 'ABONO', 'CREDITO'],
    message: '{VALUE} no es un tipo de documento permitido'
}
const TIPOS_VALIDOS = {
    values: ['PRODUCTOS', 'GASTOS'],
    message: '{VALUE} no es un tipo de cuenta permitido'
};
const ABONOS_VALIDOS = {
    values: ['CHEQUE', 'EFECTIVO'],
    message: '{VALUE} no es un tipo de pago permitido'
};

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const ACCOUNTS_PAYABLE_SCHEMA = new Schema({
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
    _purchase: {
        type: Schema.Types.ObjectId,
        ref: 'Purchase',
        default: null
    },
    _expense: {
        type: Schema.Types.ObjectId,
        ref: 'Purchase',
        default: null
    },
    date: {
        type: Date,
        default: null
    },
    serie: {
        type: String,
    },
    noBill: {
        type: String,
    },
    docType: {
        type: String,
        enum: DOCUMENTOS_VALIDOS.values,
        default: 'FACTURA'
    },
    balance: [{
        _check: {
            type: Schema.Types.ObjectId,
            ref: 'Check',
            default: null
        },
        date: {
            type: Date,
            default: null
        },
        document: {
            type: String,
        },
        credit: {
            type: String,
            enum: ABONOS_VALIDOS.values,
            default: 'CHEQUE'
        },
        amount: {
            type: FLOAT,
            required: [true, 'El monto es necesario']
        },
        file: {
            type: String,
        },
    }],
    unaffectedAmount: {
        type: FLOAT,
        default: 0
    },
    exemptAmount: {
        type: FLOAT,
        default: 0
    },
    netPurchaseAmount: {
        type: FLOAT,
        default: 0
    },
    netServiceAmount: {
        type: FLOAT,
        default: 0
    },
    otherTaxes: {
        type: FLOAT,
        default: 0
    },
    iva: {
        type: FLOAT,
        default: 0
    },
    total: {
        type: FLOAT,
        default: 0
    },
    type: {
        type: String,
        enum: TIPOS_VALIDOS.values,
        default: 'PRODUCTOS'
    },
    file: {
        type: String,
    },
    withholdingIVA: {
        type: String,
    },
    withholdingISR: {
        type: String,
    },
    toCredit: {
        type: Boolean,
        default: false,
    },
    expirationCredit: {
        type: Date,
        default: null
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

export default mongoose.model<IAccountsPayable>('AccountsPayable', ACCOUNTS_PAYABLE_SCHEMA);