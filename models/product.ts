import mongoose, { Schema, Document } from 'mongoose';
import moment from 'moment-timezone';
import { IBrand } from './brand';
import { ICellar } from './cellar';

export interface IProduct extends Document {
    _brand: IBrand['_id'];
    code: string,
    description: string,
    wholesale_price: number,
    distributor_price: number,
    retail_price: number,
    cf_price: number,
    missing: IProductMissing[],
    stagnant: IProductStagnant[],
    deleted: boolean
}

export interface IProductMissing extends Document {
    _cellar: ICellar['_id'],
    quantity: number,
    state: string
}

export interface IProductStagnant extends Document {
    _cellar: ICellar['_id'],
    detail: IProductStagnantDetail[],
}

export interface IProductStagnantDetail extends Document {
    quantity: number,
    expiration_date: Date,
}

const Float = require('mongoose-float').loadType(mongoose, 2);

const MISSING_STATES = {
    values: ['REQUEST', 'PROCESS', 'OUTSTOCK', 'ROUTE', 'FINISH'],
    message: '{VALUE} no es un estado permitido'
}

const productSchema = new Schema({
    _brand: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: [true, 'La marca es necesaria']
    },
    code: {
        type: String,
        required: [true, 'El código es necesario'],
    },
    description: {
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
    missing: [{
        _cellar: {
            type: Schema.Types.ObjectId,
            ref: 'Cellar',
        },
        date: {
            type: Date,
            default: moment().tz("America/Guatemala").format()
        },
        quantity:{
            type: Float,
            default: 0
        },
        state: {
            type: String,
            enum: MISSING_STATES.values,
            default: 'REQUEST'
        }
    }],
    stagnant:[{
        _cellar: {
            type: Schema.Types.ObjectId,
            ref: 'Cellar',
        },
        detail: [{
            quantity:{
                type: Float,
                default : 0
            },
            expiration_date: {
                type: Date,
                default: moment().tz("America/Guatemala").format()
            }
        }]
    }],
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IProduct>('Product', productSchema);
