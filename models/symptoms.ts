import mongoose, {Schema, Document} from 'mongoose';

export interface ISymptom extends Document {
	name: string,
	deleted: boolean
}

const symptomSchema: Schema = new Schema({
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<ISymptom>('Symptom', symptomSchema);
