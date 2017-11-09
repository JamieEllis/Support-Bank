const log4js = require('log4js');
const moment = require('moment');
const fastCsv = require('fast-csv');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const Transaction = require('./Transaction');

const logger = log4js.getLogger('TransactionFileParser');
logger.level = 'ALL';


// Todo: make a transaction file writer.

class TransactionFileParser {
    static parseTransactionsCSV(callback, filename) {
        // CSV import via fast-csv package.
        // Todo: swap to a package that actually gives you good errors when it fails.
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
            if (err === null) {
                let entries = JSON.parse(data);
                for (let entryId = 0; entryId < entries.length; ++entryId) {
                    let entry = entries[entryId];
                    let newlyParsedTransaction = new Transaction(moment(entry.Date, 'YYYY-MM-DD'), entry.FromAccount, entry.ToAccount, entry.Narrative, parseFloat(entry.Amount));
                    parsedTransactions.push(newlyParsedTransaction);
                }
                logger.info('Finished parsing JSON transaction data.');
            }
            else {
                console.log(err.toString());
                logger.error(`Error opening JSON file: ${err.toString()}.`);
            }
            callback(parsedTransactions);
        });
    }

    static parseTransactionsXML(callback, filename) {
        // XML import via xml2js package.
        let parsedTransactions = [];
        fs.readFile(filename, (err, data) => {
            if (err === null) {
                xml2js.parseString(data, (xmlerr, xmldata) => {
                    if (xmlerr === null) {
                        let entries = xmldata.TransactionList.SupportTransaction;
                        for (let entryId = 0; entryId < entries.length; ++entryId) {
                            let entry = entries[entryId];
                            let newlyParsedTransaction = new Transaction(moment((parseInt(entry.$.Date) - 25569) * 86400 * 1000), entry.Parties[0].From[0], entry.Parties[0].To[0], entry.Description[0], parseFloat(entry.Value[0]));
                            parsedTransactions.push(newlyParsedTransaction);
                        }
                        logger.info('Finished parsing XML transaction data.');
                    }
                    else {
                        console.log(xmlerr.toString());
                        logger.error(`Error parsing XML file: ${xmlerr.toString()}.`);
                    }
                    callback(parsedTransactions);
                });
            }
            else {
                console.log(err.toString());
                logger.error(`Error opening XML file: ${err.toString()}.`);
                callback(parsedTransactions);
            }
        });
    }

    static parseTransactions(callback, filename) {
        logger.info(`Parsing file ${filename} for transactions.`);

        // Pass in a function to call once done parsing, taking a list of the parsed transactions as an argument.
        let suffixRegex = /.([^\.]*)$/;
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


module.exports = TransactionFileParser;