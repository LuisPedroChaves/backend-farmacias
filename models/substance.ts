import mongoose, {Schema, Document} from 'mongoose';

export interface ISubstance extends Document {
	name: string,
	deleted: boolean
}

const substanceSchema: Schema = new Schema({
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<ISubstance>('Substance', substanceSchema);
