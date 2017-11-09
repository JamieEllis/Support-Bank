const log4js = require('log4js');
const moment = require('moment');
const fastCsv = require('fast-csv');
const xml2js = require('xml2js');
const fs = require('fs');

const Transaction = require('./transaction');
const User = require('./user');

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


function registerTransaction(users, transactions, date, from, to, narrative, amount) {
    let transaction = new Transaction(date, from, to, narrative, amount);

    // Add the transaction to the list of stored transactions.
    transactions.push(transaction);

    // Update user balances to include this new transaction.
    let fromUser = users.find((user) => { return user.Name === transaction.From; });
    let toUser = users.find((user) => { return user.Name === transaction.To; });
    if (fromUser === undefined) {
        users.push(new User(transaction.From, 0));
        fromUser = users[users.length - 1];
    }
    if (toUser === undefined) {
        users.push(new User(transaction.To, 0));
        toUser = users[users.length - 1];
    }
    fromUser.Balance -= transaction.Amount;
    toUser.Balance += transaction.Amount;

    logger.trace(
        `Read transaction from ${transaction.From} to ${transaction.To} on ${transaction.Date.format('DD/MM/YYYY')} 
        - amount ${transaction.Amount} for reason ${transaction.Narrative}.`
    );
}


class TransactionFileParser {
    static parseTransactionsCSV(callback, filename) {
        // CSV import via fast-csv package.
        logger.info('Parsing transaction data from CSV file.');
        let parsedTransactions = [];
        fastCsv.fromPath(filename, {headers: true})
            .on('data', (entry) => {
                let newlyParsedTransaction = new Transaction(moment(entry.Date, 'DD-MM-YYYY'), entry.From, entry.To, entry.Narrative, parseFloat(entry.Amount));
                parsedTransactions.push(newlyParsedTransaction);
            })
            .on('end', () => {
                logger.info('Finished parsing CSV transaction data.');
                callback(parsedTransactions);
            });
    }

    static parseTransactionsJSON(callback, filename) {
        // JSON import via built-in JSON parsing.
        logger.info('Parsing transaction data from JSON file.');
        let parsedTransactions = [];
        fs.readFile(filename, (err, data) => {
            let entries = JSON.parse(data);
            for (let entryId = 0; entryId < entries.length; ++entryId) {
                let entry = entries[entryId];
                let newlyParsedTransaction = new Transaction(moment(entry.Date, 'YYYY-MM-DD'), entry.FromAccount, entry.ToAccount, entry.Narrative, parseFloat(entry.Amount));
                parsedTransactions.push(newlyParsedTransaction);
            }
            logger.info('Finished parsing JSON transaction data.');
            callback(parsedTransactions);
        });
    }

    static parseTransactionsXML(callback, filename) {
        // XML import via xml2js package.
        let parsedTransactions = [];
        fs.readFile(filename, (err, data) => {
            xml2js.parseString(data, (xmlerr, xmldata) => {
                let entries = xmldata.TransactionList.SupportTransaction;
                for (let entryId = 0; entryId < entries.length; ++entryId) {
                    let entry = entries[entryId];
                    let newlyParsedTransaction = new Transaction(moment((parseInt(entry.$.Date) - 25569) * 86400 * 1000), entry.Parties[0].From[0], entry.Parties[0].To[0], entry.Description[0], parseFloat(entry.Value[0]));
                    parsedTransactions.push(newlyParsedTransaction);
                }
                logger.info('Finished parsing XML transaction data.');
                callback(parsedTransactions);
            });
        });
    }

    static parseTransactions(callback, filename) {
        // Todo: see if file actually exists.

        logger.info(`Parsing file ${filename} for transactions.`);

        // Pass in a function to call once done parsing, taking a list of the parsed transactions as an argument.
        let suffixRegex = /^[^\.]+\.(.+)/;
        let suffixRegexResult = suffixRegex.exec(filename);
        let suffix = suffixRegexResult[1];

        logger.info(`File to parse determined suffix .${suffix}.`);

        if (suffix === 'csv') {
            this.parseTransactionsCSV(callback, filename);
        }
        else if (suffix === 'json') {
            this.parseTransactionsJSON(callback, filename);
        }
        else if (suffix === 'xml') {
            this.parseTransactionsXML(callback, filename);
        }
        else {
            // Unrecognized file type.
            logger.warn("Tried to import unsupported file format - no transactions parsed.");
            console.log(`The file extension .${suffix} is an unsupported format. No transactions have been added.`);
            callback([]);
        }
    }
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
