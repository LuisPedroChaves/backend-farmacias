import mongoose, { Schema, Document } from 'mongoose';

export interface ICheck extends Document {
    no: string,
    city: string,
    date: Date,
    name: string,
    description: string,
    amount: number,
    state: string,
    delivered: boolean
}

const FLOAT = require('mongoose-float').loadType(mongoose, 2);

const ESTADOS_VALIDOS = {
    values: ['CREADO', 'INTERBANCO', 'ESPERA', 'AUTORIZADO', 'PAGADO', 'ANULADO', 'RECHAZADO'],
    message: '{VALUE} no es un estado permitido'
};

const checkSchema = new Schema({
    no: {
        type: String,
    },
    city: {
        type: String,
    },
    date: {
        type: Date,
        default: null
    },
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    amount: {
        type: FLOAT,
        default: 0
    },
    state: {
        type: String,
        enum: ESTADOS_VALIDOS.values,
        default: 'CREADO'
    },
    delivered: {
        type: Boolean,
        default: false
    }
})

export default mongoose.model<ICheck>('Check', checkSchema)
