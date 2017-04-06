/**
 * Created by tup1tsa on 11.08.2016.
 */
import {getYandexTranslation} from '../AjaxRequests'
import YandexParseModel from './Parse/yandex'
const utils = require('../utils');
const validators  = require('./validators');

export default class  {

    constructor () {
        this.correctAnswers = [];
        this.allWords = [];
    }

    setUserData (data) {
        this.userData = data;
        /*localStorage.setItem('learnWords', JSON.stringify(data));*/
    }

    setAllDefaultWords(words) {
        this.allWords = words
    }

    updateAllWords() {
        this.allWords = _.chain(this.allWords.concat(this.userData.additionalWordsList))
            .sortBy(['number'])
            .value();
    }

    getLatestStorage(first, second = false) {
        //both storage should be objects already
        const firstValid = validators.storage(first);
        const secondValid = validators.storage(second);
        if (firstValid && secondValid) {
            //compare and return latest
            const [firstTime, secondTime] = [first['lastTimeUpdate'], second['lastTimeUpdate']];
            return firstTime>secondTime === true ? first : second;
        } else if (firstValid) {
            return first;
        } else if (secondValid) {
            return second;
        } else {
            return false;
        }

    }

    updateStorageTime() {
        this.userData.lastTimeUpdate = new Date().getTime();
    }

    generateGoogleLink() {
        const word = this.getCurrentWordName();
        return `https://translate.google.ru/?ion=1&espv=2&bav=on.2,or.&bvm=bv.139250283,d.bGg&biw=1920&bih=935&dpr=1&um=1&ie=UTF-8&hl=ru&client=tw-ob#en/ru/${word}`;
    }

    generateUrbanLink() {
        const word = this.getCurrentWordName();
        return `http://www.urbandictionary.com/define.php?term=${word}`
    }

    getLearningPoolCopy() {
        return this.userData.learningPool
            .slice()
            .map((wordData) => {
                return Object.assign({}, wordData)
            })
    }

    getLearningPool(wordPart = '') {
        const regex = new RegExp(wordPart);
        return this.getLearningPoolCopy()
            .map((wordData) => {
                wordData.wordName = this.getWordsNames([wordData.number])[0];
                return wordData;
            }).filter((wordData) => {
                if (wordPart === '') {
                    return true;
                }
                return wordData.wordName.match(regex) !== null
            })
    }

    deleteWordFromPool(word) {
        const deleteWordNumber = this.getWordNumber(word);
        this.userData.learningPool = this.userData.learningPool
            .filter((wordData) => {
                return wordData.number !== deleteWordNumber
            });
        this.userData.knownWords.push(deleteWordNumber)
    }

    checkWordsList () {
        if (this.allWords.length>1) {
            return true
        }
    }

    getCurrentWordNumber() {
        return this.getWordNumber();
    }

    getCurrentWordName() {
        return this.getWordsNames([this.getCurrentWordNumber()])[0]
    }

    getWordNumber(name) {
        if (!name) {
            return this.userData.currentWord;
        }
        this.updateAllWords();
        let word = this.allWords.find((wordData) => {
            return wordData.name===name
        });
        if (!word) {
            throw new Error(`word ${name} was not found in all words and custom words`)
        }
        return word['number'];
    }

    getWordsNames(numbers = []) {
        numbers = _.sortBy(numbers);
        this.updateAllWords();
        let allWordsCopy = this.allWords.slice();
        return numbers.map((number) => {
            while(allWordsCopy.length>0) {
                const currentCopyNumber = allWordsCopy[0].number;
                if (currentCopyNumber>number) {
                    throw new Error(`for word with number ${number} name was not found`)
                }
                if (currentCopyNumber === number) {
                    return allWordsCopy[0].name;
                }
                allWordsCopy.shift();
            }
            throw new Error(`for word with number ${number} name was not found`)
        });
    }


    sortUserPool(type) {
        //default - by successGuesses and then by super new words somehow
        if (type === 'number') {
            this.userData.learningPool = _.sortBy(this.userData.learningPool, ['number']);
        } else {
            this.userData.learningPool = _.sortBy(this.userData.learningPool, ['successGuesses'])
                .reverse();
        }
    }

