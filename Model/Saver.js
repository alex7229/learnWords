/**
 * Created by uadn-gav on 2/28/17.
 */
const DataManager = require('./DataManager');
const Database = require('../components/Database');
const validators = require('../web/js/Model/validators');
const commonStorage = require('../web/js/Model/Storage/commonStorage');
const utils = require('../web/js/utils');
const moment = require('moment');

class Saver extends DataManager{

    constructor (localStorage, dbStorage) {
        super();
        this.localeStorage = localStorage;
        this.dbStorage = dbStorage;
        this.localeStorageObj = false;
        this.dbStorageObj = false;
    }

    saveData() {
        //todo: add db injections handling
        //todo: add user handling
        return new Promise((resolve, reject) => {
            const now = moment().format('YYYY-MM-DD HH:mm:ss');
            const queue = `INSERT INTO ${this.tableName} (storage, created, user_id) VALUES ('${this.localeStorage}','${now}', '2')`;
            let db = new Database();
            resolve (db.runSimpleQuery(queue))
        })
    }

    updateData() {
        //todo: add db injections handling here too
        return new Promise((resolve, reject) => {
            const now = moment().format('YYYY-MM-DD HH:mm:ss');
            const queue = `UPDATE ${this.tableName} SET storage='${this.localeStorage}', modified='${now}' WHERE storage='${this.dbStorage}'`;
            let db = new Database();
            resolve(db.runSimpleQuery(queue));
        })
    }

    run() {
        return new Promise((resolve, reject) => {
            this.localeStorageObj = this.getStorageObject(this.localeStorage);
            this.dbStorageObj = this.getStorageObject(this.dbStorage);
            if (this.localeStorageObj === false) {
                reject('Local storage for save is not valid');
                return;
            }
            if (this.dbStorageObj === false) {
                resolve(this.saveData());
                return;
            }
            const action = this.compare();
            if (action === 'do not save') {
                reject('Local storage in database is newer than user storage')
            } else if (action === 'save') {
                resolve(this.saveData());
            } else if (action === 'update') {
                resolve(this.updateData());
            }
        })
    }

    compare() {
        let [userStorageTime, dbStorageTime] = [moment(this.localeStorageObj.lastTimeUpdate), moment(this.dbStorageObj.lastTimeUpdate)];
        if (dbStorageTime.isSameOrAfter(userStorageTime)) {
            return 'do not save'
        }
        if (userStorageTime.diff(dbStorageTime, 'hours') >= 6) {
            return 'save'
        }
        return 'update'
    }

    getStorageObject(compressedStorage) {
        try {
            var decompressedStorage =commonStorage.decompress(compressedStorage);
        } catch (err) {
            return false;
        }
        return validators.storage(decompressedStorage) === true ? decompressedStorage : false;
    }

}

module.exports = Saver;