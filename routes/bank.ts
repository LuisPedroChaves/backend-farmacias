import { Router, Request, Response } from 'express';
import { CREATE_LOG_DELETE } from '../functions/logDelete';

import { mdAuth } from '../middleware/auth';
import Bank, { IBank } from '../models/bank';

const BANK_ROUTER = Router();

BANK_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    Bank.find({
        _logDelete: null,
    })
        .sort({ name: 1 })
        .exec((err, banks) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando bancos',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                banks,
            });
        });
});

BANK_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    Bank.findById(ID, async (err, bank) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar banco',
                errors: err,
            });
        }

        if (!bank) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El banco con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe un banco con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Banco - ${bank?.name}`, DETAILS);

        bank._logDelete = LOG_DELETE;

        bank.save((err, bank) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar banco',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                bank,
            });
        });
    });
})

BANK_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IBank = req.body

    const {
        image,
        name
    } = BODY;

    const NEW_BANK = new Bank({
        image,
        name
    })

    NEW_BANK.save()
        .then((bank: IBank) => {
            res.status(200).json({
                ok: true,
                bank,
            });
        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear banco',
                errors: err,
            });
        })
})

export default BANK_ROUTER;