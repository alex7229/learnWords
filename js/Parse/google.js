/**
 * Created by tup1tsa on 11.08.2016.
 */
export default class {
    
    constructor (rawData) {
        this.rawData = rawData;
    }

    getData () {
        return {
            definitionLists : this.findDefinitionLists(this.findDefinitionChunks()),
            webDefinitionLists: this.findWebDefinitionLists(this.findWebDefinitionChunk()),
            grammar: this.findGrammar()
        }
    }

    findDefinitionChunks() {
        const regExp = /<b>(.*)\n[\s\S]*?<\/[\s\S]*?<div class=std style="padding-left:40px">([\s\S]*?)(<div id="forEmbed">|<hr>)/g;
        let regExpResult;
        let definitionsChunks = [];
        while ((regExpResult = regExp.exec(this.rawData)) !== null) {
            definitionsChunks.push({
                typeOfWord: regExpResult[1],
                body: regExpResult[2]
            })
        }
        return definitionsChunks
    }

    findDefinitionLists(chunks) {
        return chunks.map(chunk => {
            const list = chunk.body.split(/<li style="list-style:decimal">/g).slice(1).map(listValue => {
                return this.deleteUnnecessaryRow(listValue)
            });
            return {
                typeOfWord: chunk.typeOfWord,
                list
            }
        })
    }

    deleteUnnecessaryRow(listValue) {
        const regExp = /color:#767676/;
        if (listValue.match(regExp)) {
            return listValue
        } else {
            return listValue.replace(/<div[\s\S]*<\/div>/, '')
        }
    }


    findWebDefinitionChunk() {
        const regExp = /Web Definitions[\s\S]*<\/ol>/g;
        return this.rawData.match(regExp)[0];
    }

    findWebDefinitionLists (chunk) {
        let webList = [];
        const regExp = /<li style="list-style:decimal; margin-bottom:10px;">([\s\S]*?)<\/li>/g;
        let regExpResult;
        while ((regExpResult = regExp.exec(chunk)) !== null) {
            webList.push(regExpResult[1])
        }
        return webList
    }

    findGrammar () {
        const regExp = /<span style="color:#767676">([\s\S]*?)<\/span>/;
        return this.rawData.match(regExp)[1].slice(0,-2);
    }
}