/**
 * Created by uadn-gav on 2/27/17.
 */
import TranslationsView from '../View/Translations'
import {getWordsList, sendUserStorage,retrieveUserStorage, getYandexTranslation} from '../AjaxRequests';
import YandexParseModel from '../Model/Parse/yandex';
import LearnMachineModel from '../Model/learningMachine'
import clientStorage from '../Model/Storage/clientStorage';
const utils = require('../utils');
import learnMachineView from '../View/learnMachineView';

const validators = require('../Model/validators');


export default class {

    constructor () {
        this.learnMachineInstance = new LearnMachineModel();
    }

    async initLearnMachine() {
        const latestStorage = await this.getUserData();
        if (latestStorage === false) {
            return this.showStartLearningForm();
        }
        this.learnMachineInstance.setUserData(latestStorage);
        try {
            this.learnMachineInstance.setAllDefaultWords(await getWordsList());
        } catch (err) {
            learnMachineView.showInaccessibleServerError('Cannot get words list from server.');
            throw err;
            //todo: mb it's better to save words in local storage (but still there is a chance of not set words in localstorage and inaccessible server)
        }
        this.getQuestion();
        this.showUserPool();
    }

    showStartLearningForm() {
        learnMachineView.toggleBlock('preferences', 'block', true);
        learnMachineView.toggleBlock('words');
        $('#startLearning').on('click', () => {
            if (this.startLearning() === true) {
                this.initLearnMachine();
            }
        })
    }

    async getUserData() {
        const localStorage = clientStorage.getData();
        try {
            const serverStorage = clientStorage.getData(await retrieveUserStorage());
            return this.learnMachineInstance.getLatestStorage(localStorage, serverStorage);
        } catch (err) {
            return this.learnMachineInstance.getLatestStorage(localStorage)
        }
    }

    async showYandexTranslation() {
        //method doesn't return anything - it is only for view purpose
        const word = document.getElementById('questionedWord').innerText;
        if ((!word)) return;
        try {
            const defaultTranslation = await getYandexTranslation(word);
            const parse = new YandexParseModel(defaultTranslation);
            TranslationsView.yandex(parse.getData());
        } catch (err) {
            console.log('no yandex translation for word')
        }
    };

    showPureAnswers () {
        const number = this.learnMachineInstance.getCurrentWordNumber();
        const answers = this.learnMachineInstance.getPureAnswerList();
        learnMachineView.showPureAnswers(number, answers, undefined, this);

    };

    showAllTranslations () {
        this.showPureAnswers();
        this.showYandexTranslation();
    };

    startLearning () {
        const lastWord = parseInt(document.getElementById('maxRange').value);
        const firstWord = parseInt(document.getElementById('minRange').value);
        const orderValue = document.getElementById('order').value;
        //todo: move errors handling to learnmachine itself (and remove magic numbers like 27380)
        if (firstWord < 0 || lastWord > 27380) {
            learnMachineView.showNotification('range of words is not correct');
            return false;
        }
        if (!((orderValue === 'random') || (orderValue === 'sequential'))) {
            learnMachineView.showNotification('Order is not random nor sequential');
            return false;
        }
        clientStorage.saveOptions(firstWord, lastWord, orderValue);
        learnMachineView.toggleBlock('words', 'block', true);
        learnMachineView.toggleBlock('preferences', 'block', false);
        learnMachineView.toggleBlock('learningNotification');
        return true;
    };
    
