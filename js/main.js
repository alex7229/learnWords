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
import {getData as storageGetData, saveOptions as storageSaveOptions, saveSession} from './Model/storage'
import {yandex as yandexView, google as googleView} from './View/translations'
import {showRegistrationBlock, showResetPasswordBlock, showNotification, hideNotification, showUserInfoBlock, showLogin, showAuthForm, logOut as viewLogOut} from './View/authForm'
import LearnMachineView from './View/learnMachineView'




var learningMachine = new LearnMachine();

const controller = {

    getYandexTranslation() {
        const word = document.getElementById('questionedWord').innerText;
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

    getGoogleMeaning() {
        const word = document.getElementById('questionedWord').innerText;
        if ((!word)) return;
        googleApi(word)
            .then(data => {
                const parse = new GoogleParse(data);
                googleView(parse.getData());
            })
    },

    showPureAnswers () {
        const answers = learningMachine.getPureAnswerList();
        LearnMachineView.showPureAnswers(answers);
    },

    showAllTranslations () {
        this.showPureAnswers();
        this.getYandexTranslation();
        this.getGoogleMeaning()
    },

    startLearning () {
        const lastWord = parseInt(document.getElementById('maxRange').value);
        const firstWord = parseInt(document.getElementById('minRange').value);
        const orderValue = document.getElementById('order').value;
        if (firstWord < 0 || lastWord > 25000) {
            LearnMachineView.showNotification('range of words is not correct');
            return
        }
        if (!((orderValue === 'random') || (orderValue === 'sequential'))) {
            LearnMachineView.showNotification('Order is not random nor sequential');
            return
        }
        storageSaveOptions(firstWord, lastWord, orderValue);
        learningMachine.setUserData(storageGetData());
        learningMachine.setNextWordNumber();
        learningMachine.downloadWords()
            .then(() => {
                controller.getQuestion()
            });
        LearnMachineView.toggleLearningForm(true);
        LearnMachineView.togglePreferences(false);
        LearnMachineView.hideNotification();
    },

    getQuestion () {
        if (learningMachine.getCurrentNumber()) {
            learningMachine.getQuestion()
                .then((questionWord) => {
                    const number = learningMachine.getCurrentNumber();
                    const wordInPool = learningMachine.findWordInPool(number);
                    if (wordInPool) {
                        LearnMachineView.showStatistics(wordInPool)
                    } else {
                        LearnMachineView.showStatistics(`Difficulty is ${(number/25000*100).toFixed(2)}%.<br>U see that word for first time. `)
                    }
                    LearnMachineView.showQuestion(questionWord)
                })

        } else {
            LearnMachineView.toggleFullResetBtn('on');
            LearnMachineView.toggleLearningForm(false);
            LearnMachineView.togglePreferences(false);
            LearnMachineView.showNotification('There are no words left. Start another learning process');
        }

    },

    startLearnWord () {
        const number = learningMachine.getCurrentNumber();
        if (learningMachine.findWordInPool(number)) {
            learningMachine.updateWordInPool(number, false)
        } else {
            learningMachine.addWordToPool();
        }
        learningMachine.setNextWordNumber();
        saveSession(learningMachine.getUserData());
        LearnMachineView.clearInput();
        LearnMachineView.clearTranslations();
        this.getQuestion()
    },
    
    tryToGuessWord() {
        const word = document.getElementById('answerWord').value;
        if (learningMachine.checkAnswer(word)) {
            saveSession(learningMachine.getUserData());
            LearnMachineView.clearInput();
            LearnMachineView.clearTranslations();
            this.getQuestion();
            LearnMachineView.showNotification('Answer is correct')
        } else {
            LearnMachineView.showNotification('Answer is incorrect')
        }
    },

    skipWord () {
        learningMachine.skipWord();
        saveSession(learningMachine.getUserData());
        LearnMachineView.clearInput();
        LearnMachineView.clearTranslations();
        this.getQuestion();
    },

    fullReset() {
        localStorage.clear();
        LearnMachineView.toggleFullResetBtn('off');
        LearnMachineView.hideNotification();
        LearnMachineView.togglePreferences(true);
        LearnMachineView.toggleLearningForm(false);
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

    listenKeyboardButtons (elem) {
        if (elem.keyCode ==13) {
            this.tryToGuessWord();
        }
    },

    listenButtons () {
        document.getElementById("checkAnswer").onclick = this.tryToGuessWord.bind(this);
        document.getElementById("startLearnWord").onclick = this.startLearnWord.bind(this);
        document.getElementById("startLearning").onclick = this.startLearning.bind(this);
        document.getElementById('showUserData').onclick = learningMachine.getUserData.bind(learningMachine);
        document.getElementById('skipWord').onclick = this.skipWord.bind(this);
        document.getElementById('showTranslations').onclick = this.showAllTranslations.bind(this);
        document.getElementById('insertNumber').onclick = learningMachine.setNextWordNumberStraight.bind(learningMachine);
        document.getElementById('answerWord').onkeydown = this.listenKeyboardButtons.bind(this);
        document.getElementById('fullReset').onclick = this.fullReset;

        document.getElementById('loginBtn').onclick = this.login;
        document.getElementById('startRegistration').onclick = showRegistrationBlock;
        document.getElementById('endRegistration').onclick = this.register;
        document.getElementById('logOut').onclick = this.logOut;
        document.getElementById('resetPasswordStart').onclick = showResetPasswordBlock;
        document.getElementById('getSecretQuestion').onclick = this.getSecretQuestion;
        document.getElementById('resetPasswordFinish').onclick = this.sendSecretQuestion;
    }
};
 






 
 window.onload = () => {
     
     controller.listenButtons();

     if (localStorage.getItem('learnWords')) {
         learningMachine.setUserData(storageGetData());
         learningMachine.downloadWords()
             .then(() => {
                 controller.getQuestion()
             })
     } else {
         LearnMachineView.togglePreferences(true);
         LearnMachineView.toggleLearningForm(false);
     }



     
 };


//todO: if pool is overwhelming - don't add new words; start new learning with options