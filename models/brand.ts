import mongoose, {Schema, Document} from 'mongoose';

export interface IBrand extends Document {
	code: number,
	name: string,
	deleted: boolean
}

const brandSchema: Schema = new Schema({
	code: {
		type: Number,
	},
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<IBrand>('Brand', brandSchema);
