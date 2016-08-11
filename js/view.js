/**
 * Created by tup1tsa on 11.08.2016.
 */
export default class {

    static yandexTranslation (words) {
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

    static googleDefinition (data) {
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

    static showQuestion (word) {
        document.getElementById('questionedWord').textContent = word
    }

    static playCorrectAnswerSound () {
        const audio = new Audio('audio/whoosh.mp3');
        audio.play();
    }

    /*static showUserInfo () {
        let auth = new AuthClass();
        const data = auth.findLocalAuthData();
        if (data) {
            AjaxRequests.checkAuth(data)
                .then(() => {
                    document.getElementById('authentication').style.display = 'none';
                    document.querySelector('#authentication .notification').style.display = 'none';
                    document.getElementById('profileData').style.display = 'block';
                    document.getElementById('profileName').value = auth.name
                }, err => {
                    let notificationElem = document.querySelector('#authentication .notification');
                    notificationElem.style.display = 'block';
                    console.log(err);
                    //notificationElem.textContent = err
                })
        }
    }*/

}