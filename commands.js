const log4js = require('log4js');
const moment = require('moment');
const fastCsv = require('fast-csv');
const xml2js = require('xml2js');
const fs = require('fs');

const Transaction = require('./transaction');
const User = require('./user');

const logger = log4js.getLogger('Spongelog Debugpants');
logger.level = 'DEBUG';


function displayAllBalances(users) {
    for (let userId = 0; userId < users.length; ++userId) {
        users[userId].display();
    }
}


function evaluateBalances(transactions) {
    let users = [];
    for (let transactionId = 0; transactionId < transactions.length; ++transactionId) {
        let transaction = transactions[transactionId];

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
    }

    displayAllBalances(users);
}


function singleAccountTransactions(transactions, name) {
    for (let transactionId = 0; transactionId < transactions.length; ++transactionId) {
        let transaction = transactions[transactionId];
        if (transaction.From === name || transaction.To === name) {
            transaction.display();
        }
    }
}


function helpCommand(callback, transactions) {
    logger.info('Displaying a list of available commands.');

    console.log('');
    console.log('List All - outputs names of all users and balance due.');
    console.log('List [Account] - outputs all transactions for an account.');
    console.log('Import File [filename] - adds all transactions from a file to the program. Supports .csv, .json, and .xml.');

    callback(transactions);
}


function listCommand(callback, transactions, parameter) {
    if (parameter === 'All') {
        // List All
        logger.info('List All command recognized.');

        evaluateBalances(transactions);
    }
    else {
        // List [Account]
        logger.info(`List [Account] command recognized, account name ${parameter}.`);

        singleAccountTransactions(transactions, parameter);
    }

    callback(transactions);
}


function registerTransaction(transactions, date, from, to, narrative, amount) {
    let transaction = new Transaction(date, from, to, narrative, amount);
    transactions.push(transaction);
    logger.trace(
        `Read transaction from ${transaction.From} to ${transaction.To} on ${transaction.Date.format('DD/MM/YYYY')} 
        - amount ${transaction.Amount} for reason ${transaction.Narrative}.`
    );
}


function importFileCommand(callback, transactions, filename) {
    // Cheeky regex
    let suffixRegex = /^[^\.]+\.(.+)/;
    let suffixRegexResult = suffixRegex.exec(filename);
    let suffix = suffixRegexResult[1];

    logger.info(`File name ${filename} determined of type .${suffix}.`);

    if (suffix === 'csv') {
        // CSV import via fast-csv package.
        logger.info('Reading in transaction data from CSV file.');
        fastCsv.fromPath(filename, {headers: true})
            .on('data', (entry) => {
                registerTransaction(transactions, moment(entry.Date, 'DD-MM-YYYY'), entry.From, entry.To, entry.Narrative, parseFloat(entry.Amount));
            })
            .on('end', () => {
                logger.info('Finished reading in transaction data.');
                callback(transactions);
            });
    }
    else if (suffix === 'json') {
        // JSON import via build-in JSON parsing.
        logger.info('Reading in transaction data from JSON file.');
        fs.readFile(filename, (err, data) => {
            let entries = JSON.parse(data);
            for (let entryId = 0; entryId < entries.length; ++entryId) {
                let entry = entries[entryId];
                registerTransaction(transactions, moment(entry.Date, 'YYYY-MM-DD'), entry.FromAccount, entry.ToAccount, entry.Narrative, parseFloat(entry.Amount));
            }
            callback(transactions);
        });
    }
    else if (suffix === 'xml') {
        // XML import via xml2js package.
        fs.readFile(filename, (err, data) => {
            xml2js.parseString(data, (xmlerr, xmldata) => {
                let entries = xmldata.TransactionList.SupportTransaction;
                for (let entryId = 0; entryId < entries.length; ++entryId) {
                    let entry = entries[entryId];
                    registerTransaction(transactions, moment(entry.Date, 'YYYY-MM-DD'), entry.FromAccount, entry.ToAccount, entry.Narrative, parseFloat(entry.Amount));

                    moment((parseInt(entry.$.Date) - 25569) * 86400 * 1000), entry.Parties[0].From[0], entry.Parties[0].To[0], entry.Description[0], parseFloat(entry.Value[0])
                }
                callback(transactions);
            });
        });
    }
    else {
        // Unrecognized file type.
        logger.info(`Tried to import unsupported file format.`);
        console.log(`The file extension .${suffix} is an unsupported format.`);
        callback(transactions);
    }
}


module.exports = {
    helpCommand, listCommand, importFileCommand
}