    setNextWordNumber () {
        let poolWord = this.findFirstReadyWordFromPool();
        if (poolWord) {
            this.userData.currentWord = poolWord.number;
            return
        }
        let nextWordNumber;
        if (this.userData.options.order === 'random') {
            let unusedWords = this.calculateUnusedWords();
            if (unusedWords.length === 0) {
                nextWordNumber = undefined
            } else {
                const index = Math.floor(Math.random() * unusedWords.length);
                nextWordNumber =  unusedWords[index];
                unusedWords.splice(index, 1)
            }
        } else {
            const possibleNextNumber = this.userData.currentWord + 1;
            if (possibleNextNumber>this.userData.options.lastWord) {
                nextWordNumber = undefined
            } else {
                nextWordNumber = possibleNextNumber
            }
        }
        this.userData.currentWord = nextWordNumber;
    }

    calculateUnusedWords() {
        //todo: refactor in functional style mb with lodash (it's already used for sorting, anyways)
        let unusedWords = [];
        const [firstNumber, lastNumber] = [this.userData.options.firstWord, this.userData.options.lastWord];
        for (let i=firstNumber; i<=lastNumber; i++) {
            unusedWords[i] = i;
        }
        let usedWords = this.userData.knownWords.concat(
            this.userData.learningPool
                .map(wordData => {
                    return wordData['number']
                })
        );
        usedWords.forEach((number) => {
            if (number>=firstNumber && number<=lastNumber) {
                unusedWords[number] = undefined;
            }
        });
        return unusedWords.filter((number) => (Number.isInteger(number)))
    }

    findWordInKnownList (number) {
        return this.userData.knownWords.find((wordNumber) => {
            if (wordNumber === number) return number
        });
    }

    findWordInPool (wordNumber) {
        return this.userData.learningPool.find((wordData) => {
            if (wordData.number === wordNumber) return wordData
        })
    }

    getPureAnswerList () {
        return this.correctAnswers;
    }

    checkAnswer (answer) {
        debugger;
        const number = this.userData.currentWord;
        const importantAnswers = this.findImportantAnswersUnchecked();
        const allAnswers = this.correctAnswers.map((answerObj) => (answerObj.answer));
        if (
            (importantAnswers.length === 0 && allAnswers.includes(answer)) ||
            (importantAnswers.length === 1 && importantAnswers.includes(answer))
        ) {
            //all finished - move to another word
            if (this.findWordInPool(this.userData.currentWord)) {
                this.updateWordInPool(number, true);
            } else {
                this.userData.knownWords.push(number);
            }
            this.setNextWordNumber();
            return {finished: true}
        }
        if (importantAnswers.length > 1 && importantAnswers.includes(answer)) {
            //half success - you need to guess another word, which was left (correct answers will bu updated)
            this.correctAnswers.map((answerObj) => {
                if (answerObj.answer === answerObj) {
                    answerObj.isChecked = true;
                }
                return answerObj
            });
            return {
                finished: false,
                importantAnswersLeft: answer.length-1
            }
        }





        //important Answers check



        if (this.correctAnswers.includes(answer)) {
            if (this.findWordInPool(this.userData.currentWord)) {
                this.updateWordInPool(number, true);
            } else {
                this.userData.knownWords.push(number);
            }
            this.setNextWordNumber();
            return true
        } else {
            return false
        }
    }

    findImportantAnswersUnchecked () {
        return this.correctAnswers
            .filter((answerObj) => (answerObj.isImportant && !answerObj.isChecked))
            .map((answerObj) => (answerObj.answer))
    }

    skipWord() {
        this.userData.knownWords.push(this.userData.currentWord);
        this.setNextWordNumber();
    }

    addWordToPool () {
        const sixHours = 6*60*60*1000;
        const currentTime = new Date().getTime();
        const word = {
            number: this.userData.currentWord,
            successGuesses: 0,
            lastGuessTime: currentTime,
            nextGuessTime: currentTime + sixHours
        };
        this.userData.learningPool.push(word)
    }

    calculateNumberOfWordsInPool (minGuesses, maxGuesses = Number.MAX_SAFE_INTEGER) {
        const pool = this.userData.learningPool;
        return pool.filter(wordData => {
            if ((wordData.successGuesses<=maxGuesses) && (wordData.successGuesses>=minGuesses)) {
                return wordData
            }
        }).length
    }

    calculateReadyWordsInPool () {
        const pool = this.userData.learningPool;
        const time = new Date().getTime();
        return pool.filter(wordData => {
            if (wordData.nextGuessTime<time) {
                return wordData
            }
        }).length
    }

    getKnownWordsCount() {
        return this.userData.knownWords.length
    }

