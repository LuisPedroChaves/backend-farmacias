import { Router, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth'
import Sale from '../models/sale';
import Customer from '../models/customer';

import { ISale, ISaleBalance } from '../models/sale';

const SALE_ROUTER = Router();
SALE_ROUTER.use(fileUpload());
// const ObjectId = mongoose.Types.ObjectId;

/* #region  GET */
SALE_ROUTER.get('/history/:_customer', mdAuth, (req: Request, res: Response) => {
    const _customer = req.params._customer;

    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    Sale.find(
        {
            _customer,
            date: {
                $gte: new Date(startDate.toDateString()),
                $lt: new Date(endDate.toDateString()),
            },
            paid: true,
            deleted: false
        },
        ''
    )
        .populate('_seller', '')
        .populate('_cellar', '')
        .sort({
            date: -1
        })
        .exec((err: any, sales: ISale) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ventas',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                sales
            });
        });
});

SALE_ROUTER.get('/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    Sale.find(
        {
            _cellar,
            date: {
                $gte: new Date(startDate.toDateString()),
                $lt: new Date(endDate.toDateString()),
            },
            deleted: false
        },
        ''
    )
        .populate('_seller', '')
        .populate('_customer', '')
        .sort({
            date: -1
        })
        .exec((err: any, sales: ISale) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ventas',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                sales
            });
        });
});
/* #endregion */

SALE_ROUTER.put('/:id', mdAuth, (req, res) => {
    const id = req.params.id;
    const body = req.body;

    Sale.findById(id, function (err, sale: ISale) {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar venta',
                errors: err
            });
        }

        if (!sale) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La venta con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una venta con ese ID'
                }
            });
        }

        // CALCULO PARA PAGAR LA COMPRA
        var balance: number = body.balance.reduce(
            (sum: number, item: ISaleBalance) => Number(sum) + Number(item.amount),
            0
        );

        if (Number((sale.total - balance).toFixed(2)) <= 0) {
            body.paid = true;
        } else {
            body.paid = false;
        }

        sale.balance = body.balance;
        sale.paid = body.paid;

        sale.save(function (err, sale) {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar venta',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                sale
            });
        });
    });
});

SALE_ROUTER.delete('/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;

    Sale.findById(id, (err, sale) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar venta',
                errors: err,
            });
        }

        if (!sale) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La venta con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una venta con ese ID',
                },
            });
        }

        sale.deleted = true;

        sale.save((err, sale) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar venta',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                sale,
            });
        });
    });
});

/* #region  POST'S */
SALE_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const body = req.body;

    try {
        if (body.code) {
            body.code = body.code.replace(/\s/g, '').toUpperCase();
        }

        Customer.findOne({
            $or: [{ code: body.code }, { nit: body.nit }],
            deleted: false
        }).exec(async (err, _customer) => {
            if (err) {
                res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar cliente',
                    errors: err,
                });
            }

            if (!_customer) {
                if (
                    !body.nit ||
                    body.nit === '' ||
                    body.nit === 'C/F' ||
                    body.nit === 'c/f' ||
                    body.nit === 'cf' ||
                    body.nit === 'CF'
                ) {
                    body.nit = 'CF';
                }
                // hay que guaradar el cliente
                const customer = new Customer({
                    code: body.code,
                    name: body.name,
                    nit: body.nit,
                    phone: body.phone,
                    address: body.address,
                    town: body.town,
                    department: body.department,
                    company: body.company,
                    transport: body.transport,
                    limitCredit: body.limitCredit,
                    limitDaysCredit: body.limitDaysCredit,
                    _seller: body._seller,
                });

                await customer
                    .save()
                    .then((NewCustomer) => {
                        _customer = NewCustomer;
                    })
                    .catch((err) => {
                        res.status(400).json({
                            ok: false,
                            mensaje: 'Error al crear cliente',
                            errors: err,
                        });
                    });
            } else if (_customer) {
                _customer.code = body.code;
                _customer.name = body.name;
                _customer.nit = body.nit;
                _customer.phone = body.phone;
                _customer.address = body.address;
                _customer.town = body.town;
                _customer.department = body.department;
                _customer.company = body.company;
                _customer.transport = body.transport;
                _customer.limitCredit = body.limitCredit;
                _customer.limitDaysCredit = body.limitDaysCredit;
                _customer._seller = body._seller;

                await _customer.save((err, NewCustomer) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Error al actualizar cliente',
                            errors: err
                        });
                    }
                    _customer = NewCustomer;
                });
            }

            const newSale = new Sale({
                _cellar: body._cellar,
                _customer,
                _seller: body._seller,
                date: body.date,
                noBill: body.noBill,
                balance: body.balance,
                total: body.total,
            });

            newSale
                .save()
                .then((sale) => {
                    res.status(200).json({
                        ok: true,
                        sale,
                    });
                })
                .catch((err) => {
                    res.status(400).json({
                        ok: false,
                        mensaje: 'Error al crear venta',
                        errors: err,
                    });
                });
        });
    } catch (err) {
        // ERROR GLOBAL
        console.log("🚀 ~ file: order.ts ~ line 1248 ~ orderRouter.post ~ err", err)
    }
});

SALE_ROUTER.post('/xlsx', (req: Request, res: Response) => {
    // Sino envia ningún archivo
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No Selecciono nada',
            errors: { message: 'Debe de seleccionar un archivo' }
        });
    }

    // Obtener nombre y la extensión del archivo
    const FILE: any = req.files.archivo;
    const NAME_FILE = FILE.name.split('.');
    const EXT_FILE = NAME_FILE[NAME_FILE.length - 1];

    // Nombre del archivo personalizado
    const NEW_NAME_FILE = `${new Date().getMilliseconds()}.${EXT_FILE}`;

    // Mover el archivo de la memoria temporal a un path
    const PATH = `./uploads/temp/${NEW_NAME_FILE}`;

    FILE.mv(PATH, async (err: any) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        const DOC = xlsx.parse(PATH);

        await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
            try {
                Customer.findOne({
                    code: doc[1],
                    deleted: false
                }).exec(async (err, _customer) => {
                    if (err) {
                        res.status(500).json({
                            ok: false,
                            mensaje: 'Error al buscar cliente',
                            errors: err,
                        });
                    }

                    if (_customer) {
                        let total = doc[5];
                        total = parseFloat(total)

                        let date =  new Date(moment(ExcelDateToJSDate(doc[3])).tz("America/Guatemala").format());

                        const newSale = new Sale({
                            _cellar: '602ea4400831cb50f0495675',
                            _customer,
                            _seller: '61e1e49c4beb0417187235ed', // IVAN MONTERROSO
                            date: date,
                            noBill: doc[4],
                            total: total,
                        });

                        let sale = await newSale
                            .save()
                            .then();

                    }else {
                        console.log(doc[1]);

                    }

                });
            } catch (e: any) {
                throw new Error(e.message);
            }
        });

        return res.status(201).json({
            ok: true,
            m: 'CLIENTES INGRESADOS'
        });
    });
});
/* #endregion */

const ExcelDateToJSDate = (serialXlsx: number) => {
    var utc_days  = Math.floor(serialXlsx - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serialXlsx - Math.floor(serialXlsx) + 0.0000001;

    var total_seconds = Math.floor(86400 * fractional_day);

    var seconds = total_seconds % 60;

    total_seconds -= seconds;

    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
 }

export default SALE_ROUTER;
