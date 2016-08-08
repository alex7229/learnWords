(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by tup1tsa on 08.08.2016.
 */
var _class = function () {
    function _class() {
        _classCallCheck(this, _class);
    }

    _createClass(_class, [{
        key: 'checkUserInfo',
        value: function checkUserInfo() {
            var authData = this.findLocalAuthData();
            if (authData) {
                var encryptedData = this.encryptData(authData);
                fetch('/auth', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': encryptedData
                    }
                }).then(function (response) {
                    console.log(response);
                });
            } else {
                throw new Error('U have not declared password or login');
            }
        }
    }, {
        key: 'findLocalAuthData',
        value: function findLocalAuthData() {
            var name = localStorage.getItem('authName');
            var password = localStorage.getItem('authPassword');
            if (!(name && password)) {
                name = document.getElementById('login').value;
                password = document.getElementById('password').value;
            }
            if (name && password) {
                return {
                    name: name,
                    password: password
                };
            }
        }
    }, {
        key: 'encryptData',
        value: function encryptData(userInfo) {
            return btoa(userInfo.name + ':' + userInfo.password);
        }
    }]);

    return _class;
}();

exports.default = _class;

},{}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _authentication = require('./authentication.js');

var _authentication2 = _interopRequireDefault(_authentication);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//todo -  add sound (when u guessed right answer) from fallout4, add authentication (to save user progress)
require('whatwg-fetch');

var Controller = function () {
    function Controller() {
        _classCallCheck(this, Controller);
    }

    _createClass(Controller, null, [{
        key: 'getTranslation',
        value: function getTranslation() {
            var word = document.getElementById('word').value;
            if (!word) return;
            AjaxRequests.getWordFromServer(word).then(function (data) {
                View.yandex(YandexParse.getData(data));
            }, function (err) {
                if (err.status === 404) {
                    AjaxRequests.yandexApi(word).then(function (data) {
                        View.yandex(YandexParse.getData(data));
                    });
                }
            });
        }
    }, {
        key: 'getMeaning',
        value: function getMeaning() {
            var word = document.getElementById('word').value;
            if (!word) return;
            AjaxRequests.googleApi(word).then(function (data) {
                View.google(GoogleParse.getData(data));
            });
        }
    }, {
        key: 'listenButtons',
        value: function listenButtons() {
            document.getElementById("getMeaning").onclick = Controller.getMeaning;
            document.getElementById("getTranslation").onclick = Controller.getTranslation;
            document.getElementById("checkAnswer").onclick = learningMachine.checkAnswer.bind(learningMachine);
            document.getElementById("sendQuestion").onclick = learningMachine.sendQuestion.bind(learningMachine);
            document.getElementById('loginBtn').onclick = function () {
                var auth = new _authentication2.default();
                auth.checkUserInfo();
            };
        }
    }]);

    return Controller;
}();

var AjaxRequests = function () {
    function AjaxRequests() {
        _classCallCheck(this, AjaxRequests);
    }

    _createClass(AjaxRequests, null, [{
        key: 'checkStatus',
        value: function checkStatus(response) {
            if (response.status >= 200 && response.status < 300) {
                return response;
            } else {
                var error = new Error(response.statusText);
                error.response = response;
                throw error;
            }
        }
    }, {
        key: 'yandexApi',
        value: function yandexApi(word) {
            return new Promise(function (resolve) {
                fetch('/learnWords/getTranslation', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        word: word
                    })
                }).then(AjaxRequests.checkStatus).then(function (response) {
                    resolve(response.text());
                });
            });
        }
    }, {
        key: 'googleApi',
        value: function googleApi(word) {
            return new Promise(function (resolve) {
                fetch('/learnWords/getMeaning', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        word: word
                    })
                }).then(AjaxRequests.checkStatus).then(function (response) {
                    resolve(response.text());
                });
            });
        }
    }, {
        key: 'getWordFromServer',
        value: function getWordFromServer(word) {
            return new Promise(function (resolve, reject) {
                fetch('http://tup1tsa.bounceme.net/learnWords/wordsLists/yandexTranslations/' + word + '.txt').then(AjaxRequests.checkStatus).then(function (response) {
                    resolve(response.json());
                }, function (err) {
                    reject(err);
                });
            });
        }
    }, {
        key: 'getWordList',
        value: function getWordList() {
            return new Promise(function (resolve, reject) {
                fetch('http://tup1tsa.bounceme.net/learnWords/wordsLists/sortedWordsList.json').then(AjaxRequests.checkStatus).then(function (response) {
                    resolve(response.json());
                }, function (err) {
                    reject(err);
                });
            });
        }
    }, {
        key: 'checkAuth',
        value: function checkAuth(data) {
            return new Promise(function (resolve, reject) {
                fetch('/auth', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }).then(AjaxRequests.checkStatus).then(function (response) {
                    resolve(response.text());
                }, function (err) {
                    reject(err);
                });
            });
        }
    }]);

    return AjaxRequests;
}();

