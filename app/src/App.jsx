import React, {Component} from 'react'
import {render} from 'react-dom'
import Logo from './components/Logo/'
import Link from './components/Link/'
import Info from './components/Info/'

import ElectronImg from './assets/electron.png'
import ReactImg from './assets/react.png'
import WebpackImg from './assets/webpack.png'

import {ipcRenderer, remote} from 'electron';
import { doesNotThrow } from 'assert';
import { url } from 'inspector';

const Events = require('events');



const logos = [
    ElectronImg,
    ReactImg,
    WebpackImg
]
let win
let currentCode

ipcRenderer.on('ping', ()=>{console.log('Pong')})


export default class App extends Component {

    constructor(props){
        super(props);
        this.eventHandler = new Events.EventEmitter();
        this.state = {
            currentCode: {},
            currentSong: {
                songLength: 0,
                albumImage: "https://i.imgur.com/AVXt1WR.png",
                artists: [
                    {
                        name:""
                    }
                ]
            },
            progress_ms: 0,
            isPlaying: false
        }
        
        
        this.eventHandler.on('newSong', (event, obj)=>{
            console.log("New song", event, obj);
        })
        this.handleSongObj = (currentlyPlaying) => {
            console.log(currentlyPlaying);
            if(!currentlyPlaying){
                return;
            }
            let body = currentlyPlaying.body;

            if(!this.state.currentSong.name || body.item.name !== this.state.currentSong.name){
                this.eventHandler.emit('newSong', currentlyPlaying);
                this.setState(()=>{
                    return {
                        currentSong: {
                            name: body.item.name,
                            artists: body.item.artists,
                            album: body.item.album,
                            uri: body.item.uri,
                            songLength: body.item.duration_ms,
                            albumImage: body.item.album.images[0].url
                        },
                        progress_ms: body.progress_ms,
                        isPlaying: body.item.is_playing,
                    }
                })
            // User is still listening to the same song, check to see if the user is listening
            // If they are, determine if they have advanced in the song for more than 2 seconds
            } else if(body.is_playing){
                // More than two seconds on the song have passed in less than one second, user has skipped a portion of the song
                this.setState(()=>{
                    return {
                        progress_ms: body.progress_ms
                    }
                })
                if(body.progress_ms - this.state.progress_ms > 4000){
                    this.eventHandler.emit('skippedSameSong', body.progress_ms - this.state.progress_ms)
                } else if(body.progress_ms - this.state.progress_ms < 0){
                    // User went backwards, may have skipped, may have restarted the song
                    if(body.progress_ms <= 4000){
                        // This should count as a new play
                        this.eventHandler.emit('newSong', currentlyPlaying)
                    } else {
                        // User just went backwards in the song manually
                        this.eventHandler.emit('reversedSameSong', this.state.progress_ms - body.progress_ms)
                    }
                }
                
            }

            
        }
        ipcRenderer.on('newSpotifyObj', (event, info)=>{
            this.handleSongObj(info);
        })
        this.loginPage = () => {
            const BrowserWindow = remote.BrowserWindow;
        
            win = new BrowserWindow({width: 800, height:600});
            win.loadURL('http://localhost:4444/login');
        }
        ipcRenderer.on('loggedIn', (event, currentCode)=>{
            // console.log("got t", t);
            this.setState(()=>{
                return {currentCode}
            })
            if(!win) return;
            win.close();
            
        })
        ipcRenderer.send("started");
    }

    choose() {
        if(Object.keys(this.state.currentCode).length === 0){
            return (<a onClick={()=>{this.loginPage()}}>Login</a>)
        } else if(Object.keys(this.state.currentSong).length !== 0){
            return (<Info {...this.state} eventHandler={this.eventHandler}></Info>)
        } else {
            <div></div>
        }
    }

    render() {
        const logosRender = logos.map( (logo, index) => {
            return <Logo key = {index} src = { logo } />
        })

        return (
            <div style={{"overflow":"hidden","display":"flex","justify-content":"center","align-items":"center","height":"100%"}}>
                <div id="background" style={{"background-image": 'url("'+this.state.currentSong.albumImage+'")'}}></div>
                {this.choose()}
            </div>
        )
    }
}
