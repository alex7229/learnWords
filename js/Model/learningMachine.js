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
        let self = this;
        let nextWord = this.findFirstReadyWordFromPool();
        if (nextWord) {
            this.userData.currentWord = nextWord.number;
            return
        }
        let nextWordNumber;
        if (this.userData.options.order === 'random') {
            nextWordNumber = findNextRandomWordNumber()
        } else {
            nextWordNumber = this.userData.currentWord + 1;
            if (nextWordNumber>this.userData.options.lastWord) {
                this.userData.currentWord = undefined;
                return
            }

        }
        this.userData.currentWord = nextWordNumber;

        function findNextRandomWordNumber() {
            if ((self.userData.learningPool.length+self.userData.knownWords.length) > (self.userData.options.lastWord-self.userData.options.firstWord)) {
                return undefined
            }
            let number = Math.ceil(Math.random() * self.userData.options.lastWord);
            if ((!self.findWordInKnownList(number)) && (!self.findWordInPool(number))) {
                return number
            } else {
                return findNextRandomWordNumber()
            }
        }
    }

    findWordInKnownList (number) {
        let currentWord = this.userData.knownWords.filter(wordNumber => {
            if (wordNumber === number) {
                return number
            }
        });
        if (currentWord.length === 1) {
            return true
        }
    }

    findWordInPool (wordNumber) {
        let currentWord = this.userData.learningPool.filter(word => {
            if (word.number == wordNumber) {
                return word
            }
        });
        if (currentWord.length === 1) {
            return currentWord[0]
        }
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

    showPool () {
        const time = new Date().getTime();
        const wholePool = this.userData.learningPool;
        const readyPool = wholePool.filter(wordData => {
            if (wordData.successGuesses<10 && wordData.nextGuessTime<time) {
                return wordData
            }
        });
        console.log(wholePool);
        console.log(readyPool)
        
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
            } else if (currentAttempt>3 && currentAttempt<7) {
                delay = 24*60*60*1000
            } else if (currentAttempt>=7) {
                delay = 3*24*60*60*1000
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
    
    getUserData () {
        return this.userData;
    }

    setNextWordNumberStraight () {
        const number = document.getElementById('straightNumber').value;
        this.userData.currentWord = number
    }


}

// todo - view is changing by model, not controller.