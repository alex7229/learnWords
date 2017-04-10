/**
 * Created by tup1tsa on 12.08.2016.
 */
export default {
    toggleBlock (id, typeOfBLock, state) {
        let elem = document.getElementById(id);
        if (state) {
            elem.style.display = typeOfBLock
        } else {
            elem.style.display = 'none'
        }
    },

    showPureAnswers(wordNumber, answers, blockSelector = '#pureAnswersBox', controller) {
        //todo: divide on several methods - too much stuff for one method
        //todo: bind enter to add new translation insted of manually clicking the tick (reload translation after adding new answer)
        //for now only for current word
        //answer example {"answer":"торчок","isImportant":false,"type":"custom"}
        //cannot delete new added words, which are important
        let box = $(blockSelector);
        const list = answers.map((answerObj) => {
            return `<div class="word">
                        <div class="buttonsContainer">
                            <div data-translation="${answerObj['answer']}" class="clickable icon addImportance ${answerObj.isImportant === true ? 'invisible' : 'visible'}"></div>
                            <div data-translation="${answerObj['answer']}" class="clickable icon removeImportance ${answerObj.isImportant === true ? 'visible' : 'invisible'}"></div>
                            <div data-translation="${answerObj['answer']}" class="clickable icon removeCustomAnswer ${answerObj.type === 'custom' ? 'visible' : 'invisible'}"></div>
                        </div>
                        <span class="${answerObj['isImportant'] === true ? 'importantTranslation': ''}" data-translation="${answerObj['answer']}">${answerObj['answer']}</span>
                    </div>
                    <br>`;
        }).join('');
        box.html(`<ul>${list}</ul> 
                    <div class="clear"></div>
                    <div id="expandedTranslation">
                        <input placeholder="custom translation" id="newTranslation" class="left">
                        <div class="clickable icon addCustomTranslation"></div>
                    </div>
                    <div class="clear"></div>
                    <hr>`);
        box.find('.icon').each((index, element) => {
            let elem = $(element);
            let translation = elem.attr('data-translation');
            if (elem.hasClass('addImportance')) {
                elem.click(() => {
                    controller.markTranslationAsImportant(wordNumber, translation)
                })
            } else if (elem.hasClass('removeImportance')) {
                elem.click(() => {
                    controller.markTranslationAsRegular(wordNumber, translation)
                })
            } else if (elem.hasClass('removeCustomAnswer')) {
                elem.click(() => {
                    controller.deleteWordTranslation(wordNumber, translation)
                })
            }
        });
        box.find('input').focus();
    },

    showQuestion (word) {
        document.getElementById('questionedWord').textContent = word
    },

    showWordStatistics (data, isCustom = false) {
        let elem = document.getElementById('statistics');
        if (typeof data === 'string') {
            elem.innerHTML = data
        } else {
            const successGuesses = data.successGuesses;
            const lastGuessTime = new Date(data.lastGuessTime).toLocaleString();
            const difficulty = isCustom ? 'This is custom word. ' : `Difficulty is ${(data.number/10000*100).toFixed(2)}%.`;
            elem.innerHTML = data.ultraNewWordsGuesses > 0 ?
                `This is new word u need to learn. Guess it ${data.ultraNewWordsGuesses} more times.` :
                `${difficulty}<br>That word is from your pool. U have guessed it right ${successGuesses} times. Last check was ${lastGuessTime}`;
        }
    },
    showPoolStatistics (data) {
        const html = data.map(({name, words}) => {
            return `${name} words: ${words}.<br>`
        }).join('');
        let elem = document.getElementById('poolData');
        elem.innerHTML = html
    },

    checkPoolStatisticsDisplayState() {
        let elem = document.getElementById('poolData');
        if (elem.innerHTML.length>0) {
            return true
        }
    },

    hidePoolData () {
        document.getElementById('poolData').innerHTML = ``
    },

    clearInput() {
        document.getElementById('answerWord').value = ''
    },

    clearTranslations () {
        let translations = document.querySelectorAll('#pureAnswersBox, #translationBox, #dictionaryBox');
        for (let elem of translations) {
            elem.innerHTML = ``
        }
    },

    showNotification (text) {
        let elem = document.getElementById('learningNotification');
        elem.innerText = text;
        elem.style.display = 'block'
    },

    hideNotification () {
        document.getElementById('learningNotification').style.display = 'none'
    },

    toggleResetButtons (state) {
        let buttons = document.querySelectorAll('#fullReset, #updateOptions');
        for (let button of buttons) {
            if (state) {
                button.style.display = 'inline-block'
            } else {
                buttons.style.display = 'none'
            }
        }
    },

    showPreferencesData(minRange, maxRange, order) {
        document.getElementById('minRange').value = minRange;
        document.getElementById('maxRange').value = maxRange;
        document.getElementById('order').value = order
    },

    showFullLearningPool(pool, learnMachine) {
        //todo: fix click from inside with jquery and not use controller
        let parent = document.querySelector('#fullLearningPool div ol');
        parent.innerHTML = pool.map((wordData) => {
            let lastCheck = moment(wordData.lastGuessTime).format('DD.MM.YYYY HH:mm');
            let nextCheck = moment(wordData.nextGuessTime).format('DD.MM.YYYY HH:mm');
            let difficulty = (wordData.number/100) + '%';
            let word = wordData.wordName;
            return `<li data-wordName="${word}">
                        <ul>
                            <li>Word is "${word}"</li>
                            <li>Difficulty is ${difficulty}</li>
                            <li>Last check: ${lastCheck}</li>
                            <li>Next check: ${nextCheck}</li>
                            <li>
                                <button data-wordName="${word}">Delete word</button>
                                <br>
                                <br>
                            </li>
                        </ul>
                    </li>`
        }).join('');
        //todo: mb change click handler (it's pretty expensive with big number of words) or make pagination for pool
        pool.map(({wordName: name}) => {
            $(`button[data-wordName="${name}"]`).click(() => {
                learnMachine.deleteWordFromPool(name)
            })
        });
    },

    showInaccessibleServerError(msg) {
        //todo: show some popup or just big red message
    }
    
    
}