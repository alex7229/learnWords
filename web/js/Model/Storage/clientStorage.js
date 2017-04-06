/**
 * Created by tup1tsa on 21.08.2016.
 */
const utils = require('../../utils');
const commonStorage = require('./commonStorage');
import validators from './../validators'

export default  {
    saveOptions(firstWord, lastWord, order) {
        let data = {
            options: {
                firstWord,
                lastWord,
                order
            },
            learningPool: [],
            knownWords: [],
            additionalWordsList: [],
            //wordsList - [{number:23, name:234}, ]
            additionalWordsTranslationList: [],
            importantWordsTranslations: [],
            //wordsTranslationList  - [{number:23, translations:['bta', 'fasf']}, {}] is the same as importantTranslations
            currentWord: 1,
            lastTimeUpdate: new Date().getTime()
        };
        if (order === 'random') {
            data.currentWord = Math.ceil(Math.random() * data.options.lastWord)
        }
        localStorage.setItem('learnWords', JSON.stringify(data))
    },
    getData (jsonCompressedStorage = localStorage.getItem('learnWords')) {
        const decompressedStorage = commonStorage.decompress(jsonCompressedStorage);
        if (validators.storage(decompressedStorage)) {
            return decompressedStorage
        }
        return false;
    },
    saveSession (userData) {
        //todo: validation?
        if (!validators.storage(userData)) {
            throw new Error('user data for save is invalid')
        }
        localStorage.setItem('learnWords', commonStorage.compress(userData))
    },

};