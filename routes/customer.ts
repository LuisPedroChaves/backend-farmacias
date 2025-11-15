import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import { getUploadPath } from '../config/paths';

import { mdAuth } from '../middleware/auth';
import Customer from '../models/customer';
import Sale from '../models/sale';

const CUSTOMER_ROUTER = Router();
CUSTOMER_ROUTER.use(fileUpload());

/* #region  GET'S */
CUSTOMER_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
	Customer.find({
		deleted: false,
	})
		.populate('_seller')
		.sort({ name: 1 })
		.exec((err, customers) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error listando clientes',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				customers: customers,
			});
		});
});

CUSTOMER_ROUTER.get('/search', mdAuth, (req: Request, res: Response) => {
    let search = req.query.search || '';
    search = String(search);

	// Se usaron INDEXES en vez de una busqueda normal
    // const REGEX = new RegExp(search, 'i');

	Customer.find({
		$text: {$search: search},
		// "$or": [
		// 	{ phone: { '$regex': search, '$options': 'i' } },
		// 	{ nit: { '$regex': search, '$options': 'i' } },
		// 	{ name: { '$regex': search, '$options': 'i' } },
		// ],
		deleted: false,
	})
		.populate('_seller')
		.sort({ name: 1 })
		.exec((err, customers) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error listando clientes',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				customers,
			});
		});
});

CUSTOMER_ROUTER.get('/recivables', mdAuth, (req: Request, res: Response) => {
	Customer.find({
		_seller: { $ne: null },
		deleted: false,
	})
		.populate('_seller')
		.sort({ name: 1 })
		.exec((err, customers) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error listando clientes',
					errors: err,
				});
			}

			const promises = customers.map((customer: any) => {
				return new Promise(async (resolve, reject) => {
					const timeAvaliable = await Sale.find(
						{
							_customer: customer._id,
							paid: false,
							deleted: false
						},
						'date',
						{
							sort: {
								date: 1
							}
						}).limit(1).exec();
					customer = customer.toObject();
					customer.timeAvaliable = true;
					if (timeAvaliable.length > 0) {
						const date1 = new Date(moment(timeAvaliable[0].date).tz("America/Guatemala").format());
						const date2 = new Date(moment().tz("America/Guatemala").format());
						const days = Math.floor((date2.getTime() - date1.getTime()) / 86400000).toFixed(0);
						if (parseInt(days) > customer.limitDaysCredit) {
							customer.timeAvaliable = false;
						}
					}

					customer.balance = 0;
					const saldo = await Sale.aggregate([
						{
							$match: {
								_customer: customer._id,
								paid: false,
								deleted: false
							}
						},
						{
							$group: {
								_id: '$_customer',
								total: { $sum: '$total' },
							},
						},
					]);
					if (saldo.length > 0) {
						const balance = await Sale.aggregate([
							{
								$match: {
									_customer: customer._id,
									paid: false,
									deleted: false
								}
							},
							{
								$unwind: {
									path: '$balance',
									preserveNullAndEmptyArrays: true,
								},
							},
							{
								$match: {
									_customer: customer._id,
									paid: false,
									deleted: false
								}
							},
							{
								$group: {
									_id: '$_customer',
									pago: { $sum: '$balance.amount' },
								},
							},
						]);
						if (balance.length > 0) {
							customer.balance = (saldo[0].total - parseFloat(balance[0].pago)).toFixed(2);
						}
					}
					resolve(customer);
				});
			});

			Promise.all(promises)
				.then((results) => {
					res.status(200).json({
						ok: true,
						customers: results,
					});
				})
				.catch((error) => {
					res.status(400).json({
						ok: false,
						mensaje:
							'Error al obtener cuentas por cobrar',
						errors: error,
					});
				});
		});
});

