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


function importTransactionsCSV(callback, users, transactions, filename) {
    // CSV import via fast-csv package.
    logger.info('Reading in transaction data from CSV file.');
    fastCsv.fromPath(filename, {headers: true})
        .on('data', (entry) => {
            registerTransaction(users, transactions, moment(entry.Date, 'DD-MM-YYYY'), entry.From, entry.To, entry.Narrative, parseFloat(entry.Amount));
        })
        .on('end', () => {
            logger.info('Finished reading in transaction data.');
            callback(users, transactions);
        });
}


function importTransactionsJSON(callback, users, transactions, filename) {
    // JSON import via build-in JSON parsing.
    logger.info('Reading in transaction data from JSON file.');
    fs.readFile(filename, (err, data) => {
        let entries = JSON.parse(data);
        for (let entryId = 0; entryId < entries.length; ++entryId) {
            let entry = entries[entryId];
            registerTransaction(users, transactions, moment(entry.Date, 'YYYY-MM-DD'), entry.FromAccount, entry.ToAccount, entry.Narrative, parseFloat(entry.Amount));
        }
        callback(users, transactions);
    });
}


function importTransactionsXML(callback, users, transactions, filename) {
    // XML import via xml2js package.
    fs.readFile(filename, (err, data) => {
        xml2js.parseString(data, (xmlerr, xmldata) => {
            let entries = xmldata.TransactionList.SupportTransaction;
            for (let entryId = 0; entryId < entries.length; ++entryId) {
                let entry = entries[entryId];
                registerTransaction(users, transactions, moment((parseInt(entry.$.Date) - 25569) * 86400 * 1000), entry.Parties[0].From[0], entry.Parties[0].To[0], entry.Description[0], parseFloat(entry.Value[0]));
            }
            callback(users, transactions);
        });
    });
}


function importFileCommand(callback, users, transactions, filename) {
    // Cheeky regex
    let suffixRegex = /^[^\.]+\.(.+)/;
    let suffixRegexResult = suffixRegex.exec(filename);
    let suffix = suffixRegexResult[1];

    logger.info(`File name ${filename} determined of type .${suffix}.`);

    if (suffix === 'csv') {
        importTransactionsCSV(callback, users, transactions, filename);
    }
    else if (suffix === 'json') {
        importTransactionsJSON(callback, users, transactions, filename);
    }
    else if (suffix === 'xml') {
        importTransactionsXML(callback, users, transactions, filename);
    }
    else {
        // Unrecognized file type.
        logger.info(`Tried to import unsupported file format.`);
        console.log(`The file extension .${suffix} is an unsupported format.`);
        callback(users, transactions);
    }
}


module.exports = {
    helpCommand, listCommand, importFileCommand
}
