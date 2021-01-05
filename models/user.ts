import mongoose, {Schema, Document} from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

export interface IUser extends Document {
	// _role:
	// name: string,
	// firs
}

const userSchema = new Schema({
	_role: {
		type: Schema.Types.ObjectId,
		ref: 'Role',
		default: null,
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

export default mongoose.model('User', userSchema);
