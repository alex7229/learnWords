/**
 * Created by tup1t on 09.04.2017.
 */
const forever = require('forever-monitor');

let child = new (forever.Monitor)('server.js', {
    max: Number.MAX_SAFE_INTEGER,
    silent: true,
    args: []
});

/*child.on('error', (err) => {
    console.log(err.message)
})*/

child.start();