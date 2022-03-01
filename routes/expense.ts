import { Router, Request, Response } from 'express';

import { mdAuth } from '../middleware/auth';
import Expense, { IExpense } from '../models/expense';

const EXPENSE_ROUTER = Router();

EXPENSE_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    Expense.find({
        deleted: false,
    })
        .sort({ name: 1 })
        .exec((err, expenses) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando tipos de gastos',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                expenses,
            });
        });
});

EXPENSE_ROUTER.delete('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;

    Expense.findByIdAndUpdate(ID, {
        deleted: true
    })
        .then((expense: IExpense | null) => {
            res.status(200).json({
                ok: true,
                expense
            });
        })
        .catch(err => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al eliminar tipo de gasto',
                errors: err
            });
        })
})

EXPENSE_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IExpense = req.body

    const NEW_EXPENSE = new Expense({
        name: BODY.name
    })

    NEW_EXPENSE.save()
        .then((expense: IExpense) => {
            res.status(200).json({
                ok: true,
                expense,
            });
        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear tipo de gasto',
                errors: err,
            });
        })
})

export default EXPENSE_ROUTER;