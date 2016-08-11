/**
 * Created by tup1tsa on 08.08.2016.
 */
import login from './AjaxRequests/login';

export default class {

    checkUserInfo (encryptedLoginPassword) {
        const authData = this.findLocalAuthData();
        if (authData) {
            const encryptedData = this.encryptData(authData);
            login(encryptedLoginPassword)
        } else {
            throw new Error('U have not declared password or login')
        }
    }
    
    findLocalAuthData () {
        let name = localStorage.getItem('authName');
        let password = localStorage.getItem('authPassword');
        if (!(name && password)) {
            name = document.getElementById('login').value;
            password = document.getElementById('password').value;
        }
        if (name && password) {
            return {
                name,
                password
            }
        }
    }

    encryptData (userInfo) {
        return btoa(`${userInfo.name}:${userInfo.password}`)
    }

    
    
}
  
