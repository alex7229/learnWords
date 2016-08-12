/**
 * Created by tup1tsa on 11.08.2016.
 */
import checkStatus from '../Utils/fetchStatusHangling';

export default () => {
    return new Promise ((resolve, reject) => {
        fetch(`http://tup1tsa.bounceme.net/learnWords/wordsLists/sortedWordsList.json`)
            .then(checkStatus)
            .then(response => {
                resolve(response.json())
            }, err => {
                reject(err)
            })
    })
}