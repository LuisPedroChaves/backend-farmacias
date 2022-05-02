import mongoose, {Schema, Document} from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IRole } from './role';
import { ICellar } from './cellar';

export interface IUser extends Document {
	_role: IRole['_id'];
	_cellar: ICellar['_id'];
	name: string,
	username: string,
	password: string,
	imageIndex: number,
	email: string,
	deleted: boolean
}

const userSchema = new Schema({
	_role: {
		type: Schema.Types.ObjectId,
		ref: 'Role',
		required: [true, 'El rol es necesario']
	},
	_cellar: {
		type: Schema.Types.ObjectId,
		ref: 'Cellar',
		default: null
	},
	name: {
		type: String,
		required: [true, 'El nombre es necesario'],
	},
	username: {
		type: String,
		unique: true,
		required: [true, 'El nombre de usuario es necesario'],
	},
	password: {
		type: String,
		required: [true, 'La contraseña es necesaria'],
	},
	imageIndex: {
		type: Number,
		required: false,
	},
	email: {
		type: String,
		required: false,
	},
	deleted: {
		type: Boolean,
		default: false,
	},
});

userSchema.plugin(uniqueValidator, {
	message: '{PATH} debe ser único',
});

export default mongoose.model<IUser>('User', userSchema);
