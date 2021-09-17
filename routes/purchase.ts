import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth'

import Purchase from '../models/purchase';
import Storage from '../models/storage';
import { IPurchase, IPurchaseDetail } from '../models/purchase';

const PURCHASE_ROUTER = Router();

/* #region  GET */
PURCHASE_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {

    Purchase.find(
        {
            deleted: false
        }
    )
        .sort({
            name: 1
        })
        .exec(async (err: any, purchases: IPurchase[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando compras',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                purchases
            });
        });
});
/* #endregion */

/* #region  POST cellar */
PURCHASE_ROUTER.post('/', mdAuth, async (req: Request, res: Response) => {
    const BODY = req.body;

    BODY.detail = await searchPrices(BODY._cellar, BODY.detail);

    const newPurchase = new Purchase({
        _cellar: BODY._cellar,
        _user: BODY._user,
        _provider: BODY._provider,
        noBill: BODY.noBill,
        date: BODY.date,
        requisition: BODY.requisition,
        details: BODY.details,
        detail: BODY.detail,
        payment: BODY.payment,
        total: BODY.total,
        file: BODY.file,
    });

    newPurchase
        .save()
        .then((purchase) => {
            res.status(200).json({
                ok: true,
                purchase,
            });
        })
        .catch((err) => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear compra',
                errors: err,
            });
        });
});
/* #endregion */

const searchPrices = async (_cellar: string, detail: IPurchaseDetail[]): Promise<any> => {
    return Promise.all(
        detail.map(async (element: IPurchaseDetail) => {

            const STORAGE = await Storage.findOne(
                {
                    _cellar,
                    _product: element._product
                }
            ).exec();

            if (STORAGE) {
                const diff: number = (element.cost - STORAGE.cost);
                const percent: number = (diff / STORAGE.cost) * 100;

                element.changedPrice = percent;
            } else {
                const NEW_STORAGE = new Storage({
                    _cellar,
                    _product: element._product,
                    minStock: 10,
                    maxStock: 30,
                    cost: element.cost,
                    totalStock: 0,
                    reserve: 0,
                    state: ''//TODO: Agregar state por defecto
                });

                await NEW_STORAGE.save().then();

                element.changedPrice = 0;
            }

            return {
                ...element,
            };
        })
    );
};

export default PURCHASE_ROUTER;
