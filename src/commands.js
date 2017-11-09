const log4js = require('log4js');

const TransactionFileParser = require('./TransactionFileParser');

const logger = log4js.getLogger('Commands');
logger.level = 'ALL';


function helpCommand(callback, bankDatabase) {
    logger.info('Displaying a list of available commands.');

    console.log('');
    console.log('List All - outputs names of all users and balance due.');
    console.log('List [Account] - outputs all transactions for an account.');
    console.log('Import File [filename] - adds all transactions from a file to the program. Supports .csv, .json, and .xml.');

    callback(bankDatabase);
}


function listCommand(callback, bankDatabase, parameter) {
    if (parameter === 'All') {
        // List All
        logger.info('List All command recognized.');
        bankDatabase.Users.forEach((user) => {
            user.display();
        });
    }
    else {
        // List [Account]
        logger.info(`List [Account] command recognized, account name ${parameter}.`);
        bankDatabase.Transactions.forEach((transaction) => {
            if (transaction.From === parameter || transaction.To === parameter) {
                transaction.display();
            }
        })
    }
    callback(bankDatabase);
}


function importFileCommand(callback, bankDatabase, filename) {
    TransactionFileParser.parseTransactions(
        newTransactions => {
            newTransactions.forEach(bankDatabase.registerTransaction.bind(bankDatabase));
            callback(bankDatabase);
        },
        filename
    );
}


module.exports = {
    helpCommand, listCommand, importFileCommand
}
