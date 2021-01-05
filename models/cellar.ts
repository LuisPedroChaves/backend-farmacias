import mongoose, {Schema, Document} from 'mongoose';

export interface ICellar extends Document {
	name: string,
    address: string,
    description: string,
	type: string,
	deleted: boolean
}

let tiposValidos = {
	values: ['BODEGA', 'FARMACIA'],
	message: '{VALUE} no es un tipo permitido'
};

const cellarSchema: Schema = new Schema({
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	address: {
		type: String,
	},
	description: {
		type: String,
    },
    type: {
        type: String,
        enum: tiposValidos.values,
        default: 'BODEGA'
    },
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<ICellar>('Cellar', cellarSchema);
