
// placeholder for Wolfram Alpha API key
var appid = null;
var isTTS = true;

// Call onDeviceReady when PhoneGap is loaded.
//
// At this point, the document has loaded but phonegap.js has not.
// When PhoneGap is loaded and talking with the native device,
// it will call the event `deviceready`.
//
function init() {
    console.log("Got body load event");
    document.addEventListener("deviceready", onDeviceReady, false);
}

// PhoneGap is loaded and it is now safe to make calls PhoneGap methods
//
function onDeviceReady() {
    console.log("Got on device ready event");
    window.plugins.tts.startup(startupWin, function(){
        console.log("There is no TTS service");
        isTTS = false;
    });
    window.plugins.speechrecognizer.init(speechReady, function() {
        console.log("There is no Spech Rec service");
        navigator.notification.alert("There is no speech recognition service available.",
            function() {
                navigator.app.exitApp();
            }, "No Speech Recognition", "Exit");
        isSpeech = false;
    });
}

function onResume() {
    console.log("I've been resumed!");

    // Check for a new API key
    window.plugins.applicationPreferences.get("api_key", function(value) {
        if (value != null && value != "") {
            appid = value;
        } else {
            navigator.notification.confirm("A WolframAlpha API key is required.",
                function(btnIdx) {
                    if (btnIdx == 1) {
                        document.location="https://developer.wolframalpha.com/portal/apisignup.html";
                    } else if (btnIdx == 2) {
                        window.plugins.applicationPreferences.show("com.simonmacdonald.anna.QuickPrefsActivity");
                    } else {
                        navigator.app.exitApp();
                    }
                }, "API Key", "Get Key,Enter Key,Exit");
        }
    });

    // Check to see if TTS should be used
    window.plugins.applicationPreferences.get("use_tts", function(value) {
        if (value == "false") {
            isTTS = false;
        } else {
            isTTS = true;
        }
    });
}

function gotKey(value) {
    if (value != null && value != "") {
        appid = value;
    } else {
        window.plugins.applicationPreferences.show("com.simonmacdonald.anna.QuickPrefsActivity");
    }
}

function startupWin(result) {
    // When result is equal to STARTED we are ready to play
    if (result == TTS.STARTED) {
        window.plugins.tts.getLanguage(win, fail);
    }
}

function addLang(loc, lang) {
    var langs = document.getElementById('langs');
    var langOption = document.createElement("OPTION")
    langOption.innerText = lang;
    langOption.value = loc;
    langs.options.add(langOption);
}

function changeLang() {
    var yourSelect = document.getElementById('langs');
    console.log("change lang to " + yourSelect);
    window.plugins.tts.setLanguage(yourSelect.options[yourSelect.selectedIndex].value, win, fail);
}

function recognizeSpeech() {
    var requestCode = 1234;
    var maxMatches = 5;
    var promptString = "Please say a command";
    window.plugins.speechrecognizer.startRecognize(speechOk, speechFail, requestCode, maxMatches, promptString);
}

function speechOk(result) {
    var match, respObj, requestCode;
    if (result) {
        respObj = JSON.parse(result);
        console.log(result);
        if (respObj) {
            if (respObj.speechMatches.speechMatch.length > 0) {
                console.log("Best match: " + respObj.speechMatches.speechMatch[0]);
                doSearch(respObj.speechMatches.speechMatch[0]);
            }
        }
    }
}

function speechFail(m) {
    console.log("***********");
    console.log("***********");
    console.log("***********");
    console.log("speechFail: " + m.toString());
}

function speechReady() {
    console.log("Speech is okay");

    // add resume listenter
    document.addEventListener("resume", onResume, false);

    // add search button listener
    document.addEventListener("searchbutton", recognizeSpeech, false);

    // check for WolframAlpha key
    window.plugins.applicationPreferences.get("api_key", gotKey);
}

function win(result) {
    console.log(result);
}

function fail(result) {
    console.log("Error = " + result);
}

function speak(msg) {
    if (isTTS) {
        window.plugins.tts.speak(msg);
    }
}

function doSearch(searchTerm) {
    console.log("In search");
    var qDiv = document.getElementById("conversation");
    qDiv.innerHTML = qDiv.innerHTML + '<p class="triangle-isosceles">' + searchTerm + '</p>';
    window.scrollTo(0, document.body.scrollHeight);
    console.log("The question is = " + searchTerm);
    var request = new XMLHttpRequest();
    request.open("GET", "http://api.wolframalpha.com/v2/query?input=" + searchTerm + "&appid="+appid);
    request.onreadystatechange = function() {
        if(request.readyState == 4) {
            console.log("*"+request.responseText+"*");
            var querySuccess = request.responseXML.getElementsByTagName("queryresult")[0].getAttributeNode("success").nodeValue;
            if (querySuccess == "true") {
                var results = request.responseXML.getElementsByTagName("pod");
                for (i=0; i<results.length; i++) {
                    if (results[i].getAttributeNode("primary") != null && results[i].getAttributeNode("primary").nodeValue == "true") {
                        var res = results[i].getElementsByTagName("subpod")[0].getElementsByTagName("plaintext")[0].childNodes[0].nodeValue;
                        res = res.replace(/\|/g, "");
                        qDiv.innerHTML = qDiv.innerHTML + '<p class="triangle-right top">' + res + '</p>';
                        window.scrollTo(0, document.body.scrollHeight);
                        speak(res);
                        break;
                    }
                }
            } else {
                qDiv.innerHTML = qDiv.innerHTML + "<p class='triangle-right top'>I'm sorry I didn't understand.</p>";
                window.scrollTo(0, document.body.scrollHeight);
                speak("I'm sorry I didn't understand");
            }
        }
    }
    console.log("asking wolfram alpha");
    request.send();
}
