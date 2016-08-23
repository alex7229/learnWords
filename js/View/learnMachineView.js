/**
 * Created by tup1tsa on 12.08.2016.
 */
export default class {

    static hidePreferences () {
        document.getElementById('preferences').style.display = 'none'
    }
    
    static showLearningForm () {
        document.getElementById('words').style.display = 'block'
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
            elem.textContent = data
        } else {
            const successGuesses = data.successGuesses;
            const lastGuessTime = new Date(data.lastGuessTime).toLocaleString();
            const text = `That word is from your pool. U have guessed it right ${successGuesses} times. Last check was ${lastGuessTime}`;
            elem.textContent = text
        }

    }

    static playCorrectAnswerSound () {
        const audio = new Audio('audio/whoosh.mp3');
        audio.play();
    }

}