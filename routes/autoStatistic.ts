import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth';
import AutoStatistic, { IAutoStatistic } from '../models/autoStatistic';

const AUTO_STATISTIC_ROUTER = Router();
const SCHDULED_FUNCTIONS = require('../scheduledJobs/globalStatistics');

AUTO_STATISTIC_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    AutoStatistic.find({
        deleted: false,
    })
        .populate('_user')
        .populate('brands')
        .sort({ name: 1 })
        .exec((err, autoStatistics) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando configuraciones',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                autoStatistics,
            });
        });
});

AUTO_STATISTIC_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IAutoStatistic = req.body;

    AutoStatistic.findByIdAndUpdate(ID, {
        name: BODY.name,
        hour: BODY.hour,
        minute: BODY.minute,
        cellars: BODY.cellars,
        brands: BODY.brands,
        daysRequest: BODY.daysRequest,
        daysSupply: BODY.daysSupply,
        note: BODY.note,
        activated: BODY.activated,
        updated: moment().tz("America/Guatemala").format(),
    },
        {
            new: true
        })
        .then((autoStatistic: IAutoStatistic | null) => {
            SCHDULED_FUNCTIONS.initScheduledJobs();

            res.status(200).json({
                ok: true,
                autoStatistic
            });
        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar configuración',
                errors: err
            });
        })
})

AUTO_STATISTIC_ROUTER.delete('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;

    AutoStatistic.findByIdAndUpdate(ID, {
        deleted: true
    })
        .then((autoStatistic: IAutoStatistic | null) => {
            SCHDULED_FUNCTIONS.initScheduledJobs();
            res.status(200).json({
                ok: true,
                autoStatistic
            });
        })
        .catch(err => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al eliminar configuración',
                errors: err
            });
        })
})

AUTO_STATISTIC_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IAutoStatistic = req.body

    const NEW_AUTO_STATISTIC = new AutoStatistic({
        _user: BODY._user,
        name: BODY.name,
        hour: BODY.hour,
        minute: BODY.minute,
        cellars: BODY.cellars,
        brands: BODY.brands,
        daysRequest: BODY.daysRequest,
        daysSupply: BODY.daysSupply,
        note: BODY.note,
        activated: BODY.activated,
        date: moment().tz("America/Guatemala").format(),
    })

    NEW_AUTO_STATISTIC.save()
        .then((autoStatistic: IAutoStatistic) => {
            SCHDULED_FUNCTIONS.initScheduledJobs();

            res.status(200).json({
                ok: true,
                autoStatistic,
            });
        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear configuracion',
                errors: err,
            });
        })
})

export default AUTO_STATISTIC_ROUTER;