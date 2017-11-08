let readlineSync = require('readline-sync');

class Transaction {
    constructor(date, from, to, narrative, amount) {
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.amount = amount;
    }
}

function pullCSVTransactions() {
    // Reads CSV transaction data into an array of Transaction objects.
    
}

new Transaction(5, 5, 5, 5, 5);