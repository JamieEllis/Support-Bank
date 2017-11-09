const log4js = require('log4js');

const User = require('./user');

const logger = log4js.getLogger('BankDatabase');
logger.level = 'ALL';


class BankDatabase {
    constructor() {
        this.Transactions = [];
        this.Users = [];
    }

    registerTransaction(transaction) {
        // Todo: validation checking on new transaction.

        this.Transactions.push(transaction);

        let fromUser = this.Users.find((user) => { return user.Name === transaction.From; });
        let toUser = this.Users.find((user) => { return user.Name === transaction.To; });
        if (fromUser === undefined) {
            this.Users.push(new User(transaction.From, 0));
            fromUser = this.Users[this.Users.length - 1];
        }
        if (toUser === undefined) {
            this.Users.push(new User(transaction.To, 0));
            toUser = this.Users[this.Users.length - 1];
        }

        fromUser.Balance -= transaction.Amount;
        toUser.Balance += transaction.Amount;

        logger.trace(
            `Read transaction from ${transaction.From} to ${transaction.To} on ${transaction.Date.format('DD/MM/YYYY')} - amount ${transaction.Amount} for reason ${transaction.Narrative}.`
        );
    }
}


module.exports = BankDatabase;