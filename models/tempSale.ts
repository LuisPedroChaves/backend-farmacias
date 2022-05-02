import mongoose, { Schema, Document } from 'mongoose';

import { ICellar } from './cellar';
import { IProduct } from './product';

export interface ITempSale extends Document {
    _cellar: ICellar['_id'];
    _product: IProduct['_id'];
    date: Date,
    quantity: number,
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const tempSaleSchema = new Schema({
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
    date: {
        type: Date,
        required: [true, 'La fecha es necesaria']
    },
    quantity: {
        type: FLOAT,
        default: 0
    },
});

export default mongoose.model<ITempSale>('TempSale', tempSaleSchema);
