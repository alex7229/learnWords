//todo -  add sound (when u guessed right answer) from fallout4, add authentication (to save user progress)
require('whatwg-fetch');
import yandexApi from './AjaxRequests/yandexApi'
import googleApi from './AjaxRequests/googleApi'
import savedYandexTranslation from './AjaxRequests/savedYandexTranslation'
import fetchRegistration from './AjaxRequests/registration'
import fetchLogin from './AjaxRequests/login'
import {getSecretQuestion as fetchGetQuestion, sendSecretAnswer as fetchSendAnswer} from './AjaxRequests/resetPassword'
import YandexParse from './Parse/yandex'
import GoogleParse from './Parse/google'
import Auth from './Model/authentication.js'
import LearnMachine from './Model/learningMachine'
import {yandex as yandexView, google as googleView} from './View/translations'
import {showRegistrationBlock, showResetPasswordBlock, showNotification, hideNotification, showUserInfoBlock, showLogin, showAuthForm, logOut as viewLogOut} from './View/authForm'



 
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
             showNotification(err.message, 'brown');
             errors  = true
         }
         if (errors) return;
         fetchRegistration(userInfo.encryptedAuthorizationData, userInfo.email, userInfo.secretQuestion, userInfo.secretAnswer)
             .then(() => {
                 const userInfo = auth.findLocalAuthData();
                 auth.saveCredentials(userInfo.name, userInfo.password);
                 showUserInfoBlock(userInfo.name)
             }, err => {
                 showNotification(err.message, 'brown');
             })
     }
     
     static login () {
         return new Promise ((resolve, reject) => {
             const auth = new Auth();
             try {
                 var userInfo = auth.findLocalAuthData()
             } catch (err) {
                 showNotification(err.message, 'brown');
                 reject(err.message);
             }
             fetchLogin(auth.encryptData(userInfo))
                 .then((result) => {
                     auth.saveCredentials(userInfo.name, userInfo.password);
                     showUserInfoBlock(userInfo.name);
                     resolve(result)
                 }, err => {
                     showNotification(err.message, 'brown');
                     reject(err.message)
                 })
         })
     }

     static logOut () {
         const auth = new Auth();
         auth.deleteCredentials();
         viewLogOut();
     }
     
     static getSecretQuestion () {
         const login = document.getElementById('loginReset').value;
         const email = document.getElementById('emailReset').value;
         fetchGetQuestion(login, email)
             .then((secretQuestion) => {
                 document.getElementById('secretQuestionReset').innerText = secretQuestion
             }, err => {
                 showNotification(err, 'brown')
             })
     }
     
     static sendSecretQuestion () {
         const login = document.getElementById('loginReset').value;
         const email = document.getElementById('emailReset').value;
         const answer = document.getElementById('secretAnswerReset').value;
         if (!((login || email) && answer)) {
             showNotification('Enter login or email and secret answer', 'brown');
             return
         }
         fetchSendAnswer(login, email, answer)
             .then((response) => {
                 showNotification(response);
             }, err => {
                 showNotification(err, 'brown')
             })


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
        document.getElementById('resetPasswordStart').onclick = showResetPasswordBlock;
        document.getElementById('getSecretQuestion').onclick = Controller.getSecretQuestion;
        document.getElementById('resetPasswordFinish').onclick = Controller.sendSecretQuestion;
    }

}


 





 var learningMachine = new LearnMachine();
 learningMachine.getAllWords();
 
 window.onload = () => {
     
     Controller.listenButtons();
     Controller.login()
         .then(() => {
             showAuthForm()
         }, () => {
             showAuthForm();
             showLogin();
             hideNotification()
         });






     setTimeout(() => {
         learningMachine.sendQuestion();
     }, 200)
 };


