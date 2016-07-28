'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
            if (!word) return;
            AjaxRequests.getWordFromServer(word).then(function (data) {
                var parsedData = Parse.yandex(data);
                Draw.yandexData(parsedData);
            }, function (err) {
                if (err.status === 404) {
                    AjaxRequests.yandexApi(word).then(function (data) {
                        var parsedData = Parse.yandex(data);
                        Draw.yandexData(parsedData);
                    });
                }
            });
        }
    }, {
        key: 'getMeaning',
        value: function getMeaning() {
            var word = $('#word').val();
            AjaxRequests.googleApi(word).then(function (data) {
                Draw.googleData(data);
            });
        }
    }]);

    return Controller;
}();

var AjaxRequests = function () {
    function AjaxRequests() {
        _classCallCheck(this, AjaxRequests);
    }

    _createClass(AjaxRequests, null, [{
        key: 'yandexApi',
        value: function yandexApi(word) {
            return new Promise(function (resolve) {
                $.ajax({
                    url: '/getTranslation',
                    type: 'POST',
                    data: {
                        word: word
                    }
                }).done(function (data) {
                    resolve(data);
                });
            });
        }
    }, {
        key: 'googleApi',
        value: function googleApi(word) {
            return new Promise(function (resolve) {
                $.ajax({
                    url: '/getMeaning',
                    type: 'POST',
                    data: {
                        word: word
                    }
                }).done(function (data) {
                    resolve(data);
                });
            });
        }
    }, {
        key: 'getWordFromServer',
        value: function getWordFromServer(word) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: 'http://tup1tsa.bounceme.net/learnWords/wordsLists/yandexTranslations/' + word + '.txt',
                    type: 'GET'
                }).done(function (data) {
                    resolve(data);
                }).catch(function (err) {
                    reject(err);
                });
            });
        }
    }]);

    return AjaxRequests;
}();

var Parse = function () {
    function Parse() {
        _classCallCheck(this, Parse);
    }

    _createClass(Parse, null, [{
        key: 'yandex',
        value: function yandex(rawData) {
            var data = JSON.parse(rawData);
            if (data.def.length === 0) return;
            var wordFullData = {
                chunks: data.def, //adjective, noun, etc;
                correctAnswers: []
            };
            wordFullData.chunks = wordFullData.chunks.map(function (description) {
                return {
                    type: description.pos || '',
                    transcription: description.ts ? '[' + description.ts + ']' : '',
                    translations: description.tr.map(function (translation) {
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
            return wordFullData;
        }
    }, {
        key: 'transformExamples',
        value: function transformExamples() {
            var examples = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            return examples.map(function (example) {
                return example.text + ' - ' + example.tr[0].text;
            });
        }
    }, {
        key: 'transformSynonyms',
        value: function transformSynonyms() {
            var synonyms = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            return synonyms.map(function (synonym) {
                return synonym.text;
            });
        }
    }]);

    return Parse;
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
            var divHTML = '';
            differentTypes.map(function (description) {
                var type = description.pos || '';
                var transcription = description.ts ? '[' + description.ts + ']' : '';

                divHTML += '<br><span class="ital"><b>' + type + '</b></span> ' + transcription + ' ';
                var translations = description.tr;
                translations.map(function (translation, index) {
                    var examples = translation.ex;
                    var synonyms = translation.syn;
                    var meanings = translation.mean;
                    var typeTranslated = translation.pos;
                    var translatedText = translation.text;
                    divHTML += '<br>' + (index + 1) + ') ' + translatedText;
                    if (examples) {
                        divHTML += '. <br><span class="tabbed">Examples:</span> ' + examples.map(function (example) {
                            var exampleText = example.text;
                            var translationOfExample = example.tr[0].text;
                            return exampleText + ' - ' + translationOfExample + '; ';
                        }).join('').slice(0, -2);
                    }
                    if (synonyms) {
                        divHTML += '. <br><span class="tabbed">Synonyms:</span> ' + synonyms.map(function (synonym) {
                            return synonym.text + '; ';
                        }).join('').slice(0, -2);
                    }
                    if (meanings) {
                        divHTML += '. <br><span class = "tabbed">Synonyms (en):</span> ' + meanings.map(function (meaning) {
                            return meaning.text + '; ';
                        }).join('').slice(0, -2);
                    }
                });
            });
            divHTML += '<hr>';
            $('#translationBox').html(divHTML);
        }
    }, {
        key: 'yandexNew',
        value: function yandexNew(data) {
            var words = data.chunks;
            var divHTML = '';
            words.map(function (word) {
                divHTML += '<br><span class="ital"><b>' + word.type + '</b></span> ' + word.transcription + ' ';
                word.translations.map(function (translation, index) {
                    divHTML += '<br>' + (index + 1) + ') ' + translation.translation;
                    if (translation.examples.length !== 0) {
                        divHTML += '. <br><span class="tabbed">Examples:</span> ' + translation.examples.join('; ');
                    }
                    if (translation.synonyms.length !== 0) {
                        divHTML += '. <br><span class="tabbed">Synonyms:</span> ' + translation.synonyms.join('; ');
                    }
                    if (translation.synonymsEn.length !== 0) {
                        divHTML += '. <br><span class="tabbed">Synonyms (en):</span> ' + translation.synonymsEn.join('; ');
                    }
                });
            });
            divHTML += '<hr>';
            $('#translationBox').html(divHTML);
        }
    }, {
        key: 'googleData',
        value: function googleData(data) {
            var divHTML = '';
            var regExpChunk = /<b>(.*)\n[\s\S]*?<\/[\s\S]*?<div class=std style="padding-left:40px">([\s\S]*?)(<div id="forEmbed">|<hr>)/g;
            var regExpResultChunk = void 0;
            var definitionsChunks = [];
            while ((regExpResultChunk = regExpChunk.exec(data)) !== null) {
                definitionsChunks.push({
                    typeOfWord: regExpResultChunk[1],
                    body: regExpResultChunk[2]
                });
            }
            definitionsChunks.map(function (chunk) {
                var orderedList = chunk.body.split(/<li style="list-style:decimal">/g);
                orderedList.shift();
                divHTML += '<b>' + chunk.typeOfWord + '</b><br><ol>\n                ' + orderedList.map(function (definition) {
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
            divHTML += '<b>Web Results:</b><ol>\n            ' + webList.map(function (part) {
                return '<li>' + part + '</li>';
            }).join('') + '</ol>';

            var regExpGrammar = /<span style="color:#767676">([\s\S]*?)<\/span>/;
            var grammarText = '<span class="googleGrammar"><b>Grammar:</b> ' + data.match(regExpGrammar)[1] + '</span><br>';

            $('#dictionaryBox').html(divHTML).prepend(grammarText);
        }
    }]);

    return Draw;
}();

var LearnMachine = function () {
    function LearnMachine() {
        _classCallCheck(this, LearnMachine);

        this.correctAnswers = [];
    }

    _createClass(LearnMachine, [{
        key: 'setCorrectAnswers',
        value: function setCorrectAnswers() {}
    }]);

    return LearnMachine;
}();

$(document).ready(function () {});

var learningMachine = new LearnMachine();

AjaxRequests.getWordFromServer('run').then(function (data) {
    console.log(Parse.yandex(data));
    Draw.yandexNew(Parse.yandex(data));
});

//# sourceMappingURL=main-compiled.js.map