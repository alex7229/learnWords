function convertTime(timeMs) {
    function pad (str, max) {
        str = str.toString();
        return str.length < max ? pad("0" + str, max) : str;
    }
    const date = new Date(timeMs);
    const day = pad(date.getDate(), 2);
    const month = pad(date.getMonth()+1, 2);
    const year = date.getFullYear();
    const hours = pad(date.getHours(), 2);
    const minutes = pad(date.getMinutes(), 2);
    return `${day}.${month}.${year} ${hours}:${minutes}`
}

class Ajax {
    static fetchCheckStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response
        } else {
            return new Promise ((resolve, reject) => {
                const error = new Error(response.status);
                error.response = response;
                error.response.text()
                    .then((text) => {
                        error.message = text;
                        reject(error)
                    } )
            })
        }
    }

    static getWordsList() {
        return new Promise ((resolve, reject) => {
            fetch(`../learnwords/wordsLists/sortedWordsList.json`)
                .then(Ajax.fetchCheckStatus)
                .then(response => {
                    resolve(response.json())
                }, err => {
                    reject(err)
                })
        })
    }

    static getSavedYandexTranslation(word) {
        return new Promise ((resolve,reject) => {
            fetch(`../learnwords/wordsLists/yandexTranslations/${word}.txt`)
                .then(Ajax.fetchCheckStatus)
                .then(response => {
                    resolve(response.json())
                }, err => {
                    reject(err)
                })
        })
    }

    static saveUserData(userData) {
        return new Promise ((resolve,reject) => {
            let data = new FormData();
            data.append("userData", JSON.stringify(userData));
            data.append("save", true);
            fetch(`../learnwords/api.php`, {
                method: 'POST',
                body: data
            })
                .then(Ajax.fetchCheckStatus)
                .then(response => {
                    resolve(response)
                }, err => {
                    reject(err)
                })
        })
    }

    static retrieveUserData() {
        return new Promise ((resolve,reject) => {
            let data = new FormData();
            data.append("retrieve", true);
            fetch(`../learnwords/api.php`, {
                method: 'POST',
                body: data
            })
                .then(Ajax.fetchCheckStatus)
                .then(response => {
                    resolve(response.text())
                }, err => {
                    reject(err)
                })
        })
    }
}

class YandexParseModel{
    constructor (data) {
        this.jsonData = data
    }

    getData () {
        if (this.jsonData.def.length === 0) return;
        return this.jsonData.def.map(description => {
            return {
                type: description.pos || ``,
                transcription: description.ts ? `[${description.ts}]` : ``,
                translations: description.tr
                    .map(translation => {
                        return {
                            examples: this.transformExamples(translation.ex),
                            synonyms: this.transformSynonyms(translation.syn),
                            synonymsEn: this.transformSynonyms(translation.mean),
                            translationType: translation.pos,
                            translation: translation.text
                        };
                    })

            };
        })
    }

    transformExamples (examples = []) {
        return examples.map(example => {
            return `${example.text} - ${example.tr[0].text}`
        })
    }

    transformSynonyms (synonyms = []) {
        return synonyms.map(synonym => {
            return synonym.text
        })
    }

    findCorrectAnswers (parsedWords) {
        return parsedWords.map(word => {
            return word.translations.map(translation => {
                return translation.translation.toLowerCase()
            })
        }).reduce((previousWords, currentWord) => {
            return previousWords.concat(currentWord)
        }, [])
    }
}

class LearnMachineModel {
    constructor () {
        this.correctAnswers = [];
        this.allWords = [];
    }

    setUserData (data) {
        this.userData = data
    }

    downloadWords () {
        return new Promise( (resolve, reject) => {
            Ajax.getWordsList()
                .then(data => {
                    this.allWords = data;
                    resolve(true)
                }, err => {
                    reject(err)
                })
        })
    }

    generateGoogleLink() {
        const word = this.getCurrentWordString();
        return `https://translate.google.ru/?ion=1&espv=2&bav=on.2,or.&bvm=bv.139250283,d.bGg&biw=1920&bih=935&dpr=1&um=1&ie=UTF-8&hl=ru&client=tw-ob#en/ru/${word}`;
    }

