/**
 * Created by tup1tsa on 16.08.2016.
 */
import checkStatus from '../Utils/fetchStatusHangling';

export default (login, secretAnswer) => {
    return new Promise ((resolve, reject) => {
        fetch('/auth/resetPassword', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login,
                secretAnswer
            })
        })
            .then(checkStatus)
            .then(response => {
                resolve(response.text())
            })
            .catch(err => {
                reject (err)
            })
    })
}