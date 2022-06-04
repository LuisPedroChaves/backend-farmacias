import moment from 'moment-timezone';

import BankAccount, { IBankAccount } from '../models/bankAccount'
import BankFlow, { IBankFlow } from "../models/bankFlow";

export const UPDATE_BANK_BALANCE = (bankFlow: IBankFlow): Promise<boolean> => {
    return new Promise((resolve, reject) => {

        BankAccount.findById(bankFlow._bankAccount, (err, bankAccount: IBankAccount) => {
            if (err) {
                reject(err);
            }

            if (!bankAccount) {
                reject(false);
            }

            let newBalance = bankAccount.balance;

            if (bankFlow.credit > 0) {
                newBalance += bankFlow.credit
            }
            if (bankFlow.debit > 0) {
                newBalance -= bankFlow.debit
            }

            bankAccount.balance = newBalance;
            bankFlow.balance = newBalance;

            bankAccount.save(async (err, bankAccount) => {
                if (err) {
                    reject(err);
                }

                bankFlow.date = moment().tz("America/Guatemala").format()

                await CREATE_FLOW(bankFlow)

                resolve(true);
            });

        });
    });
}

export const CREATE_FLOW = (bankFlow: IBankFlow): Promise<boolean> => {
    return new Promise((resolve, reject) => {

        const NEW_BANK_ACCOUNT = new BankFlow(bankFlow)

        NEW_BANK_ACCOUNT.save()
            .then((bankFlow: IBankFlow) => {
                resolve(true);
            })
            .catch(err => {
                reject(err);
            })
    });
}