import mongoose, {Schema, Document} from 'mongoose';

export interface IProvider extends Document {
	name: string,
	address: string,
	nit: string,
	phone: string,
	email: string,
	creditDays: number,
	deleted: boolean
}

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
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<IProvider>('Provider', providerSchema);
