const readlineSync = require('readline-sync');
const moment = require('moment');
const fastCsv = require('fast-csv');
const log4js = require('log4js');
const xml2js = require('xml2js');
const fs = require('fs');

const Transaction = require('./transaction');
const User = require('./user');

log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: './logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'DEBUG'}
    }
});

const logger = log4js.getLogger('DEBUG');
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

function commandStep(transactions) {
    logger.info('Requesting command from the user.');

    let command = readlineSync.question('Enter a command (or type "help" to see a list of commands).\n>> ');

    logger.info(`Command entered by the user: ${command}`);

    if (command === 'help') {
        logger.info('Help command recognized.');
        logger.info('Displaying a list of available commands.');

        console.log('');
        console.log('List All - outputs names of all users and balance due.');
        console.log('List [Account] - outputs all transactions for an account.');
        console.log('Import File [filename] - adds all transactions from a file to the program. Supports .csv, .json, and .xml.');

        commandStep(transactions);
    }
    else if (command.substring(0, 5) === 'List ') {
        let parameter = command.substring(5);

        logger.info(`List command identified with parameter ${parameter}.`);

        if (command.substring(5) === 'All') {
            // List All
            logger.info('List All command recognized.');

            evaluateBalances(transactions);
        }
        else {
            // List [Account]
            logger.info(`List [Account] command recognized, account name ${parameter}.`);

            singleAccountTransactions(transactions, command.substring(5));
        }
        commandStep(transactions);
    }
    else if (command.substring(0, 12) === 'Import File ') {
        // Import File [filename]
        let filename = command.substring(12);
        logger.info(`Import File command recognized, file name ${filename}.`);

        // Cheeky regex
        let suffixRegex = /^[^\.]+\.(.+)/;
        let suffixRegexResult = suffixRegex.exec(filename);
        let suffix = suffixRegexResult[1];
        if (suffix === 'csv') {
            // CSV import via fast-csv package.
            fastCsv.fromPath(filename, {headers: true})
                .transform((entry) => {
                    return new Transaction(moment(entry.Date, 'DD-MM-YYYY'), entry.From, entry.To, entry.Narrative, parseFloat(entry.Amount));
                })
                .on('data', (transaction) => {
                    transactions.push(transaction);
                })
                .on('end', () => {
                    commandStep(transactions);
                });
        }
        else if (suffix === 'json') {
            // JSON import via build-in JSON parsing.
            fs.readFile(filename, (err, data) => {
                let entries = JSON.parse(data);
                for (let entryId = 0; entryId < entries.length; ++entryId) {
                    let entry = entries[entryId];
                    transactions.push(new Transaction(moment(entry.Date, 'YYYY-MM-DD'), entry.FromAccount, entry.ToAccount, entry.Narrative, parseFloat(entry.Amount)));
                }
                commandStep(transactions);
            });
        }
        else if (suffix === 'xml') {
            // XML import via xml2js package.
            fs.readFile(filename, (err, data) => {
                xml2js.parseString(data, (xmlerr, xmldata) => {
                    let entries = xmldata.TransactionList.SupportTransaction;
                    for (let entryId = 0; entryId < entries.length; ++entryId) {
                        let entry = entries[entryId];
                        transactions.push(new Transaction(moment((parseInt(entry.$.Date) - 25569) * 86400 * 1000), entry.Parties[0].From[0], entry.Parties[0].To[0], entry.Description[0], parseFloat(entry.Value[0])));
                    }
                    commandStep(transactions);
                });
            });
        }
        else {
            // Unrecognized file type.
            console.log(`The file extension .${suffix} is an unsupported format.`);
            commandStep(transactions);
        }
    }
    else {
        // Unrecognized command.
        console.log($`Unrecognized command "${command}".`);
        commandStep(transactions);
    }
    console.log('');
}

function initialize() {
    logger.info('SupportBank initializing.');
    let transactions = [];
    commandStep(transactions);
}

initialize();

