/**
 * Created by uadn-gav on 2/27/17.
 */
const DataManager = require('./DataManager');
const Database = require('../components/Database');
const moment = require('moment');

class Retriever extends DataManager{

    constructor () {
        super();
    }

    getData() {
        return new Promise((resolve, reject) => {
            this.retrieveLastSaveTimeOfUserData()
                .then((time) => {
                    resolve(this.getDataFromTime(moment(time).format('YYYY-MM-DD HH:mm:ss')));
                })
        })
    }

    getDataFromTime(time) {
        //time format 'YYYY-MM-DD HH:mm:ss'
        return new Promise((resolve, reject) => {
            let db = new Database();
            db.runSimpleQuery(`SELECT storage FROM ${this.tableName} WHERE created='${time}'`)
                .then((result) => {
                    if (result.length !== 1) {
                        throw new Error ('cannot find data in db');
                    }
                    return result[0]['storage']
                })
                .then(storage => {
                    resolve(storage)
                }, err => {
                    reject(err)
                })
        })
    }

}

module.exports = Retriever;