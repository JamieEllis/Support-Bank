const readlineSync = require('readline-sync');
const log4js = require('log4js');

const BankDatabase = require('./bankDatabase');

const { helpCommand, listCommand, importFileCommand } = require('./commands');

const logger = log4js.getLogger('Index');
logger.level = 'ALL';


function commandStep(bankDatabase) {
    logger.info('Requesting command from the user.');
    const command = readlineSync.question('Enter a command (or type "help" to see a list of commands).\n>> ');
    logger.info(`Command entered by the user: ${command}`);

    if (command === 'help') {
        logger.info('Help command recognized.');
        helpCommand(commandStep, bankDatabase);
    }
    else if (command === 'quit') {
        logger.info('Quit command recognized.');
        logger.info('Terminating command loop.');
        console.log('Goodbye forever. :(');
    }
    else if (command.substring(0, 5) === 'List ') {
        const parameter = command.substring(5);
        logger.info(`List command identified with parameter ${parameter}.`);
        listCommand(commandStep, bankDatabase, parameter);
    }
    else if (command.substring(0, 12) === 'Import File ') {
        // Import File [filename]
        const filename = command.substring(12);
        logger.info(`Import File command recognized, file name ${filename}.`);
        importFileCommand(commandStep, bankDatabase, filename);
    }
    else {
        // Unrecognized command.
        logger.info('Command was not recognized.');
        console.log(`Unrecognized command "${command}".`);
        commandStep(bankDatabase);
    }
}


function initialize() {
    log4js.configure({
        appenders: {
            file: { type: 'fileSync', filename: './logs/debug.log' }
        },
        categories: {
            default: { appenders: ['file'], level: 'DEBUG'}
        }
    });

    logger.info('SupportBank initializing.');
    let bankDatabase = new BankDatabase();
    commandStep(bankDatabase);
}


initialize();

