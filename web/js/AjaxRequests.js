/**
 * Created by uadn-gav on 2/27/17.
 */


async function getRequest(url) {
    return await $.ajax(url)
}

async function postRequest(url, data) {
    return await $.ajax(url, {
        type: 'POST',
        data
    })
}

export function getWordsList () {
    return getRequest('/wordsLists/sortedWordsList.json')
}

export function getYandexTranslation (word) {
    return getRequest(`/wordsLists/yandexTranslations/${word}.json`);
}

export function sendUserStorage() {
    return postRequest('/save-user-data', {
        userData: localStorage.getItem('learnWords')
    });
}

export function retrieveUserStorage() {
    return postRequest('/get-user-data', {})
}