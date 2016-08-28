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

var _fetchStatusHangling = require('../Utils/fetchStatusHangling');

var _fetchStatusHangling2 = _interopRequireDefault(_fetchStatusHangling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
    return new Promise(function (resolve, reject) {
        fetch('http://tup1tsa.bounceme.net/learnWords/wordsLists/sortedWordsList.json').then(_fetchStatusHangling2.default).then(function (response) {
            resolve(response.json());
        }, function (err) {
            reject(err);
        });
    });
}; /**
    * Created by tup1tsa on 11.08.2016.
    */

},{"../Utils/fetchStatusHangling":14}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fetchStatusHangling = require('../Utils/fetchStatusHangling');

var _fetchStatusHangling2 = _interopRequireDefault(_fetchStatusHangling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (word) {
    return new Promise(function (resolve) {
        fetch('/learnWords/getMeaning', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                word: word
            })
        }).then(_fetchStatusHangling2.default).then(function (response) {
            resolve(response.text());
        });
    });
}; /**
    * Created by tup1tsa on 11.08.2016.
    */

},{"../Utils/fetchStatusHangling":14}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fetchStatusHangling = require('../Utils/fetchStatusHangling');

var _fetchStatusHangling2 = _interopRequireDefault(_fetchStatusHangling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (encryptedLoginPassword) {
    return new Promise(function (resolve, reject) {
        fetch('/auth/login', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'authorization': encryptedLoginPassword
            }
        }).then(_fetchStatusHangling2.default).then(function (response) {
            resolve(response.text());
        }, function (err) {
            reject(err);
        });
    });
}; /**
    * Created by tup1tsa on 11.08.2016.
    */

},{"../Utils/fetchStatusHangling":14}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fetchStatusHangling = require('../Utils/fetchStatusHangling');

var _fetchStatusHangling2 = _interopRequireDefault(_fetchStatusHangling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (encryptedLoginPassword, email, secretQuestion, secretAnswer) {
    return new Promise(function (resolve, reject) {
        fetch('/auth/registration', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'authorization': encryptedLoginPassword
            },
            body: JSON.stringify({
                email: email,
                secretQuestion: secretQuestion,
                secretAnswer: secretAnswer
            })
        }).then(_fetchStatusHangling2.default).then(function (response) {
            resolve(response.text());
        }).catch(function (err) {
            reject(err);
        });
    });
}; /**
    * Created by tup1tsa on 11.08.2016.
    */

},{"../Utils/fetchStatusHangling":14}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getSecretQuestion = getSecretQuestion;
exports.sendSecretAnswer = sendSecretAnswer;

var _fetchStatusHangling = require('../Utils/fetchStatusHangling');

var _fetchStatusHangling2 = _interopRequireDefault(_fetchStatusHangling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getSecretQuestion(login, email) {
    return new Promise(function (resolve, reject) {
        fetch('/auth/resetPassword/getQuestion', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: login,
                email: email
            })
        }).then(_fetchStatusHangling2.default).then(function (response) {
            resolve(response.text());
        }).catch(function (err) {
            reject(err);
        });
    });
} /**
   * Created by tup1tsa on 16.08.2016.
   */
function sendSecretAnswer(login, email, answer) {
    return new Promise(function (resolve, reject) {
        fetch('/auth/resetPassword/sendAnswer', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: login,
                email: email,
                answer: answer
            })
        }).then(_fetchStatusHangling2.default).then(function (response) {
            resolve(response.text());
        }).catch(function (err) {
            reject(err);
        });
    });
}

},{"../Utils/fetchStatusHangling":14}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fetchStatusHangling = require('../Utils/fetchStatusHangling');

var _fetchStatusHangling2 = _interopRequireDefault(_fetchStatusHangling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (word) {
    return new Promise(function (resolve, reject) {
        fetch('http://tup1tsa.bounceme.net/learnWords/wordsLists/yandexTranslations/' + word + '.txt').then(_fetchStatusHangling2.default).then(function (response) {
            resolve(response.json());
        }, function (err) {
            reject(err);
        });
    });
}; /**
    * Created by tup1tsa on 11.08.2016.
    */

},{"../Utils/fetchStatusHangling":14}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fetchStatusHangling = require('../Utils/fetchStatusHangling');

var _fetchStatusHangling2 = _interopRequireDefault(_fetchStatusHangling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (word) {
    return new Promise(function (resolve) {
        fetch('/learnWords/getTranslation', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                word: word
            })
        }).then(_fetchStatusHangling2.default).then(function (response) {
            resolve(response.text());
        });
    });
}; /**
    * Created by tup1tsa on 11.08.2016.
    */

},{"../Utils/fetchStatusHangling":14}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by tup1tsa on 11.08.2016.
 */
