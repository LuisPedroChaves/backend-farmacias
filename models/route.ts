import mongoose, { Schema, Document } from 'mongoose';
import moment from 'moment-timezone';
import { IUser } from './user';
import { IOrder } from './order';
import { ICellar } from './cellar';
import { IInternalOrder } from './internalOrder';

export interface IRoute extends Document {
    _user: IUser['_id'];
    _cellar?: ICellar['_id'];
    noRoute: number,
    date: Date,
    details: IRouteDetail[],
    state: string,
    timeFinish: string,
    deleted: boolean
}

export interface IRouteDetail extends Document {
    _order?: IOrder['_id'];
    _internalOrder?: IInternalOrder['_id'];
}

let estadosValidos = {
    values: ['INICIO', 'RUTA', 'FIN', 'RECHAZADA'],
    message: '{VALUE} no es un estado permitido'
};

const routeSchema = new Schema({
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es necesario']
    },
    _cellar: {
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        default: null
    },
    noRoute: {
        type: Number,
        required: [true, 'El número de ruta es necesario'],
    },
    date: {
        type: Date,
        default: moment().tz("America/Guatemala").format()
    },
    details: [{
        _order: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            default: null
        },
        _internalOrder: {
            type: Schema.Types.ObjectId,
            ref: 'InternalOrder',
            default: null
        },
    }],
    state: {
        type: String,
        enum: estadosValidos.values,
        default: 'INICIO'
    },
    timeFinish: {
        type: Date,
        default: null
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export default mongoose.model<IRoute>('Route', routeSchema);
