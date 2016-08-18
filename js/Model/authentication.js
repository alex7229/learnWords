/**
 * Created by tup1tsa on 08.08.2016.
 */
import login from '../AjaxRequests/login';
import registration from '../AjaxRequests/registration'

export default class {
    
    findLocalAuthData () {
        let name = localStorage.getItem('authName');
        let password = localStorage.getItem('authPassword');
        if (!(name && password)) {
            name = document.getElementById('loginDefault').value;
            password = document.getElementById('passwordDefault').value;
        }
        if (name && password) {
            return {
                name,
                password
            }
        } else {
            throw new Error('You missed login or password.')
        }
    }
    
    saveCredentials (name, password) {
        if (!localStorage) return;
        localStorage.setItem('authName', name);
        localStorage.setItem('authPassword', password)
    }
    
    deleteCredentials () {
        if (!localStorage) return;
        localStorage.removeItem('authName');
        localStorage.removeItem('authPassword')
    }

    encryptData (userInfo) {
        return btoa(`${userInfo.name}:${userInfo.password}`)
    }
    
    gatherUserInfo() {
        const name = document.getElementById('loginReg').value;
        const password = document.getElementById('passwordReg').value;
        const checkPassword = document.getElementById('repeatedPassword').value;
        const email = document.getElementById('emailReg').value;
        const secretQuestion = document.getElementById('secretQuestionReg').value;
        const secretAnswer = document.getElementById('secretAnswerReg').value;
        if (!name || !password || !checkPassword || !email || !secretQuestion || !secretAnswer) {
            throw new Error ('All fields required')
        }
        if (password !== checkPassword) {
            throw new Error ('Passwords are different')
        }
        const encryptedAuthorizationData = this.encryptData({
            name,
            password
        });
        return {
            encryptedAuthorizationData,
            email,
            secretQuestion,
            secretAnswer
        }
    }

    
    
}
  