var _class = function () {
    function _class(rawData) {
        _classCallCheck(this, _class);

        this.rawData = rawData;
    }

    _createClass(_class, [{
        key: 'getData',
        value: function getData() {
            return {
                definitionLists: this.findDefinitionLists(this.findDefinitionChunks()),
                webDefinitionLists: this.findWebDefinitionLists(this.findWebDefinitionChunk()),
                grammar: this.findGrammar()
            };
        }
    }, {
        key: 'findDefinitionChunks',
        value: function findDefinitionChunks() {
            var regExp = /<b>(.*)\n[\s\S]*?<\/[\s\S]*?<div class=std style="padding-left:40px">([\s\S]*?)(<div id="forEmbed">|<hr>)/g;
            var regExpResult = void 0;
            var definitionsChunks = [];
            while ((regExpResult = regExp.exec(this.rawData)) !== null) {
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
            var _this = this;

            return chunks.map(function (chunk) {
                var list = chunk.body.split(/<li style="list-style:decimal">/g).slice(1).map(function (listValue) {
                    return _this.deleteUnnecessaryRow(listValue);
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
        value: function findWebDefinitionChunk() {
            var regExp = /Web Definitions[\s\S]*<\/ol>/g;
            return this.rawData.match(regExp)[0];
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
        value: function findGrammar() {
            var regExp = /<span style="color:#767676">([\s\S]*?)<\/span>/;
            return this.rawData.match(regExp)[1].slice(0, -2);
        }
    }]);

    return _class;
}();

exports.default = _class;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by tup1tsa on 11.08.2016.
 */
var _class = function () {
    function _class(data) {
        _classCallCheck(this, _class);

        this.jsonData = data;
    }

    _createClass(_class, [{
        key: "getData",
        value: function getData() {
            var _this = this;

            if (this.jsonData.def.length === 0) return;
            return this.jsonData.def.map(function (description) {
                return {
                    type: description.pos || "",
                    transcription: description.ts ? "[" + description.ts + "]" : "",
                    translations: description.tr.map(function (translation) {
                        return {
                            examples: _this.transformExamples(translation.ex),
                            synonyms: _this.transformSynonyms(translation.syn),
                            synonymsEn: _this.transformSynonyms(translation.mean),
                            translationType: translation.pos,
                            translation: translation.text
                        };
                    })

                };
            });
        }
    }, {
        key: "transformExamples",
        value: function transformExamples() {
            var examples = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            return examples.map(function (example) {
                return example.text + " - " + example.tr[0].text;
            });
        }
    }, {
        key: "transformSynonyms",
        value: function transformSynonyms() {
            var synonyms = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            return synonyms.map(function (synonym) {
                return synonym.text;
            });
        }
    }, {
        key: "findCorrectAnswers",
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

    return _class;
}();

exports.default = _class;

},{}],11:[function(require,module,exports){
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
        key: 'findLocalAuthData',
        value: function findLocalAuthData() {
            var name = localStorage.getItem('authName');
            var password = localStorage.getItem('authPassword');
            if (!(name && password)) {
                name = document.getElementById('loginDefault').value;
                password = document.getElementById('passwordDefault').value;
            }
            if (name && password) {
                return {
                    name: name,
                    password: password
                };
            } else {
                throw new Error('You missed login or password.');
            }
        }
    }, {
        key: 'saveCredentials',
        value: function saveCredentials(name, password) {
            if (!localStorage) return;
            localStorage.setItem('authName', name);
            localStorage.setItem('authPassword', password);
        }
    }, {
        key: 'deleteCredentials',
        value: function deleteCredentials() {
            if (!localStorage) return;
            localStorage.removeItem('authName');
            localStorage.removeItem('authPassword');
        }
    }, {
        key: 'encryptData',
        value: function encryptData(userInfo) {
            return btoa(userInfo.name + ':' + userInfo.password);
        }
    }, {
        key: 'gatherUserInfo',
        value: function gatherUserInfo() {
            var name = document.getElementById('loginReg').value;
            var password = document.getElementById('passwordReg').value;
            var checkPassword = document.getElementById('repeatedPassword').value;
            var email = document.getElementById('emailReg').value;
            var secretQuestion = document.getElementById('secretQuestionReg').value;
            var secretAnswer = document.getElementById('secretAnswerReg').value;
            if (!name || !password || !checkPassword || !email || !secretQuestion || !secretAnswer) {
                throw new Error('All fields required');
            }
            if (password !== checkPassword) {
                throw new Error('Passwords are different');
            }
            var encryptedAuthorizationData = this.encryptData({
                name: name,
                password: password
            });
            return {
                encryptedAuthorizationData: encryptedAuthorizationData,
                email: email,
                secretQuestion: secretQuestion,
                secretAnswer: secretAnswer
            };
        }
    }]);

    return _class;
}();

exports.default = _class;

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Created by tup1tsa on 11.08.2016.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _getWordsList = require('../AjaxRequests/getWordsList');

var _getWordsList2 = _interopRequireDefault(_getWordsList);

var _savedYandexTranslation = require('../AjaxRequests/savedYandexTranslation');

var _savedYandexTranslation2 = _interopRequireDefault(_savedYandexTranslation);

var _yandex = require('../Model/Parse/yandex');

var _yandex2 = _interopRequireDefault(_yandex);

var _learnMachineView = require('../View/learnMachineView');

var _learnMachineView2 = _interopRequireDefault(_learnMachineView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
    function _class() {
        _classCallCheck(this, _class);

        this.correctAnswers = [];
        this.allWords = [];
    }

    _createClass(_class, [{
        key: 'setUserData',
        value: function setUserData(data) {
            this.userData = data;
        }
    }, {
        key: 'downloadWords',
        value: function downloadWords() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                (0, _getWordsList2.default)().then(function (data) {
                    _this.allWords = data;
                    resolve(true);
                }, function (err) {
                    reject(err);
                });
            });
        }
    }, {
        key: 'checkWordsList',
        value: function checkWordsList() {
            if (this.allWords.length > 1) {
                return true;
            }
        }
    }, {
        key: 'getCurrentNumber',
        value: function getCurrentNumber() {
            return this.userData.currentWord;
        }
    }, {
        key: 'setNextWordNumber',
        value: function setNextWordNumber() {
            var poolWord = this.findFirstReadyWordFromPool();
            if (poolWord) {
                this.userData.currentWord = poolWord.number;
                return;
            }
            var nextWordNumber = void 0;
            if (this.userData.options.order === 'random') {
                var unusedWords = this.findUnusedWords();
                if (unusedWords.length === 0) {
                    nextWordNumber = undefined;
                } else {
                    var index = Math.floor(Math.random() * unusedWords.length);
                    nextWordNumber = unusedWords[index];
                }
            } else {
                var possibleNextNumber = this.userData.currentWord + 1;
                if (possibleNextNumber > this.userData.options.lastWord) {
                    nextWordNumber = undefined;
                } else {
                    nextWordNumber = possibleNextNumber;
                }
            }
            this.userData.currentWord = nextWordNumber;
        }
    }, {
        key: 'findWordInKnownList',
        value: function findWordInKnownList(number) {
            return this.userData.knownWords.find(function (wordNumber) {
                if (wordNumber === number) return number;
            });
        }
    }, {
        key: 'findWordInPool',
        value: function findWordInPool(wordNumber) {
            return this.userData.learningPool.find(function (wordData) {
                if (wordData.number === wordNumber) return wordData;
            });
        }
    }, {
        key: 'getPureAnswerList',
        value: function getPureAnswerList() {
            return this.correctAnswers;
        }
    }, {
        key: 'checkAnswer',
        value: function checkAnswer(answer) {
            var number = this.userData.currentWord;
            if (this.correctAnswers.indexOf(answer) !== -1) {
                if (this.findWordInPool(this.userData.currentWord)) {
                    this.updateWordInPool(number, true);
                } else {
                    this.userData.knownWords.push(number);
                }
                this.setNextWordNumber();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: 'skipWord',
        value: function skipWord() {
            this.userData.knownWords.push(this.userData.currentWord);
            this.setNextWordNumber();
        }
    }, {
        key: 'addWordToPool',
        value: function addWordToPool() {
            var sixHours = 6 * 60 * 60 * 1000;
            var currentTime = new Date().getTime();
            var word = {
                number: this.userData.currentWord,
                successGuesses: 0,
                lastGuessTime: currentTime,
                nextGuessTime: currentTime + sixHours
            };
            this.userData.learningPool.push(word);
        }
    }, {
        key: 'calculateNumberOfWordsInPool',
        value: function calculateNumberOfWordsInPool(minGuesses) {
            var maxGuesses = arguments.length <= 1 || arguments[1] === undefined ? Number.MAX_SAFE_INTEGER : arguments[1];

            var pool = this.userData.learningPool;
            return pool.filter(function (wordData) {
                if (wordData.successGuesses <= maxGuesses && wordData.successGuesses >= minGuesses) {
                    return wordData;
                }
            }).length;
        }
    }, {
        key: 'calculateReadyWordsInPool',
        value: function calculateReadyWordsInPool() {
            var pool = this.userData.learningPool;
            var time = new Date().getTime();
            return pool.filter(function (wordData) {
                if (wordData.nextGuessTime < time) {
                    return wordData;
                }
            }).length;
        }
    }, {
        key: 'getKnownWordsCount',
        value: function getKnownWordsCount() {
            return this.userData.knownWords.length;
        }
    }, {
        key: 'updateWordInPool',
        value: function updateWordInPool(wordNumber, successGuess) {
            var word = this.findWordInPool(wordNumber);
            var currentTime = new Date().getTime();
            word.lastGuessTime = currentTime;
            if (successGuess) {
                word.successGuesses++;
                var currentAttempt = word.successGuesses;
                var delay = void 0;
                if (currentAttempt <= 3) {
                    delay = 6 * 60 * 60 * 1000;
                } else if (currentAttempt >= 4 && currentAttempt <= 6) {
                    delay = 24 * 60 * 60 * 1000;
                } else if (currentAttempt === 7 || currentAttempt === 8) {
                    delay = 3 * 24 * 60 * 60 * 1000;
                } else if (currentAttempt === 9) {
                    delay = 10 * 24 * 60 * 60 * 1000;
                } else if (currentAttempt >= 10) {
                    delay = 30 * 240 * 60 * 60 * 1000;
                }
                word.nextGuessTime = currentTime + delay;
            } else {
                word.successGuesses = 0;
                var _delay = 6 * 60 * 60 * 1000;
                word.nextGuessTime = currentTime + _delay;
            }
        }
    }, {
        key: 'findFirstReadyWordFromPool',
        value: function findFirstReadyWordFromPool() {
            var time = new Date().getTime();
            var readyWords = this.userData.learningPool.filter(function (wordData) {
                if (wordData.successGuesses < 10 && wordData.nextGuessTime < time) {
                    return wordData.number;
                }
            });
            if (readyWords.length > 0) {
                return readyWords[0];
            }
        }
    }, {
        key: 'getQuestion',
        value: function getQuestion() {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                var wordNumber = _this2.userData.currentWord;
                var word = _this2.allWords[wordNumber].word;
                _this2.getAnswer(word).then(function () {
                    resolve(word);
                }, function (err) {
                    reject(err);
                });
            });
        }
    }, {
        key: 'getAnswer',
        value: function getAnswer(word) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                (0, _savedYandexTranslation2.default)(word).then(function (data) {
                    var parse = new _yandex2.default(data);
                    _this3.correctAnswers = parse.findCorrectAnswers(parse.getData(data));
                    resolve(_this3.correctAnswers);
                }, function (err) {
                    reject(err);
                });
            });
        }
    }, {
        key: 'getUserData',
        value: function getUserData() {
            return this.userData;
        }
    }, {
        key: 'setNextWordNumberStraight',
        value: function setNextWordNumberStraight() {
            var number = document.getElementById('straightNumber').value;
            this.userData.currentWord = number;
        }
    }, {
        key: 'findUnusedWords',
        value: function findUnusedWords() {
            var unusedWords = [];
            for (var i = this.userData.options.firstWord; i <= this.userData.options.lastWord; i++) {
                if (!this.findWordInKnownList(i) && !this.findWordInPool(i)) {
                    unusedWords.push(i);
                }
            }
            return unusedWords;
        }
    }]);

    return _class;
}();

