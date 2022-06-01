import mongoose, { Schema, Document } from 'mongoose';

import { ICash } from './cash';
import { ICashFlow } from './cashFlow';
import { ICheck } from './check';
import { ILogDelete } from './logDelete';

export interface ICashRequisition extends Document {
    _cash: ICash['_id'],
    _check: ICheck['_id'],
    _cashFlows: ICashFlow[],
    total: number,
    paid: boolean,
    created: string | Date,
    updated: string,
    _logDelete: ILogDelete['_id'],
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const CASH_REQUISITION_SCHEMA = new Schema({
    _cash: {
        type: Schema.Types.ObjectId,
        ref: 'Cash',
        required: [true, 'La caja es necesaria']
    },
    _check: {
        type: Schema.Types.ObjectId,
        ref: 'Check',
        default: null
    },
    _cashFlows: [{
        type: Schema.Types.ObjectId,
        ref: 'CashFlow',
    }],
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    total: {
        type: FLOAT,
        default: 0
    },
    paid: {
        type: Boolean,
        default: false
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

export default mongoose.model<ICashRequisition>('CashRequisition', CASH_REQUISITION_SCHEMA);