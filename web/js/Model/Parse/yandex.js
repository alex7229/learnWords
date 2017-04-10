/**
 * Created by tup1tsa on 11.08.2016.
 */
export default class {

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


    resolveAfter2Seconds(x) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(x);
            }, 2000);
        });
    }

    async add1(x) {
        var a = this.resolveAfter2Seconds(20);
        var b = this.resolveAfter2Seconds(30);
        let answer =  x + await a + await b;
        console.log(answer);
        return answer;
    }
}