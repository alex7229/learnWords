/*
 parsing from txt.rawData into JSON
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
 console.log(JSON.stringify(bigList));
 */

/*get sorted Data
$.ajax({
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
            console.log(JSON.stringify(mainWords))


        });

});
*/


//todo - get to work google.api for dictionary (via suspicious site) and yandex.api for translations


class Controller {

    static getTranslation () {
        let word = $('#word').val();
        let language = $('#translationLanguage').val();
        if ((!word) || (!language)) return;
        $.ajax({
            url: '/getTranslation',
            type: 'POST',
            data: {
                word,
                language
            }
        })
            .then(data => {
                Draw.yandexData(data)
            })
    }

    static getMeaning () {
        let word = $('#word').val();
        $.ajax({
            url: '/getMeaning',
            type: 'POST',
            data: {
                word
            }
        }).done(data => {
            console.log(data)
        });
    }

    getWords () {

    }

}

class Draw {
    static yandexData(data) {
        let response = JSON.parse(data);
        if (response.def.length === 0) return;
        let differentTypes = response.def; //adjective, noun else
        let pageHTML = ``;
        differentTypes.map(description => {
            let [type, transcription] = [description.pos || ``, description.ts ? `[${description.ts}]` : ``];
            pageHTML += `<br><span class="ital">${type}</span> ${transcription} `;
            let translations = description.tr;
            translations.map((translation, index) => {
                let examples = translation.ex;
                let synonyms = translation.syn;
                let meanings = translation.mean;
                let typeTranslated = translation.pos;
                let translatedText = translation.text;
                pageHTML+=`<br>${index+1}) ${translatedText}`;
                if (examples) {
                    pageHTML += '. <br><span class="tabbed">Examples:</span> ' +
                        examples.map(example => {
                        let exampleText = example.text;
                        let translationOfExample = example.tr[0].text;
                        return `${exampleText} - ${translationOfExample}; `;
                    }).join('').slice(0,-2)
                }
                if (synonyms) {
                    pageHTML += `. <br><span class="tabbed">Synonyms:</span> `+
                        synonyms.map(synonym => {
                            return `${synonym.text}; `
                    }).join('').slice(0,-2)
                }
                if (meanings) {
                    pageHTML += `. <br><span class = "tabbed">Synonyms (en):</span> `+
                        meanings.map(meaning => {
                            return `${meaning.text}; `
                        }).join('').slice(0,-2)
                }

            })
        });
        $('#translationBox').html(pageHTML)
    }
}








$(document).ready(() => {
    $('#word').val('cat');
    Controller.getTranslation();
});