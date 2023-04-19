const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./client3.json')
const Console = require('console')
const axios = require("axios");

const app = express()
app.use(express.static(__dirname+'/public'));
const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];
Console.log(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

const githubClientId='a3e7d14b41b3e15c6f1c';
const githubSecret='cb51381cc82a12d146f4aa2751b3e2b25396e73b';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;
app.set('view engine', 'ejs');
var access_token = "";



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
        if(req.data.access_token)
        {
            res.send(
                `<html>
  <head>
    <title>Github OAuth</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"> <!-- load bulma css -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"> <!-- load fontawesome -->
      <style>
          body        { padding-top:70px; }
      </style>
  </head>
  <body>
    <div class="container">
      <div class="jumbotron">
          <h1 class="text-primary  text-center"><span class="fa fa-github"></span> Github Information</h1>
          <div class="row">
            <div class="col-sm-6">
              <div class="well">
                <p>
                  <strong>Name</strong>: ${req.data.name}<br>
                  <strong>Username</strong>: ${req.data.login}<br>
                    <strong>Company</strong>:  ${req.data.company}<br>
                    <strong>Bio</strong>: ${req.data.bio}
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  </body>
</html>`



            )
        }
        const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
        oauth2.userinfo.v2.me.get(function (err, response) {
            if (err) {
                console.log("NIESTETY BLAD")
                console.log(err);
            } else {
                loggedUser = response.data.name;
                console.log(response.data);

            }
            res.send(
                "<img src=" + '"'+response.data.picture +'"' + " alt=" + '"'+response.data.name +'"' + " style=" + '"'+ "width:100px;height:100px;" +'"' + " />" +
                "<br>"+
                "Logged in: "+loggedUser+
                + "<br>" +
            "<a href=" + '"'+"/logout"+'"' + ">Logout</a>");

        });
    }
})
app.get('/auth/github/callback', function (req, res) {
    // The req.query object has the query params that were sent to this route.
    const requestToken = req.query.code

    axios({
        method: 'post',
        url: `https://github.com/login/oauth/access_token?client_id=${githubClientId}&client_secret=${githubSecret}&code=${requestToken}`,
        // Set the content type header, so that we get the response in JSON
        headers: {
            accept: 'application/json'
        }
    }).then((response) => {
        access_token = response.data.access_token
        res.redirect('/success');
    })
});


app.get('/success', function(req, res) {

    axios({
        method: 'get',
        url: `https://api.github.com/user`,
        headers: {
            Authorization: 'token ' + access_token
        }
    }).then((response) => {
        authed = true;
        res.data = response.data;
        res.redirect('/login');
    })
});

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