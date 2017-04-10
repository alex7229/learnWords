/**
 * Created by uadn-gav on 3/18/17.
 */
const utils = require('../../utils');

exports.compress = (userData) => {
    const uncompressedPool = userData.learningPool;
    userData.learningPool = uncompressedPool.map((wordData) => {
        return {
            lgt:utils.convertToUnixMinutes(wordData['lastGuessTime']),
            ngt:utils.convertToUnixMinutes(wordData['nextGuessTime']),
            n: wordData['number'],
            sg: wordData['successGuesses'],
            ug: wordData['ultraNewWordsGuesses']
        }
    });
    const storage = JSON.stringify(userData);
    userData.learningPool = uncompressedPool;
    return storage;
};
exports.decompress = (jsonUserData) => {
    try {
        const compressedUserData = utils.jsonParse(jsonUserData);
        var uncompressedUserData = compressedUserData;
        uncompressedUserData.learningPool = compressedUserData.learningPool.map((wordData) => {
            return {
                lastGuessTime: utils.convertToTimestampFromMinutes(wordData['lgt']),
                nextGuessTime: utils.convertToTimestampFromMinutes(wordData['ngt']),
                number: wordData['n'],
                successGuesses: wordData['sg'],
                ultraNewWordsGuesses: wordData['ug']
            }
        });
    } catch (err) {
        return false;
    }
    return uncompressedUserData;
};