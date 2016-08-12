/**
 * Created by tup1tsa on 12.08.2016.
 */
export function yandex (words) {
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

export function google (data) {
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