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

//todo -  add sound (when u guessed right answer) from fallout4, add authentication (to save user progress)


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
                Draw.yandex(YandexParse.getData(data));
            }, function (err) {
                if (err.status === 404) {
                    AjaxRequests.yandexApi(word).then(function (data) {
                        Draw.yandex(YandexParse.getData(data));
                    });
                }
            });
        }
    }, {
        key: 'getMeaning',
        value: function getMeaning() {
            var word = $('#word').val();
            if (!word) return;
            AjaxRequests.googleApi(word).then(function (data) {
                Draw.google(GoogleParse.getData(data));
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
    }, {
        key: 'getWordList',
        value: function getWordList() {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: 'http://tup1tsa.bounceme.net/learnWords/wordsLists/sorted_34k.txt',
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

var YandexParse = function () {
    function YandexParse() {
        _classCallCheck(this, YandexParse);
    }

    _createClass(YandexParse, null, [{
        key: 'getData',
        value: function getData(rawData) {
            var data = JSON.parse(rawData);
            if (data.def.length === 0) return;
            return data.def.map(function (description) {
                return {
                    type: description.pos || '',
                    transcription: description.ts ? '[' + description.ts + ']' : '',
                    translations: description.tr.map(function (translation) {
                        return {
                            examples: YandexParse.transformExamples(translation.ex),
                            synonyms: YandexParse.transformSynonyms(translation.syn),
                            synonymsEn: YandexParse.transformSynonyms(translation.mean),
                            translationType: translation.pos,
                            translation: translation.text
                        };
                    })

                };
            });
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
    }, {
        key: 'findCorrectAnswers',
        value: function findCorrectAnswers(parsedWords) {
            return parsedWords.map(function (word) {
                return word.translations.map(function (translation) {
                    return translation.translation.toLowerCase();
                });
            }).reduce(function (previousWords, currentWord) {
                return previousWords.concat(currentWord);
            }, []);
        }
    }]);

    return YandexParse;
}();

var GoogleParse = function () {
    function GoogleParse() {
        _classCallCheck(this, GoogleParse);
    }

    _createClass(GoogleParse, null, [{
        key: 'getData',
        value: function getData(rawData) {
            return {
                definitionLists: GoogleParse.findDefinitionLists(GoogleParse.findDefinitionChunks(rawData)),
                webDefinitionLists: GoogleParse.findWebDefinitionLists(GoogleParse.findWebDefinitionChunk(rawData)),
                grammar: GoogleParse.findGrammar(rawData)
            };
        }
    }, {
        key: 'findDefinitionChunks',
        value: function findDefinitionChunks(rawData) {
            var regExp = /<b>(.*)\n[\s\S]*?<\/[\s\S]*?<div class=std style="padding-left:40px">([\s\S]*?)(<div id="forEmbed">|<hr>)/g;
            var regExpResult = void 0;
            var definitionsChunks = [];
            while ((regExpResult = regExp.exec(rawData)) !== null) {
                definitionsChunks.push({
                    typeOfWord: regExpResult[1],
                    body: regExpResult[2]
                });
            }
            return definitionsChunks;
        }
    }, {
        key: 'findDefinitionLists',
        value: function findDefinitionLists(chunks) {
            return chunks.map(function (chunk) {
                var list = chunk.body.split(/<li style="list-style:decimal">/g).slice(1).map(function (listValue) {
                    return GoogleParse.deleteUnnecessaryRow(listValue);
                });
                return {
                    typeOfWord: chunk.typeOfWord,
                    list: list
                };
            });
        }
    }, {
        key: 'deleteUnnecessaryRow',
        value: function deleteUnnecessaryRow(listValue) {
            var regExp = /color:#767676/;
            if (listValue.match(regExp)) {
                return listValue;
            } else {
                return listValue.replace(/<div[\s\S]*<\/div>/, '');
            }
        }
    }, {
        key: 'findWebDefinitionChunk',
        value: function findWebDefinitionChunk(rawData) {
            var regExp = /Web Definitions[\s\S]*<\/ol>/g;
            return rawData.match(regExp)[0];
        }
    }, {
        key: 'findWebDefinitionLists',
        value: function findWebDefinitionLists(chunk) {
            var webList = [];
            var regExp = /<li style="list-style:decimal; margin-bottom:10px;">([\s\S]*?)<\/li>/g;
            var regExpResult = void 0;
            while ((regExpResult = regExp.exec(chunk)) !== null) {
                webList.push(regExpResult[1]);
            }
            return webList;
        }
    }, {
        key: 'findGrammar',
        value: function findGrammar(rawData) {
            var regExp = /<span style="color:#767676">([\s\S]*?)<\/span>/;
            return rawData.match(regExp)[1].slice(0, -2);
        }
    }]);

    return GoogleParse;
}();

var Draw = function () {
    function Draw() {
        _classCallCheck(this, Draw);
    }

    _createClass(Draw, null, [{
        key: 'yandex',
        value: function yandex(words) {
            var divHTML = words.map(function (word) {
                return '<br><span class="ital"><b>' + word.type + '</b></span> ' + word.transcription + ' ' + word.translations.map(function (translation, index) {
                    var innerHTML = '<br>' + (index + 1) + ') ' + translation.translation;
                    if (translation.examples.length !== 0) {
                        innerHTML += '. <br><span class="tabbed">Examples:</span> ' + translation.examples.join('; ');
                    }
                    if (translation.synonyms.length !== 0) {
                        innerHTML += '. <br><span class="tabbed">Synonyms:</span> ' + translation.synonyms.join('; ');
                    }
                    if (translation.synonymsEn.length !== 0) {
                        innerHTML += '. <br><span class="tabbed">Synonyms (en):</span> ' + translation.synonymsEn.join('; ');
                    }
                    return innerHTML;
                }).join('');
            }) + '<hr>';
            $('#translationBox').html(divHTML);
        }
    }, {
        key: 'google',
        value: function google(data) {
            var grammar = '<span class="googleGrammar"><b>Grammar:</b> ' + data.grammar + '</span><br>';
            var definitions = data.definitionLists.map(function (chunk) {
                return '<b>' + chunk.typeOfWord + '</b><br><ol>\n                ' + chunk.list.map(function (definition) {
                    return '<li>' + definition + '</li>';
                }).join('') + '</ol><hr>';
            });
            var webDefinition = '<b>Web Results:</b><ol>\n            ' + data.webDefinitionLists.map(function (row) {
                return '<li>' + row + '</li>';
            }).join('') + '</ol>';
            $('#dictionaryBox').html(grammar + definitions + webDefinition);
        }
    }]);

    return Draw;
}();

var LearnMachine = function () {
    function LearnMachine() {
        _classCallCheck(this, LearnMachine);

        this.correctAnswers = [];
        this.allWords = [];
    }

    _createClass(LearnMachine, [{
        key: 'getAllWords',
        value: function getAllWords() {
            var _this = this;

            AjaxRequests.getWordList().then(function (data) {
                _this.allWords = JSON.parse(data);
            }, function (err) {
                throw err;
            });
        }
    }, {
        key: 'checkAnswer',
        value: function checkAnswer() {
            var userAnswer = $('#answerWord').val();
            if (this.correctAnswers.includes(userAnswer)) {
                console.log('answer is correct');
            } else {
                console.log('answer is incorrect');
            }
        }
    }, {
        key: 'sendQuestion',
        value: function sendQuestion() {
            var wordNumber = Math.ceil(Math.random() * 1000);
            var word = this.allWords[wordNumber].word;
            $('#questionedWord').text(word);
            this.getAnswer(word);
        }
    }, {
        key: 'getAnswer',
        value: function getAnswer(word) {
            var _this2 = this;

            AjaxRequests.getWordFromServer(word).then(function (data) {
                _this2.correctAnswers = YandexParse.findCorrectAnswers(YandexParse.getData(data));
            }, function (err) {
                if (err.status === 404) {
                    AjaxRequests.yandexApi(word).then(function (data) {
                        _this2.correctAnswers = YandexParse.findCorrectAnswers(YandexParse.getData(data));
                    });
                }
            });
        }
    }]);

    return LearnMachine;
}();

/*AjaxRequests.googleApi('cat')
    .then(data => {
        Draw.google(GoogleParse.getData(data))
    });*/

var learningMachine = new LearnMachine();
learningMachine.getAllWords();

$(document).ready(function () {
    setTimeout(function () {
        learningMachine.sendQuestion();
    }, 2500);
});

//# sourceMappingURL=main-compiled.js.map