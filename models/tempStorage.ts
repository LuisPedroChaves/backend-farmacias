import mongoose, { Schema, Document } from 'mongoose';

import { ICellar } from './cellar';
import { IProduct } from './product';

export interface ITempStorage extends Document {
    _cellar: ICellar['_id'];
    _product: IProduct['_id'];
    stock: number,
    supply: number,
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const tempStorageSchema = new Schema({
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
    stock: {
        type: FLOAT,
        default: 0
    },
    minStock: {
        type: FLOAT,
        default: 0
    },
    maxStock: {
        type: FLOAT,
        default: 0
    },
    supply: {
        type: FLOAT,
        default: 0
    },
});

export default mongoose.model<ITempStorage>('TempStorage', tempStorageSchema);