var YandexParse = function () {
    function YandexParse() {
        _classCallCheck(this, YandexParse);
    }

    _createClass(YandexParse, null, [{
        key: 'getData',
        value: function getData(jsonData) {
            if (jsonData.def.length === 0) return;
            return jsonData.def.map(function (description) {
                return {
                    type: description.pos || '',
                    transcription: description.ts ? '[' + description.ts + ']' : '',
                    translations: description.tr.map(function (translation) {
                        return {
                            examples: YandexParse.transformExamples(translation.ex),
                            synonyms: YandexParse.transformSynonyms(translation.syn),
                            synonymsEn: YandexParse.transformSynonyms(translation.mean),
                            translationType: translation.pos,
                            translation: translation.text
                        };
                    })

                };
            });
        }
    }, {
        key: 'transformExamples',
        value: function transformExamples() {
            var examples = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            return examples.map(function (example) {
                return example.text + ' - ' + example.tr[0].text;
            });
        }
    }, {
        key: 'transformSynonyms',
        value: function transformSynonyms() {
            var synonyms = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            return synonyms.map(function (synonym) {
                return synonym.text;
            });
        }
    }, {
        key: 'findCorrectAnswers',
        value: function findCorrectAnswers(parsedWords) {
            return parsedWords.map(function (word) {
                return word.translations.map(function (translation) {
                    return translation.translation.toLowerCase();
                });
            }).reduce(function (previousWords, currentWord) {
                return previousWords.concat(currentWord);
            }, []);
        }
    }]);

    return YandexParse;
}();

var GoogleParse = function () {
    function GoogleParse() {
        _classCallCheck(this, GoogleParse);
    }

    _createClass(GoogleParse, null, [{
        key: 'getData',
        value: function getData(rawData) {
            return {
                definitionLists: GoogleParse.findDefinitionLists(GoogleParse.findDefinitionChunks(rawData)),
                webDefinitionLists: GoogleParse.findWebDefinitionLists(GoogleParse.findWebDefinitionChunk(rawData)),
                grammar: GoogleParse.findGrammar(rawData)
            };
        }
    }, {
        key: 'findDefinitionChunks',
        value: function findDefinitionChunks(rawData) {
            var regExp = /<b>(.*)\n[\s\S]*?<\/[\s\S]*?<div class=std style="padding-left:40px">([\s\S]*?)(<div id="forEmbed">|<hr>)/g;
            var regExpResult = void 0;
            var definitionsChunks = [];
            while ((regExpResult = regExp.exec(rawData)) !== null) {
                definitionsChunks.push({
                    typeOfWord: regExpResult[1],
                    body: regExpResult[2]
                });
            }
            return definitionsChunks;
        }
    }, {
        key: 'findDefinitionLists',
        value: function findDefinitionLists(chunks) {
            return chunks.map(function (chunk) {
                var list = chunk.body.split(/<li style="list-style:decimal">/g).slice(1).map(function (listValue) {
                    return GoogleParse.deleteUnnecessaryRow(listValue);
                });
                return {
                    typeOfWord: chunk.typeOfWord,
                    list: list
                };
            });
        }
    }, {
        key: 'deleteUnnecessaryRow',
        value: function deleteUnnecessaryRow(listValue) {
            var regExp = /color:#767676/;
            if (listValue.match(regExp)) {
                return listValue;
            } else {
                return listValue.replace(/<div[\s\S]*<\/div>/, '');
            }
        }
    }, {
        key: 'findWebDefinitionChunk',
        value: function findWebDefinitionChunk(rawData) {
            var regExp = /Web Definitions[\s\S]*<\/ol>/g;
            return rawData.match(regExp)[0];
        }
    }, {
        key: 'findWebDefinitionLists',
        value: function findWebDefinitionLists(chunk) {
            var webList = [];
            var regExp = /<li style="list-style:decimal; margin-bottom:10px;">([\s\S]*?)<\/li>/g;
            var regExpResult = void 0;
            while ((regExpResult = regExp.exec(chunk)) !== null) {
                webList.push(regExpResult[1]);
            }
            return webList;
        }
    }, {
        key: 'findGrammar',
        value: function findGrammar(rawData) {
            var regExp = /<span style="color:#767676">([\s\S]*?)<\/span>/;
            return rawData.match(regExp)[1].slice(0, -2);
        }
    }]);

    return GoogleParse;
}();

