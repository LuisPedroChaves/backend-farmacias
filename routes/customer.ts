import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';

import Customer from '../models/customer';

const customerRouter = Router();

/* #region  GET */
customerRouter.get('/', mdAuth, (req: Request, res: Response) => {
	Customer.find({
		deleted: false,
	})
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
/* #endregion */

/* #region  PUT */
customerRouter.put('/:id', mdAuth, (req: Request, res: Response) => {
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

		customer.name = body.name;
		customer.nit = body.nit;
		customer.phone = body.phone;
		customer.address = body.address;
		customer.town = body.town;
		customer.department = body.department;
		customer.company = body.company;
		customer.transport = body.transport;
		customer.limitCredit = body.limitCredit;
		customer.limitDaysCredit = body.limitDaysCredit;

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
customerRouter.delete('/:id', mdAuth, (req: Request, res: Response) => {
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
customerRouter.post('/', mdAuth, (req: Request, res: Response) => {
	const body = req.body;

	const customer = new Customer({
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
/* #endregion */

export default customerRouter;
