/**
 * Created by uadn-gav on 2/27/17.
 */
const express = require('express');
const bodyParser = require('body-parser');
const compress = require('compression');
const Retriever = require('./Model/Retriever');
const Saver = require('./Model/Saver');
const moment = require('moment');



let app = express();
app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(compress());
app.use(express.static('web'));


app.post('/get-user-data', (req, res) => {
    let retriever = new Retriever();
    retriever.getData()
        .then((result) => {
           res.send(result)
        }, err => {
            res.status(500).send('No data found in db')
        })
});



app.post('/save-user-data', (req, res) => {
    const userData = req.body.userData;
    new Retriever()
        .getData()
        .then((dbStorage) => {
            const saver = new Saver(userData, dbStorage);
            return saver.run();
        }, () => {
            const saver = new Saver(userData, '');
            return saver.run();
        })
        .then((success) => {
            res.send('all fine - success')
        }, (err) => {
            res.status(500).send(err)
        });
});

app.listen(3000);


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