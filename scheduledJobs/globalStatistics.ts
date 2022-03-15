import CronJob from 'node-cron';
import moment from 'moment';
import mongoose from 'mongoose';
import bluebird from 'bluebird';

import AutoStatistic from '../models/autoStatistic';
import TempSale, { ITempSale } from '../models/tempSale';
import TempStorage from '../models/tempStorage';
import { ICellar } from '../models/cellar';
import { IBrand } from '../models/brand';

const OBJECT_ID = mongoose.Types.ObjectId;

exports.initScheduledJobs = () => {

  AutoStatistic.find({
    activated: true,
    deleted: false,
  })
    .populate('cellars')
    .populate('brands')
    .sort({ code: 1 })
    .exec((err, autoStatistics) => {
      if (err) {
        console.log(err);
      }

      const NOW = moment().tz("America/Guatemala");
      const LAST_MONTH = NOW.subtract(1, 'month');
      const LAST_MONTH_UTC = LAST_MONTH.utc(true).format();
      const LAST_YEAR = LAST_MONTH.subtract(1, 'year').utc(true).format();
      const NOW_UTC = NOW.utc(true).format();

      autoStatistics.forEach(auto => {
        // console.log(auto.hour);
        // console.log(auto.minute);

        CronJob.schedule(`${auto.minute} ${auto.hour} * * *`, async () => {
        // CronJob.schedule(`${13} ${13} * * *`, async () => {
          console.log(auto.name);
          await SEARCH_CELLARS(auto.cellars, auto.brands, LAST_YEAR, LAST_MONTH_UTC, NOW_UTC, auto.daysRequest, auto.daysSupply).then();
          console.log('ESTADISTICAS ACTUALIZADAS CON EXITO')
        }, {
          scheduled: true,
          timezone: "America/Guatemala"
        });
      });
    });
}

const SEARCH_CELLARS = async (cellars: ICellar[], brands: IBrand[], LAST_YEAR: string, LAST_MONTH_UTC: string, NOW_UTC: string, daysRequest: number, daysSupply: number): Promise<any> => {
  return Promise.all(
    await bluebird.mapSeries(cellars, async (c: any) => {
        console.log(c.name);
        console.log(brands.length);
        return await SEARCH_BRANDS(c, brands, LAST_YEAR, LAST_MONTH_UTC, NOW_UTC, daysRequest, daysSupply).then();
      })
    );
}

const SEARCH_BRANDS = async (c: ICellar, brands: IBrand[], LAST_YEAR: string, LAST_MONTH_UTC: string, NOW_UTC: string, daysRequest: number, daysSupply: number): Promise<any> => {
  return Promise.all(
    await bluebird.mapSeries(brands, async (b: any) => {
        let query: any[] = [
          {
            $match: {
              _cellar: OBJECT_ID(c._id),
              date: {
                $gte: new Date(LAST_YEAR),
                $lt: new Date(LAST_MONTH_UTC),
              },
            },
          },
          {
            $lookup: {
              from: 'products',
              localField: '_product',
              foreignField: '_id',
              as: '_product',
            },
          },
          {
            $unwind: '$_product',
          },
          {
            $match: {
              '_product._brand': OBJECT_ID(b._id),
            },
          },
          {
            $sort: { _product: 1 },
          },
          {
            $group: {
              _id: '$_product',
              suma: { $sum: "$quantity" },
              _cellar: { $first: "$_cellar" }
            }
          },
          {
            "$project": {
              _id: 1,
              suma: 1,
              _cellar: 1,
              promMonth: { $divide: ["$suma", 12] },
            }
          },
        ];

        const TEMP_SALES: ITempSale[] = await TempSale.aggregate(
          query
        );

        return await SEARCH_STOCK_SALES(TEMP_SALES, LAST_MONTH_UTC, NOW_UTC, daysRequest, daysSupply).then();
      })
    );
}

const SEARCH_STOCK_SALES = async (detail: any[], newStart: string, newEnd: string, MIN_X: any, MAX_X: any): Promise<any> => {
  return Promise.all(
    await bluebird.mapSeries(detail, async (element: any) => {
      // console.log(element._cellar);
      // console.log(element._id._id);

      const SEARCH_SALES = await TempSale.aggregate(
        [
          {
            $match: {
              _cellar: OBJECT_ID(element._cellar),
              _product: OBJECT_ID(element._id._id),
              date: {
                $gte: new Date(newStart),
                $lt: new Date(newEnd),
              },
            },
          },
          {
            $group: {
              _id: '$_product',
              suma: { $sum: "$quantity" },
            }
          },
          {
            "$project": {
              _id: 1,
              suma: 1,
            }
          }
        ]
      );
      let sales = 0;
      if (SEARCH_SALES.length > 0) {
        sales = SEARCH_SALES[0].suma
      }
      const PROM_ADJUST_MONTH = (+element.promMonth + +sales) / 2;
      const PROM_ADJUST_DAY = (+PROM_ADJUST_MONTH / 30);

      const TEMP_STORAGE = await TempStorage.findOne({
        _cellar: element._cellar,
        _product: element._id._id,
      }).populate('_cellar').exec();

      let stock = 0;
      if (TEMP_STORAGE) {
        stock = TEMP_STORAGE.stock;
      }
      const SUPPLY = (+PROM_ADJUST_DAY * +(+MIN_X + +MAX_X));
      const APROX_SUPPLY = Math.ceil(SUPPLY);

      // VARIABLES LISTAS
      let request = 0;
      if (APROX_SUPPLY > 0) {
        request = +APROX_SUPPLY - +stock;
      }

      const MIN_STOCK = Math.ceil(PROM_ADJUST_DAY * 15)
      const MAX_STOCK = Math.ceil(PROM_ADJUST_DAY * 30)
      // ACTUALIZANDO ESTADISTICAS...
      if (!TEMP_STORAGE) {
        const NEW_TEMP_STORAGE = new TempStorage({
          _cellar: element._cellar,
          _product: element._id._id,
          stock: 0,
          minStock: MIN_STOCK,
          maxStock: MAX_STOCK,
          supply: request,
          lastUpdateStatics: moment().tz("America/Guatemala").format()
        });

        return await NEW_TEMP_STORAGE.save().then();
      } else {
        return await TempStorage.updateOne(
          {
            _id: TEMP_STORAGE._id,
          },
          {
            minStock: MIN_STOCK,
            maxStock: MAX_STOCK,
            supply: request,
            lastUpdateStatics: moment().tz("America/Guatemala").format()
          },
        ).exec();
      }
    })
  );
};