
// placeholder for Wolfram Alpha API key
var appid = null;
var isTTS = true;
var sms = null;
var oauth = null;
var localStoreKey = "anna.twitter.oauth";
var twitterLogin = false;

var oauthOptions = { 
        consumerKey: 'YX79bWjQDih6xgLu9PsfLg',
        consumerSecret: 'r0mmsRMQR8MGF16ZUmatGN3SoXZ6PGzjkPRPxBQVY',
        callbackUrl: 'http://simonmacdonald.com/anna/oauth' 
};

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
    sms = cordova.require("cordova/plugin/smsplugin");
    
    oauth = OAuth(oauthOptions);
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
                processCommand(respObj.speechMatches.speechMatch[0]);
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

function processCommand(searchTerm) {
    displayQA(searchTerm, 'triangle-isosceles');

    // Strip Anna from the question if the user uses the programs name.
    searchTerm = stripName(searchTerm);
    
    // determine what action is being asked for
    if (is(/(^text)|(^message)/, searchTerm)) {
        console.log("I've been asked to send a text");
        sendText(searchTerm);
    } else if (is(/(^tweet)/, searchTerm)) {
        console.log("I've been asked to send a tweet");
        sendTweet(searchTerm);
    } else {
        doSearch(searchTerm);
    }
}

function is(expression, searchTerm) {
    return expression.test(searchTerm);
}

function sendTweet(searchTerm) {
    var theTweet = searchTerm.replace(/(^tweet )/, '');
    console.log("Tweet = " + theTweet);
    
    console.log("get twitter auth");
    var storedAccessData, rawData = localStorage.getItem(localStoreKey);
    if (!twitterLogin && rawData !== null) {
        loginToTwitter(theTweet);
    } else if (!twitterLogin) {
        getAuth(theTweet);
    } else {
        twitterPost(theTweet);
    }
}

var twitterPost = function(message) {
    oauth.post('https://api.twitter.com/1/statuses/update.json',
        { 'status' : message,  // jsOAuth encodes for us
          'trim_user' : 'true' },
        function(data) {
            var entry = JSON.parse(data.text);
                                            
            console.log("AppLaudLog: Tweet id: " + entry.id_str + " text: " + entry.text);
            //data_html = data_html.concat('<p>Id: ' + entry.id_str + '<br>Text: ' 
            //        + entry.text + '</p>');
        },
        function(data) { 
            console.log("AppLaudLog: Error during tweet " + data.text);
        }
    );  
}

function loginToTwitter(message) {
    var rawData = localStorage.getItem(localStoreKey);
    var storedAccessData = JSON.parse(rawData);                 
    oauthOptions.accessTokenKey = storedAccessData.accessTokenKey;
    oauthOptions.accessTokenSecret = storedAccessData.accessTokenSecret;
      
    console.log("AppLaudLog: Attemping oauth with stored token key/secret");           
    oauth.get('https://api.twitter.com/1/account/verify_credentials.json?skip_status=true',
            function(data) {
                var entry = JSON.parse(data.text);
                console.log("AppLaudLog: Success getting credentials. screen_name: " + entry.screen_name);
                twitterLogin = true;
                //twitterPost(message);
                oauth.post('https://api.twitter.com/1/statuses/update.json',
                    { 'status' : message,  // jsOAuth encodes for us
                      'trim_user' : 'true' },
                    function(data) {
                        var entry = JSON.parse(data.text);
                                                        
                        console.log("AppLaudLog: Tweet id: " + entry.id_str + " text: " + entry.text);
                        //data_html = data_html.concat('<p>Id: ' + entry.id_str + '<br>Text: ' 
                        //        + entry.text + '</p>');
                    },
                    function(data) { 
                        console.log("AppLaudLog: Error during tweet " + data.text);
                    }
                );  
            },
            function(data) { 
                //alert('Error with stored user data. Re-start authorization.');
                oauthOptions.accessTokenKey = '';
                oauthOptions.accessTokenSecret = '';
                localStorage.removeItem(localStoreKey);
                console.log("AppLaudLog: No Authorization from localStorage data"); 
                getAuth();
            }
    );
}

