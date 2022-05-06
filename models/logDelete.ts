import mongoose, {Schema, Document} from 'mongoose';
import { IUser } from './user';

export interface ILogDelete extends Document {
	_user: IUser['_id'];
    date: string,
    title: string,
	details: string,
}

const LOG_DELETE_SCHEMA = new Schema({
	_user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'El usuario es necesario']
	},
    date: {
        type: Date,
    },
	title: {
		type: String,
	},
	details: {
		type: String,
	},
});

export default mongoose.model<ILogDelete>('LogDelete', LOG_DELETE_SCHEMA);