    async getQuestion () {
        //todo: simplify that method
        const number = this.learnMachineInstance.getCurrentWordNumber();
        const name = this.learnMachineInstance.getCurrentWordName();
        let defaultTranslations = [];
        try {
            const translationData = await getYandexTranslation(name);
            //todo: set error handling if there is word in AllWordsList but server returns 404 after some time
            const parse = new YandexParseModel(translationData);
            defaultTranslations = parse.findCorrectAnswers(parse.getData(translationData));
        } catch (err) {
            defaultTranslations = [];
        }
        try {
            this.learnMachineInstance.setAnswers(name, defaultTranslations);
            const wordInPool = this.learnMachineInstance.findWordInPool(number);
            if (wordInPool) {
                learnMachineView.showWordStatistics(wordInPool, this.learnMachineInstance.isCustomWordSet(name))
            } else {
                //todo: add handling here about custom word
                learnMachineView.showWordStatistics(`Difficulty is ${(number/10000*100).toFixed(2)}%.<br>U see that word for first time. `)
            }
            learnMachineView.showQuestion(name);
        } catch (err) {
            learnMachineView.toggleBlock('fullReset', 'inline-block', true);
            learnMachineView.toggleBlock('updateOptions', 'inline-block', true);
            learnMachineView.toggleBlock('words');
            learnMachineView.toggleBlock('preferences', 'block', true);
            learnMachineView.toggleBlock('startLearning');
            const userData = this.learnMachineInstance.getUserData();
            learnMachineView.showPreferencesData(userData.options.firstWord, userData.options.lastWord, userData.options.order);
            learnMachineView.showNotification('There are no words left. Start another learning process or update range of words (order would be the same).');
        }
    };

    startLearnWord () {
        const number = this.learnMachineInstance.getWordNumber();
        if (this.learnMachineInstance.findWordInPool(number)) {
            //you don't know word that is already started to learn some time ago
            // => it's time to use ultra new words learning system
            this.learnMachineInstance.updateWordInPool(number, false, true)
        } else {
            this.learnMachineInstance.addWordToPool();
        }
        this.learnMachineInstance.setNextWordNumber();
        this.updateStorage();
        learnMachineView.clearInput();
        learnMachineView.clearTranslations();
        this.getQuestion();
        this.updatePoolStatistics();
    };

    tryToGuessWord() {
        const answer = document.getElementById('answerWord').value;
        const check = this.learnMachineInstance.checkAnswer(answer);
        if (check.finished) {
            this.updateStorage();
            learnMachineView.clearInput();
            learnMachineView.clearTranslations();
            this.getQuestion();
            this.updatePoolStatistics();
            learnMachineView.showNotification('Answer is correct. Proceed to next word');
            return;
        }
        if (check.importantAnswersLeft > 0 && check.answerCorrect === false) {
            learnMachineView.showNotification(
                `Answer was incorrect.
                 You still have ${check.importantAnswersLeft} main answers left`
            );
            return;
        }
        if (check.importantAnswersLeft > 0 && check.answerCorrect === true) {
            learnMachineView.clearInput();
            learnMachineView.showNotification(
                `Answer was correct.
                 You have ${check.importantAnswersLeft} main answers left`
            );
            return;
        }
        learnMachineView.showNotification('Answer is incorrect. Try again');
    };

    skipWord () {
        const currentNumber= this.learnMachineInstance.getWordNumber();
        if (!this.learnMachineInstance.findWordInPool(currentNumber)) {
            this.learnMachineInstance.skipWord();
            this.updateStorage();
            learnMachineView.clearInput();
            learnMachineView.clearTranslations();
            this.getQuestion();
            // this.updatePoolStatistics();
        } else {
            learnMachineView.showNotification('U cannot skip word from your pool. Deal with it')
        }
    };

    fullReset() {
        localStorage.clear();
        learnMachineView.toggleBlock('fullReset');
        learnMachineView.toggleBlock('updateOptions');
        learnMachineView.toggleBlock('learningNotification');
        learnMachineView.toggleBlock('preferences');
        learnMachineView.toggleBlock('startLearning', 'inline-block', true);
        this.startLearning();
    };

