let words = [];
$.ajax({
    url: 'http://tup1tsa.bounceme.net/learnWords/words.txt'
})
.done((data) => {
    words = JSON.parse(data);
    console.log(words)
});

//todo delete words, which has no definition on yandex.dictionary