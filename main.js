
 //parsing from txt.rawData into JSON
/*$.ajax({
    url: `http://tup1tsa.bounceme.net/learnWords/wordsLists/rawLists/bast/Lemmatized/2+2+3frq.txt`
})
    .then(data => {
        //console.log(data);
        let rawData = data.toLowerCase().replace(/[!)(]/g, '');
        let regExpGroups = /----- \d{1,2} -----/g;
        let wordGroups = rawData.split(regExpGroups);
        let bigList = [];
        let wordNumber = 0;
        for (let i=1; i<=21; i++) {
            let group = wordGroups[i];
            let regExpWords = /([\w'-]+)\r\n(?:\s{4}([ \w,*'-]+)\r\n)?/g;
            let regExpResult;
            while ((regExpResult = regExpWords.exec(group)) !== null) {
                wordNumber++;
                let word = {
                    word: regExpResult[1],
                    number: wordNumber,
                    group: i,
                    differentSpellings: regExpResult[2]
                };
                if (!word.word.match(/-/)) {
                    bigList.push(word);
                }
            }
        }




        //duplicates
        bigList.splice(19127, 1);
        bigList.splice(2821, 1);
        bigList.splice(10143, 1);
        bigList.splice(10153, 1);
        console.log(((JSON.stringify(bigList))));
        bigList.map((currentWord, index) => {
            let sameWords = bigList.filter(possibleWord => {
                if (currentWord.word === possibleWord.word) {
                    return possibleWord
                }
            });
            if (sameWords.length > 1) {
                console.log(`word ${currentWord.word} has duplicates, index is ${index}`)
            }
        })
    });
*/


//get sorted Data
/*$.ajax({
    url: 'http://tup1tsa.bounceme.net/learnWords/wordsLists/sorted_34k.txt'
})
.done((data) => {
    let mainWords = JSON.parse(data);
    $.ajax({
            url: 'http://tup1tsa.bounceme.net/learnWords/wordsLists/rawLists/300k.txt'
        })
        .done((data) => {
            let superBigList = [];

            let powerWordsRaw = data;
            let regExp = /(\w+)\s+(\d+)/g;
            let regExpResult;
            while ((regExpResult = (regExp.exec(powerWordsRaw)))!==null) {
                superBigList.push({
                    word: regExpResult[1],
                    power: parseInt(regExpResult[2])
                })
            }


            let power = 3000;
            for (let i=0; i<mainWords.length; i++) {
                let mainWord = mainWords[i];
                for (let j=0; j<superBigList.length; j++) {
                    let powerWord = superBigList[j];
                    if (mainWord.word === powerWord.word) {
                        mainWord.power = powerWord.power;
                        break
                    }
                }
                if (!mainWord.power) {
                    mainWord.power = power;
                    power--
                }
            }


            function compare (a,b) {
                if (a.power>b.power) return -1;
                if (a.power<b.power) return 1;
                return 0
            }
            mainWords.sort(compare);
            console.log((JSON.stringify(mainWords)));



        });

});*/



//todo - get to work google.api for dictionary (via suspicious site) - (get web translation, add noun/verb type), add sound (when u guessed right answer) from fallout4


 class Controller {

    static getTranslation() {
        let word = $('#word').val();
        if ((!word)) return;
        AjaxRequests.getWordFromServer(word)
            .then(data => {
                let parsedData = Parse.yandex(data);
                Draw.yandexData(parsedData)
            }, err => {
                if (err.status === 404) {
                    AjaxRequests.yandexApi(word)
                        .then(data => {
                            let parsedData = Parse.yandex(data);
                            Draw.yandexData(parsedData)
                        })
                }
            })
    }

    static getMeaning() {
        let word = $('#word').val();
        AjaxRequests.googleApi(word)
            .then(data => {
                Draw.googleData(data)
            })
    }

    getWords() {

    }

}


 class AjaxRequests {

     static yandexApi(word) {
         return new Promise (resolve => {
             $.ajax({
                 url: '/getTranslation',
                 type: 'POST',
                 data: {
                     word
                 }
             }).done(data => {
                 resolve(data)
             });
         });
     }

     static googleApi (word) {
         return new Promise (resolve => {
             $.ajax({
                 url: '/getMeaning',
                 type: 'POST',
                 data: {
                     word
                 }
             }).done(data => {
                 resolve(data)
             });
         });

     }

     static getWordFromServer (word) {
         return new Promise ((resolve, reject) => {
             $.ajax({
                 url: `http://tup1tsa.bounceme.net/learnWords/wordsLists/yandexTranslations/${word}.txt`,
                 type: 'GET'
             }).done(data => {
                 resolve(data)
             }).catch(err => {
                 reject (err)
             })
         })
     }


 }

class Parse {

    static yandex (rawData) {
        let data = JSON.parse(rawData);
        if (data.def.length === 0) return;
        let wordFullData = {
            chunks: data.def, //adjective, noun, etc;
            correctAnswers: []
        };
        wordFullData.chunks = wordFullData.chunks.map(description => {
            return {
                type: description.pos || ``,
                transcription: description.ts ? `[${description.ts}]` : ``,
                translations: description.tr
                    .map(translation => {
                        wordFullData.correctAnswers.push(translation.text);
                        return {
                            examples: Parse.transformExamples(translation.ex),
                            synonyms: Parse.transformSynonyms(translation.syn),
                            synonymsEn: Parse.transformSynonyms(translation.mean),
                            translationType: translation.pos,
                            translation: translation.text
                        };
                    })

            };
        });
        return wordFullData
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
}


