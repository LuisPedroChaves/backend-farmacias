import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
	name: string,
	type: string,
	permissions: IPermission[],
	deleted: boolean
}

export interface IPermission {
	name: string;
    label: string;
    parent: string;
    level: number;
    options: string[];
}

const tiposValidos = {
	values: ['FACTORY', 'PHARMA', 'ADMIN', 'DELIVERY', 'SELLER'],
	message: '{VALUE} no es un estado permitido'
};

const roleSchema: Schema = new Schema({
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	type: {
		type: String,
		default: 'PHARMA',
		enum: tiposValidos.values
	},
	permissions: [
		{
			name: {
				type: String,
				required: [true, 'El nombre es necesario'],
			},
			label: {
				type: String,
				required: [true, 'La etiqueta  es necesaria'],
			},
			parent: {
				type: String,
				required: false,
			},
			level: {
				type: Number,
				required: false,
			},
			options: [
				{
					type: String,
					required: false,
				},
			],
		},
	],
	deleted: {
		type: Boolean,
		default: false,
	},
});

export default mongoose.model<IRole>('Role', roleSchema);