// todo - view is changing by model, not controller.


exports.default = _class;

},{"../AjaxRequests/getWordsList":2,"../AjaxRequests/savedYandexTranslation":7,"../Model/Parse/yandex":10,"../View/learnMachineView":16}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.saveOptions = saveOptions;
exports.updateUserData = updateUserData;
exports.getData = getData;
exports.saveSession = saveSession;
/**
 * Created by tup1tsa on 21.08.2016.
 */
function saveOptions(firstWord, lastWord, order) {
    var data = getData();
    if (!data) {
        data = {
            options: {
                firstWord: firstWord,
                lastWord: lastWord,
                order: order
            },
            learningPool: [],
            knownWords: [],
            currentWord: 1
        };
        if (order === 'random') {
            data.currentWord = Math.ceil(Math.random() * data.options.lastWord);
        }
        localStorage.setItem('learnWords', JSON.stringify(data));
    } else {
        throw new Error('Data already set');
    }
}

function updateUserData(userData) {
    localStorage.setItem('learnWords', JSON.stringify(userData));
}

function getData() {
    var jsonData = localStorage.getItem('learnWords');
    if (jsonData) {
        try {
            var data = JSON.parse(jsonData);
        } catch (err) {
            throw new Error('Not correct JSON in local storage');
        }
        return data;
    }
}

