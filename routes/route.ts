import { Router, Request, Response } from 'express';
// import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { mdAuth } from '../middleware/auth'
import Route from '../models/route';
import Order from '../models/order';

import { IRoute, IRouteDetail } from '../models/route';

const routeRouter = Router();
// const ObjectId = mongoose.Types.ObjectId;

/* #region  GET */
routeRouter.get('/:_user', mdAuth, (req: Request, res: Response) => {
    const mes: number = Number(req.query.month);
    let mes2 = 0;
    let año: number = Number(req.query.year);
    let año2: number = Number(req.query.year);
    const _user = req.params._user;

    if (mes == 12) {
        mes2 = 1;
        año2 = año + 1;
    } else {
        mes2 = mes + 1;
    }

    Route.find(
        {
            _user: _user,
            date: {
                $gte: new Date(año + ',' + mes),
                $lt: new Date(año2 + ',' + mes2),
            },
            state: {
                $in: ['FIN', 'RECHAZADA']
            },
            deleted: false
        },
        ''
    )
    .populate('details._order')
        .sort({
            date: -1
        })
        .exec((err: any, routes: IRoute) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando rutas',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                routes
            });
        });
});
/* #endregion */

/* #region  GET */
routeRouter.get('/active/:_user', mdAuth, (req: Request, res: Response) => {
    const _user = req.params._user;

    Route.find(
        {
            _user: _user,
            state: {
                $in: ['INICIO', 'RUTA']
            },
            deleted: false
        },
        ''
    )
        .populate('details._order')
        .sort({
            date: -1
        })
        .exec((err: any, actives: IRoute) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando rutas',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                actives
            });
        });
});
/* #endregion */

/* #region  PUT */
routeRouter.put('/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    Route.findById(id, (err, route) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar ruta',
                errors: err
            });
        }

        if (!route) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La ruta con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una ruta con ese ID'
                }
            });
        }

        const promises = route.details.map((detail: IRouteDetail) => {
            return new Promise((resolve, reject) => {

                Order.findById(detail._order, (err, order) => {
                    if (err) {
                        return reject('Error al buscar orden');
                    }

                    if (!order) {
                        return reject('No existe una orden con ese ID');
                    }

                    order._delivery = null;

                    order.save((err, order) => {
                        if (err) {
                            return reject('Error al actualizar orden');
                        }

                        resolve(true);
                    });
                });
            });
        });

        Promise.all(promises)
            .then((results) => {

                route.details = body.details;

                route.save((err, route) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Error al actualizar ruta',
                            errors: err
                        });
                    }

                    const promises = route.details.map((detail: IRouteDetail) => {
                        return new Promise((resolve, reject) => {

                            Order.findById(detail._order, (err, order) => {
                                if (err) {
                                    return reject('Error al buscar orden');
                                }

                                if (!order) {
                                    return reject('No existe una orden con ese ID');
                                }

                                order._delivery = route._user;

                                order.save((err, order) => {
                                    if (err) {
                                        return reject('Error al actualizar orden');
                                    }

                                    resolve(true);
                                });
                            });
                        });
                    });

                    Promise.all(promises)
                        .then((results) => {
                            res.status(200).json({
                                ok: true,
                                route
                            });
                        })
                        .catch((error) => {
                            res.status(400).json({
                                ok: false,
                                mensaje: 'Error al actualizar ordenes.',
                                errors: error
                            });
                        });
                });
            })
            .catch((error) => {
                res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar ordenes.',
                    errors: error
                });
            });
    });
});
/* #endregion */

