/**
 * Created by tup1tsa on 11.08.2016.
 */
import checkStatus from './statusHandling';

export default (word) => {
    return new Promise ((resolve,reject) => {
        fetch(`http://tup1tsa.bounceme.net/learnWords/wordsLists/yandexTranslations/${word}.txt`)
            .then(checkStatus)
            .then(response => {
                resolve(response.json())
            }, err => {
                reject(err)
            })
    })
}