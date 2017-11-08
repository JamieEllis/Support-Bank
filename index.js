let readlineSync = require('readline-sync');
let moment = require('moment');
let fastCsv = require('fast-csv');

class Transaction {
    constructor(date, from, to, narrative, amount) {
        this.Date = date;
        this.From = from;
        this.To = to;
        this.Narrative = narrative;
        this.Amount = amount;
    }

    display() {
        console.log(`Transaction: ${this.Amount} transferred from ${this.From} to ${this.To} on ${this.Date.format('Do MMMM YYYY')} (${this.Narrative}).`);
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

function parseTransactionsCSV(terminationFunction) {
    let transactions = [];
    fastCsv.fromPath('Transactions2014.csv', {headers: true})
        .transform((entry) => {
            return new Transaction(moment(entry.Date, 'DD-MM-YYYY'), entry.From, entry.To, entry.Narrative, parseFloat(entry.Amount));
        })
        .on('data', (transaction) => {
           transactions.push(transaction);
        })
        .on('end', () => {
            terminationFunction(transactions)
        });
}

function evaluateBalance(transactions) {
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

        transaction.display();
    }

    for (userId = 0; userId < users.length; ++userId) {
        users[userId].display();
    }
}

parseTransactionsCSV(evaluateBalance);