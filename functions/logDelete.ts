import moment from 'moment-timezone';

import LogDelete, { ILogDelete } from "../models/logDelete";
import { IUser } from "../models/user";


export const CREATE_LOG_DELETE = (_user: IUser, title: string, details: string): Promise<ILogDelete> => {

    const NEW_LOG_DELETE = new LogDelete({
        _user,
        date: moment().tz("America/Guatemala").format(),
        title,
        details
    })

    return NEW_LOG_DELETE.save()
}