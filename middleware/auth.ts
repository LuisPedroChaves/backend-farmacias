import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { SEED } from '../global/environment';

// VERIFICAR TOKEN

export const mdAuth = (req: any, res: Response, next: any) => {
	const token: any = req.headers.token;

	jwt.verify(token, SEED, (err: any, decoded: any) => {
		if (err) {
			return res.status(401).json({
				ok: false,
				mensaje: 'Token Incorrecto',
				errors: err,
			});
		}

		req.user = decoded.user;

		next();
	});
};