 class Draw {

    static yandexData(data) {
        let response = JSON.parse(data);
        if (response.def.length === 0) return;
        let differentTypes = response.def; //adjective, noun else
        let divHTML = ``;
        differentTypes.map(description => {
            let [type, transcription] = [description.pos || ``, description.ts ? `[${description.ts}]` : ``];
            divHTML += `<br><span class="ital"><b>${type}</b></span> ${transcription} `;
            let translations = description.tr;
            translations.map((translation, index) => {
                let examples = translation.ex;
                let synonyms = translation.syn;
                let meanings = translation.mean;
                let typeTranslated = translation.pos;
                let translatedText = translation.text;
                divHTML+=`<br>${index+1}) ${translatedText}`;
                if (examples) {
                    divHTML += '. <br><span class="tabbed">Examples:</span> ' +
                        examples.map(example => {
                        let exampleText = example.text;
                        let translationOfExample = example.tr[0].text;
                        return `${exampleText} - ${translationOfExample}; `;
                    }).join('').slice(0,-2)
                }
                if (synonyms) {
                    divHTML += `. <br><span class="tabbed">Synonyms:</span> `+
                        synonyms.map(synonym => {
                            return `${synonym.text}; `
                    }).join('').slice(0,-2)
                }
                if (meanings) {
                    divHTML += `. <br><span class = "tabbed">Synonyms (en):</span> `+
                        meanings.map(meaning => {
                            return `${meaning.text}; `
                        }).join('').slice(0,-2)
                }

            })
        });
        divHTML += '<hr>';
        $('#translationBox').html(divHTML)
    }


     static yandexNew (data) {
         let words = data.chunks;
         let divHTML = ``;
         words.map(word => {
             divHTML += `<br><span class="ital"><b>${word.type}</b></span> ${word.transcription} `;
             word.translations.map((translation, index) => {
                 divHTML+=`<br>${index+1}) ${translation.translation}`;
                 if (translation.examples.length !== 0) {
                     divHTML += '. <br><span class="tabbed">Examples:</span> ' +
                         translation.examples.join('; ');
                 }
                 if (translation.synonyms.length !== 0) {
                     divHTML += `. <br><span class="tabbed">Synonyms:</span> `+
                         translation.synonyms.join('; ');
                 }
                 if (translation.synonymsEn.length !== 0) {
                     divHTML += `. <br><span class="tabbed">Synonyms (en):</span> `+
                         translation.synonymsEn.join('; ');
                 }
             })
         });
         divHTML += '<hr>';
         $('#translationBox').html(divHTML)
     }

    static googleData (data) {
        let divHTML = ``;
        let regExpChunk = /<b>(.*)\n[\s\S]*?<\/[\s\S]*?<div class=std style="padding-left:40px">([\s\S]*?)(<div id="forEmbed">|<hr>)/g;
        let regExpResultChunk;
        let definitionsChunks = [];
        while ((regExpResultChunk = regExpChunk.exec(data)) !== null) {
            definitionsChunks.push({
                typeOfWord: regExpResultChunk[1],
                body: regExpResultChunk[2]
            })
        }
        definitionsChunks.map(chunk => {
            let orderedList = chunk.body.split(/<li style="list-style:decimal">/g);
            orderedList.shift();
            divHTML += `<b>${chunk.typeOfWord}</b><br><ol>
                ${orderedList.map(definition => {
                    return `<li>${definition.slice(0,-10)}</li>`
                }).join('')}</ol><hr>`
        });


        let regExpWeb = /Web Definitions[\s\S]*<\/ol>/g;
        let webResultChunk = data.match(regExpWeb)[0];
        let webList = [];
        let regExpWebList = /<li style="list-style:decimal; margin-bottom:10px;">([\s\S]*?)<\/li>/g;
        let regExpWebListResult;
        while ((regExpWebListResult = regExpWebList.exec(webResultChunk)) !== null) {
            webList.push(regExpWebListResult[1])
        }
        divHTML += `<b>Web Results:</b><ol>
            ${webList.map(part => {
                return `<li>${part}</li>`
            }).join('')}</ol>`;


        let regExpGrammar = /<span style="color:#767676">([\s\S]*?)<\/span>/;
        let grammarText = `<span class="googleGrammar"><b>Grammar:</b> ${data.match(regExpGrammar)[1]}</span><br>`;

        
        $('#dictionaryBox').html(divHTML).prepend(grammarText);
    }
}


 class LearnMachine {

     constructor () {
         this.correctAnswers = []
     }

     setCorrectAnswers () {

     }

 }







$(document).ready(() => {

});

 let learningMachine = new LearnMachine();

AjaxRequests.getWordFromServer('run')
 .then(data => {
     console.log(Parse.yandex(data));
    Draw.yandexNew(Parse.yandex(data));

 });