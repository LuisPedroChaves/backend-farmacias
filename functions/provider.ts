
import Provider from '../models/provider';
import { IProvider } from '../models/provider';

export const UPDATE_BALANCE = (_provider: string, amount: number, action: string = 'SUMA'): Promise<boolean> => {
return new Promise((resolve, reject) => {
    Provider.findById(_provider, (err, provider: IProvider) => {
        if (err) {
            reject(err);
        }

        if (!provider) {
            reject(false);
        }

        let newBalance = provider.balance;

        if (action === 'SUMA') {
            newBalance += amount
        }else if (action === 'RESTA') {
            newBalance -= amount
        }

        provider.balance = newBalance;

        provider.save((err, provider) => {
            if (err) {
                reject(err);
            }

            resolve(true);
        });

    });
});
}