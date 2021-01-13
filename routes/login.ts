import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SEED } from '../global/environment';

import User from '../models/user';

const loginRouter = Router();

/* #region  RENUEVA TOKEN */
loginRouter.get('/renuevatoken', mdAuth, (req: any, res: Response) => {
    const token = jwt.sign(
        {
            user: req.user,
        },
        SEED,
        {
            expiresIn: 14400,
        }
    );

    res.status(200).json({
        ok: true,
        user: req.user,
        token: token,
        id: req.user._id,
    });
});
/* #endregion */

/* #region  LOGIN */
loginRouter.post('/', (req: Request, res: Response) => {
	const body = req.body;

	User.findOne({
		username: body.username,
		deleted: false,
	})
		.populate('_role', '')
		.exec((err, userBD) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: 'Error al buscar usuario',
					errors: err,
				});
			}

			if (!userBD) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Credenciales incorrectas - email',
					errors: err,
				});
			}

			if (!bcrypt.compareSync(body.password, userBD.password)) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Credenciales incorrectas - password',
					errors: err,
				});
			}

			// Creamos el ROL por aparte
			const role = userBD._role;
			userBD._role = userBD._role._id;

			// Crear un TOKEN
			userBD.password = '********';
			var token = jwt.sign(
				{
					user: userBD,
				},
				SEED,
				{
					expiresIn: 14400,
				}
            );

            res.status(200).json({
                ok: true,
                user: userBD,
                type: role.type,
                token: token,
                id: userBD._id,
            });
		});
});
/* #endregion */

export default loginRouter;
