import chalk from 'chalk';

const log = console.info;

const getTimestamp = (): string => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].slice(0, 5); // HH:mm
    return `[${date} ${time}]`;
};

const error = (message: string) => {
    log(chalk.bold.red(`${getTimestamp()} - ${message}`));
};

const success = (message: string) => {
    log(chalk.bold.green(`${getTimestamp()} - ${message}`));
};

const warning = (message: string) => {
    log(chalk.bold.yellow(`${getTimestamp()} - ${message}`));
};


const info = (message: string)=>{
    log(chalk.bold.white(`${getTimestamp()} - ${message}`))
}

export { error, success, warning,info };
