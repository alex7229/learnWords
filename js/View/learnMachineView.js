/**
 * Created by tup1tsa on 12.08.2016.
 */
export default class {


    static showQuestion (word) {
        document.getElementById('questionedWord').textContent = word
    }

    static playCorrectAnswerSound () {
        const audio = new Audio('audio/whoosh.mp3');
        audio.play();
    }

}