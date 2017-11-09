const readlineSync = require('readline-sync');
const log4js = require('log4js');

const { helpCommand, listCommand, importFileCommand } = require('./commands');

log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: './logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'DEBUG'}
    }
});

const logger = log4js.getLogger('Spongelog Debugpants');
logger.level = 'DEBUG';


function commandStep(transactions) {
    logger.info('Requesting command from the user.');
    let command = readlineSync.question('Enter a command (or type "help" to see a list of commands).\n>> ');
    logger.info(`Command entered by the user: ${command}`);

    if (command === 'help') {
        logger.info('Help command recognized.');
        helpCommand(commandStep, transactions);
    }
    else if (command === 'quit') {
        logger.info('Quit command recognized.');
        logger.info('Terminating command loop.');
        console.log('Goodbye forever. :(');
    }
    else if (command.substring(0, 5) === 'List ') {
        let parameter = command.substring(5);
        logger.info(`List command identified with parameter ${parameter}.`);
        listCommand(commandStep, transactions, parameter);
    }
    else if (command.substring(0, 12) === 'Import File ') {
        // Import File [filename]
        let filename = command.substring(12);
        logger.info(`Import File command recognized, file name ${filename}.`);
        importFileCommand(commandStep, transactions, filename);
    }
    else {
        // Unrecognized command.
        logger.info('Command was not recognized.');
        console.log(`Unrecognized command "${command}".`);
        commandStep(transactions);
    }
}


function initialize() {
    logger.info('SupportBank initializing.');
    let transactions = [];
    commandStep(transactions);
}


initialize();

