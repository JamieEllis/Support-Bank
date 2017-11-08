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

module.exports = Transaction;