/* #region  PUT */
routeRouter.put('/state/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    Route.findById(id, (err, route) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar ruta',
                errors: err
            });
        }

        if (!route) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La ruta con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una ruta con ese ID'
                }
            });
        }

        route.state = body.state;
        if (body.state === 'FIN') {
            route.timeFinish = moment().tz("America/Guatemala").format();
        }

        route.save((err, route) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar ruta',
                    errors: err
                });
            }

            if (route.state === 'RUTA') {
                const promises = route.details.map((detail: IRouteDetail) => {
                    return new Promise((resolve, reject) => {

                        Order.findById(detail._order, (err, order) => {
                            if (err) {
                                return reject('Error al buscar orden');
                            }

                            if (!order) {
                                return reject('No existe una orden con ese ID');
                            }

                            order.state = 'ENVIO';
                            order.timeSend = moment().tz("America/Guatemala").format();

                            order.save((err, order) => {
                                if (err) {
                                    return reject('Error al actualizar orden');
                                }

                                resolve(true);
                            });
                        });
                    });
                });

                Promise.all(promises)
                    .then((results) => {
                        res.status(200).json({
                            ok: true,
                            route
                        });
                    })
                    .catch((error) => {
                        res.status(400).json({
                            ok: false,
                            mensaje: 'Error al actualizar ordenes.',
                            errors: error
                        });
                    });
            }else if (route.state === 'RECHAZADA') {
                const promises = route.details.map((detail: IRouteDetail) => {
                    return new Promise((resolve, reject) => {

                        Order.findById(detail._order, (err, order) => {
                            if (err) {
                                return reject('Error al buscar orden');
                            }

                            if (!order) {
                                return reject('No existe una orden con ese ID');
                            }

                            order._delivery = null;

                            order.save((err, order) => {
                                if (err) {
                                    return reject('Error al actualizar orden');
                                }

                                resolve(true);
                            });
                        });
                    });
                });

                Promise.all(promises)
                    .then((results) => {
                        res.status(200).json({
                            ok: true,
                            route
                        });
                    })
                    .catch((error) => {
                        res.status(400).json({
                            ok: false,
                            mensaje: 'Error al actualizar ordenes.',
                            errors: error
                        });
                    });
            }else {
                res.status(200).json({
                    ok: true,
                    route
                });
            }
        });
    });
});
/* #endregion */

/* #region  DELETE */
routeRouter.delete('/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;

    Route.findById(id, (err, route) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar ruta',
                errors: err
            });
        }

        if (!route) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La ruta con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una ruta con ese ID'
                }
            });
        }

        route.deleted = true;

        route.save((err, route) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar ruta',
                    errors: err
                });
            }

            const promises = route.details.map((detail: IRouteDetail) => {
                return new Promise((resolve, reject) => {

                    Order.findById(detail._order, (err, order) => {
                        if (err) {
                            return reject('Error al buscar orden');
                        }

                        if (!order) {
                            return reject('No existe una orden con ese ID');
                        }

                        order._delivery = null;
                        order.state = 'DESPACHO';

                        order.save((err, order) => {
                            if (err) {
                                return reject('Error al actualizar orden');
                            }

                            resolve(true);
                        });
                    });
                });
            });

            Promise.all(promises)
                .then((results) => {
                    res.status(200).json({
                        ok: true,
                        route
                    });
                })
                .catch((error) => {
                    res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar ordenes.',
                        errors: error
                    });
                });
        });
    });
});
/* #endregion */

/* #region  POST cellar */
routeRouter.post('/', mdAuth, (req: Request, res: Response) => {
    const body = req.body;

    try {

        Route.findOne(
            {
                _user: body._user,
                deleted: false
            },
            'noRoute',
            {
                sort: {
                    noRoute: -1
                }
            },
            function (err, route) {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al buscar correlativo',
                        errors: err,
                    });
                }

                let correlative = 0;
                if (route) {
                    correlative = Number(route.noRoute) + 1;
                }

                const newRoute = new Route({
                    _user: body._user,
                    noRoute: correlative,
                    details: body.details,
                });

                newRoute
                    .save()
                    .then((route) => {
                        const promises = route.details.map((detail: IRouteDetail) => {
                            return new Promise((resolve, reject) => {

                                Order.findById(detail._order, (err, order) => {
                                    if (err) {
                                        return reject('Error al buscar orden');
                                    }

                                    if (!order) {
                                        return reject('No existe una orden con ese ID');
                                    }

                                    order._delivery = route._user;

                                    order.save((err, order) => {
                                        if (err) {
                                            return reject('Error al actualizar orden');
                                        }

                                        resolve(true);
                                    });
                                });
                            });
                        });

                        Promise.all(promises)
                            .then((results) => {
                                res.status(200).json({
                                    ok: true,
                                    route,
                                });
                            })
                            .catch((error) => {
                                res.status(400).json({
                                    ok: false,
                                    mensaje: 'Error al actualizar ordenes.',
                                    errors: error
                                });
                            });
                    })
                    .catch((err) => {
                        res.status(400).json({
                            ok: false,
                            mensaje: 'Error al crear ruta',
                            errors: err,
                        });
                    });
            });
    } catch (err) {
        // ERROR GLOBAL
        console.log("🚀 ~ file: order.ts ~ line 1248 ~ orderRouter.post ~ err", err)
    }
});
/* #endregion */

export default routeRouter;