function saveSession(userData) {
    var jsonData = JSON.stringify(userData);
    localStorage.setItem('learnWords', jsonData);
}

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

/**
 * Created by tup1tsa on 11.08.2016.
 */
exports.default = function (response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    } else {
        return new Promise(function (resolve, reject) {
            var error = new Error(response.status);
            error.response = response;
            error.response.text().then(function (text) {
                error.message = text;
                reject(error);
            });
        });
    }
};

},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.showRegistrationBlock = showRegistrationBlock;
exports.showUserInfoBlock = showUserInfoBlock;
exports.showNotification = showNotification;
exports.hideNotification = hideNotification;
exports.showResetPasswordBlock = showResetPasswordBlock;
exports.showLogin = showLogin;
exports.showAuthForm = showAuthForm;
/**
 * Created by tup1tsa on 12.08.2016.
 */
function showRegistrationBlock() {
    hideAll();
    display('registration');
}

function showUserInfoBlock(profileName) {
    hideAll();
    document.getElementById('profileName').innerText = profileName;
    display('profileData');
}

function showNotification(text) {
    var color = arguments.length <= 1 || arguments[1] === undefined ? 'black' : arguments[1];

    var elem = document.getElementById('authNotification');
    elem.innerHTML = '<p>' + text + '</p>';
    elem.style.color = color;
    elem.style.display = 'block';
}

