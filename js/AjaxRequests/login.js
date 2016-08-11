/**
 * Created by tup1tsa on 11.08.2016.
 */
import checkStatus from './statusHandling';

export default (encryptedLoginPassword) => {
    return new Promise ((resolve, reject) => {
        fetch('/auth/login', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'authorization': encryptedLoginPassword
            }
        })
            .then(checkStatus)
            .then(response => {
                resolve(response.text())
            }, err => {
                reject(err)
            })
    })
}