    updateUserOptions () {
        //todo: add check ranges and order in learnMachine (not controller)
        //todo: check if it's working correctly with small learning pool
        const oldUserData = this.learnMachineInstance.getUserData();
        const newMinRange = parseInt(document.getElementById('minRange').value);
        const newMaxRange = parseInt(document.getElementById('maxRange').value);
        const oldMinRange = oldUserData.options.firstWord;
        const oldMaxRange = oldUserData.options.lastWord;
        if (newMinRange>oldMinRange) {
            learnMachineView.showNotification(`Your first word should be equal or less than ${oldMinRange}`);
        } else if (newMaxRange<oldMaxRange) {
            learnMachineView.showNotification(`Your last word should be equal or more than ${oldMaxRange}`);
        } else if (((newMinRange === oldMinRange) && (newMaxRange === oldMaxRange)) || (!newMinRange) || (!newMaxRange)) {
            learnMachineView.showNotification(`You should declare new minimum and maximum ranges`);
        }  else if (newMinRange < 1) {
            learnMachineView.showNotification(`First word number cannot be less than 1`);
        } else if (newMaxRange > 27380) {
            learnMachineView.showNotification(`Last word number cannot exceed 27,380`);
        } else {
            let oldStorageData = clientStorage.getData();
            oldStorageData.options.firstWord  = newMinRange;
            oldStorageData.options.lastWord = newMaxRange;
            clientStorage.saveSession(oldStorageData);
            learnMachineView.toggleBlock('startLearning', 'inline-block', true);
            learnMachineView.toggleBlock('preferences');
            learnMachineView.toggleBlock('fullReset');
            learnMachineView.toggleBlock('updateOptions');
            learnMachineView.toggleBlock('words', 'block', true);
            this.learnMachineInstance.setUserData(clientStorage.getData());
            this.learnMachineInstance.setUnusedWords();
            this.learnMachineInstance.setNextWordNumber();
            this.getQuestion();
        }

    };

    moveToGoogle() {
        let link = this.learnMachineInstance.generateGoogleLink();
        window.open(link, '_blank')
    };

    moveToUrban() {
        let link = this.learnMachineInstance.generateUrbanLink();
        window.open(link, '_blank')
    };

    showCustomWord() {
        learnMachineView.toggleBlock('addCustomWord', 'block', true);
        document.getElementById('newWord').focus();
    };

    addCustomWord() {
        learnMachineView.toggleBlock('addCustomWord');
        let $newWord = $('#newWord');
        let $translation = $('#newWordTranslation');
        const result = this.learnMachineInstance.addCustomWord($newWord.val(), $translation.val());
        $newWord.val('');
        $translation.val('');
        $('#learningNotification').html(result);
        this.updateStorage();
    };

    showUserPool () {
        let wordsData = [
            ['New', [0,3]],
            ['Medium', [4,6]],
            ['Old', [7,8]],
            ['Very old', [9,11]],
            ['Ancient', [12,12]]
        ].map(([name, [min, max, ultraNew]]) => {
            return {
                name,
                words: this.learnMachineInstance.calculateNumberOfWordsInPool(min, max, ultraNew)
            }
        });
        wordsData.unshift({
            name: 'Ready',
            words: this.learnMachineInstance.calculateReadyWordsInPool()
        }, {
            name: 'Ultra new',
            words: this.learnMachineInstance.calculateUltraNewWordsNumber()
        });
        wordsData.push({
            name: 'All known',
            words: this.learnMachineInstance.getKnownWordsCount()
        });
        learnMachineView.showPoolStatistics(wordsData);
    };

    showLearningPoolFull() {
        const pool = this.learnMachineInstance.getLearningPool();
        learnMachineView.toggleBlock('fullLearningPool', 'block', true);
        learnMachineView.showFullLearningPool(pool, this);
    };

    showLearningPoolFiltered() {
        const value = document.getElementById('poolWordFilter').value;
        const pool = this.learnMachineInstance.getLearningPool(value);
        learnMachineView.showFullLearningPool(pool, this.learnMachineInstance);
    };

    hidePopups() {
        $('.popup').css('display', 'none')
    }

