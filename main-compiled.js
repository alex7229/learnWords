'use strict';

/*
 parsing from txt.rawData into JSON
 let rawData = data;
 let regExpGroups = /----- \d{1,2} -----/g;
 let wordGroups = rawData.split(regExpGroups);
 let bigList = [];
 let wordNumber = 0;
 for (let i=1; i<=21; i++) {
 let group = wordGroups[i];
 let regExpWords = /(\w+)\r\n(?:\s{4}([ \w,*]+)\r\n)?/gi;
 let regExpResult;
 while ((regExpResult = regExpWords.exec(group)) !== null) {
 wordNumber++;
 let word = {
 word: regExpResult[1],
 number: wordNumber,
 group: i,
 synonyms: regExpResult[2]
 };
 bigList.push(word)
 }
 }
 console.log(JSON.stringify(bigList))
 */
$.ajax({
    url: 'http://tup1tsa.bounceme.net/learnWords/wordsLists/sorted_34k.txt'
}).done(function (data) {
    var words = JSON.parse(data)
    function compare(a, b) {
        if (a.power > b.power) {
            return -1;
        }
        if (a.power < b.power) {
            return 1;
        }
        return 0;
    }
    words.sort(compare);
    console.log(words);
});

//# sourceMappingURL=main-compiled.js.map