const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./client3.json')
const Console = require('console')

const app = express()
app.use(express.static('public'));
const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];
Console.log(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.get('/login', (req, res) => {
    var loggedUser = "";
    if (!authed) {
        // Generate an OAuth URL and redirect there
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        console.log(url)
        res.redirect(url);
    } else {
        const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
        oauth2.userinfo.v2.me.get(function (err, response) {
            if (err) {
                console.log("NIESTETY BLAD")
                console.log(err);
            } else {
                loggedUser = response.data.name;
                console.log(response.data);

            }
            res.send("Logged in: "+loggedUser+"<img src=" + '"'+response.data.picture +'"' + " alt=" + '"'+response.data.name +'"' + " style=" + '"'+ "width:100px;height:100px;" +'"' + " />" + "<br>" +
            "<a href=" + '"'+"/logout"+'"' + ">Logout</a>");

        });
    }
})

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/login')
            }
        });
    }
});

app.get('/logout', (req, res) => {
    authed = false;
    res.redirect('/');
});


const port = process.env.port || 3000
app.listen(port, () => console.log(`Server running at ${port}`));