    updateWordInPool (wordNumber, successGuess) {
        //todo: refactor with moment
        let word = this.findWordInPool(wordNumber);
        const currentTime = new Date().getTime();
        word.lastGuessTime = currentTime;
        const hour = 60*60*1000;
        const day = 24*hour;
        let delay = 6*hour;
        if (successGuess) {
            word.successGuesses++;
            const currentAttempt = word.successGuesses;
            if (currentAttempt>=4 && currentAttempt<=6) {
                delay = day
            } else if (currentAttempt === 7 || currentAttempt === 8) {
                delay = 3*day
            } else if (currentAttempt === 9) {
                delay = 10*day
            } else if (currentAttempt === 10) {
                delay = 15*day
            } else if (currentAttempt === 11) {
                delay = 22*day
            } else if (currentAttempt > 11) {
                delay = 30*day
            }
        }
        word.nextGuessTime = currentTime+delay
    }

    findFirstReadyWordFromPool () {
        const time = new Date().getTime();
        let readyWords = this.userData.learningPool.filter(wordData => {
            if (wordData.nextGuessTime<time) {
                return wordData.number
            }
        });
        if (readyWords.length>0) {
            return readyWords[0]
        }
    }

    getCustomAnswersObject(number = this.getCurrentWordNumber()) {
        return this.getUserData()['additionalWordsTranslationList']
            .find((wordData) => {
                return wordData.number === number;
            });
    }

    getCustomAnswers(number = this.getCurrentWordNumber()) {
        let customAnswerObject = this.getCustomAnswersObject(number);
        if (!customAnswerObject) return [];
        return customAnswerObject['translations'];
    }

    updateCustomAnswers(answer) {
        if (this.correctAnswers.find((answerObj) => (answerObj.answer === answer))) return;
        let customAnswers = this.getCustomAnswers();
        customAnswers.push(answer);
        let customAnswersObject = this.getCustomAnswersObject();
        customAnswersObject['translations'] = customAnswers;
        this.addCustomTranslationToCorrectAnswers(answer);
    }

    addCustomPureAnswer(answer) {
        const answers = this.getCustomAnswers();
        if (answers.length === 0) {
            //add
            this.getUserData()['additionalWordsTranslationList'].push({
                'number': this.getWordNumber(),
                'translations': [answer]
            });
            this.addCustomTranslationToCorrectAnswers(answer)
        } else {
            //update
            this.updateCustomAnswers(answer)
        }
    }

    markTranslationAsImportant(translation) {
        const importantAnswers = this.getImportantAnswers();
        if (importantAnswers.includes(translation)) return;
        if (importantAnswers.length === 0) {
            //add
            this.getUserData()['importantWordsTranslations'].push({
                'number': this.getWordNumber(),
                'translations': [translation]
            });
            this.addImportantTranslationToCorrectAnswers(translation)
        }else {
            //update
            let importantAnswers = this.getImportantAnswers();
            importantAnswers.push(translation);
            let importantAnswersObject = this.getImportantAnswersObject();
            importantAnswersObject['translations'] = importantAnswers;
            this.addImportantTranslationToCorrectAnswers(translation)
        }
    }

    markTranslationAsRegular(translation) {
        let importantAnswers = this.getImportantAnswers();
        if (!importantAnswers.includes(translation) || importantAnswers.length === 0) return;
        importantAnswers = importantAnswers.filter((answer) => (answer !== translation));
        let importantAnswersObject = this.getImportantAnswersObject();
        importantAnswersObject['translations'] = importantAnswers;
        if (importantAnswers.length === 0) {
            //delete whole object with answers to ensure no duplication will occur later
            const currentNumber = this.getCurrentWordNumber();
            this.userData.importantWordsTranslations = this.userData.importantWordsTranslations
                .filter((answerObj) => (answerObj.number !== currentNumber))
        }
        this.correctAnswers.map((answerObj) => {
            if (answerObj.answer === translation) {
                answerObj.isImportant = false;
                delete answerObj.isChecked;
            }
            return answerObj;
        })
    }

    addImportantTranslationToCorrectAnswers(translation) {
        this.correctAnswers.map((answerObj) => {
            if (answerObj.answer === translation) {
                answerObj.isImportant = true;
                answerObj.isChecked = false
            }
            return answerObj;
        })
    }


    //todo: custom translation and remove custom translations - weird stuff. Better update correctAnswers automatically from yandex translations and custom/important additions.
    //the problem - yandex translations are fetched from the server every time asynchronously
    addCustomTranslationToCorrectAnswers(translation) {
        this.correctAnswers.push({
            answer: translation,
            isImportant: true,
            isChecked: false,
            type: 'custom'
        })
    }