var View = function () {
    function View() {
        _classCallCheck(this, View);
    }

    _createClass(View, null, [{
        key: 'yandex',
        value: function yandex(words) {
            document.getElementById('translationBox').innerHTML = words.map(function (word) {
                return '<br><span class="ital"><b>' + word.type + '</b></span> ' + word.transcription + ' ' + word.translations.map(function (translation, index) {
                    var innerHTML = '<br>' + (index + 1) + ') ' + translation.translation;
                    if (translation.examples.length !== 0) {
                        innerHTML += '. <br><span class="tabbed">Examples:</span> ' + translation.examples.join('; ');
                    }
                    if (translation.synonyms.length !== 0) {
                        innerHTML += '. <br><span class="tabbed">Synonyms:</span> ' + translation.synonyms.join('; ');
                    }
                    if (translation.synonymsEn.length !== 0) {
                        innerHTML += '. <br><span class="tabbed">Synonyms (en):</span> ' + translation.synonymsEn.join('; ');
                    }
                    return innerHTML;
                }).join('');
            }) + '<hr>';
        }
    }, {
        key: 'google',
        value: function google(data) {
            var grammar = '<span class="googleGrammar"><b>Grammar:</b> ' + data.grammar + '</span><br>';
            var definitions = data.definitionLists.map(function (chunk) {
                return '<b>' + chunk.typeOfWord + '</b><br><ol>\n                ' + chunk.list.map(function (definition) {
                    return '<li>' + definition + '</li>';
                }).join('') + '</ol><hr>';
            });
            var webDefinition = '<b>Web Results:</b><ol>\n            ' + data.webDefinitionLists.map(function (row) {
                return '<li>' + row + '</li>';
            }).join('') + '</ol>';
            document.getElementById('dictionaryBox').innerHTML = grammar + definitions + webDefinition;
        }
    }, {
        key: 'showQuestion',
        value: function showQuestion(word) {
            document.getElementById('questionedWord').textContent = word;
        }
    }, {
        key: 'playCorrectAnswerSound',
        value: function playCorrectAnswerSound() {
            var audio = new Audio('audio/whoosh.mp3');
            audio.play();
        }
    }, {
        key: 'showUserInfo',
        value: function showUserInfo() {
            var auth = new _authentication2.default();
            var data = auth.findLocalAuthData();
            if (data) {
                AjaxRequests.checkAuth(data).then(function () {
                    document.getElementById('authentication').style.display = 'none';
                    document.querySelector('#authentication .notification').style.display = 'none';
                    document.getElementById('profileData').style.display = 'block';
                    document.getElementById('profileName').value = auth.name;
                }, function (err) {
                    var notificationElem = document.querySelector('#authentication .notification');
                    notificationElem.style.display = 'block';
                    console.log(err);
                    //notificationElem.textContent = err
                });
            }
        }
    }]);

    return View;
}();

var LearnMachine = function () {
    function LearnMachine() {
        _classCallCheck(this, LearnMachine);

        this.correctAnswers = [];
        this.allWords = [];
    }

    _createClass(LearnMachine, [{
        key: 'getAllWords',
        value: function getAllWords() {
            var _this = this;

            AjaxRequests.getWordList().then(function (data) {
                _this.allWords = data;
            }, function (err) {
                throw err;
            });
        }
    }, {
        key: 'checkAnswer',
        value: function checkAnswer() {
            var userAnswer = document.getElementById('answerWord').value;
            if (this.correctAnswers.indexOf(userAnswer) !== -1) {
                console.log('answer is correct');
            } else {
                console.log('answer is incorrect');
            }
        }
    }, {
        key: 'sendQuestion',
        value: function sendQuestion() {
            var wordNumber = Math.ceil(Math.random() * 1000);
            var word = this.allWords[wordNumber].word;
            this.getAnswer(word);
            View.showQuestion(word);
        }
    }, {
        key: 'getAnswer',
        value: function getAnswer(word) {
            var _this2 = this;

            AjaxRequests.getWordFromServer(word).then(function (data) {
                _this2.correctAnswers = YandexParse.findCorrectAnswers(YandexParse.getData(data));
            }, function (err) {
                throw err;
            });
        }
    }]);

    return LearnMachine;
}();

var learningMachine = new LearnMachine();
learningMachine.getAllWords();

window.onload = function () {
    View.showUserInfo();

    setTimeout(function () {
        learningMachine.sendQuestion();
        Controller.listenButtons();
    }, 200);
};

},{"./authentication.js":2,"whatwg-fetch":1}]},{},[3])


//# sourceMappingURL=main.compiled.js.map
