/**
 * Created by uadn-gav on 2/27/17.
 */
const Database = require('../components/Database');
const fs = require('fs');

class DataManager {

    constructor() {
        this.tableName = 'gav_learn_words';
    }

    retrieveLastSaveTimeOfUserData() {
        return new Promise((resolve, reject) => {
            let db = new Database();
            db.runSimpleQuery(`SELECT MAX(created) AS latest FROM ${this.tableName} `)
                .then((data) => {
                    resolve(data[0]['latest'])
                }, err => {
                    reject(err)
                })

        })
    }
}

module.exports = DataManager;