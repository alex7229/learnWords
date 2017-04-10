/**
 * Created by uadn-gav on 2/27/17.
 */


exports.jsonParse = (data) => {
    try {
        var parsed = JSON.parse(data);
    } catch (err) {
        return false;
    }
    return parsed;
};

exports.checkPropertiesInObject = (obj, properties = [])  => {
    let currentObject=  obj;
    if (obj === null || typeof obj !=='object' || obj.constructor === Array || Object.keys(obj).length !== properties.length) {
        return false;
    }
    return properties.every((property) => {
        return obj.hasOwnProperty(property)
    })
};

exports.checkIfArray = (...twoDimensionalArray) => {
    if (!Array.isArray(twoDimensionalArray)) {
        return false;
    }
    return twoDimensionalArray.every((possibleArray) => {
        return Array.isArray(possibleArray)
    })
};

exports.convertToUnixMinutes = (timpestamp) => {
    return Math.floor(timpestamp/60000)
};

exports.convertToTimestampFromMinutes = (minutes) => {
    return minutes*60000;
};