    deleteCustomPureAnswer(translation) {
        let answers = this.getCustomAnswers();
        if (!answers.includes(translation)) return;
        answers = answers.filter((answer) => (answer !== translation));
        let customAnswersObject = this.getCustomAnswersObject();
        customAnswersObject['translations'] = answers;
        if (answers.length === 0) {
            //delete whole object with answers to ensure no duplication will occur later
            const currentNumber = this.getCurrentWordNumber();
            this.userData.additionalWordsTranslationList = this.userData.additionalWordsTranslationList
                .filter((answerObj) => (answerObj.number !== currentNumber))
        }
        this.correctAnswers = this.correctAnswers.filter((answerObj) => {
            return answerObj.answer !== translation;
        })
    }

    setAnswers (wordName, defaultAnswers) {
        //todo: model should not work with asynchronous code
        //todo: redo with extended translation and custom word
        //todo: huge problem here = default answer for predefined word, and custom answer only for current word
        //todo: problem with inaccessible word data (should be some error handling and time limit for request to server)
        this.correctAnswers = this.createAnswersList(defaultAnswers, this.getWordNumber(wordName));
        if (this.correctAnswers.length === 0) {
            throw new Error (`There is no pure answers for word ${wordName}`)
        }
    }

    createAnswersList(defaultAnswers, wordNumber) {
        let customAnswers = this.getCustomAnswers(wordNumber);
        let importantAnswers = this.getImportantAnswers(wordNumber);
        return customAnswers.concat(defaultAnswers)
            .map(answer => {
                return {
                    answer,
                    isImportant: importantAnswers.includes(answer),
                    isChecked: !importantAnswers.includes(answer),
                    type: customAnswers.includes(answer) === true ? 'custom' : 'default'
                }
            });
    }

    getImportantAnswers(number = this.getCurrentWordNumber()) {
        const importantAnswersObj = this.getImportantAnswersObject(number);
        if (!importantAnswersObj) {
            return [];
        }
        return importantAnswersObj['translations'];
    }

    getImportantAnswersObject(number = this.getCurrentWordNumber()) {
        return this.getUserData()['importantWordsTranslations']
            .find((wordData) => {
                return wordData.number === number;
            });
    }

    getUserData() {
        return this.userData;
    }

    setNextWordNumberStraight () {
        this.userData.currentWord = document.getElementById('straightNumber').value;
    }

    setUnusedWords() {
        this.userData.unusedWords = [];
        for (let i=this.userData.options.firstWord; i<=this.userData.options.lastWord; i++) {
            if (!(this.findWordInKnownList(i)) && (!this.findWordInPool(i))) {
                this.userData.unusedWords.push(i)
            }
        }
    }

    isCustomWordSet(word) {
        //todo: doable too
        return this.getUserData()['additionalWordsList']
            .find((customWord) => {
                return customWord['word'] === word
            })
    }

    getLatestCustomWordNumber() {
        //todo:doable, mb now just push words and get number normal (and not that weird 100000 value)
        const list = this.getUserData()['additionalWordsList'];
        if (list.length === 0) {
            return 99999;
        }
        return Math.max(...list.map((data) => (data.number)))
    }

    addBrandNewCustomWord(word) {
        if (this.isCustomWordSet(word)) return;
        const currentNumber = this.getLatestCustomWordNumber();
        this.getUserData()['additionalWordsList'].push({
            word,
            number: currentNumber+1
        });
        //add to pool and return to previous word
        this.userData.currentWord = (currentNumber);
        this.addWordToPool();
        this.userData.currentWord = (previousNumber);
            //previous number is undefined?
    }

    addCustomWord(name, translation) {
        //find word in all words
        //todo: add here to super new learning list (till three success guesses)
        let wordNumber;
        const wordData = this.allWords.filter((wordObj, index) => {
            if (wordObj.word === name) {
                wordNumber = index;
                return true;
            }
            return false;
        });
        if (wordData.length === 0) {
            const currentNumber = this.userData.currentWord;
            this.addBrandNewCustomWord(name);
            this.addCustomPureAnswer(translation);
            return;
            //todo: put in learning pool too
        }
        const number = wordData[0].number;
        const learningPool = this.userData.learningPool.filter((learnedWord) => {
            return learnedWord.number == wordNumber
        });
        //already learned
        if (learningPool.length > 0) return;
        const previousNumber = this.userData.currentWord;
        this.userData.currentWord = wordNumber;
        this.addWordToPool();
        this.userData.currentWord = previousNumber;
    }

}

