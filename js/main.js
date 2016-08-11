//todo -  add sound (when u guessed right answer) from fallout4, add authentication (to save user progress)
require('whatwg-fetch');
import yandexApi from './AjaxRequests/yandexApi'
import googleApi from './AjaxRequests/googleApi'
import savedYandexTranslation from './AjaxRequests/savedYandexTranslation'
import YandexParse from './Parse/yandex'
import GoogleParse from './Parse/google'
import View from './view'
import Auth from './authentication.js'
import LearnMachine from './learningMachine'



 
 class Controller {

    static getTranslation() {
        const word = document.getElementById('word').value;
        if ((!word)) return;
        savedYandexTranslation(word)
            .then(data => {
                const parse = new YandexParse(data);
                View.yandexTranslation(parse.getData());
            }, err => {
                if (err.status === 404) {
                    yandexApi(word)
                        .then(data => {
                            const parse = new YandexParse(data);
                            View.yandexTranslation(parse.getData());
                        })
                }
            })
    }

    static getMeaning() {
        const word = document.getElementById('word').value;
        if ((!word)) return;
        googleApi(word)
            .then(data => {
                const parse = new GoogleParse(data);
                View.googleDefinition(parse.getData());
            })
    }

    static listenButtons () {
        document.getElementById("getMeaning").onclick = Controller.getMeaning;
        document.getElementById("getTranslation").onclick  = Controller.getTranslation;
        document.getElementById("checkAnswer").onclick = learningMachine.checkAnswer.bind(learningMachine);
        document.getElementById("sendQuestion").onclick = learningMachine.sendQuestion.bind(learningMachine);
        document.getElementById('loginBtn').onclick = () => {
            let auth = new Auth();
            auth.checkUserInfo()
        }
    }

}


 





 var learningMachine = new LearnMachine();
 learningMachine.getAllWords();
 
 window.onload = () => {
     

     setTimeout(() => {
         learningMachine.sendQuestion();
         Controller.listenButtons();
     }, 200)
 };


