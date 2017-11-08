const readlineSync = require('readline-sync');
const moment = require('moment');
const fastCsv = require('fast-csv');
const log4js = require('log4js');
const fs = require('fs');

log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: './logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});

const logger = log4js.getLogger('debug');
logger.level = 'debug';




class Transaction {
    constructor(date, from, to, narrative, amount) {
        this.Date = date;
        this.From = from;
        this.To = to;
        this.Narrative = narrative;
        this.Amount = amount;
    }

    display() {
        console.log(`Transaction: ${this.Amount.toFixed(2)} transferred from ${this.From} to ${this.To} on ${this.Date.format('Do MMMM YYYY')} (${this.Narrative}).`);
    }
}

class User {
    constructor(name, balance) {
        this.Name = name;
        this.Balance = balance
    }

    display() {
        console.log(`User: ${this.Name} has ${this.Balance.toFixed(2)}`);
    }
}



function displayAllBalances(users) {
    for (userId = 0; userId < users.length; ++userId) {
        users[userId].display();
    }
}

function evaluateBalances(transactions) {
    let users = [];
    for (transactionId = 0; transactionId < transactions.length; ++transactionId) {
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
    for (transactionId = 0; transactionId < transactions.length; ++transactionId) {
        let transaction = transactions[transactionId];
        if (transaction.From === name || transaction.To === name) {
            transaction.display();
        }
    }
}

function commandLoop(transactions) {
    while (true) {
        let command = readlineSync.question('Enter a command (or type "help" to see a list of commands).\n>> ');
        if (command === 'help') {
            console.log('');
            console.log('List All - outputs names of all users and balance due.');
            console.log('List [Account] - outputs all transactions for an account.');
        }
        else if (command.substring(0, 5) === 'List ') {
            if (command.substring(5) === 'All') {
                // List All
                evaluateBalances(transactions);
            }
            else {
                // List [Account]
                singleAccountTransactions(transactions, command.substring(5));
            }
        }
        console.log('');
    }
}

function initialize() {
    logger.debug('But why?');

    let transactions = [];

    /*
    fastCsv.fromPath('DodgyTransactions2015.csv', {headers: true})
        .transform((entry) => {
            return new Transaction(moment(entry.Date, 'DD-MM-YYYY'), entry.From, entry.To, entry.Narrative, parseFloat(entry.Amount));
        })
        .on('data', (transaction) => {
            transactions.push(transaction);
        })
        .on('end', () => {
            commandLoop(transactions);
        });
        */

    fs.readFile('Transactions2013.json', (err, data) => {
        let entries = JSON.parse(data);
        for (entryId = 0; entryId < entries.length; ++entryId) {
            let entry = entries[transactionId];
            transactions.push(new Transaction(moment(entry.Date, 'YYYY-MM-DD')), entry.FromAccount, entry.ToAccount, entry.Narrative, parseFloat(entry.Amount));
        }
        console.log(info);
    });
}

initialize();

