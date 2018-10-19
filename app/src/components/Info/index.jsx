import React, {Component} from 'react'
import styles from './styles.css'

export default class Link extends Component {

    constructor(props){
        super(props);
        this.props = props;
        let {eventHandler} = props;
        eventHandler.on('newSong', ()=>{
            let songProgress = document.getElementById('songProgress').children[0]
            songProgress.style.transition = "width 0s";
            songProgress.style.width = "100%";
            songProgress.style.transition = "width 1s";
        })
    }

    render () {
      console.log(styles);
        console.log(this.props.currentSong.songLength/1000, Math.round(this.props.progress_ms/1000));
        return (
            // <div>Current Song Info: {this.props.currentSong.body} <br/> Currently At: {Math.round(this.props.progress_ms/1000)}s / {Math.round(this.props.currentSong.songLength / 1000)}</div>
            <div style={{"position":"relative", "min-height":"300px","min-width":"300px"}}>
                <div id="imageOverlay">
                    <div id="songProgress">
                        <div style={{"width":(Math.round(this.props.progress_ms/1000) / Math.round(this.props.currentSong.songLength/1000))*100 +"%"}}></div>
                    </div>
                    <img src={this.props.currentSong.albumImage} width={300} height={300}/>
                </div>
                <div id="songInfo">
                    {this.props.currentSong.name} by {this.props.currentSong.artists[0].name}
                </div>
            </div>
        )
    }
}
