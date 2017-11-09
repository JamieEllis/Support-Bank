const log4js = require('log4js');

const User = require('./user');
const TransactionFileParser = require('./transactionFileParser');

const logger = log4js.getLogger('Spongelog Debugpants');
logger.level = 'ALL';


function helpCommand(callback, users, transactions) {
    logger.info('Displaying a list of available commands.');

    console.log('');
    console.log('List All - outputs names of all users and balance due.');
    console.log('List [Account] - outputs all transactions for an account.');
    console.log('Import File [filename] - adds all transactions from a file to the program. Supports .csv, .json, and .xml.');

    callback(users, transactions);
}


function listCommand(callback, users, transactions, parameter) {
    if (parameter === 'All') {
        // List All
        logger.info('List All command recognized.');
        for (let userId = 0; userId < users.length; ++userId) {
            users[userId].display();
        }
    }
    else {
        // List [Account]
        logger.info(`List [Account] command recognized, account name ${parameter}.`);
        for (let transactionId = 0; transactionId < transactions.length; ++transactionId) {
            let transaction = transactions[transactionId];
            if (transaction.From === parameter || transaction.To === parameter) {
                transaction.display();
            }
        }
    }
    callback(users, transactions);
}


function registerTransaction(users, transactions, newTransaction) {
    // Todo: validation checking on new transaction.

    transactions.push(newTransaction);

    let fromUser = users.find((user) => { return user.Name === newTransaction.From; });
    let toUser = users.find((user) => { return user.Name === newTransaction.To; });
    if (fromUser === undefined) {
        users.push(new User(newTransaction.From, 0));
        fromUser = users[users.length - 1];
    }
    if (toUser === undefined) {
        users.push(new User(newTransaction.To, 0));
        toUser = users[users.length - 1];
    }

    fromUser.Balance -= newTransaction.Amount;
    toUser.Balance += newTransaction.Amount;

    logger.trace(
        `Read transaction from ${newTransaction.From} to ${newTransaction.To} on ${newTransaction.Date.format('DD/MM/YYYY')} - amount ${newTransaction.Amount} for reason ${newTransaction.Narrative}.`
    );
}


function importFileCommand(callback, users, transactions, filename) {
    TransactionFileParser.parseTransactions(
        newTransactions => {
            newTransactions.forEach(newTransaction => {
                registerTransaction(users, transactions, newTransaction);
            });
            callback(users, transactions);
        },
        filename
    );
}


module.exports = {
    helpCommand, listCommand, importFileCommand
}