function hideNotification() {
    document.getElementById('authNotification').style.display = 'none';
}

function showResetPasswordBlock() {
    hideAll();
    display('resetPassword');
}

function showLogin() {
    hideAll();
    display('authDefault');
}

function showAuthForm() {
    document.getElementById('authentication').style.display = 'block';
}

function display(id) {
    document.getElementById(id).style.display = 'block';
}

function hideAll() {
    document.querySelectorAll('.auth').forEach(function (elem) {
        elem.style.display = 'none';
    });
}

},{}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by tup1tsa on 12.08.2016.
 */
var _class = function () {
    function _class() {
        _classCallCheck(this, _class);
    }

    _createClass(_class, null, [{
        key: 'toggleBlock',
        value: function toggleBlock(id, typeOfBLock, state) {
            var elem = document.getElementById(id);
            if (state) {
                elem.style.display = typeOfBLock;
            } else {
                elem.style.display = 'none';
            }
        }
    }, {
        key: 'showPureAnswers',
        value: function showPureAnswers(answersArray) {
            var box = document.getElementById('pureAnswersBox');
            var list = answersArray.join(', ');
            box.innerHTML = list + '<hr>';
        }
    }, {
        key: 'showQuestion',
        value: function showQuestion(word) {
            document.getElementById('questionedWord').textContent = word;
        }
    }, {
        key: 'showWordStatistics',
        value: function showWordStatistics(data) {
            var elem = document.getElementById('statistics');
            if (typeof data === 'string') {
                elem.innerHTML = data;
            } else {
                var successGuesses = data.successGuesses;
                var lastGuessTime = new Date(data.lastGuessTime).toLocaleString();
                elem.innerHTML = 'Difficulty is ' + (data.number / 10000 * 100).toFixed(2) + '%.<br>That word is from your pool. U have guessed it right ' + successGuesses + ' times. Last check was ' + lastGuessTime;
            }
        }
    }, {
        key: 'showPoolStatistics',
        value: function showPoolStatistics(htmlData) {
            var elem = document.getElementById('poolData');
            elem.innerHTML = htmlData;
        }
    }, {
        key: 'checkPoolStatisticsDisplayState',
        value: function checkPoolStatisticsDisplayState() {
            var elem = document.getElementById('poolData');
            if (elem.innerHTML.length > 0) {
                return true;
            }
        }
    }, {
        key: 'hidePoolData',
        value: function hidePoolData() {
            document.getElementById('poolData').innerHTML = '';
        }
    }, {
        key: 'clearInput',
        value: function clearInput() {
            document.getElementById('answerWord').value = '';
        }
    }, {
        key: 'clearTranslations',
        value: function clearTranslations() {
            var translations = document.querySelectorAll('#pureAnswersBox, #translationBox, #dictionaryBox');
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = translations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var elem = _step.value;

                    elem.innerHTML = '';
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: 'showNotification',
        value: function showNotification(text) {
            var elem = document.getElementById('learningNotification');
            elem.innerText = text;
            elem.style.display = 'block';
        }
    }, {
        key: 'hideNotification',
        value: function hideNotification() {
            document.getElementById('learningNotification').style.display = 'none';
        }
    }, {
        key: 'playCorrectAnswerSound',
        value: function playCorrectAnswerSound() {
            var audio = new Audio('audio/whoosh.mp3');
            audio.play();
        }
    }, {
        key: 'toggleResetButtons',
        value: function toggleResetButtons(state) {
            var buttons = document.querySelectorAll('#fullReset, #updateOptions');
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = buttons[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var button = _step2.value;

                    if (state) {
                        button.style.display = 'inline-block';
                    } else {
                        buttons.style.display = 'none';
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }, {
        key: 'showPreferencesData',
        value: function showPreferencesData(minRange, maxRange, order) {
            document.getElementById('minRange').value = minRange;
            document.getElementById('maxRange').value = maxRange;
            document.getElementById('order').value = order;
        }
    }]);

    return _class;
}();

exports.default = _class;

},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.yandex = yandex;
exports.google = google;
/**
 * Created by tup1tsa on 12.08.2016.
 */
function yandex(words) {
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

function google(data) {
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

},{}],18:[function(require,module,exports){
'use strict';

var _learningMachine = require('./Model/learningMachine');

var _learningMachine2 = _interopRequireDefault(_learningMachine);

var _yandexApi = require('./AjaxRequests/yandexApi');

var _yandexApi2 = _interopRequireDefault(_yandexApi);

var _googleApi = require('./AjaxRequests/googleApi');

var _googleApi2 = _interopRequireDefault(_googleApi);

var _savedYandexTranslation = require('./AjaxRequests/savedYandexTranslation');

var _savedYandexTranslation2 = _interopRequireDefault(_savedYandexTranslation);

var _registration = require('./AjaxRequests/registration');

var _registration2 = _interopRequireDefault(_registration);

var _login = require('./AjaxRequests/login');

var _login2 = _interopRequireDefault(_login);

var _resetPassword = require('./AjaxRequests/resetPassword');

var _yandex = require('./Model/Parse/yandex');

var _yandex2 = _interopRequireDefault(_yandex);

var _google = require('./Model/Parse/google');

var _google2 = _interopRequireDefault(_google);

var _authentication = require('./Model/authentication.js');

var _authentication2 = _interopRequireDefault(_authentication);

var _storage = require('./Model/storage');

var _translations = require('./View/translations');

var _authForm = require('./View/authForm');

var _learnMachineView = require('./View/learnMachineView');

var _learnMachineView2 = _interopRequireDefault(_learnMachineView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//todo -  add sound (when u guessed right answer) from fallout4, add authentication (to save user progress)
require('whatwg-fetch');


var learningMachine = new _learningMachine2.default();

var controller = {
    getYandexTranslation: function getYandexTranslation() {
        var word = document.getElementById('questionedWord').innerText;
        if (!word) return;
        (0, _savedYandexTranslation2.default)(word).then(function (data) {
            var parse = new _yandex2.default(data);
            (0, _translations.yandex)(parse.getData());
        }, function (err) {
            if (err.status === 404) {
                (0, _yandexApi2.default)(word).then(function (data) {
                    var parse = new _yandex2.default(data);
                    (0, _translations.yandex)(parse.getData());
                });
            }
        });
    },
    getGoogleMeaning: function getGoogleMeaning() {
        var word = document.getElementById('questionedWord').innerText;
        if (!word) return;
        (0, _googleApi2.default)(word).then(function (data) {
            var parse = new _google2.default(data);
            (0, _translations.google)(parse.getData());
        });
    },
    showPureAnswers: function showPureAnswers() {
        var answers = learningMachine.getPureAnswerList();
        _learnMachineView2.default.showPureAnswers(answers);
    },
    showAllTranslations: function showAllTranslations() {
        this.showPureAnswers();
        this.getYandexTranslation();
        this.getGoogleMeaning();
    },
    startLearning: function startLearning() {
        var lastWord = parseInt(document.getElementById('maxRange').value);
        var firstWord = parseInt(document.getElementById('minRange').value);
        var orderValue = document.getElementById('order').value;
        if (firstWord < 0 || lastWord > 25000) {
            _learnMachineView2.default.showNotification('range of words is not correct');
            return;
        }
        if (!(orderValue === 'random' || orderValue === 'sequential')) {
            _learnMachineView2.default.showNotification('Order is not random nor sequential');
            return;
        }
        (0, _storage.saveOptions)(firstWord, lastWord, orderValue);
        learningMachine.setUserData((0, _storage.getData)());
        learningMachine.setNextWordNumber();
        learningMachine.downloadWords().then(function () {
            controller.getQuestion();
        });
        this.showUserPool();
        _learnMachineView2.default.toggleBlock('words', 'block', true);
        _learnMachineView2.default.toggleBlock('preferences', 'block', false);
        _learnMachineView2.default.toggleBlock('learningNotification');
    },
    getQuestion: function getQuestion() {
        if (learningMachine.getCurrentNumber()) {
            learningMachine.getQuestion().then(function (questionWord) {
                var number = learningMachine.getCurrentNumber();
                var wordInPool = learningMachine.findWordInPool(number);
                if (wordInPool) {
                    _learnMachineView2.default.showWordStatistics(wordInPool);
                } else {
                    _learnMachineView2.default.showWordStatistics('Difficulty is ' + (number / 10000 * 100).toFixed(2) + '%.<br>U see that word for first time. ');
                }
                _learnMachineView2.default.showQuestion(questionWord);
            });
        } else {
            _learnMachineView2.default.toggleBlock('fullReset', 'inline-block', true);
            _learnMachineView2.default.toggleBlock('updateOptions', 'inline-block', true);
            _learnMachineView2.default.toggleBlock('words');
            _learnMachineView2.default.toggleBlock('preferences', 'block', true);
            _learnMachineView2.default.toggleBlock('startLearning');
            var userData = learningMachine.getUserData();
            _learnMachineView2.default.showPreferencesData(userData.options.firstWord, userData.options.lastWord, userData.options.order);
            _learnMachineView2.default.showNotification('There are no words left. Start another learning process or update range of words (order would be the same).');
        }
    },
    startLearnWord: function startLearnWord() {
        var number = learningMachine.getCurrentNumber();
        if (learningMachine.findWordInPool(number)) {
            learningMachine.updateWordInPool(number, false);
        } else {
            learningMachine.addWordToPool();
        }
        learningMachine.setNextWordNumber();
        (0, _storage.saveSession)(learningMachine.getUserData());
        _learnMachineView2.default.clearInput();
        _learnMachineView2.default.clearTranslations();
        this.getQuestion();
        this.updatePoolStatistics();
    },
    tryToGuessWord: function tryToGuessWord() {
        var word = document.getElementById('answerWord').value;
        if (learningMachine.checkAnswer(word)) {
            (0, _storage.saveSession)(learningMachine.getUserData());
            _learnMachineView2.default.clearInput();
            _learnMachineView2.default.clearTranslations();
            this.getQuestion();
            this.updatePoolStatistics();
            _learnMachineView2.default.showNotification('Answer is correct');
        } else {
            _learnMachineView2.default.showNotification('Answer is incorrect');
        }
    },
    skipWord: function skipWord() {
        learningMachine.skipWord();
        (0, _storage.saveSession)(learningMachine.getUserData());
        _learnMachineView2.default.clearInput();
        _learnMachineView2.default.clearTranslations();
        this.getQuestion();
        this.updatePoolStatistics();
    },
    fullReset: function fullReset() {
        localStorage.clear();
        _learnMachineView2.default.toggleBlock('fullReset');
        _learnMachineView2.default.toggleBlock('updateOptions');
        _learnMachineView2.default.toggleBlock('learningNotification');
        _learnMachineView2.default.toggleBlock('preferences');
        _learnMachineView2.default.toggleBlock('startLearning', 'inline-block', true);
        this.startLearning();
    },
    updateUserOptions: function updateUserOptions() {
        var oldUserData = learningMachine.getUserData();
        var newMinRange = parseInt(document.getElementById('minRange').value);
        var newMaxRange = parseInt(document.getElementById('maxRange').value);
        var oldMinRange = oldUserData.options.firstWord;
        var oldMaxRange = oldUserData.options.lastWord;
        if (newMinRange > oldMinRange) {
            _learnMachineView2.default.showNotification('Your first word should be equal or less than ' + oldMinRange);
        } else if (newMaxRange < oldMaxRange) {
            _learnMachineView2.default.showNotification('Your last word should be equal or more than ' + oldMaxRange);
        } else if (newMinRange === oldMinRange && newMaxRange === oldMaxRange || !newMinRange || !newMaxRange) {
            _learnMachineView2.default.showNotification('You should declare new minimum and maximum ranges');
        } else if (newMinRange < 1) {
            _learnMachineView2.default.showNotification('First word number cannot be less than 1');
        } else if (newMaxRange > 25000) {
            _learnMachineView2.default.showNotification('Last word number cannot exceed 25,000');
        } else {
            var oldStorageData = (0, _storage.getData)();
            oldStorageData.options.firstWord = newMinRange;
            oldStorageData.options.lastWord = newMaxRange;
            (0, _storage.updateUserData)(oldStorageData);
            _learnMachineView2.default.toggleBlock('startLearning', 'inline-block', true);
            _learnMachineView2.default.toggleBlock('preferences');
            _learnMachineView2.default.toggleBlock('fullReset');
            _learnMachineView2.default.toggleBlock('updateOptions');
            _learnMachineView2.default.toggleBlock('words', 'block', true);
            learningMachine.setUserData((0, _storage.getData)());
            learningMachine.setNextWordNumber();
            (0, _storage.saveSession)(learningMachine.getUserData());
            this.getQuestion();
        }
    },
    showUserPool: function showUserPool() {
        var readyWordsCount = learningMachine.calculateReadyWordsInPool();
        var newWordsCount = learningMachine.calculateNumberOfWordsInPool(0, 3);
        var mediumWordsCount = learningMachine.calculateNumberOfWordsInPool(4, 6);
        var oldWordsCount = learningMachine.calculateNumberOfWordsInPool(7, 8);
        var superOldWordsCount = learningMachine.calculateNumberOfWordsInPool(9, 9);
        var maxOldWordsCount = learningMachine.calculateNumberOfWordsInPool(10);
        var knownWordsCount = learningMachine.getKnownWordsCount();
        var data = 'Ready words: ' + readyWordsCount + '.<br>\n                        New words: ' + newWordsCount + '.<br>\n                        Medium words: ' + mediumWordsCount + '.<br>\n                        Old words: ' + oldWordsCount + '.<br>\n                        Very old words: ' + superOldWordsCount + '.<br>\n                        Max old words: ' + maxOldWordsCount + '.<br>\n                        All known words: ' + knownWordsCount;
        _learnMachineView2.default.showPoolStatistics(data);
    },
    updatePoolStatistics: function updatePoolStatistics() {
        if (_learnMachineView2.default.checkPoolStatisticsDisplayState()) {
            this.showUserPool();
        }
    },
    register: function register() {
        var auth = new _authentication2.default();
        var errors = false;
        try {
            var userInfo = auth.gatherUserInfo();
        } catch (err) {
            (0, _authForm.showNotification)(err.message, 'brown');
            errors = true;
        }
        if (errors) return;
        (0, _registration2.default)(userInfo.encryptedAuthorizationData, userInfo.email, userInfo.secretQuestion, userInfo.secretAnswer).then(function () {
            var userInfo = auth.findLocalAuthData();
            auth.saveCredentials(userInfo.name, userInfo.password);
            (0, _authForm.showUserInfoBlock)(userInfo.name);
        }, function (err) {
            (0, _authForm.showNotification)(err.message, 'brown');
        });
    },
    login: function login() {
        return new Promise(function (resolve, reject) {
            var auth = new _authentication2.default();
            try {
                var userInfo = auth.findLocalAuthData();
            } catch (err) {
                (0, _authForm.showNotification)(err.message, 'brown');
                reject(err.message);
            }
            (0, _login2.default)(auth.encryptData(userInfo)).then(function (result) {
                auth.saveCredentials(userInfo.name, userInfo.password);
                (0, _authForm.showUserInfoBlock)(userInfo.name);
                resolve(result);
            }, function (err) {
                (0, _authForm.showNotification)(err.message, 'brown');
                reject(err.message);
            });
        });
    },
    logOut: function logOut() {
        var auth = new _authentication2.default();
        auth.deleteCredentials();
        (0, _authForm.logOut)();
    },
    getSecretQuestion: function getSecretQuestion() {
        var login = document.getElementById('loginReset').value;
        var email = document.getElementById('emailReset').value;
        (0, _resetPassword.getSecretQuestion)(login, email).then(function (secretQuestion) {
            document.getElementById('secretQuestionReset').innerText = secretQuestion;
        }, function (err) {
            (0, _authForm.showNotification)(err, 'brown');
        });
    },
    sendSecretQuestion: function sendSecretQuestion() {
        var login = document.getElementById('loginReset').value;
        var email = document.getElementById('emailReset').value;
        var answer = document.getElementById('secretAnswerReset').value;
        if (!((login || email) && answer)) {
            (0, _authForm.showNotification)('Enter login or email and secret answer', 'brown');
            return;
        }
        (0, _resetPassword.sendSecretAnswer)(login, email, answer).then(function (response) {
            (0, _authForm.showNotification)(response);
        }, function (err) {
            (0, _authForm.showNotification)(err, 'brown');
        });
    },
    listenKeyboardButtons: function listenKeyboardButtons(elem) {
        if (elem.keyCode == 13) {
            this.tryToGuessWord();
        }
    },
    listenButtons: function listenButtons() {
        document.getElementById("startLearnWord").onclick = this.startLearnWord.bind(this);
        document.getElementById("startLearning").onclick = this.startLearning.bind(this);
        document.getElementById('skipWord').onclick = this.skipWord.bind(this);
        document.getElementById('showTranslations').onclick = this.showAllTranslations.bind(this);
        document.getElementById('insertNumber').onclick = learningMachine.setNextWordNumberStraight.bind(learningMachine);
        document.getElementById('answerWord').onkeydown = this.listenKeyboardButtons.bind(this);
        document.getElementById('fullReset').onclick = this.fullReset.bind(this);
        document.getElementById('updateOptions').onclick = this.updateUserOptions.bind(this);
        document.getElementById('calculateUnusedWords').onclick = learningMachine.findUnusedWords.bind(learningMachine);

        document.getElementById('loginBtn').onclick = this.login;
        document.getElementById('startRegistration').onclick = _authForm.showRegistrationBlock;
        document.getElementById('endRegistration').onclick = this.register;
        document.getElementById('logOut').onclick = this.logOut;
        document.getElementById('resetPasswordStart').onclick = _authForm.showResetPasswordBlock;
        document.getElementById('getSecretQuestion').onclick = this.getSecretQuestion;
        document.getElementById('resetPasswordFinish').onclick = this.sendSecretQuestion;
    }
};

window.onload = function () {

    controller.listenButtons();

    if (localStorage.getItem('learnWords')) {
        learningMachine.setUserData((0, _storage.getData)());
        learningMachine.downloadWords().then(function () {
            controller.getQuestion();
            controller.showUserPool();
        });
    } else {
        _learnMachineView2.default.toggleBlock('preferences', 'block', true);
        _learnMachineView2.default.toggleBlock('words');
    }
};

//todO: if pool is overwhelming - don't add new words; start new learning with options

},{"./AjaxRequests/googleApi":3,"./AjaxRequests/login":4,"./AjaxRequests/registration":5,"./AjaxRequests/resetPassword":6,"./AjaxRequests/savedYandexTranslation":7,"./AjaxRequests/yandexApi":8,"./Model/Parse/google":9,"./Model/Parse/yandex":10,"./Model/authentication.js":11,"./Model/learningMachine":12,"./Model/storage":13,"./View/authForm":15,"./View/learnMachineView":16,"./View/translations":17,"whatwg-fetch":1}]},{},[18])


//# sourceMappingURL=main.compiled.js.map
