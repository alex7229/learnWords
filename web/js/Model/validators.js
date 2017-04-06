/**
 * Created by uadn-gav on 3/8/17.
 */
const utils = require('./../utils');

exports.storage = (storage) => {
    if (typeof storage === 'string') {
        storage = utils.jsonParse(storage);
        if (storage === false) return false;
    }
    const storageProperties = ['options', 'currentWord', 'knownWords', 'learningPool', 'lastTimeUpdate', 'additionalWordsList', 'additionalWordsTranslationList', 'importantWordsTranslations'];
    if (!utils.checkPropertiesInObject(storage, storageProperties)) {
        return false;
    }
    if (!utils.checkIfArray([storage['knownWords'], storage['learningPool'], storage['additionalWordsList'], storage['additionalWordsTranslationList']])) {
        return false;
    }
    return validateLearningPool(storage['learningPool'])
            && validateOptions(storage['options'])
            && validateKnownWords(storage['knownWords'])
            && Number.isInteger(storage['currentWord'])
            && validateWordsList(storage['additionalWordsList'])
            && validateWordsTranslationList(storage['additionalWordsTranslationList'])
            && validateWordsTranslationList(storage['importantWordsTranslations'])
};

function validateLearningPool(pool) {
    return pool.every(dataWord => {
        if (!utils.checkPropertiesInObject(dataWord, ['lastGuessTime', 'nextGuessTime', 'number', 'successGuesses'])) {
            return false;
        }
        return [
            dataWord['lastGuessTime'],
            dataWord['nextGuessTime'],
            dataWord['number'],
            dataWord['successGuesses']
        ].every(number => {
            return Number.isInteger(number)
        });
    })
}

function validateOptions(options) {
    const properties = ['firstWord', 'lastWord', 'order'];
    return utils.checkPropertiesInObject(options, properties)
            && Number.isInteger(options['firstWord'])
            && Number.isInteger(options['lastWord'])
            && (options['order'] === 'random' || options['order'] === 'sequential')
}

function validateKnownWords(words) {
    return words.every((wordNumber) => {
        return Number.isInteger(wordNumber)
    })
}

function validateWordsList(list) {
    return true;
}

function validateWordsTranslationList(list) {
    return true;
}