    generateUrbanLink() {
        const word = this.getCurrentWordString();
        return `http://www.urbandictionary.com/define.php?term=${word}`
    }

    getLearningPoolFull() {
        return this.userData.learningPool.map((wordData) => {
            wordData.wordName = this.allWords[wordData.number].word;
            return wordData;
        })
    }

    getLearningPoolFiltered(wordPart) {
        const regex = new RegExp(wordPart);
        return this.userData.learningPool.map((wordData) => {
            wordData.wordName = this.allWords[wordData.number].word;
            return wordData;
        }).filter((wordData) => {
            return wordData.wordName.match(regex) !== null
        })
    }

    deleteWordFromPool(word) {
        let deleteWordNumber;
        this.userData.learningPool = this.userData.learningPool.filter((wordData) => {
            if (wordData.wordName !== word) {
                return true;
            }
            deleteWordNumber = wordData.number;
            return false;
        });
        this.userData.knownWords.push(deleteWordNumber)
    }

    checkWordsList () {
        if (this.allWords.length>1) {
            return true
        }
    }

    getCurrentNumber () {
        return this.userData.currentWord;
    }

    getCurrentWordString() {
        return this.allWords[this.getCurrentNumber()].word;
    }

    setNextWordNumber () {
        let poolWord = this.findFirstReadyWordFromPool();
        if (poolWord) {
            this.userData.currentWord = poolWord.number;
            return
        }
        let nextWordNumber;
        if (this.userData.options.order === 'random') {
            let unusedWords = this.userData.unusedWords;
            if (unusedWords.length === 0) {
                nextWordNumber = undefined
            } else {
                const index = Math.floor(Math.random() * unusedWords.length);
                nextWordNumber =  unusedWords[index];
                unusedWords.splice(index, 1)
            }
        } else {
            const possibleNextNumber = this.userData.currentWord + 1;
            if (possibleNextNumber>this.userData.options.lastWord) {
                nextWordNumber = undefined
            } else {
                nextWordNumber = possibleNextNumber
            }
        }
        this.userData.currentWord = nextWordNumber;
    }

    findWordInKnownList (number) {
        return this.userData.knownWords.find((wordNumber) => {
            if (wordNumber === number) return number
        });
    }

    findWordInPool (wordNumber) {
        return this.userData.learningPool.find((wordData) => {
            if (wordData.number === wordNumber) return wordData
        })
    }

    getPureAnswerList () {
        return this.correctAnswers;
    }

    checkAnswer (answer) {
        const number = this.userData.currentWord;
        if (this.correctAnswers.includes(answer)) {
            if (this.findWordInPool(this.userData.currentWord)) {
                this.updateWordInPool(number, true);
            } else {
                this.userData.knownWords.push(number);
            }
            this.setNextWordNumber();
            return true
        } else {
            return false
        }
    }

    skipWord() {
        this.userData.knownWords.push(this.userData.currentWord);
        this.setNextWordNumber();
    }

    addWordToPool () {
        const sixHours = 6*60*60*1000;
        const currentTime = new Date().getTime();
        const word = {
            number: this.userData.currentWord,
            successGuesses: 0,
            lastGuessTime: currentTime,
            nextGuessTime: currentTime + sixHours
        };
        this.userData.learningPool.push(word)
    }

    calculateNumberOfWordsInPool (minGuesses, maxGuesses = Number.MAX_SAFE_INTEGER) {
        const pool = this.userData.learningPool;
        return pool.filter(wordData => {
            if ((wordData.successGuesses<=maxGuesses) && (wordData.successGuesses>=minGuesses)) {
                return wordData
            }
        }).length
    }

    calculateReadyWordsInPool () {
        const pool = this.userData.learningPool;
        const time = new Date().getTime();
        return pool.filter(wordData => {
            if (wordData.nextGuessTime<time) {
                return wordData
            }
        }).length
    }

    getKnownWordsCount() {
        return this.userData.knownWords.length
    }