CUSTOMER_ROUTER.get('/recivablesBySeller/:id', mdAuth, (req: Request, res: Response) => {
	const idSeller = req.params.id;
	Customer.find({
		_seller: idSeller,
		deleted: false,
	})
		.populate('_seller')
		.sort({ name: 1 })
		.exec((err, customers) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error listando clientes',
					errors: err,
				});
			}

			const promises = customers.map((customer: any) => {
				return new Promise(async (resolve, reject) => {
					const timeAvaliable = await Sale.find(
						{
							_customer: customer._id,
							paid: false,
							deleted: false
						},
						'date',
						{
							sort: {
								date: 1
							}
						}).limit(1).exec();
					customer = customer.toObject();
					customer.timeAvaliable = true;
					if (timeAvaliable.length > 0) {
						const date1 = new Date(moment(timeAvaliable[0].date).tz("America/Guatemala").format());
						const date2 = new Date(moment().tz("America/Guatemala").format());
						const days = Math.floor((date2.getTime() - date1.getTime()) / 86400000).toFixed(0);
						if (parseInt(days) > customer.limitDaysCredit) {
							customer.timeAvaliable = false;
						}
					}

					customer.balance = 0;
					const saldo = await Sale.aggregate([
						{
							$match: {
								_customer: customer._id,
								paid: false,
								deleted: false
							}
						},
						{
							$group: {
								_id: '$_customer',
								total: { $sum: '$total' },
							},
						},
					]);
					if (saldo.length > 0) {
						const balance = await Sale.aggregate([
							{
								$match: {
									_customer: customer._id,
									paid: false,
									deleted: false
								}
							},
							{
								$unwind: {
									path: '$balance',
									preserveNullAndEmptyArrays: true,
								},
							},
							{
								$match: {
									_customer: customer._id,
									paid: false,
									deleted: false
								}
							},
							{
								$group: {
									_id: '$_customer',
									pago: { $sum: '$balance.amount' },
								},
							},
						]);
						if (balance.length > 0) {
							customer.balance = (saldo[0].total - parseFloat(balance[0].pago)).toFixed(2);
						}
					}
					resolve(customer);
				});
			});

			Promise.all(promises)
				.then((results) => {
					res.status(200).json({
						ok: true,
						customers: results,
					});
				})
				.catch((error) => {
					res.status(400).json({
						ok: false,
						mensaje:
							'Error al obtener cuentas por cobrar',
						errors: error,
					});
				});
		});
});

CUSTOMER_ROUTER.get('/statements/:id', mdAuth, (req: Request, res: Response) => {
	const id = req.params.id;

	Customer.findById(id, (err, customer: any) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar cliente',
				errors: err,
			});
		}

		if (!customer) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El cliente con el id' + id + ' no existe',
				errors: {
					message: 'No existe un cliente con ese ID',
				},
			});
		}

		Sale.find({
			_customer: customer._id,
			paid: false,
			deleted: false
		})
		.populate('_cellar')
		.populate('_seller')
		.sort({date: 1}).exec((err, recivables)=> {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error listando clientes',
					errors: err,
				});
			}
			customer = customer.toObject();
			customer.recivables = recivables;

			res.status(200).json({
				ok: true,
				customer
			});
		})
	}).populate('_seller');
});

CUSTOMER_ROUTER.get('/recivables/:id', mdAuth, (req: Request, res: Response) => {
	const id = req.params.id;

	Customer.findById(id, (err, customer) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar cliente',
				errors: err,
			});
		}

		if (!customer) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El cliente con el id' + id + ' no existe',
				errors: {
					message: 'No existe un cliente con ese ID',
				},
			});
		}

		Promise.all([
			// Buscando la fecha de la primera compra para los dias de credito
			Sale.find(
				{
					_customer: customer._id,
					paid: false,
					deleted: false
				},
				'date',
				{
					sort: {
						date: 1
					}
				}).limit(1).exec(),

			// Buscando los saldos
			Sale.aggregate([
				{
					$match: {
						_customer: customer._id,
						paid: false,
						deleted: false
					}
				},
				{
					$group: {
						_id: '$_customer',
						saldo: { $sum: '$total' },
					},
				},
			]),
			// Buscando las cuentas por cobrar
			Sale.aggregate([
				{
					$match: {
						_customer: customer._id,
						paid: false,
						deleted: false
					}
				},
				{
					$unwind: {
						path: '$balance',
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$match: {
						_customer: customer._id,
						paid: false,
						deleted: false
					}
				},
				{
					$group: {
						_id: '$_customer',
						saldo: { $sum: '$total' },
						pago: { $sum: '$balance.amount' },
					},
				},
			]),
		]).then(function (counts) {
			let timeAvaliable = true;
			let credit = customer.limitCredit;
			if (counts[0].length > 0) {
				let arrayCount = counts[0];
				let objectCount = arrayCount[0];
				const date1 = new Date(moment(objectCount.date).tz("America/Guatemala").format());
				const date2 = new Date(moment().tz("America/Guatemala").format());
				const days = Math.floor((date2.getTime() - date1.getTime()) / 86400000).toFixed(0);
				if (parseInt(days) > customer.limitDaysCredit) {
					timeAvaliable = false;
				}
			}

			if (counts[1].length > 0) {
				let arrayCount = counts[1];
				let objectCount: any = arrayCount[0];
				if (counts[2].length > 0) {
					let arrayCount2 = counts[2];
					let objectCount2: any = arrayCount2[0];
					let balance = parseFloat(objectCount.saldo) - parseFloat(objectCount2.pago);
					credit = credit - balance;
				}
			}

			res.status(200).json({
				ok: true,
				timeAvaliable,
				credit
			});
		});
	});
});
/* #endregion */

