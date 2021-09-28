import { IPurchaseDetail } from '../models/purchase';
import Storage from '../models/storage';

export const INGRESO = (detail: IPurchaseDetail[]): Promise<any> => {
    return Promise.all(
        detail.map(async (element: IPurchaseDetail) => {
            // const STORAGE = await Storage.findOne(
            //     {
            //         _cellar: _cellar._id,
            //         _product: element._product
            //     }
            // ).exec();
        })
    );
};