    updateWordInPool (wordNumber, successGuess) {
        let word = this.findWordInPool(wordNumber);
        const currentTime = new Date().getTime();
        word.lastGuessTime = currentTime;
        if (successGuess) {
            word.successGuesses++;
            const currentAttempt = word.successGuesses;
            let delay;
            if (currentAttempt<=3) {
                delay = 6*60*60*1000;
            } else if (currentAttempt>=4 && currentAttempt<=6) {
                delay = 24*60*60*1000
            } else if (currentAttempt === 7 || currentAttempt === 8) {
                delay = 3*24*60*60*1000
            } else if (currentAttempt === 9) {
                delay = 10*24*60*60*1000
            } else if (currentAttempt >= 10) {
                delay = 30*24*60*60*1000
            }
            word.nextGuessTime = currentTime + delay
        } else {
            word.successGuesses = 0;
            const delay = 6*60*60*1000;
            word.nextGuessTime = currentTime+delay
        }
    }

    findFirstReadyWordFromPool () {
        const time = new Date().getTime();
        let readyWords = this.userData.learningPool.filter(wordData => {
            if (wordData.nextGuessTime<time) {
                return wordData.number
            }
        });
        if (readyWords.length>0) {
            return readyWords[0]
        }
    }

    getQuestion () {
        return new Promise ((resolve, reject) => {
            const wordNumber = this.userData.currentWord;
            const word = this.allWords[wordNumber].word;
            this.getAnswer(word)
                .then(() => {
                    resolve(word)
                }, err => {
                    reject (err)
                })
        })

    }

    getAnswer (word) {
        return new Promise ((resolve, reject) => {
            Ajax.getSavedYandexTranslation(word)
                .then(data => {
                    const parse = new YandexParseModel(data);
                    this.correctAnswers = parse.findCorrectAnswers(parse.getData(data));
                    resolve(this.correctAnswers)
                }, err => {
                    reject(err)
                })
        })

    }

    getUserData() {
        return this.userData;
    }

    setNextWordNumberStraight () {
        this.userData.currentWord = document.getElementById('straightNumber').value;
    }

    setUnusedWords() {
        this.userData.unusedWords = [];
        for (let i=this.userData.options.firstWord; i<=this.userData.options.lastWord; i++) {
            if (!(this.findWordInKnownList(i)) && (!this.findWordInPool(i))) {
                this.userData.unusedWords.push(i)
            }
        }
    }

    addCustomWord(word) {
        //find word in all words
        let wordNumber;
        const wordData = this.allWords.filter((wordObj, index) => {
            if (wordObj.word === word) {
                wordNumber = index;
                return true;
            }
            return false;
        });
        if (wordData.length !== 1) return;
        const number = wordData[0].number;
        const learningPool = this.userData.learningPool.filter((learnedWord) => {
            return learnedWord.number == wordNumber
        });
        //already learned
        if (learningPool.length > 0) return;
        const previousNumber = this.userData.currentWord;
        this.userData.currentWord = wordNumber;
        this.addWordToPool();
        this.userData.currentWord = previousNumber;
    }

    fillDataTest() {
        for (let i=1; i<19950; i++) {
            this.userData.knownWords.push(i)
        }
        for (let i=20000; i<24450; i++) {
            const sixHours = 6*60*60*1000;
            const currentTime = new Date().getTime();
            const word = {
                number: i,
                successGuesses: 0,
                lastGuessTime: currentTime,
                nextGuessTime: currentTime + sixHours
            };
            this.userData.learningPool.push(word)
        }
    }
}

class StorageModel{
    static saveOptions(firstWord, lastWord, order) {
        let data = StorageModel.getData();
        if (!data) {
            data = {
                options: {
                    firstWord,
                    lastWord,
                    order
                },
                learningPool: [],
                knownWords: [],
                currentWord: 1
            };
            if (order === 'random') {
                data.currentWord = Math.ceil(Math.random() * data.options.lastWord)
            }
            localStorage.setItem('learnWords', JSON.stringify(data))
        } else {
            throw new Error ('Data already set')
        }
    }
    static updateUserData(userData) {
        localStorage.setItem('learnWords', JSON.stringify(userData))
    }
    static getData () {
        const jsonData = localStorage.getItem('learnWords');
        if (jsonData) {
            try {
                var data = JSON.parse(jsonData);
            } catch (err) {
                throw new Error('Not correct JSON in local storage')
            }
            return data
        }
    }

