/**
 * Created by tup1tsa on 12.08.2016.
 */
export default class {

    static togglePreferences (state) {
        let elem = document.getElementById('preferences');
        if (state) {
            elem.style.display = 'block'
        } else {
            elem.style.display = 'none'
        }
    }

    static toggleLearningForm (state) {
        let elem = document.getElementById('words');
        if (state) {
            elem.style.display = 'block'
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

    static showStatistics (data) {
        let elem = document.getElementById('statistics');
        if (typeof data === 'string') {
            elem.innerHTML = data
        } else {
            const successGuesses = data.successGuesses;
            const lastGuessTime = new Date(data.lastGuessTime).toLocaleString();
            elem.innerHTML = `Difficulty is ${(data.number/25000*100).toFixed(2)}%.<br>That word is from your pool. U have guessed it right ${successGuesses} times. Last check was ${lastGuessTime}`;
        }
    }
    
    static clearInput() {
        document.getElementById('answerWord').value = ''
    }
    
    static clearTranslations () {
        document.querySelectorAll('#pureAnswersBox, #translationBox, #dictionaryBox').forEach(elem => {
            elem.innerHTML = ``
        })
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

    static toggleFullResetBtn (state) {
        let elem = document.getElementById('fullReset');
        if (state === 'on') {
            elem.style.display = 'inline-block'
        } else if (state === 'off') {
            elem.style.display = 'none'
        }
    }

}