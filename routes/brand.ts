import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import Brand from '../models/brand';
import { IBrand } from '../models/brand';

const BRAND_ROUTER = Router();

BRAND_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    Brand.find({
        deleted: false,
    })
        .sort({ code: 1 })
        .exec((err, brands) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando marcas',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                brands,
            });
        });
});

BRAND_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IBrand = req.body;

    BODY.name = BODY.name.replace(/\s/g, '');
    BODY.name = BODY.name.replace(/-/g, '').toUpperCase();

    Brand.findByIdAndUpdate(ID, {
        name: BODY.name
    },
    {
        new : true
    })
    .then((brand: IBrand | null) => {
        res.status(200).json({
            ok: true,
            brand
        });
    })
    .catch((err: any) => {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al actualizar laboratorio',
            errors: err
        });
    })
})

BRAND_ROUTER.delete('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;

    Brand.findByIdAndUpdate(ID, {
        deleted: true
    })
    .then((brand: IBrand | null) => {
        res.status(200).json({
            ok: true,
            brand
        });
    })
    .catch(err => {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error al eliminar laboratorio',
            errors: err
        });
    })
})

BRAND_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IBrand = req.body

    Brand.findOne(
        {
            deleted: false
        }, 'code'
    ).sort({
        code: -1
    }).then((brand: IBrand | null) => {
        let code: number = 1;

        if (brand) {
            code = brand.code + 1;
        }

        BODY.name = BODY.name.replace(/\s/g, '');
        BODY.name = BODY.name.replace(/-/g, '').toUpperCase();

        const NEW_BRAND = new Brand({
            code,
            name: BODY.name
        })

        NEW_BRAND.save()
            .then((brand: IBrand) => {
                res.status(200).json({
                    ok: true,
                    brand,
                });
            })
            .catch(err => {
                res.status(400).json({
                    ok: false,
                    mensaje: 'Error al crear laboratorio',
                    errors: err,
                });
            })
    })
        .catch(err => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al buscar correlativo',
                errors: err,
            });
        });
})

export default BRAND_ROUTER;