/* #region  PUT */
CUSTOMER_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
	const id = req.params.id;
	const body = req.body;

	Customer.findById(id, (err, customer) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar cliente',
				errors: err,
			});
		}

		if (!customer) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El cliente con el id' + id + ' no existe',
				errors: {
					message: 'No existe un cliente con ese ID',
				},
			});
		}

		if (body.code) {
			body.code = body.code.replace(/\s/g, '').toUpperCase();
		}
		if (body.nit) {
			body.nit = body.nit.replace(/\s/g, '');
			body.nit = body.nit.replace(/-/g, '').toUpperCase();
		}

		customer.name = body.name;
		customer.nit = body.nit;
		customer.phone = body.phone;
		customer.address = body.address;
		customer.town = body.town;
		customer.department = body.department;
		customer.addresses = body.addresses;
		customer.company = body.company;
		customer.code = body.code;
		customer.transport = body.transport;
		customer.limitCredit = body.limitCredit;
		customer.limitDaysCredit = body.limitDaysCredit;
		customer._seller = body._seller;

		customer.save((err, customerS) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Error al actualizar cliente',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				customer: customerS,
			});
		});
	});
});
/* #endregion */

/* #region  DELETE */
CUSTOMER_ROUTER.delete('/:id', mdAuth, (req: Request, res: Response) => {
	const id = req.params.id;

	Customer.findById(id, (err, customer) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar cliente',
				errors: err,
			});
		}

		if (!customer) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El cliente con el id' + id + ' no existe',
				errors: {
					message: 'No existe un cliente con ese ID',
				},
			});
		}

		customer.deleted = true;

		customer.save((err, customerD) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Error al borrar cliente',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				customer: customerD,
			});
		});
	});
});
/* #endregion */

/* #region  POST cellar */
CUSTOMER_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
	const body = req.body;

	if (body.code) {
		body.code = body.code.replace(/\s/g, '').toUpperCase();
	}
	if (body.nit) {
		body.nit = body.nit.replace(/\s/g, '');
		body.nit = body.nit.replace(/-/g, '').toUpperCase();
	}

	const customer = new Customer({
		name: body.name,
		nit: body.nit,
		phone: body.phone,
		address: body.address,
		town: body.town,
		department: body.department,
		addresses: body.addresses,
		company: body.company,
		code: body.code,
		transport: body.transport,
		limitCredit: body.limitCredit,
		limitDaysCredit: body.limitDaysCredit,
		_seller: body._seller,
	});

	customer
		.save()
		.then((customer) => {
			res.status(201).json({
				ok: true,
				customer: customer,
			});
		})
		.catch((err) => {
			res.status(400).json({
				ok: false,
				mensaje: 'Error al crear cliente',
				errors: err,
			});
		});
});

CUSTOMER_ROUTER.post('/xlsx', (req: Request, res: Response) => {
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
    const PATH = getUploadPath('temp', NEW_NAME_FILE);

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
				let nit: string = doc[1]
				nit = nit.toString();

				if (nit) {
					nit = nit.replace(/\s/g, '');
					nit = nit.replace(/-/g, '').toUpperCase();
				}

				const CUSTOMER = new Customer({
					name: doc[2],
					nit: nit,
					phone: doc[3],
					address: doc[4],
					town: doc[5],
					department: doc[6],
					company: doc[7],
					code: doc[0],
					transport: doc[8],
					limitCredit: doc[11],
					limitDaysCredit: doc[10],
					_seller: '61e2098ab454222f681dd228', // IVAN MONTERROSO
				});

                let product = await CUSTOMER
                    .save()
                    .then();
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

export default CUSTOMER_ROUTER;
