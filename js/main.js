//todo -  add sound (when u guessed right answer) from fallout4, add authentication (to save user progress)
require('whatwg-fetch');
import yandexApi from './AjaxRequests/yandexApi'
import googleApi from './AjaxRequests/googleApi'
import savedYandexTranslation from './AjaxRequests/savedYandexTranslation'
import fetchRegistration from './AjaxRequests/registration'
import fetchLogin from './AjaxRequests/login'
import YandexParse from './Parse/yandex'
import GoogleParse from './Parse/google'
import Auth from './Model/authentication.js'
import LearnMachine from './Model/learningMachine'
import {yandex as yandexView, google as googleView} from './View/translations'
import {showRegistrationBlock, showNotification, showUserInfoBlock, showLogin, logOut as viewLogOut, hideAll} from './View/authForm'



 
 class Controller {

    static getTranslation() {
        const word = document.getElementById('word').value;
        if ((!word)) return;
        savedYandexTranslation(word)
            .then(data => {
                const parse = new YandexParse(data);
                yandexView(parse.getData());
            }, err => {
                if (err.status === 404) {
                    yandexApi(word)
                        .then(data => {
                            const parse = new YandexParse(data);
                            yandexView(parse.getData());
                        })
                }
            })
    }

    static getMeaning() {
        const word = document.getElementById('word').value;
        if ((!word)) return;
        googleApi(word)
            .then(data => {
                const parse = new GoogleParse(data);
                googleView(parse.getData());
            })
    }
     
     static register () {
         const auth = new Auth();
         let errors = false;
         try {
             var userInfo = auth.gatherUserInfo()
         } catch (err) {
             showNotification(err.message, 'red');
             errors  = true
         }
         if (errors) return;
         fetchRegistration(userInfo.encryptedAuthorizationData, userInfo.email, userInfo.secretQuestion, userInfo.secretAnswer)
             .then(() => {
                 const userInfo = auth.findLocalAuthData();
                 auth.saveCredentials(userInfo.name, userInfo.password);
                 showUserInfoBlock(userInfo.name)
             }, err => {
                 showNotification(err.message, 'red');
             })
     }
     
     static login (notificationOn) {
         const auth = new Auth();
         let errors = false;
         try {
             var userInfo = auth.findLocalAuthData()
         } catch (err) {
             errors = true;
             if (notificationOn) {
                 showNotification(err.message, 'red')
             }
         }
         if (errors) {
             showLogin();
             return
         }
         fetchLogin(auth.encryptData(userInfo))
             .then((success) => {
                 auth.saveCredentials(userInfo.name, userInfo.password);
                 showUserInfoBlock(userInfo.name)
             }, err => {
                 if (notificationOn) {
                     showNotification(err.message, 'red')
                 }
                 showLogin()
             })
     }

     static logOut () {
         let auth = new Auth();
         auth.deleteCredentials();
         viewLogOut();
     }
     
     static resetPassword () {
         
     }

    static listenButtons () {
        document.getElementById("getMeaning").onclick = Controller.getMeaning;
        document.getElementById("getTranslation").onclick  = Controller.getTranslation;
        document.getElementById("checkAnswer").onclick = learningMachine.checkAnswer.bind(learningMachine);
        document.getElementById("sendQuestion").onclick = learningMachine.sendQuestion.bind(learningMachine);
        document.getElementById('loginBtn').onclick = Controller.login;
        document.getElementById('startRegistration').onclick = showRegistrationBlock;
        document.getElementById('endRegistration').onclick = Controller.register;
        document.getElementById('logOut').onclick = Controller.logOut;
    }

}


 





 var learningMachine = new LearnMachine();
 learningMachine.getAllWords();
 
 window.onload = () => {
     
     /*Controller.listenButtons();
     Controller.login();*/
     hideAll();


     setTimeout(() => {
         learningMachine.sendQuestion();
     }, 200)
 };


