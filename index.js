const inquirer = require('inquirer-promise');
const spawn = require('child_process').spawn;

const Docker = require('dockerode-promise');
const docker = new Docker()

return inquirer.prompt([{
    type : 'list',
    name : 'action',
    message : 'Which action would you like?',
    choices : ['shell', 'logs']
}]).then((result) => {

    return docker.listContainers().then((containers) => {

        // sort containers by name
        containers = containers.map((container) => container.Names[0].slice(1)).sort();

        // format the instance properties for the selection list
        const choices = containers.map((container) => ({ name : container, value : container }));

        return inquirer.prompt([{
            type : 'list',
            name : 'container',
            message : 'Which container do you want to start a shell in?',
            choices
        }]).then((answer) => {

            const spawnArgs = {
                shell : (container) => ['docker', ['exec', '-it', container, '/bin/ash']],
                logs : (container) => {

                    const logPaths = {
                        api : '/var/log/stemn/api',
                        mongodb : '/var/log/mongodb/mongod.log',
                        nginx : '/var/log/nginx/access.log',
                        redis : '/var/log/redis/redis',
                        websocket : '/var/log/stemn/websocket'
                    }

                    const logTypes = Object.keys(logPaths);

                    const containerType = logTypes.reduce((result, logType) => container.includes(logType) ? logType : result, undefined);

                    const logPath = logPaths[containerType];

                    return ['docker', ['exec', '-it', container, 'less', logPath]];
                }
            }

            spawn(...spawnArgs[result.action](answer.container), { stdio: [0, 1, 2] });
        });
    });
});
