import mongoose, { Schema, Document } from 'mongoose';

import { ICellar } from './cellar';
import { IProduct } from './product';

export interface IStorage extends Document {
    _cellar: ICellar['_id'];
    _product: IProduct['_id'];
    minStock: number,
    maxStock: number,
    cost: number,
    totalStock: number,
    reserve: number,
    isNew: boolean,
    isMissing: boolean,
    state: string
}

const Float = require('mongoose-float').loadType(mongoose, 2);

const storageSchema = new Schema({
    _cellar: {
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        required: [true, 'La sucursal es necesaria']
    },
    _product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es necesario']
    },
    minStock: {
        type: Float,
        default: 0
    },
    maxStock: {
        type: Float,
        default: 0
    },
    cost: {
        type: Float,
        default: 0
    },
    totalStock: {
        type: Float,
        default: 0
    },
    reserve: {
        type: Float,
        default: 0
    },
    new: {
        type: Boolean,
        default: false,
    },
    missing: {
        type: Boolean,
        default: false,
    },
    state: { //TODO: Aqui los estados son un ENUM de string para llevar el control de nuevos ingresos
        type: String,
        default: false,
    },
});

export default mongoose.model<IStorage>('Storage', storageSchema);
