let readlineSync = require('readline-sync');
let moment = require('moment');
let fastCsv = require('fast-csv');



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
    let readStream = fastCsv.createReadStream('Transactions2014.csv');
    csv.fromStream(readStream).on('data', (data) => {console.log(data);});
}

pullCSVTransactions();