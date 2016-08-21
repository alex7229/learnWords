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

    getAllWords () {
        getWordsList()
            .then(data => {
                this.allWords = data
            }, err => {
                throw err
            })
    }

    getQuestion () {
        let nextWordNumber;
        if (this.userData.options.order === 'random') {
            nextWordNumber = this.findNextRandomWordNumber()
        } else {
            nextWordNumber = this.userData.currentWord + 1
        }
        
    }
    
    findNextRandomWordNumber () {
        let number = Math.ceil(Math.random()*this.userData.options.lastWord);
        let isKnown = this.userData.knownWords.filter(wordNumber => {
            if (number === wordNumber) {
                return wordNumber
            }
        });
        let isLearning = this.userData.learningPool.filter(word => {
            if (word.number === number) {
                return word
            }
        });
        if (isKnown.length === 0 && isLearning.length === 0) {
            return number
        } else {
            return this.findNextRandomWordNumber()
        }
    }

    checkAnswer () {
        const userAnswer = document.getElementById('answerWord').value;
        if (this.correctAnswers.includes(userAnswer)) {
            console.log('answer is correct')
        } else {
            console.log('answer is incorrect')
        }
    }

    sendQuestion () {
        const wordNumber = Math.ceil(Math.random()*1000);
        const word = this.allWords[wordNumber].word;
        this.getAnswer(word);
        View.showQuestion(word)
    }

    getAnswer (word) {
        getSavedYandexWordTranslation(word)
            .then(data => {
                const parse = new YandexParse(data);
                this.correctAnswers = parse.findCorrectAnswers(parse.getData(data));
            }, err => {
                throw err
            })
    }
    
    showUserData () {
        console.log(this.userData)
    }


}

// todo - view is changing by model, not controller.