/**
 * Created by tup1tsa on 11.08.2016.
 */
import getWordsList from '../AjaxRequests/getWordsList'
import getSavedYandexWordTranslation from '../AjaxRequests/savedYandexTranslation'
import YandexParse from '../Model/Parse/yandex'
import View from '../View/learnMachineView'

export default class  {

    constructor () {
        this.correctAnswers = [];
        this.allWords = [];
    }
    
    setUserData (data) {
        this.userData = data
    }

    downloadWords () {
        return new Promise( (resolve, reject) => {
            getWordsList()
                .then(data => {
                    this.allWords = data;
                    resolve(true)
                }, err => {
                    reject(err)
                })
        })
    }
    
    checkWordsList () {
        if (this.allWords.length>1) {
            return true
        }
    }
    
    getCurrentNumber () {
        return this.userData.currentWord;
    }

    setNextWordNumber () {
        let poolWord = this.findFirstReadyWordFromPool();
        if (poolWord) {
            this.userData.currentWord = poolWord.number;
            return
        }
        let nextWordNumber;
        if (this.userData.options.order === 'random') {
            let unusedWords = this.userData.unusedWords;
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
        const number = this.userData.currentWord;
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
        let word = this.findWordInPool(wordNumber);
        const currentTime = new Date().getTime();
        word.lastGuessTime = currentTime;
        if (successGuess) {
            word.successGuesses++;
            const currentAttempt = word.successGuesses;
            let delay;
            if (currentAttempt<=3) {
                delay = 6*60*60*1000;
            } else if (currentAttempt>=4 && currentAttempt<=6) {
                delay = 24*60*60*1000
            } else if (currentAttempt === 7 || currentAttempt === 8) {
                delay = 3*24*60*60*1000
            } else if (currentAttempt === 9) {
                delay = 10*24*60*60*1000
            } else if (currentAttempt >= 10) {
                delay = 30*240*60*60*1000
            }
            word.nextGuessTime = currentTime + delay
        } else {
            word.successGuesses = 0;
            const delay = 6*60*60*1000;
            word.nextGuessTime = currentTime+delay
        }
    }

    findFirstReadyWordFromPool () {
        const time = new Date().getTime();
        let readyWords = this.userData.learningPool.filter(wordData => {
            if ((wordData.successGuesses<10) && (wordData.nextGuessTime<time)) {
                return wordData.number
            }
        });
        if (readyWords.length>0) {
            return readyWords[0]
        }
    }

    getQuestion () {
        return new Promise ((resolve, reject) => {
            const wordNumber = this.userData.currentWord;
            const word = this.allWords[wordNumber].word;
            this.getAnswer(word)
                .then(() => {
                    resolve(word)
                }, err => {
                    reject (err)
                })
        })
        
    }

    getAnswer (word) {
        return new Promise ((resolve, reject) => {
            getSavedYandexWordTranslation(word)
                .then(data => {
                    const parse = new YandexParse(data);
                    this.correctAnswers = parse.findCorrectAnswers(parse.getData(data));
                    resolve(this.correctAnswers)
                }, err => {
                    reject(err)
                })
        })
        
    }
    
    getUserData() {
        return this.userData;
    }

    setNextWordNumberStraight () {
        const number = document.getElementById('straightNumber').value;
        this.userData.currentWord = number
    }

    setUnusedWords() {
        this.userData.unusedWords = [];
        for (let i=this.userData.options.firstWord; i<=this.userData.options.lastWord; i++) {
            if (!(this.findWordInKnownList(i)) && (!this.findWordInPool(i))) {
                this.userData.unusedWords.push(i)
            }
        }
    }

    fillDataTest() {
        for (let i=1; i<19950; i++) {
            this.userData.knownWords.push(i)
        }
        for (let i=20000; i<24450; i++) {
            const sixHours = 6*60*60*1000;
            const currentTime = new Date().getTime();
            const word = {
                number: i,
                successGuesses: 0,
                lastGuessTime: currentTime,
                nextGuessTime: currentTime + sixHours
            };
            this.userData.learningPool.push(word)
        }
    }

}

