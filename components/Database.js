/**
 * Created by uadn-gav on 2/27/17.
 */
var mysql = require('mysql');

class Database {
    constructor() {
        this.encoding = 'UTF-8';
    }

    connect() {
        //todo: hide data in file (that is not in git)
        //todo: change at home
        this.connection = mysql.createConnection({
            'host': '10.38.1.200',
            'user': 'cysend_v2',
            'password': 'Cqgn0QG9RkRzHwxVDtiEUDR2h',
            'database': 'cysend_v2'
        });
        /*this.connection = mysql.createConnection({
            'host': '127.0.0.1',
            'user': 'root',
            'password': 'basta',
            'database': 'learnwords'
        });*/
        return new Promise ((resolve, reject) => {
            this.connection.connect((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve (`connected as id ${this.connection.threadId}`)
            })
        })
    }

    dropConnection() {
        this.connection.end();
    }

    execute(query) {
        return new Promise((resolve, reject) => {
            this.connection.query(query, (error, results, fields) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results)
            })
        })
    }

    runSimpleQuery(query) {
        return new Promise((resolve, reject) => {
            this.connect()
                .then(() => {
                    return this.execute(query)
                })
                .then(result => {
                    this.dropConnection();
                    resolve(result)
                }, err => {
                    this.dropConnection();
                    reject(err)
                })
        })
    }
}

module.exports = Database;