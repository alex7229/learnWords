'use strict';

var words = [];
$.ajax({
    url: 'http://tup1tsa.bounceme.net/learnWords/words.txt'
}).done(function (data) {
    words = JSON.parse(data);
    console.log(words);
});

//todo delete words, which has no definition on yandex.dictionary

//# sourceMappingURL=main-compiled.js.map