    static saveSession (userData) {
        const jsonData = JSON.stringify(userData);
        localStorage.setItem('learnWords', jsonData)
    }
}

class LearnMachineView{
    static toggleBlock (id, typeOfBLock, state) {
        let elem = document.getElementById(id);
        if (state) {
            elem.style.display = typeOfBLock
        } else {
            elem.style.display = 'none'
        }
    }

    static showPureAnswers(answersArray) {
        let box = document.getElementById('pureAnswersBox');
        const list = answersArray.join(', ');
        box.innerHTML = `${list}<hr>`
    }

    static showQuestion (word) {
        document.getElementById('questionedWord').textContent = word
    }

    static showWordStatistics (data) {
        let elem = document.getElementById('statistics');
        if (typeof data === 'string') {
            elem.innerHTML = data
        } else {
            const successGuesses = data.successGuesses;
            const lastGuessTime = new Date(data.lastGuessTime).toLocaleString();
            elem.innerHTML = `Difficulty is ${(data.number/10000*100).toFixed(2)}%.<br>That word is from your pool. U have guessed it right ${successGuesses} times. Last check was ${lastGuessTime}`;
        }
    }
    static showPoolStatistics (htmlData) {
        let elem = document.getElementById('poolData');
        elem.innerHTML = htmlData
    }

    static checkPoolStatisticsDisplayState() {
        let elem = document.getElementById('poolData');
        if (elem.innerHTML.length>0) {
            return true
        }
    }

    static hidePoolData () {
        document.getElementById('poolData').innerHTML = ``
    }

    static clearInput() {
        document.getElementById('answerWord').value = ''
    }

    static clearTranslations () {
        let translations = document.querySelectorAll('#pureAnswersBox, #translationBox, #dictionaryBox');
        for (let elem of translations) {
            elem.innerHTML = ``
        }
    }

    static showNotification (text) {
        let elem = document.getElementById('learningNotification');
        elem.innerText = text;
        elem.style.display = 'block'
    }

    static hideNotification () {
        document.getElementById('learningNotification').style.display = 'none'
    }

    static toggleResetButtons (state) {
        let buttons = document.querySelectorAll('#fullReset, #updateOptions');
        for (let button of buttons) {
            if (state) {
                button.style.display = 'inline-block'
            } else {
                buttons.style.display = 'none'
            }
        }
    }

    static showPreferencesData(minRange, maxRange, order) {
        document.getElementById('minRange').value = minRange;
        document.getElementById('maxRange').value = maxRange;
        document.getElementById('order').value = order
    }

    static showFullLearningPool(pool) {
        let parent = document.querySelector('#fullLearningPool div ol');
        parent.innerHTML = pool.map((wordData) => {
            let lastCheck = convertTime(wordData.lastGuessTime);
            let nextCheck = convertTime(wordData.nextGuessTime);
            let difficulty = (wordData.number/100) + '%';
            let word = wordData.wordName;
            return `<li data-wordName="${word}">
<ul>
<li>Word is "${word}"</li>
<li>Difficulty is ${difficulty}</li>
<li>Last check: ${lastCheck}</li>
<li>Next check: ${nextCheck}</li>
<li><button onclick="controller.deleteWordFromPool('${word}')">Delete word</button><br><br></li>
</ul>
</li>`
        }).join('');
    }
}

class TranslationsView{
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
}

var learningMachine = new LearnMachineModel();

