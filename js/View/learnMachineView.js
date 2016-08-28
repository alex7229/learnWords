/**
 * Created by tup1tsa on 12.08.2016.
 */
export default class {
    
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

    static playCorrectAnswerSound () {
        const audio = new Audio('audio/whoosh.mp3');
        audio.play();
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
    
    
}