import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user';
const Float = require('mongoose-float').loadType(mongoose, 2);

export interface ICustomer extends Document {
	name: string,
 	nit: string,
 	phone: string,
 	address: string,
 	town: string,
 	department: string,
 	company: string,
 	transport: string,
 	limitCredit: number,
	 limitDaysCredit: number,
	 _seller?: IUser['_id'],
	deleted: boolean
}

const customerSchema: Schema = new Schema({
	_seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	nit: {
        type: String,
		required: [true, 'El nit es necesario'],
	},
	phone: {
		type: String,
	},
	address: {
		type: String,
	},
	town: {
		type: String,
	},
	department: {
		type: String,
		required: [true, 'El departamento es necesario'],
	},
	company: {
		type: String,
	},
	transport: {
		type: String,
    },
    limitCredit: {
        type: Float,
        default: 0
    },
    limitDaysCredit: {
        type: Number,
        default: 0
	},
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<ICustomer>('Customer', customerSchema);
