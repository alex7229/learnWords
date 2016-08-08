//todo -  add sound (when u guessed right answer) from fallout4, add authentication (to save user progress)
require('whatwg-fetch');
import AuthClass from './authentication.js';

 
 class Controller {

    static getTranslation() {
        const word = document.getElementById('word').value;
        if ((!word)) return;
        AjaxRequests.getWordFromServer(word)
            .then(data => {
                View.yandex(YandexParse.getData(data))
            }, err => {
                if (err.status === 404) {
                    AjaxRequests.yandexApi(word)
                        .then(data => {
                            View.yandex(YandexParse.getData(data))
                        })
                }
            })
    }

    static getMeaning() {
        const word = document.getElementById('word').value;
        if ((!word)) return;
        AjaxRequests.googleApi(word)
            .then(data => {
                View.google(GoogleParse.getData(data))
            })
    }

    static listenButtons () {
        document.getElementById("getMeaning").onclick = Controller.getMeaning;
        document.getElementById("getTranslation").onclick  = Controller.getTranslation;
        document.getElementById("checkAnswer").onclick = learningMachine.checkAnswer.bind(learningMachine);
        document.getElementById("sendQuestion").onclick = learningMachine.sendQuestion.bind(learningMachine)
    }

}


 class AjaxRequests {
     
     static checkStatus (response) {
         if (response.status >= 200 && response.status < 300) {
             return response
         } else {
             const error = new Error(response.statusText);
             error.response = response;
             throw error
         }
     }

     static yandexApi(word) {
        return new Promise(resolve => {
           fetch('/learnWords/getTranslation', {
               method: 'post',
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                   word
               })
           })
               .then(AjaxRequests.checkStatus)
               .then(response => {
                   resolve (response.text())
               })

        });
     }

     static googleApi (word) {
         return new Promise (resolve => {
            fetch('/learnWords/getMeaning', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    word
                })
            })
                .then(AjaxRequests.checkStatus)
                .then(response => {
                    resolve(response.text())
                })
         });
     }

     static getWordFromServer (word) {
         return new Promise ((resolve,reject) => {
             fetch(`http://tup1tsa.bounceme.net/learnWords/wordsLists/yandexTranslations/${word}.txt`)
                 .then(AjaxRequests.checkStatus)
                 .then(response => {
                     resolve(response.text())
                 }, err => {
                     reject(err)
                 })
         })
     }

     static getWordList () {
         return new Promise ((resolve, reject) => {
             fetch(`http://tup1tsa.bounceme.net/learnWords/wordsLists/sorted_34k.txt`)
                 .then(AjaxRequests.checkStatus)
                 .then(response => {
                     resolve(response.text())
                 }, err => {
                     reject(err)
                 })
         })
     }
     
     static checkAuth (data) {
         return new Promise ((resolve, reject) => {
             fetch('/auth', {
                 method: 'post',
                 headers: {
                     'Content-Type': 'application/json'
                 },
                 body: JSON.stringify(data)
             })
                 .then(AjaxRequests.checkStatus)
                 .then(response => {
                     resolve(response.text())
                 }, err => {
                     reject(err)
                 })
         })
     }

 }

 class YandexParse {

    static getData (rawData) {
        const data = JSON.parse(rawData);
        if (data.def.length === 0) return;
        return data.def.map(description => {
            return {
                type: description.pos || ``,
                transcription: description.ts ? `[${description.ts}]` : ``,
                translations: description.tr
                    .map(translation => {
                        return {
                            examples: YandexParse.transformExamples(translation.ex),
                            synonyms: YandexParse.transformSynonyms(translation.syn),
                            synonymsEn: YandexParse.transformSynonyms(translation.mean),
                            translationType: translation.pos,
                            translation: translation.text
                        };
                    })

            };
        })
    }

    static transformExamples (examples = []) {
        return examples.map(example => {
            return `${example.text} - ${example.tr[0].text}`
        })
    }

    static transformSynonyms (synonyms = []) {
        return synonyms.map(synonym => {
            return synonym.text
        })
    }

    static findCorrectAnswers (parsedWords) {
        return parsedWords.map(word => {
            return word.translations.map(translation => {
                return translation.translation.toLowerCase()
            })
        }).reduce((previousWords, currentWord) => {
            return previousWords.concat(currentWord)
        }, [])
    }



}

 class GoogleParse {

     static getData (rawData) {
         return {
             definitionLists : GoogleParse.findDefinitionLists(GoogleParse.findDefinitionChunks(rawData)),
             webDefinitionLists: GoogleParse.findWebDefinitionLists(GoogleParse.findWebDefinitionChunk(rawData)),
             grammar: GoogleParse.findGrammar(rawData)
         }
     }

     static findDefinitionChunks(rawData) {
         const regExp = /<b>(.*)\n[\s\S]*?<\/[\s\S]*?<div class=std style="padding-left:40px">([\s\S]*?)(<div id="forEmbed">|<hr>)/g;
         let regExpResult;
         let definitionsChunks = [];
         while ((regExpResult = regExp.exec(rawData)) !== null) {
             definitionsChunks.push({
                 typeOfWord: regExpResult[1],
                 body: regExpResult[2]
             })
         }
         return definitionsChunks
     }

     static findDefinitionLists(chunks) {
         return chunks.map(chunk => {
             const list = chunk.body.split(/<li style="list-style:decimal">/g).slice(1).map(listValue => {
                return GoogleParse.deleteUnnecessaryRow(listValue)
             });
             return {
                 typeOfWord: chunk.typeOfWord,
                 list
             }
         })
     }

     static deleteUnnecessaryRow(listValue) {
         const regExp = /color:#767676/;
         if (listValue.match(regExp)) {
             return listValue
         } else {
             return listValue.replace(/<div[\s\S]*<\/div>/, '')
         }
     }


     static findWebDefinitionChunk(rawData) {
         const regExp = /Web Definitions[\s\S]*<\/ol>/g;
         return rawData.match(regExp)[0];
     }

     static findWebDefinitionLists (chunk) {
         let webList = [];
         const regExp = /<li style="list-style:decimal; margin-bottom:10px;">([\s\S]*?)<\/li>/g;
         let regExpResult;
         while ((regExpResult = regExp.exec(chunk)) !== null) {
             webList.push(regExpResult[1])
         }
         return webList
     }

     static findGrammar (rawData) {
         const regExp = /<span style="color:#767676">([\s\S]*?)<\/span>/;
         return rawData.match(regExp)[1].slice(0,-2);
     }
 }


 class View {

     static yandex (words) {
         document.getElementById('translationBox').innerHTML =
             words.map(word => {
                 return `<br><span class="ital"><b>${word.type}</b></span> ${word.transcription} ` +
                     word.translations.map((translation, index) => {
                         let innerHTML =`<br>${index+1}) ${translation.translation}`;
                         if (translation.examples.length !== 0) {
                             innerHTML += '. <br><span class="tabbed">Examples:</span> ' +
                                 translation.examples.join('; ');
                         }
                         if (translation.synonyms.length !== 0) {
                             innerHTML += `. <br><span class="tabbed">Synonyms:</span> `+
                                 translation.synonyms.join('; ');
                         }
                         if (translation.synonymsEn.length !== 0) {
                             innerHTML += `. <br><span class="tabbed">Synonyms (en):</span> `+
                                 translation.synonymsEn.join('; ');
                         }
                         return innerHTML
                     }).join('')
                }) + '<hr>';
     }

     static google (data) {
         const grammar = `<span class="googleGrammar"><b>Grammar:</b> ${data.grammar}</span><br>`;
         const definitions = data.definitionLists.map(chunk => {
             return `<b>${chunk.typeOfWord}</b><br><ol>
                ${chunk.list.map(definition => {
                    return `<li>${definition}</li>`
                }).join('')}</ol><hr>`
         });
         const webDefinition = `<b>Web Results:</b><ol>
            ${data.webDefinitionLists.map(row => {
                return `<li>${row}</li>`
            }).join('')}</ol>`;
         document.getElementById('dictionaryBox').innerHTML = grammar + definitions+ webDefinition
     }

     static showQuestion (word) {
         document.getElementById('questionedWord').textContent = word
     }

     static playCorrectAnswerSound () {
         const audio = new Audio('audio/whoosh.mp3');
         audio.play();
     }

     static showUserInfo () {
         let auth = new AuthClass();
         const data = auth.findLocalAuthData();
         if (data) {
             AjaxRequests.checkAuth(data)
                 .then(() => {
                     document.getElementById('authentication').style.display = 'none';
                     document.querySelector('#authentication .notification').style.display = 'none';
                     document.getElementById('profileData').style.display = 'block';
                     document.getElementById('profileName').value = auth.name
                 }, err => {
                     let notificationElem = document.querySelector('#authentication .notification');
                     notificationElem.style.display = 'block';
                     console.log(err);
                     //notificationElem.textContent = err
                 })
         }
     }

}


 class LearnMachine {

     constructor () {
         this.correctAnswers = [];
         this.allWords = []
     }

     getAllWords () {
        AjaxRequests.getWordList()
            .then(data => {
                this.allWords = JSON.parse(data)
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
         AjaxRequests.getWordFromServer(word)
             .then(data => {
                 this.correctAnswers = YandexParse.findCorrectAnswers(YandexParse.getData(data));
             }, err => {
                 if (err.status === 404) {
                     AjaxRequests.yandexApi(word)
                         .then(data => {
                             this.correctAnswers = YandexParse.findCorrectAnswers(YandexParse.getData(data))
                         })
                 }
             })
     }

 }





 var learningMachine = new LearnMachine();
 learningMachine.getAllWords();
 
 
 window.onload = () => {
     View.showUserInfo();
     setTimeout(() => {
         learningMachine.sendQuestion();
         Controller.listenButtons();
     }, 2500)
 };



