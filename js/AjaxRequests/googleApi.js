/**
 * Created by tup1tsa on 11.08.2016.
 */
import checkStatus from '../Utils/fetchStatusHangling';

export default (word) => {
    return new Promise (resolve => {
        fetch('/learnWords/getMeaning', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                word
            })
        })
            .then(checkStatus)
            .then(response => {
                resolve(response.text())
            })
    });
}