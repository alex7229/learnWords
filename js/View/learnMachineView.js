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

    static showQuestion (word) {
        document.getElementById('questionedWord').textContent = word
    }

    static playCorrectAnswerSound () {
        const audio = new Audio('audio/whoosh.mp3');
        audio.play();
    }

}