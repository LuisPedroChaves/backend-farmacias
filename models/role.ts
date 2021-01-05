import mongoose, { Schema, Document } from 'mongoose';
import { ICellar } from './cellar';

export interface IRole extends Document {
	_cellar: ICellar['_id'];
	name: string,
	type: string,
	deleted: boolean
}

let tiposValidos = {
	values: ['ADMIN', 'BODEGA', 'FARMACIA', 'REPARTIDOR'],
	message: '{VALUE} no es un tipo permitido'
};

const roleSchema: Schema = new Schema({
	_cellar: { type: Schema.Types.ObjectId, required: true },
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	type: {
		type: String,
		enum: tiposValidos.values,
		default: 'ADMIN'
	},
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<IRole>('Role', roleSchema);
