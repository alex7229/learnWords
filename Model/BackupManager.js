/**
 * Created by tup1t on 09.04.2017.
 */

const fs = require('fs');
const moment = require('moment');

class BackupManager {

    constructor(data) {
        this.oneDrivePath = 'D:\\OneDrive\\english\\learn_words_backup';
        this.userId = data.userId;
        this.storage = data.storage;
    }

    makeBackupCopy() {
        return new Promise((resolve, reject) => {
           const now = moment();
           let fileName = `${now.format('DD_MM_YYYY_HH_mm')}_user_id_${this.userId}.json'`;
           return resolve(fs.writeFile(`${this.oneDrivePath}\\${fileName}`, this.storage))
        })
    }

}


module.exports = BackupManager;