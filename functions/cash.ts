
import Cash, { ICash } from '../models/cash';

export const UPDATE_BALANCE = (_cash: string, amount: number): Promise<number> => {
return new Promise((resolve, reject) => {

    Cash.findById(_cash, (err, cash: ICash) => {
        if (err) {
            reject(err);
        }

        if (!cash) {
            reject('No existe una caja con ese ID');
        }

        let newBalance = cash.balance;
        newBalance += amount

        cash.balance = newBalance;

        cash.save((err, cash) => {
            if (err) {
                reject(err);
            }

            resolve(newBalance);
        });

    });
});
}