const controller = {

    getYandexTranslation() {
        const word = document.getElementById('questionedWord').innerText;
        if ((!word)) return;
        Ajax.getSavedYandexTranslation(word)
            .then(data => {
                const parse = new YandexParseModel(data);
                TranslationsView.yandex(parse.getData());
            }, err => {
               console.log('no yandex translation for word')
            })
    },

    showPureAnswers () {
        const answers = learningMachine.getPureAnswerList();
        LearnMachineView.showPureAnswers(answers);
    },

    showAllTranslations () {
        this.showPureAnswers();
        this.getYandexTranslation();
    },

    startLearning () {
        const lastWord = parseInt(document.getElementById('maxRange').value);
        const firstWord = parseInt(document.getElementById('minRange').value);
        const orderValue = document.getElementById('order').value;
        if (firstWord < 0 || lastWord > 27380) {
            LearnMachineView.showNotification('range of words is not correct');
            return
        }
        if (!((orderValue === 'random') || (orderValue === 'sequential'))) {
            LearnMachineView.showNotification('Order is not random nor sequential');
            return
        }
        StorageModel.saveOptions(firstWord, lastWord, orderValue);
        learningMachine.setUserData(StorageModel.getData());
        learningMachine.setUnusedWords();
        learningMachine.setNextWordNumber();
        StorageModel.saveSession(learningMachine.userData);
        learningMachine.downloadWords()
            .then(() => {
                controller.getQuestion()
            });
        this.showUserPool();
        LearnMachineView.toggleBlock('words', 'block', true);
        LearnMachineView.toggleBlock('preferences', 'block', false);
        LearnMachineView.toggleBlock('learningNotification');
    },

    getQuestion () {
        if (learningMachine.getCurrentNumber()) {
            learningMachine.getQuestion()
                .then((questionWord) => {
                    const number = learningMachine.getCurrentNumber();
                    const wordInPool = learningMachine.findWordInPool(number);
                    if (wordInPool) {
                        LearnMachineView.showWordStatistics(wordInPool)
                    } else {
                        LearnMachineView.showWordStatistics(`Difficulty is ${(number/10000*100).toFixed(2)}%.<br>U see that word for first time. `)
                    }
                    LearnMachineView.showQuestion(questionWord);
                })

        } else {
            LearnMachineView.toggleBlock('fullReset', 'inline-block', true);
            LearnMachineView.toggleBlock('updateOptions', 'inline-block', true);
            LearnMachineView.toggleBlock('words');
            LearnMachineView.toggleBlock('preferences', 'block', true);
            LearnMachineView.toggleBlock('startLearning');
            const userData = learningMachine.getUserData();
            LearnMachineView.showPreferencesData(userData.options.firstWord, userData.options.lastWord, userData.options.order);
            LearnMachineView.showNotification('There are no words left. Start another learning process or update range of words (order would be the same).');
        }

    },

    startLearnWord () {
        const number = learningMachine.getCurrentNumber();
        if (learningMachine.findWordInPool(number)) {
            learningMachine.updateWordInPool(number, false)
        } else {
            learningMachine.addWordToPool();
        }
        learningMachine.setNextWordNumber();
        StorageModel.saveSession(learningMachine.getUserData());
        LearnMachineView.clearInput();
        LearnMachineView.clearTranslations();
        this.getQuestion();
        this.updatePoolStatistics();
    },
    
    tryToGuessWord() {
        const word = document.getElementById('answerWord').value;
        if (learningMachine.checkAnswer(word)) {
            StorageModel.saveSession(learningMachine.getUserData());
            LearnMachineView.clearInput();
            LearnMachineView.clearTranslations();
            this.getQuestion();
            this.updatePoolStatistics();
            LearnMachineView.showNotification('Answer is correct')
        } else {
            LearnMachineView.showNotification('Answer is incorrect')
        }
    },

    skipWord () {
        const currentNumber= learningMachine.getCurrentNumber();
        if (!learningMachine.findWordInPool(currentNumber)) {
            learningMachine.skipWord();
            StorageModel.saveSession(learningMachine.getUserData());
            LearnMachineView.clearInput();
            LearnMachineView.clearTranslations();
            this.getQuestion();
            this.updatePoolStatistics();
        } else {
            LearnMachineView.showNotification('U cannot skip word from your pool. Deal with it')
        }
    },

    fullReset() {
        localStorage.clear();
        LearnMachineView.toggleBlock('fullReset');
        LearnMachineView.toggleBlock('updateOptions');
        LearnMachineView.toggleBlock('learningNotification');
        LearnMachineView.toggleBlock('preferences');
        LearnMachineView.toggleBlock('startLearning', 'inline-block', true);
        this.startLearning();
    },

    updateUserOptions () {
        const oldUserData = learningMachine.getUserData();
        const newMinRange = parseInt(document.getElementById('minRange').value);
        const newMaxRange = parseInt(document.getElementById('maxRange').value);
        const oldMinRange = oldUserData.options.firstWord;
        const oldMaxRange = oldUserData.options.lastWord;
        if (newMinRange>oldMinRange) {
            LearnMachineView.showNotification(`Your first word should be equal or less than ${oldMinRange}`);
        } else if (newMaxRange<oldMaxRange) {
            LearnMachineView.showNotification(`Your last word should be equal or more than ${oldMaxRange}`);
        } else if (((newMinRange === oldMinRange) && (newMaxRange === oldMaxRange)) || (!newMinRange) || (!newMaxRange)) {
            LearnMachineView.showNotification(`You should declare new minimum and maximum ranges`);
        }  else if (newMinRange < 1) {
            LearnMachineView.showNotification(`First word number cannot be less than 1`);
        } else if (newMaxRange > 27380) {
            LearnMachineView.showNotification(`Last word number cannot exceed 27,380`);
        } else {
            let oldStorageData = StorageModel.getData();
            oldStorageData.options.firstWord  = newMinRange;
            oldStorageData.options.lastWord = newMaxRange;
            StorageModel.updateUserData(oldStorageData);
            LearnMachineView.toggleBlock('startLearning', 'inline-block', true);
            LearnMachineView.toggleBlock('preferences');
            LearnMachineView.toggleBlock('fullReset');
            LearnMachineView.toggleBlock('updateOptions');
            LearnMachineView.toggleBlock('words', 'block', true);
            learningMachine.setUserData(StorageModel.getData());
            learningMachine.setUnusedWords();
            learningMachine.setNextWordNumber();
            StorageModel.saveSession(learningMachine.getUserData());
            this.getQuestion();
        }

    },

    moveToGoogle() {
        let link = learningMachine.generateGoogleLink();
        window.open(link, '_blank')
    },

    moveToUrban() {
        let link = learningMachine.generateUrbanLink();
        window.open(link, '_blank')
    },

    showCustomWord() {
        LearnMachineView.toggleBlock('addCustomWord', 'block', true);
        document.getElementById('newWord').focus();
    },

    addCustomWord() {
        LearnMachineView.toggleBlock('addCustomWord');
        let input = document.getElementById('newWord');
        const word = input.value;
        input.value = '';
        learningMachine.addCustomWord(word);
    },

    hideCustomWord() {
        LearnMachineView.toggleBlock('addCustomWord')
    },

    showUserPool () {
        const readyWordsCount = learningMachine.calculateReadyWordsInPool();
        const newWordsCount = learningMachine.calculateNumberOfWordsInPool(0, 3);
        const mediumWordsCount = learningMachine.calculateNumberOfWordsInPool(4, 6);
        const oldWordsCount = learningMachine.calculateNumberOfWordsInPool(7, 8);
        const superOldWordsCount = learningMachine.calculateNumberOfWordsInPool(9, 9);
        const maxOldWordsCount = learningMachine.calculateNumberOfWordsInPool(10);
        const knownWordsCount = learningMachine.getKnownWordsCount();
        const data = `Ready words: ${readyWordsCount}.<br>
                        New words: ${newWordsCount}.<br>
                        Medium words: ${mediumWordsCount}.<br>
                        Old words: ${oldWordsCount}.<br>
                        Very old words: ${superOldWordsCount}.<br>
                        Ancient words: ${maxOldWordsCount}.<br>
                        All known words: ${knownWordsCount}`;
        LearnMachineView.showPoolStatistics(data);
    },

    showLearningPoolFull() {
        const pool = learningMachine.getLearningPoolFull();
        LearnMachineView.toggleBlock('fullLearningPool', 'block', true);
        LearnMachineView.showFullLearningPool(pool);

    },

    showLearningPoolFiltered() {
        const value = document.getElementById('poolWordFilter').value;
        const pool = learningMachine.getLearningPoolFiltered(value);
        LearnMachineView.showFullLearningPool(pool);
    },

    hideFullLearningPool() {
        LearnMachineView.toggleBlock('fullLearningPool');
    },

    deleteWordFromPool(word) {
        learningMachine.deleteWordFromPool(word);
        let elem = document.querySelector(`li[data-wordName="${word}"]`);
        elem.outerHTML = '';
    },

    updatePoolStatistics() {
      if (LearnMachineView.checkPoolStatisticsDisplayState()) {
          this.showUserPool()
      }
    },


    
    
    


    listenKeyboardButtons (keyEvent) {
        let elementId = keyEvent.srcElement.id;
        if (elementId === 'poolWordFilter') {
            this.showLearningPoolFiltered();
            return;
        }
        if (keyEvent.keyCode ==13) {
            switch (elementId) {
                case 'answerWord': {
                    this.tryToGuessWord();
                    break;
                }
                case 'newWord': {
                    this.addCustomWord();
                    break;
                }
                default: {
                    throw new Error('id is undefined')
                }
            }
        }
    },

    listenButtons () {
        document.getElementById("startLearnWord").onclick = this.startLearnWord.bind(this);
        document.getElementById("startLearning").onclick = this.startLearning.bind(this);
        document.getElementById('skipWord').onclick = this.skipWord.bind(this);
        document.getElementById('showTranslations').onclick = this.showAllTranslations.bind(this);
        document.getElementById('googleTranslation').onclick = this.moveToGoogle.bind(this);
        document.getElementById('urbanDictionary').onclick = this.moveToUrban.bind(this);
        document.getElementById('showCustomWordInput').onclick = this.showCustomWord.bind(this);
        document.getElementById('showFullLearningPool').onclick = this.showLearningPoolFull.bind(this);
        document.getElementById('addWord').onclick = this.addCustomWord.bind(this);
        document.getElementById('hideNewWordInput').onclick = this.hideCustomWord.bind(this);
        document.getElementById('hideFullLearningPool').onclick = this.hideFullLearningPool.bind(this);
        document.getElementById('insertNumber').onclick = learningMachine.setNextWordNumberStraight.bind(learningMachine);
        document.getElementById('answerWord').onkeydown = this.listenKeyboardButtons.bind(this);
        document.getElementById('newWord').onkeydown = this.listenKeyboardButtons.bind(this);
        document.getElementById('poolWordFilter').onkeyup = this.listenKeyboardButtons.bind(this);
        document.getElementById('fullReset').onclick = this.fullReset.bind(this);
        document.getElementById('updateOptions').onclick = this.updateUserOptions.bind(this);
        document.getElementById('calculateUnusedWords').onclick = learningMachine.setUnusedWords.bind(learningMachine);
    }
};
 





 
 window.onload = () => {
     
     controller.listenButtons();

     if (localStorage.getItem('learnWords')) {
         learningMachine.setUserData(StorageModel.getData());
         Ajax.saveUserData(learningMachine.userData)
             .then(() => {
                 console.log('data was successfully saved')
             }, (err) => {
                 console.log(`Something happened when trying to save: ${err.message}`)
             });
         learningMachine.downloadWords()
             .then(() => {
                 controller.getQuestion();
                 controller.showUserPool();
             })

     } else {
         //try ot get data from server
         Ajax.retrieveUserData()
             .then((response) => {
                 localStorage.setItem('learnWords', response);
                 learningMachine.setUserData(StorageModel.getData());
                 learningMachine.downloadWords()
                     .then(() => {
                         controller.getQuestion();
                         controller.showUserPool();
                     })
             }, (err) => {
                 LearnMachineView.toggleBlock('preferences', 'block', true);
                 LearnMachineView.toggleBlock('words');
             });
     }

     
 };

