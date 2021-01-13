import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import Role from '../models/role';

// var mdAuth = require('../middleware/auth');
// import mongoose from 'mongoose';
// var ObjectId = mongoose.Types.ObjectId;

const roleRouter = Router();

/* #region  GET */
roleRouter.get('/', mdAuth, (req: Request, res: Response) => {
	Role.find(
		{
			deleted: false
		},
		''
	)
		.sort({
			type: 1
		})
		.exec((err, roles) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error listando roles',
					errors: err
				});
			}

			res.status(200).json({
				ok: true,
				roles
			});
		});
});
/* #endregion */

/* #region  GET BY ID */
roleRouter.get('/:id', mdAuth, (req: Request, res: Response) => {
	const id: string = req.params.id;

	Role.findById(id, (err, role) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar rol',
				errors: err,
			});
		}

		if (!role) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El rol con el id' + id + ' no existe',
				errors: {
					message: 'No existe un rol con ese ID',
				},
			});
		}

		res.status(200).json({
			ok: true,
			role: role,
		});
	});
});
/* #endregion */

/* #region  PUT */
roleRouter.put('/:id', mdAuth, (req: Request, res: Response) => {
	const id = req.params.id;
	const body = req.body;

	Role.findById(id, (err, role) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar rol',
				errors: err,
			});
		}

		if (!role) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El rol con el id' + id + ' no existe',
				errors: {
					message: 'No existe un rol con ese ID',
				},
			});
		}

		role.name = body.name;
		role.type = body.type;
		role.permissions = body.permissions;

		role.save((err, role) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Error al actualizar rol',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				role: role,
			});
		});
	});
});
/* #endregion */

/* #region  DELETE */
roleRouter.delete('/:id', mdAuth, (req: Request, res: Response) => {
	const id = req.params.id;

	Role.findById(id, (err, role) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar rol',
				errors: err,
			});
		}

		if (!role) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El rol con el id' + id + ' no existe',
				errors: {
					message: 'No existe un rol con ese ID',
				},
			});
		}

		role.deleted = true;

		role.save((err, role) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Error al borrar rol',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				role: role,
			});
		});
	});
});
/* #endregion */

/* #region  POST cellar */
roleRouter.post('/', mdAuth, (req: Request, res: Response) => {
	const body = req.body;

	const role = new Role({
		name: body.name,
		type: body.type,
		permissions: body.permissions,
	});

	role
		.save()
		.then((role) => {
			res.status(201).json({
				ok: true,
				role: role,
			});
		})
		.catch((err) => {
			res.status(400).json({
				ok: false,
				mensaje: 'Error al crear rol',
				errors: err,
			});
		});
});
/* #endregion */

export default roleRouter;