    hideCustomWord() {
        learnMachineView.toggleBlock('addCustomWord')
    };

    hideFullLearningPool() {
        learnMachineView.toggleBlock('fullLearningPool');
    };

    deleteWordFromPool(word) {
        const firstStorage =clientStorage.getData();
        this.learnMachineInstance.deleteWordFromPool(word);
        this.updateStorage();
        const secondStorage = clientStorage.getData();
        validators.storage(firstStorage);
        validators.storage(secondStorage);
        //todo: why the hell is second storage here?
        //delete word from poolViewList (if it's deleted from pool and not by button "I don't want to learn")
        let elem = document.querySelector(`li[data-wordName="${word}"]`);
        elem.outerHTML = '';
    };

    updatePoolStatistics() {
        if (learnMachineView.checkPoolStatisticsDisplayState()) {
            this.showUserPool()
        }
    };

    updateStorage() {
        this.learnMachineInstance.updateStorageTime();
        clientStorage.saveSession(this.learnMachineInstance.getUserData());
        sendUserStorage();
    }

    expandCurrentWordTranslation(translation) {
        if (typeof translation !== 'string' || translation.length <1) return;
        this.learnMachineInstance.addCustomPureAnswer(translation);
        this.learnMachineInstance.markTranslationAsImportant(translation);
        this.showAllTranslations();
        this.updateStorage();
    }

    deleteWordTranslation(wordNumber, translation) {
        if (typeof translation !== 'string' || translation.length <1 || Number.isNaN(wordNumber)) return;
        this.markTranslationAsRegular(wordNumber, translation);
        this.learnMachineInstance.deleteCustomPureAnswer(translation);
        this.showAllTranslations();
        this.updateStorage();
    }

    markTranslationAsImportant(wordNumber, translation) {
        if (typeof translation !== 'string' || translation.length <1) return;
        this.learnMachineInstance.markTranslationAsImportant(translation);
        this.showAllTranslations();
        this.updateStorage();
    }

    markTranslationAsRegular(wordNumber, translation) {
        if (typeof translation !== 'string' || translation.length <1) return;
        this.learnMachineInstance.markTranslationAsRegular(translation);
        this.showAllTranslations();
        this.updateStorage();
    }








    turnEventKeyListener () {
        $(document).keydown((keyEvent) => {
            let elementId = keyEvent.target.id;
            if (elementId === 'poolWordFilter') {
                this.showLearningPoolFiltered();
                return;
            }
            if (keyEvent.keyCode === 13) {
                switch (elementId) {
                    case 'answerWord': {
                        this.tryToGuessWord();
                        break;
                    }
                    case 'newWord':
                    case 'newWordTranslation': {
                        this.addCustomWord();
                        break;
                    }
                    case 'newTranslation': {
                        const translation = $('#newTranslation').val();
                        this.expandCurrentWordTranslation(translation);
                        break;
                    }
                    default: {
                        throw new Error('id is undefined')
                    }
                }
            }
        });
    }

    listenButtons () {
        document.getElementById("startLearnWord").onclick = this.startLearnWord.bind(this);
        document.getElementById('skipWord').onclick = this.skipWord.bind(this);
        document.getElementById('showTranslations').onclick = this.showAllTranslations.bind(this);
        document.getElementById('googleTranslation').onclick = this.moveToGoogle.bind(this);
        document.getElementById('urbanDictionary').onclick = this.moveToUrban.bind(this);
        document.getElementById('showCustomWordInput').onclick = this.showCustomWord.bind(this);
        document.getElementById('showFullLearningPool').onclick = this.showLearningPoolFull.bind(this);
        $('.hidePopup').click(() => (this.hidePopups()));
        document.getElementById('fullReset').onclick = this.fullReset.bind(this);
        document.getElementById('updateOptions').onclick = this.updateUserOptions.bind(this);
        this.turnEventKeyListener();
    }
}