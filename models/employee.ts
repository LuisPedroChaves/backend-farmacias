import mongoose, { Schema, Document } from 'mongoose';

import { ILogDelete } from './logDelete';
import { IBank } from './bank';
import { ICellar } from './cellar';

export interface IEmployee extends Document {
    _logDelete: ILogDelete['_id'],
    _bank: IBank['_id'],
    _cellar: ICellar['_id'],
    _cellarIGSS: ICellar['_id'],
    code: number,
    name: string,
    lastName: string,
    family: IEmployeeFamily[],
    nit: string,
    email: string,
    birth: Date,
    gender: string,
    maritalStatus: string,
    address: string,
    city: string,
    department: string,
    docType: string,
    document: string,
    profession: string,
    academicLavel: string,
    photo: string,
    igss: boolean,
    benefits: boolean,
    bankAccount: string,
    vacationDate: string,
    lastVacationDate: Date,
    details: string,
    fired: string,
    nationality: string,
    disability: string,
    foreignPermit: string,
    igssNumber: string,
    village: string,
    linguisticCommunity: string,
    emergencyContact: IEmployeeEmergencyContact,
    vacations: IEmployeeVacation[],
    contractLaw: string,
    internalContract: string,
    confidentialityContract: string,
    newContract: string,
    cv: string
}

export interface IEmployeeFamily extends Document {
    name: string,
    birth: Date,
    type: string,
    phone: string,
}

export interface IEmployeeEmergencyContact {
    name: string,
    phone: string
}

export interface IEmployeeVacation extends Document {
    year: number,
    start: Date,
    end: Date,
    constancy: string,
    details: string,
}

const TIPOS_FAMILIA_VALIDOS = {
    values: ['father', 'mother', 'son', 'grandmother', 'grandfather', 'aunt', 'uncle', 'cousin'],
    message: '{VALUE} no es un tipo de familia permitido'
}

const TIPOS_PUEBLO_VALIDOS = {
    values: ['Maya', 'Garifuna', 'Xinca', 'Ladino', 'Otro'],
    message: '{VALUE} no es un tipo de pueblo permitido'
}

const TIPOS_COMUNIDAD_VALIDAS = {
    values: ['Otro', 'Español', 'Achi', 'Akateko', 'Awakateko', 'Chalchiteko', 'Ch’orti’', 'Chuj', 'Garífuna', 'Itza', 'Ixil', 'Kaqchikel', 'K’iche’', 'Mam', 'Mopan', 'Popti', 'Poqomam', 'Poqomchi’', 'Q’anjobal’', 'Q’eqchi', 'Sacapulteko', 'Sipakapense', 'Tektiteko', 'Tz’utujil', 'Uspanteko', 'Xinka'],
    message: '{VALUE} no es un tipo de comunidad linguistica permitido'
}

const EMERGENCY_CONTACT_SCHEMA = new Schema({
    name: {
        type: String,
    },
    phone: {
        type: String,
    },
})

const EMPLOYEE_SCHEMA: Schema = new Schema({
    _logDelete: {
        type: Schema.Types.ObjectId,
        ref: 'LogDelete',
        default: null
    },
    _bank: {
        type: Schema.Types.ObjectId,
        ref: 'Bank',
        required: [true, 'El banco es necesario'],
    },
    _cellar: {
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        required: [true, 'La sucursal es necesaria'],
    },
    _cellarIGSS: {
        type: Schema.Types.ObjectId,
        ref: 'Cellar',
        required: [true, 'La sucursal de IGSS es necesaria'],
    },
    code: {
        type: Number,
        default: 0
    },
    name: {
        type: String,
        required: [true, 'El nombre es necesario'],
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es necesario'],
    },
    family: [{
        name: {
            type: String,
        },
        birth: {
            type: Date,
            default: null
        },
        type: {
            type: String,
            enum: TIPOS_FAMILIA_VALIDOS.values,
            default: 'partner'
        },
        phone: {
            type: String,
        },
    }],
    nit: {
        type: String,
    },
    email: {
        type: String,
    },
    birth: {
        type: Date,
    },
    gender: {
        type: String,
    },
    maritalStatus: {
        type: String,
    },
    address: {
        type: String,
    },
    city: {
        type: String,
    },
    department: {
        type: String,
    },
    docType: {
        type: String,
    },
    document: {
        type: String,
    },
    profession: {
        type: String,
    },
    academicLavel: {
        type: String,
    },
    photo: {
        type: String,
    },
    igss: {
        type: Boolean,
    },
    benefits: {
        type: Boolean,
    },
    bankAccount: {
        type: String,
    },
    vacationDate: {
        type: String,
    },
    lastVacationDate: {
        type: Date,
    },
    details: {
        type: String,
    },
    fired: {
        type: String,
    },
    nationality: {
        type: String,
    },
    disability: {
        type: String,
    },
    foreignPermit: {
        type: String,
    },
    igssNumber: {
        type: String,
    },
    village: {
        type: String,
        enum: TIPOS_PUEBLO_VALIDOS.values,
        default: 'Maya'
    },
    linguisticCommunity: {
        type: String,
        enum: TIPOS_COMUNIDAD_VALIDAS.values,
        default: 'Español'
    },
    emergencyContact: {
        type: EMERGENCY_CONTACT_SCHEMA,
        default: null
    },
    vacations: [{
        year: {
            type: Number,
            default: 0
        },
        start: {
            type: Date,
            default: null
        },
        end: {
            type: Date,
            default: null
        },
        constancy: {
            type: String,
        },
        details: {
            type: String,
        },
    }],
    contractLaw: {
        type: String,
        default: null
    },
    internalContract: {
        type: String,
        default: null
    },
    confidentialityContract: {
        type: String,
        default: null
    },
    newContract: {
        type: String,
        default: null
    },
    cv: {
        type: String,
        default: null
    },
});

export default mongoose.model<IEmployee>('Employee', EMPLOYEE_SCHEMA);
