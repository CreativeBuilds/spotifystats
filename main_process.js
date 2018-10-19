// Basic init
const electron = require('electron')
const ipcMain = electron.ipcMain;
const {
    app,
    BrowserWindow
} = electron
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const config = require('./config');
var SpotifyWebApi = require('spotify-web-api-node');

const Events = require('events');
var events = new Events.EventEmitter();

var spotifyApi = new SpotifyWebApi({
    clientId: config.client_id,
    clientSecret: config.client_secret,
    redirectUri: 'http://localhost:4444/callback'
  });

  let mainWindow
  let isloading = false;
  events.on('spotifyLoggedIn', ()=>{
      if(isloading) return;
      setInterval(()=>{
          isloading = true;
        spotifyApi.getMyCurrentPlayingTrack().then(obj => {
            // console.log(obj.body);
            mainWindow.webContents.send('newSpotifyObj', obj);
        })
      },2000)
  })

const express = require('express')
const server = express()
const port = 4444

let currentCode;

ipcMain.on('started', ()=>{
    console.log("Got started!");
    if(!currentCode || !mainWindow) return
    mainWindow.webContents.send("loggedIn", currentCode);   
})

server.get('/login', (req, res) => res.redirect(`https://accounts.spotify.com/authorize?client_id=${config.client_id}&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A4444%2Fcallback&scope=user-read-playback-state user-read-recently-played`))

server.get('/callback', (req, res) => {
    let code = req.query.code;
    console.log("In callback");
    let http = new XMLHttpRequest();
    http.onload = () => {
        console.log("On load", http.status);
        if (http.status >= 200) {
            currentCode = JSON.parse(http.responseText);
            console.log("Logged in!")
            mainWindow.webContents.send('ping');
            console.log('Sending info to client')
            mainWindow.webContents.send('loggedIn', currentCode)
            spotifyApi.setAccessToken(currentCode.access_token);
            // res.sendFile(__dirname+"/app/index.html")
            events.emit('spotifyLoggedIn')
        } else {
            console.log(http.status);
        }
    };
    http.open('POST', 'https://accounts.spotify.com/api/token?grant_type=authorization_code&code='+code+'&redirect_uri=http%3A%2F%2Flocalhost%3A4444%2Fcallback');
    let baseString = `${config.client_id}:${config.client_secret}`;
    http.setRequestHeader("Authorization", `Basic `+(new Buffer(config.client_id + ':' + config.client_secret).toString('base64')))
    http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    http.send()

    // request.post(`https://accounts.spotify.com/api/token`).set('accept','json').set('Content-Type', 'application/json').send(JSON.stringify({grant_type:"authorization_code",code,redirect_uri:"http://localhost:4444",client_id:config.client_id,client_secret:config.client_secret})).end((err, response) =>{
    //     console.log('got to end')
    //     if(err){
    //         throw err;
    //     } else {
    //         console.log("Wowzers")
    //         console.log(response);
    //         // res.sendFile(`${__dirname}/app/index.html`)
    //     }
    // })
})

server.listen(port, () => console.log(`Example app listening on port ${port}!`))



// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname)

// To avoid being garbage collected


app.on('ready', () => {

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    })

    mainWindow.loadURL(`file://${__dirname}/app/index.html`);



})