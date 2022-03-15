import mongoose, {Schema, Document} from 'mongoose';

export interface IProvider extends Document {
	name: string,
	address: string,
	nit: string,
	phone: string,
	email: string,
	creditDays: number,
	credit: number,
	balance: number,
	iva: boolean,
	isr: boolean,
	deleted: boolean
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const providerSchema: Schema = new Schema({
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	address: {
		type: String,
	},
	nit: {
		type: String,
	},
	phone: {
		type: String,
	},
	email: {
		type: String,
	},
	creditDays: {
		type: Number,
        default: 0
	},
	credit: {
		type: FLOAT,
		default: 0
	},
	balance: {
		type: FLOAT,
		default: 0
	},
	iva: {
		type: Boolean,
		default: false,
	},
	isr: {
		type: Boolean,
		default: false,
	},
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<IProvider>('Provider', providerSchema);