function getAuth(message) {
    // Set childBrowser callback to detect our oauth_callback_url
    if (typeof window.plugins.childBrowser.onLocationChange !== "function") {
        window.plugins.childBrowser.onLocationChange = function(loc){
            console.log("AppLaudLog: onLocationChange : " + loc);
  
            // If user hit "No, thanks" when asked to authorize access
            if (loc.indexOf("http://www.your-callback-url.com/?denied") >= 0) {
                //$('#oauthStatus').html('<span style="color:red;">User declined access</span>');
                window.plugins.childBrowser.close();
                return;
            }

            // Same as above, but user went to app's homepage instead
            // of back to app. Don't close the browser in this case.
            if (loc === "http://www.your-apps-homepage.com/") {
                //$('#oauthStatus').html('<span style="color:red;">User declined access</span>');
                return;
            }
            
            // The supplied oauth_callback_url for this session is being loaded
            if (loc.indexOf("http://simonmacdonald.com/anna/oauth") >= 0) {
                var index, verifier = '';            
                var params = loc.substr(loc.indexOf('?') + 1);
                
                params = params.split('&');
                for (var i = 0; i < params.length; i++) {
                    var y = params[i].split('=');
                    if(y[0] === 'oauth_verifier') {
                        verifier = y[1];
                    }
                }
           
                // Exchange request token for access token
                oauth.get('https://api.twitter.com/oauth/access_token?oauth_verifier='+verifier+'&'+requestParams,
                        function(data) {               
                            var accessParams = {};
                            var qvars_tmp = data.text.split('&');
                            for (var i = 0; i < qvars_tmp.length; i++) {
                                var y = qvars_tmp[i].split('=');
                                accessParams[y[0]] = decodeURIComponent(y[1]);
                            }
                            console.log('AppLaudLog: ' + accessParams.oauth_token + ' : ' + accessParams.oauth_token_secret);
                            //$('#oauthStatus').html('<span style="color:green;">Success!</span>');
                            //$('#stage-auth').hide();
                            //$('#stage-data').show();
                            oauth.setAccessToken([accessParams.oauth_token, accessParams.oauth_token_secret]);
                            
                            // Save access token/key in localStorage
                            var accessData = {};
                            accessData.accessTokenKey = accessParams.oauth_token;
                            accessData.accessTokenSecret = accessParams.oauth_token_secret;
                            console.log("AppLaudLog: Storing token key/secret in localStorage");
                            localStorage.setItem(localStoreKey, JSON.stringify(accessData));
                            
                            window.plugins.childBrowser.close();
                            // we are authorized so login
                            loginToTwitter(message);
                    },
                    function(data) { 
                        //alert('Error : No Authorization'); 
                        console.log("AppLaudLog: 1 Error " + data); 
                        //$('#oauthStatus').html('<span style="color:red;">Error during authorization</span>');
                    }
                );
            }
        };  
    } // end if
    oauth.get('https://api.twitter.com/oauth/request_token',
            function(data) {
                requestParams = data.text;
                console.log("AppLaudLog: requestParams: " + data.text);
                window.plugins.childBrowser.showWebPage('https://api.twitter.com/oauth/authorize?'+data.text, 
                        { showLocationBar : false });                    
            },
            function(data) { 
                alert('Error : No Authorization'); 
                console.log("AppLaudLog: 2 Error " + data); 
                $('#oauthStatus').html('<span style="color:red;">Error during authorization</span>');
            }
    );
}

function sendText(searchTerm) {
    var result = searchTerm.replace(/(^text )|(^message )/, '');
    console.log("result = " + result);
    var words = result.split(' ');
    var options = new ContactFindOptions();
    options.filter = words[0] + " " + words[1];
    options.multiple=true; 
    console.log("name = " + options.filter);
    var message = result.substring(options.filter.length+1);
    console.log("message = " + message);
    
    navigator.contacts.find(["displayName", "name", "nickname", "phoneNumbers"], function(contacts) {
        console.log("contact success");
        console.log("length of results = " + contacts.length);
        // look for a mobile phone number
        for (var i=0; i<contacts.length; i++) {
            Log.d(LOG_TAG, "Found: " + contacts[i].displayName);
        }
// We'd send the SMS here if we have a phone number for the contact        
//    sms.send(contacts[i].phoneNumbers[0], message, function() {
//        console.log("message sent");
//    }, function() {
//        console.log("message not sent");
//    });
    }, function() {
        console.log("contact failure");
        speak("I couldn't find a contact named " + options.filter);
    }, options);    
}

function displayQA(searchTerm, className) {
    var qDiv = document.getElementById("conversation");
    qDiv.innerHTML = qDiv.innerHTML + '<p class="' + className + '">' + searchTerm + '</p>';
    window.scrollTo(0, document.body.scrollHeight);
}

function stripName(searchTerm) {
    var anna = /^anna/;
    if (anna.test(searchTerm.toLowerCase())) {
        searchTerm = searchTerm.substring(4);
        console.log("searchterm = " + searchTerm);
    }
    return searchTerm;
}

function doSearch(searchTerm) {
    console.log("In search");
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
                        displayQA(res, 'triangle-right top');
                        speak(res);
                        break;
                    }
                }
            } else {
                displayQA("I'm sorry I didn't understand", 'triangle-right top');
                speak("I'm sorry I didn't understand");
            }
        }
    }
    console.log("asking wolfram alpha");
    request.send();
}
