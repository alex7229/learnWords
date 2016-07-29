
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
                Draw.yandex(YandexParse.getData(data))
            }, err => {
                if (err.status === 404) {
                    AjaxRequests.yandexApi(word)
                        .then(data => {
                            Draw.yandex(YandexParse.getData(data))
                        })
                }
            })
    }

    static getMeaning() {
        let word = $('#word').val();
        AjaxRequests.googleApi(word)
            .then(data => {
                Draw.google(GoogleParse.getData(data))
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

 class YandexParse {

    static getData (rawData) {
        let data = JSON.parse(rawData);
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
                return translation.translation
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
             return {
                 typeOfWord: chunk.typeOfWord,
                 list: chunk.body.split(/<li style="list-style:decimal">/g).slice(1)
             }
         })
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


 class Draw {

     static yandex (words) {
         let divHTML = words.map(word => {
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
         $('#translationBox').html(divHTML)
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
         console.log(grammar);
         console.log(definitions);
         console.log(webDefinition);
         $('#dictionaryBox').html(grammar+definitions+webDefinition)
     }

}


 class LearnMachine {

     constructor () {
         this.correctAnswers = []
     }

     setCorrectAnswers (words) {
        this.correctAnswers = words
     }

     checkAnswer (word) {
         if (this.correctAnswers.includes(word)) {
             return true
         }
     }

 }







$(document).ready(() => {

});

 /*AjaxRequests.googleApi('cat')
     .then(data => {
         Draw.google(GoogleParse.getData(data))
     });*/
 let learningMachine = new LearnMachine();

