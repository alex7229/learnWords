/**
 * Created by tup1tsa on 11.08.2016.
 */
import checkStatus from './statusHandling';

export default (encryptedLoginPassword, email, secretQuestion, secretAnswer) => {
    return new Promise ((resolve, reject) => {
        fetch('/auth/registration', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'authorization': encryptedLoginPassword
            },
            body: JSON.stringify({
                email,
                secretQuestion,
                secretAnswer
            })
        })
            .then(checkStatus)
            .then(response => {
                resolve(response.text())
            }, err => {
                reject(err)
            })
    })
}