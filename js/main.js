//todo -  add sound (when u guessed right answer) from fallout4, add authentication (to save user progress)
require('whatwg-fetch');
import LearnMachine from './Model/learningMachine'
import yandexApi from './AjaxRequests/yandexApi'
import googleApi from './AjaxRequests/googleApi'
import savedYandexTranslation from './AjaxRequests/savedYandexTranslation'
import fetchRegistration from './AjaxRequests/registration'
import fetchLogin from './AjaxRequests/login'
import {getSecretQuestion as fetchGetQuestion, sendSecretAnswer as fetchSendAnswer} from './AjaxRequests/resetPassword'
import YandexParse from './Model/Parse/yandex'
import GoogleParse from './Model/Parse/google'
import Auth from './Model/authentication.js'
import {getData as storageGetData, saveOptions as storageSaveOptions} from './Model/storage'
import {yandex as yandexView, google as googleView} from './View/translations'
import {showRegistrationBlock, showResetPasswordBlock, showNotification, hideNotification, showUserInfoBlock, showLogin, showAuthForm, logOut as viewLogOut} from './View/authForm'
import learnMachineView from './View/learnMachineView'




var learningMachine = new LearnMachine();
learningMachine.getAllWords();

const controller = {

    getTranslation() {
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
    },

    getMeaning() {
        const word = document.getElementById('word').value;
        if ((!word)) return;
        googleApi(word)
            .then(data => {
                const parse = new GoogleParse(data);
                googleView(parse.getData());
            })
    },

    startLearning () {
        const lastWord = parseInt(document.getElementById('maxRange').value);
        const firstWord = parseInt(document.getElementById('minRange').value);
        const orderValue = document.getElementById('order').value;
        if (firstWord < 0 || lastWord > 25000) {
            throw new Error('range of words is not correct')
        }
        if (!((orderValue === 'random') || (orderValue === 'sequential'))) {
            throw new Error('Order is not correct')
        }
        learningMachine.setUserData(storageGetData());
        storageSaveOptions(firstWord, lastWord, orderValue);


    },

    register () {
        const auth = new Auth();
        let errors = false;
        try {
            var userInfo = auth.gatherUserInfo()
        } catch (err) {
            showNotification(err.message, 'brown');
            errors = true
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
    },

    login () {
        return new Promise((resolve, reject) => {
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
    },

    logOut () {
        const auth = new Auth();
        auth.deleteCredentials();
        viewLogOut();
    },

    getSecretQuestion () {
        const login = document.getElementById('loginReset').value;
        const email = document.getElementById('emailReset').value;
        fetchGetQuestion(login, email)
            .then((secretQuestion) => {
                document.getElementById('secretQuestionReset').innerText = secretQuestion
            }, err => {
                showNotification(err, 'brown')
            })
    },

    sendSecretQuestion () {
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


    },

    listenButtons () {
        document.getElementById("getMeaning").onclick = this.getMeaning;
        document.getElementById("getTranslation").onclick = this.getTranslation;
        document.getElementById("checkAnswer").onclick = learningMachine.checkAnswer.bind(learningMachine);
        document.getElementById("sendQuestion").onclick = learningMachine.sendQuestion.bind(learningMachine);
        document.getElementById("startLearning").onclick = this.startLearning;
        document.getElementById('loginBtn').onclick = this.login;
        document.getElementById('startRegistration').onclick = showRegistrationBlock;
        document.getElementById('endRegistration').onclick = this.register;
        document.getElementById('logOut').onclick = this.logOut;
        document.getElementById('resetPasswordStart').onclick = showResetPasswordBlock;
        document.getElementById('getSecretQuestion').onclick = this.getSecretQuestion;
        document.getElementById('resetPasswordFinish').onclick = this.sendSecretQuestion;
        document.getElementById('showUserData').onclick = learningMachine.showUserData.bind(learningMachine);
    }
};
 






 
 window.onload = () => {
     
     controller.listenButtons();
     controller.startLearning();

     
 };


