import mongoose, { Schema, Document } from 'mongoose';

import { IBrand } from './brand';
import { ISubstance } from './substance';
import { ISymptom } from './symptoms';

export interface IProduct extends Document {
    _brand: IBrand['_id'];
    code: number,
    barcode: string,
    description: string,
    healthProgram: string,
    presentations: IProductPresentations[],
    substances: IProductSubstances[],
    symptoms: IProductSymptoms[],
    exempt: boolean,
    discontinued: boolean,
    deleted: boolean
}
export interface IProductPresentations extends Document {
    name: string,
    wholesale_price: number,
    distributor_price: number,
    retail_price: number,
    cf_price: number,
    quantity: number,
    commission: number,
}
export interface IProductSubstances extends Document {
    _substance: ISubstance['_id'];
}
export interface IProductSymptoms extends Document {
    _symptom: ISymptom['_id'];
}

const Float = require('mongoose-float').loadType(mongoose, 2);

const productSchema = new Schema({
    _brand: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: [true, 'La marca es necesaria']
    },
    code: {
        type: Number,
        required: [true, 'El código es necesario'],
    },
    barcode: {
        type: String,
    },
    description: {
        type: String,
    },
    healthProgram: {
        type: String,
    },
    presentations: [{
        name: {
            type: String,
        },
        wholesale_price: {
            type: Float,
            default: 0
        },
        distributor_price: {
            type: Float,
            default: 0
        },
        retail_price: {
            type: Float,
            default: 0
        },
        cf_price: {
            type: Float,
            default: 0
        },
        quantity: {
            type: Float,
            default: 0
        },
        commission: {
            type: Float,
            default: 0
        },
    }],
    substances: [{
        _substance: {
            type: Schema.Types.ObjectId,
            ref: 'Substance',
        },
    }],
    symptoms: [{
        _symptom: {
            type: Schema.Types.ObjectId,
            ref: 'Symptom',
        },
    }],
    exempt: {
        type: Boolean,
        default: false,
    },
    discontinued: {
        type: Boolean,
        default: false,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IProduct>('Product', productSchema);
