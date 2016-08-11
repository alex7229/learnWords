/**
 * Created by tup1tsa on 11.08.2016.
 */
import getWordsList from './AjaxRequests/getWordsList'
import getSavedYandexWordTranslation from './AjaxRequests/savedYandexTranslation'
import YandexParse from './Parse/yandex'
import View from './view'

export default class  {

    constructor () {
        this.correctAnswers = [];
        this.allWords = []
    }

    getAllWords () {
        getWordsList()
            .then(data => {
                this.allWords = data
            }, err => {
                throw err
            })
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

}

// todo - view is changing by model, not controller.