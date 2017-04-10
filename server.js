/**
 * Created by uadn-gav on 2/27/17.
 */
// todo: manually change only files that you need on server (e.g. components/Database.js to components/Database.compiled.js and require compiled file)
    //or just wait for implementation of async/await modules to node.js natively




    //todo: if change to prod => change here dev = true/false
    //change in gulfpile.js dev=true/false and run it
    //change in main.html all libs to dev
const express = require('express');
const bodyParser = require('body-parser');
const compress = require('compression');
const Retriever = require('./Model/Retriever');
const Saver = require('./Model/Saver');
const BackupManager = require('./Model/BackupManager');
const moment = require('moment');


const dev = false;
let app = express();
app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(compress());
app.use(express.static('web'));


app.post('/get-user-data', (req, res) => {
    let retriever = new Retriever(dev);
    retriever.getData()
        .then((result) => {
           res.send(result)
        }, err => {
            res.status(500).send('No data found in db')
        })
});



app.post('/save-user-data', (req, res) => {
    const userData = req.body.userData;
    new Retriever(dev)
        .getData()
        .then((dbStorage) => {
            const saver = new Saver(userData, dbStorage, dev);
            return saver.run();
        }, () => {
            const saver = new Saver(userData, '', dev);
            return saver.run();
        })
        .then((result) => {
            if (dev || !result.readyToBackup) return true;
            const manager = new BackupManager(result.data);
            return manager.makeBackupCopy();
        })
        .then((success) => {
            res.send('all fine - success')
        }, (err) => {
            res.status(500).send(err)
        });
});

app.listen(dev ? 3000 : 80);


/*//todo: add htmlparser of request urls and load css
const htmlparser = require('htmlparser');



var rawHtml = `<a href="fsdff"></a>`;
var handler = new htmlparser.DefaultHandler(function (error, dom) {
    if (error)
       console.log(error);
    else
        console.log(JSON.stringify(dom))
}, {verbose:false, ignoreWhitespace:true});
var parser = new htmlparser.Parser(handler);
parser.parseComplete(rawHtml);*/


/*const Google = require('./web/js/Model/Parse/google.compiled').default;
 const Yandex = require('./web/js/Model/Parse/yandex.compiled').default;

 let google = new Google();
 let yandex = new Yandex();
 google.add5(23);
 yandex.add1(23);*/