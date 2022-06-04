import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { UPDATE_BANK_BALANCE } from '../functions/bank';

import { mdAuth } from '../middleware/auth';
import BankFlow, { IBankFlow } from '../models/bankFlow';

const BANK_FLOW_ROUTER = Router();

BANK_FLOW_ROUTER.get('/:bankAccount', mdAuth, (req: Request, res: Response) => {
    const _bankAccount = req.params.bankAccount;

    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    BankFlow.find({
        _bankAccount,
        date: {
            $gte: new Date(startDate.toDateString()),
            $lt: new Date(endDate.toDateString()),
        },
    })
        .populate('_bankAccount')
        .populate('_check')
        .sort({ date: -1 })
        .exec((err, bankFlows) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando movimientos de cuenta',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                bankFlows,
            });
        });
});

BANK_FLOW_ROUTER.post('/', mdAuth, async (req: Request, res: Response) => {
    const BODY: IBankFlow = req.body

    await UPDATE_BANK_BALANCE(BODY);

    res.status(200).json({
        ok: true,
    });
})

export default BANK_FLOW_ROUTER;