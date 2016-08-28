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
import {getData as storageGetData, saveOptions as storageSaveOptions, saveSession, updateUserData as storageUpdateData} from './Model/storage'
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
        this.showUserPool();
        LearnMachineView.toggleBlock('words', 'block', true);
        LearnMachineView.toggleBlock('preferences', 'block', false);
        LearnMachineView.toggleBlock('learningNotification');
    },

    getQuestion () {
        if (learningMachine.getCurrentNumber()) {
            learningMachine.getQuestion()
                .then((questionWord) => {
                    const number = learningMachine.getCurrentNumber();
                    const wordInPool = learningMachine.findWordInPool(number);
                    if (wordInPool) {
                        LearnMachineView.showWordStatistics(wordInPool)
                    } else {
                        LearnMachineView.showWordStatistics(`Difficulty is ${(number/10000*100).toFixed(2)}%.<br>U see that word for first time. `)
                    }
                    LearnMachineView.showQuestion(questionWord)
                })

        } else {
            LearnMachineView.toggleBlock('fullReset', 'inline-block', true);
            LearnMachineView.toggleBlock('updateOptions', 'inline-block', true);
            LearnMachineView.toggleBlock('words');
            LearnMachineView.toggleBlock('preferences', 'block', true);
            LearnMachineView.toggleBlock('startLearning');
            const userData = learningMachine.getUserData();
            LearnMachineView.showPreferencesData(userData.options.firstWord, userData.options.lastWord, userData.options.order);
            LearnMachineView.showNotification('There are no words left. Start another learning process or update range of words (order would be the same).');
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
        this.getQuestion();
        this.updatePoolStatistics();
    },
    
    tryToGuessWord() {
        const word = document.getElementById('answerWord').value;
        if (learningMachine.checkAnswer(word)) {
            saveSession(learningMachine.getUserData());
            LearnMachineView.clearInput();
            LearnMachineView.clearTranslations();
            this.getQuestion();
            this.updatePoolStatistics();
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
        this.updatePoolStatistics();
    },

    fullReset() {
        localStorage.clear();
        LearnMachineView.toggleBlock('fullReset');
        LearnMachineView.toggleBlock('updateOptions');
        LearnMachineView.toggleBlock('learningNotification');
        LearnMachineView.toggleBlock('preferences');
        LearnMachineView.toggleBlock('startLearning', 'inline-block', true);
        this.startLearning();
    },

    updateUserOptions () {
        const oldUserData = learningMachine.getUserData();
        const newMinRange = parseInt(document.getElementById('minRange').value);
        const newMaxRange = parseInt(document.getElementById('maxRange').value);
        const oldMinRange = oldUserData.options.firstWord;
        const oldMaxRange = oldUserData.options.lastWord;
        if (newMinRange>oldMinRange) {
            LearnMachineView.showNotification(`Your first word should be equal or less than ${oldMinRange}`);
        } else if (newMaxRange<oldMaxRange) {
            LearnMachineView.showNotification(`Your last word should be equal or more than ${oldMaxRange}`);
        } else if (((newMinRange === oldMinRange) && (newMaxRange === oldMaxRange)) || (!newMinRange) || (!newMaxRange)) {
            LearnMachineView.showNotification(`You should declare new minimum and maximum ranges`);
        }  else if (newMinRange < 1) {
            LearnMachineView.showNotification(`First word number cannot be less than 1`);
        } else if (newMaxRange > 25000) {
            LearnMachineView.showNotification(`Last word number cannot exceed 25,000`);
        } else {
            let oldStorageData = storageGetData();
            oldStorageData.options.firstWord  = newMinRange;
            oldStorageData.options.lastWord = newMaxRange;
            storageUpdateData(oldStorageData);
            LearnMachineView.toggleBlock('startLearning', 'inline-block', true);
            LearnMachineView.toggleBlock('preferences');
            LearnMachineView.toggleBlock('fullReset');
            LearnMachineView.toggleBlock('updateOptions');
            LearnMachineView.toggleBlock('words', 'block', true);
            learningMachine.setUserData(storageGetData());
            learningMachine.setNextWordNumber();
            saveSession(learningMachine.getUserData());
            this.getQuestion();
        }

    },

    showUserPool () {
        const readyWordsCount = learningMachine.calculateReadyWordsInPool();
        const newWordsCount = learningMachine.calculateNumberOfWordsInPool(0, 3);
        const mediumWordsCount = learningMachine.calculateNumberOfWordsInPool(4, 6);
        const oldWordsCount = learningMachine.calculateNumberOfWordsInPool(7, 8);
        const superOldWordsCount = learningMachine.calculateNumberOfWordsInPool(9, 9);
        const maxOldWordsCount = learningMachine.calculateNumberOfWordsInPool(10);
        const knownWordsCount = learningMachine.getKnownWordsCount();
        const data = `Ready words: ${readyWordsCount}.<br>
                        New words: ${newWordsCount}.<br>
                        Medium words: ${mediumWordsCount}.<br>
                        Old words: ${oldWordsCount}.<br>
                        Very old words: ${superOldWordsCount}.<br>
                        Max old words: ${maxOldWordsCount}.<br>
                        All known words: ${knownWordsCount}`;
        LearnMachineView.showPoolStatistics(data);
    },

    updatePoolStatistics() {
      if (LearnMachineView.checkPoolStatisticsDisplayState()) {
          this.showUserPool()
      }
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
        document.getElementById("startLearnWord").onclick = this.startLearnWord.bind(this);
        document.getElementById("startLearning").onclick = this.startLearning.bind(this);
        document.getElementById('skipWord').onclick = this.skipWord.bind(this);
        document.getElementById('showTranslations').onclick = this.showAllTranslations.bind(this);
        document.getElementById('insertNumber').onclick = learningMachine.setNextWordNumberStraight.bind(learningMachine);
        document.getElementById('answerWord').onkeydown = this.listenKeyboardButtons.bind(this);
        document.getElementById('fullReset').onclick = this.fullReset.bind(this);
        document.getElementById('updateOptions').onclick = this.updateUserOptions.bind(this);
        document.getElementById('calculateUnusedWords').onclick = learningMachine.findUnusedWords.bind(learningMachine);

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
                 controller.getQuestion();
                 controller.showUserPool();
             })
     } else {
         LearnMachineView.toggleBlock('preferences', 'block', true);
         LearnMachineView.toggleBlock('words');
     }



     
 };


//todO: if pool is overwhelming - don't add new words; start new learning with options