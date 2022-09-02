import { Router, Request, Response } from 'express';

import { CREATE_LOG_DELETE } from '../functions/logDelete';
import { mdAuth } from '../middleware/auth';
import Discount, { IDiscount } from '../models/discount';

const DISCOUNT_ROUTER = Router();

DISCOUNT_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {

    Discount.find({
        _logDelete: null,
    })
        .populate({
            path: '_employeeJob',
            populate: {
                path: '_employee'
            }
        })
        .sort({ date: -1 })
        .exec((err, discounts) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando descuentos',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                discounts,
            });
        });
});

DISCOUNT_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IDiscount = req.body;

    const {
        _employeeJob,
        date,
        type,
        details,
        hours,
        amount,
        approved,
        hasDiscount,
        applied
    } = BODY;

    Discount.findByIdAndUpdate(ID, {
        _employeeJob,
        date,
        type,
        details,
        hours,
        amount,
        approved,
        hasDiscount,
        applied
    },
        {
            new: true
        })
        .then((discount: IDiscount | null) => {

            res.status(200).json({
                ok: true,
                discount,
            });

        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar descuento',
                errors: err
            });
        })
})

DISCOUNT_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    Discount.findById(ID, async (err, discount) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar descuento',
                errors: err,
            });
        }

        if (!discount) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El descuento con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe un descuento con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Descuento - ${discount?.details}`, DETAILS);

        discount._logDelete = LOG_DELETE;

        discount.save((err, discount) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar descuento',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                discount,
            });
        });

    });
})

DISCOUNT_ROUTER.post('/', mdAuth, (req: any, res: Response) => {
    const BODY: IDiscount = req.body

    const {
        _employeeJob,
        date,
        type,
        details,
        hours,
        amount,
        approved,
        hasDiscount,
        applied
    } = BODY;

    const NEW_DISCOUNT = new Discount({
        _user: req.user,
        _employeeJob,
        date,
        type,
        details,
        hours,
        amount,
        approved,
        hasDiscount,
        applied
    })

    NEW_DISCOUNT.save()
        .then(async (discount: IDiscount) => {

            res.status(200).json({
                ok: true,
                discount,
            });

        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear descuento',
                errors: err,
            });
        })
})

export default DISCOUNT_ROUTER;