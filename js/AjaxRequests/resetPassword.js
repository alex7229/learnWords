/**
 * Created by tup1tsa on 16.08.2016.
 */
import checkStatus from '../Utils/fetchStatusHangling';

export function getSecretQuestion (login, email)  {
    return new Promise ((resolve, reject) => {
        fetch('/auth/resetPassword', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login,
                email
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

export function sendSecretAnswer (login, email, answer)  {
    return new Promise ((resolve, reject) => {
        fetch('/auth/resetPassword', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login,
                email,
                answer
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