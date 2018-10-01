const fs = require('fs');

// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Creates a client
const client = new textToSpeech.TextToSpeechClient();

const AUDIO = "audio";
const TEAMS = "teams";

function download(dir, filename, text) {

    const file = dir + "/" + filename + ".wav";
    if (fs.existsSync(file)) return console.log(filename + "already exists");
    // Construct the request
    const request = {
        input: {text: text},
        // Select the language and SSML Voice Gender (optional)
        voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL', name: 'en-US-Wavenet-C'},
        // Select the type of audio encoding
        audioConfig: {audioEncoding: 'LINEAR16'},
    };

    // Performs the Text-to-Speech request
    client.synthesizeSpeech(request, (err, response) => {
        if (err) return console.error('ERROR:', err);
        // Write the binary audio content to a local file
        fs.writeFile(file, response.audioContent, 'binary', err => {
        if (err) return console.error('ERROR:', err);
        console.log('Audio content written to file:', file);
        });
    });

}

var speeches = JSON.parse(fs.readFileSync("speeches.json"));
var speechex = JSON.parse(fs.readFileSync("speechex.json"));

for (var i in speeches) {
    download(AUDIO, i, speeches[i]);
}

for (var j in speechex) {
    download(TEAMS, j, speechex[j]);
}


//download(AUDIO,"0_to_0","0:0");