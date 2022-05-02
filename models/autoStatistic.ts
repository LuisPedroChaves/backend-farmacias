import mongoose, {Schema, Document} from 'mongoose';

import { IUser } from './user';
import { ICellar } from './cellar';
import { IBrand } from './brand';

export interface IAutoStatistic extends Document {
    _user: IUser['_id'],
	name: string,
    hour: number,
    minute: number,
    cellars: ICellar[],
    brands: IBrand[],
    daysRequest: number,
    daysSupply: number,
    note: string,
    date: Date,
    updated: string,
    activated: boolean,
	deleted: boolean
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const autoStatisticSchema: Schema = new Schema({
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es necesario']
    },
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
    hour: {
        type: Number,
        default: 0
    },
    minute: {
        type: Number,
        default: 0
    },
    cellars: [{
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        required: [true, 'La sucursal es necesaria']
    }],
    brands: [{
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: [true, 'El laboratorio es necesario']
    }],
    daysRequest: {
        type: FLOAT,
        default: 0
    },
    daysSupply: {
        type: FLOAT,
        default: 0
    },
    note: {
        type: String
    },
    date: {
        type: Date,
        required: [true, 'La fecha de creación es necesaria']
    },
    updated: {
        type: Date,
        default: null
    },
	activated: {
		type: Boolean,
		default: false,
	},
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<IAutoStatistic>('AutoStatistic', autoStatisticSchema);
