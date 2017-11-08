class User {
    constructor(name, balance) {
        this.Name = name;
        this.Balance = balance
    }

    display() {
        console.log(`User: ${this.Name} has ${this.Balance.toFixed(2)}`);
    }
}

module.exports = User;