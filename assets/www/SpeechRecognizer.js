/**
 *  SpeechRecognizer.js
 *  Speech Recognizer cordova plugin (Android)
 *
 *  @author Colin Turner
 *
 *  MIT Licensed
 */

/**
 * c'tor
 */
function SpeechRecognizer() {
}

/**
 * Initialize
 *
 * @param successCallback
 * @param errorCallback
 */
SpeechRecognizer.prototype.init = function(successCallback, errorCallback) {
     return cordova.exec(successCallback, errorCallback, "SpeechRecognizer", "init", []);
};

/**
 * Recognize speech and return a list of matches
 *
 * @param successCallback
 * @param errorCallback
 * @param reqCode User-defined integer request code which will be returned when recognition is complete
 * @param maxMatches The maximum number of matches to return. 0 means the service decides how many to return.
 * @param promptString An optional string to prompt the user during recognition
 */
SpeechRecognizer.prototype.startRecognize = function(successCallback, errorCallback, reqCode, maxMatches, promptString) {
    return cordova.exec(successCallback, errorCallback, "SpeechRecognizer", "startRecognize", [reqCode, maxMatches, promptString]);
};

/**
 * Load
 */
if(!window.plugins) {
    window.plugins = {};
}
if (!window.plugins.speechrecognizer) {
    window.plugins.speechrecognizer = new SpeechRecognizer();
}

