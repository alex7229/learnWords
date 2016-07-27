'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

//todo - get to work google.api for dictionary (via suspicious site) - (get web translation, add noun/verb type), add sound (when u guessed right answer) from fallout4


var Controller = function () {
    function Controller() {
        _classCallCheck(this, Controller);
    }

    _createClass(Controller, [{
        key: 'getWords',
        value: function getWords() {}
    }], [{
        key: 'getTranslation',
        value: function getTranslation() {
            var word = $('#word').val();
            var language = 'ru';
            if (!word || !language) return;
            $.ajax({
                url: '/getTranslation',
                type: 'POST',
                data: {
                    word: word,
                    language: language
                }
            }).then(function (data) {
                Draw.yandexData(data);
            });
        }
    }, {
        key: 'getMeaning',
        value: function getMeaning() {
            var word = $('#word').val();
            $.ajax({
                url: '/getMeaning',
                type: 'POST',
                data: {
                    word: word
                }
            }).done(function (data) {
                Draw.googleData(data);
            });
        }
    }]);

    return Controller;
}();

var Draw = function () {
    function Draw() {
        _classCallCheck(this, Draw);
    }

    _createClass(Draw, null, [{
        key: 'yandexData',
        value: function yandexData(data) {
            var response = JSON.parse(data);
            if (response.def.length === 0) return;
            var differentTypes = response.def; //adjective, noun else
            var pageHTML = '';
            differentTypes.map(function (description) {
                var type = description.pos || '';
                var transcription = description.ts ? '[' + description.ts + ']' : '';

                pageHTML += '<br><span class="ital">' + type + '</span> ' + transcription + ' ';
                var translations = description.tr;
                translations.map(function (translation, index) {
                    var examples = translation.ex;
                    var synonyms = translation.syn;
                    var meanings = translation.mean;
                    var typeTranslated = translation.pos;
                    var translatedText = translation.text;
                    pageHTML += '<br>' + (index + 1) + ') ' + translatedText;
                    if (examples) {
                        pageHTML += '. <br><span class="tabbed">Examples:</span> ' + examples.map(function (example) {
                            var exampleText = example.text;
                            var translationOfExample = example.tr[0].text;
                            return exampleText + ' - ' + translationOfExample + '; ';
                        }).join('').slice(0, -2);
                    }
                    if (synonyms) {
                        pageHTML += '. <br><span class="tabbed">Synonyms:</span> ' + synonyms.map(function (synonym) {
                            return synonym.text + '; ';
                        }).join('').slice(0, -2);
                    }
                    if (meanings) {
                        pageHTML += '. <br><span class = "tabbed">Synonyms (en):</span> ' + meanings.map(function (meaning) {
                            return meaning.text + '; ';
                        }).join('').slice(0, -2);
                    }
                });
            });
            pageHTML += '<hr>';
            $('#translationBox').html(pageHTML);
        }
    }, {
        key: 'googleData',
        value: function googleData(data) {
            var pageHTML = '';
            var regExp = /<div class=std style="padding-left:40px">([\s\S]*?)(<div id="forEmbed">|<hr>)/g;
            var regExpResult = void 0;
            var definitionsChunks = [];
            while ((regExpResult = regExp.exec(data)) !== null) {
                definitionsChunks.push(regExpResult[1]);
            }
            definitionsChunks.map(function (chunk) {
                var orderedList = chunk.split(/<li style="list-style:decimal">/g);
                orderedList.shift();
                pageHTML += '<ol>\n                ' + orderedList.map(function (definition) {
                    return '<li>' + definition.slice(0, -10) + '</li>';
                }).join('') + '</ol><hr>';
            });

            var regExpWeb = /Web Definitions[\s\S]*<\/ol>/g;
            var webResultChunk = data.match(regExpWeb)[0];
            var webList = [];
            var regExpWebList = /<li style="list-style:decimal; margin-bottom:10px;">([\s\S]*?)<\/li>/g;
            var regExpWebListResult = void 0;
            while ((regExpWebListResult = regExpWebList.exec(webResultChunk)) !== null) {
                webList.push(regExpWebListResult[1]);
            }
            pageHTML += '<b>Web Results:</b><ol>\n            ' + webList.map(function (part) {
                return '<li>' + part + '</li>';
            }).join('') + '</ol>';

            $('#dictionaryBox').html(pageHTML);
        }
    }]);

    return Draw;
}();

$(document).ready(function () {
    $('#word').val('match');
    //Controller.getTranslation();
});

//# sourceMappingURL=main-compiled.js.map