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
        }
        return false;
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

    getLearningPool(wordPart = '') {
        const regex = new RegExp(wordPart);
        const numbers = this.userData.learningPool.map(({number}) => number);
        const names = this.getWordsNames(numbers);
        return this.userData.learningPool.map((wordData, index) => {
            return Object.assign({}, wordData, {wordName: names[index]})
        }).filter(wordData => {
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

    normalizeString(answer) {
        return answer.replace(/ё/ig, 'е')
            .replace(/ /ig, '')
            .toLowerCase();
    }

    checkAnswerInList(answer, list = []) {
        answer = this.normalizeString(answer);
        const regExp = new RegExp(answer, 'i');
        return list.some((correctAnswer) => {
            return this.normalizeString(correctAnswer) === answer;
        })
    }

    checkAnswer (answer) {
        let result = {
            finished: false,
            answerCorrect:false,
            importantAnswersLeft: 0
        };
        const number = this.userData.currentWord;
        const importantAnswers = this.findImportantAnswersUnchecked();
        const allAnswers = this.correctAnswers.map((answerObj) => (answerObj.answer));
        if (
            (importantAnswers.length === 0 && this.checkAnswerInList(answer, allAnswers)) ||
            (importantAnswers.length === 1 && this.checkAnswerInList(answer, importantAnswers))
        ) {
            //all finished - move to another word
            if (this.findWordInPool(this.userData.currentWord)) {
                this.updateWordInPool(number, true);
            } else {
                this.userData.knownWords.push(number);
            }
            this.setNextWordNumber();
            result.finished = true;
            result.answerCorrect = true;
            return result;
        }
        if (importantAnswers.length > 1 && this.checkAnswerInList(answer, importantAnswers)) {
            //half success - you need to guess another word, which was left (correct answers will bu updated)
            this.correctAnswers.map((answerObj) => {
                if (answerObj.answer === answer) {
                    answerObj.isChecked = true;
                }
                return answerObj
            });
            result.answerCorrect = true;
            result.importantAnswersLeft = importantAnswers.length -1;
            return result;
        }
        if (importantAnswers.length > 1 && !this.checkAnswerInList(answer, importantAnswers)) {
            result.importantAnswersLeft = importantAnswers.length;
            return result;
        }
        return result;
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

    removeWordFromKnownWords(number) {
        this.userData.knownWords = this.userData.knownWords.filter(wordNumber => {
            return wordNumber !== number
        })
    }

    addWordToPool (number = this.getCurrentWordNumber(), ultraNewSystem = true) {
        this.removeWordFromKnownWords(number);
        const sixHours = 6*60*60*1000;
        const currentTime = new Date().getTime();
        const word = {
            number,
            successGuesses: 0,
            ultraNewWordsGuesses: ultraNewSystem ? 3 : 0,
            lastGuessTime: currentTime,
            nextGuessTime: currentTime + sixHours
        };
        this.userData.learningPool.push(word)
    }

    calculateNumberOfWordsInPool (minGuesses, maxGuesses = Number.MAX_SAFE_INTEGER) {
        return this.userData.learningPool.filter(({successGuesses: regular, ultraNewWordsGuesses: ultra}) => {
            return regular<=maxGuesses && regular>=minGuesses && ultra === 0
        }).length
    }

    calculateReadyWordsInPool () {
        const time = new Date().getTime();
        return this.userData.learningPool.filter(({nextGuessTime}) => nextGuessTime<time).length
    }

    calculateUltraNewWordsNumber() {
        return this.userData.learningPool.filter(({ultraNewWordsGuesses: times}) => times > 0).length
    }

    getKnownWordsCount() {
        return this.userData.knownWords.length
    }

    updateWordInPool (wordNumber, successGuess, addToUltraSystem = false) {
        //todo: refactor with moment
        let word = this.findWordInPool(wordNumber);
        const currentTime = new Date().getTime();
        word.lastGuessTime = currentTime;
        const hour = 60*60*1000;
        const day = 24*hour;
        let delay = 6*hour;

        if (word.ultraNewWordsGuesses > 0) {
            //super new word - guesses depends on success
            //no delay
            if (successGuess) {
                word.ultraNewWordsGuesses--;
            }
            return;
        }

        if (successGuess) {
            //not super new with correct guess
            //regular delay
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
            word.nextGuessTime = currentTime+delay
        } else if (addToUltraSystem && successGuess === false) {
            //regular word, but now it will be ultra new word
            //no delay
            word.successGuesses = 0;
            word.ultraNewWordsGuesses = 3;
        }
    }

    findFirstReadyWordFromPool () {
        const time = new Date().getTime();
        const readyWords = this.userData.learningPool.filter(wordData => wordData.nextGuessTime < time);
        if (readyWords.length === 0) return;

        const firstOldWord = _.chain(readyWords)
            .filter(({successGuesses: regular, ultraNewWordsGuesses: ultra}) => {
                return regular > 0 || (regular === 0 && ultra === 0)
            })
            .orderBy(['successGuesses'], ['desc'])
            .first()
            .value();
        if (firstOldWord) {
            return firstOldWord
        }

        const firstUltraNewWord = _.chain(readyWords)
            .filter(['successGuesses', 0])
            .orderBy(['ultraNewWordsGuesses'], ['desc'])
            .first()
            .value();
        if (firstUltraNewWord) {
            return firstUltraNewWord
        }
    }

    getCustomAnswersObject(desiredNumber = this.getCurrentWordNumber()) {
        return this.getUserData()['additionalWordsTranslationList']
            .find(({number}) => number === desiredNumber);
    }

    getCustomAnswers(number = this.getCurrentWordNumber()) {
        let customAnswerObject = this.getCustomAnswersObject(number);
        return !customAnswerObject ? [] : customAnswerObject['translations']
    }

    updateCustomAnswers(answer, wordNumber = this.getCurrentWordNumber()) {
        //todo: is that condition necessary?
        if (this.correctAnswers.find(({answer:correctAnswer}) => (correctAnswer === answer))) return;
        let customAnswers = this.getCustomAnswers(wordNumber);
        customAnswers.push(answer);
        let customAnswersObject = this.getCustomAnswersObject();
        customAnswersObject['translations'] = customAnswers;
        if (wordNumber !== this.getCurrentWordNumber()) return;
        this.addCustomTranslationToCorrectAnswers(answer);
    }

    addCustomPureAnswer(answer, wordNumber = this.getCurrentWordNumber()) {
        const answers = this.getCustomAnswers(wordNumber);
        if (answers.length === 0) {
            //add
            this.getUserData()['additionalWordsTranslationList'].push({
                'number': wordNumber,
                'translations': [answer]
            });
            if (wordNumber === this.getCurrentWordNumber()) {
                this.addCustomTranslationToCorrectAnswers(answer)
            }
        } else {
            //update
            this.updateCustomAnswers(answer, wordNumber)
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
        //if word is custom - you cannot delete last translation
        if (this.isCustomWordSet(this.getCurrentWordName()) && answers.length === 1) return;
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
        return this.getUserData()['additionalWordsList']
            .find((customWord) => {
                return customWord['name'] === word
            })
    }

    getLatestCustomWordNumber() {
        let list = this.getUserData()['additionalWordsList'];
        if (list.length === 0) {
            list = this.allWords;
        }
        return Math.max(...list.map((data) => (data.number)))
    }

    addBrandNewCustomWord(name) {
        //condition seems impossible
        if (this.isCustomWordSet(name)) return;
        const newWordNumber = this.getLatestCustomWordNumber()+1;
        this.getUserData()['additionalWordsList'].push({
            name,
            number: newWordNumber
        });
    }

    addCustomWord(name, translation) {
        //find word in all words
        //todo: add here to super new learning list (till three success guesses)
        let currentWordNumber = this.getCurrentWordNumber();
        let customWord = this.allWords.find(wordObj => wordObj.name === name);
        if (customWord) {
            this.addWordToPool(customWord.number);
            return `You successfully added this word to pool.`
        }
        this.addBrandNewCustomWord(name);
        let customWordNumber = this.getLatestCustomWordNumber();
        this.addCustomPureAnswer(translation, customWordNumber);
        this.addWordToPool(customWordNumber);
        return `You successfully added this custom word to pool and expanded all words.`
    }

}

