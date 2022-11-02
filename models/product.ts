import mongoose, { Schema, Document } from 'mongoose';

import { IBrand } from './brand';
import { ISubstance } from './substance';
import { ISymptom } from './symptoms';
import { IProvider } from './provider';

export interface IProduct extends Document {
    _brand: IBrand['_id'];
    picture: string,
    code: number,
    barcode: string,
    description: string,
    healthProgram: string,
    presentations: IProductPresentations[],
    substances: ISubstance[],
    symptoms: ISymptom[],
    lastUpdate: string,
    exempt: boolean,
    discontinued: boolean,
    ticket: IProductTicket,
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
    cost: number,
}
export interface IProductTicket {
    providerCode: string,
    loteCode: string,
    date: Date
}

const Float = require('mongoose-float').loadType(mongoose, 2);

const TICKET_SCHEMA = new Schema({
    providerCode: {
        type: String,
    },
    loteCode: {
        type: String,
    },
    date: {
        type: Date,
        default: null
    },
})

const productSchema = new Schema({
    _brand: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: [true, 'La marca es necesaria']
    },
    picture: {
        type: String,
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
        cost: {
            type: Float,
            default: 0
        },
    }],
    substances: [{
        type: Schema.Types.ObjectId,
        ref: 'Substance',
    }],
    symptoms: [{
        type: Schema.Types.ObjectId,
        ref: 'Symptom',
    }],
    lastUpdate: {
        type: Date,
        default: null
    },
    exempt: {
        type: Boolean,
        default: false,
    },
    discontinued: {
        type: Boolean,
        default: false,
    },
    ticket: {
        type: TICKET_SCHEMA,
        default: null
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IProduct>('Product', productSchema);
