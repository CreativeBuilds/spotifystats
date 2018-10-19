const Events = require('events');
const eventEmitter = new Events.EventEmitter();
const {
    ipcMain
} = require('electron');

const db = require('./db.js');

let info = {
    eventEmitter,
    currentSong: {
        songLength: 0
    },
    progress_ms: 0,
    isPlaying: false
}

/*

Push all listen events for a day into the database
At the end of the day/new day when a new song plays
Calculate the average of when users play songs/what genres etc
Then push daily stats to database

*/

eventEmitter.on("amountOfSongWatched", (obj)=>{
    console.log("New song has started, calculating total listen time for last song!");
    let progress_ms = obj.progress_ms;
    let skipped_ms = obj.skipped_ms || 0;
    if(obj.skipped_ms){
        progress_ms = progress_ms - obj.skipped_ms;
    }
    db.update("songs",{_id: obj.id}, {$inc:{totalListenTime: Math.round(obj.progress_ms - skipped_ms)}}, {}, (err)=>{
        if(err){
            throw err;
        }
        console.log(obj.progress_ms, obj.songLength, (obj.progress_ms/obj.songLength))
        console.log("User listened to ", Math.round(((obj.progress_ms - skipped_ms)/obj.songLength)*10000)/100, "% of the song!");
        console.log("Updated the song!");
    });
})

eventEmitter.on('newSongPlay', (song) => {
    db.update("songs",{_id:song.body.item.id}, {
        $inc: {plays: 1}
    }, (err, numAffected, affectedDocuments, upsert)=>{
        if(err){
            throw err;
        } else {
            // console.log(numAffected, affectedDocuments, upsert)
            db.songs.find({_id:song.body.item.id}, (err, some) => {
                if(err){
                    throw err;
                }
            })
        }
    })
    db.update("stats",{_id:"songPlays"}, {$inc: {plays: 1}}, {}, ()=>{})
})


eventEmitter.on("play", ()=>{
    db.update("stats",{_id: "plays"}, {$inc:{total: 1}}, (err)=>{
        if(err) throw err;
    })
    db.stats.find({_id: "plays"}, (err, some)=>{
        if(err) throw err;
        if(some.length === 0) return;
        let plays = some[0].total;
        console.log("User has played a total of "+plays+ " times!");
    })
})
eventEmitter.on("pause", ()=>{
    db.update("stats", {_id: "pauses"}, {$inc:{total: 1}}, (err)=>{
        if(err) throw err;
    })
    db.stats.find({_id: "pauses"}, (err, some)=>{
        if(err) throw err;
        if(some.length === 0) return;
        let pauses = some[0].total;
        console.log("User has paused a total of "+pauses+ " times!");
    })
})

eventEmitter.on('newSong', (currentlyPlaying) => {
    if (!currentlyPlaying) {
        return;
    }
    let body = currentlyPlaying.body;

    if(info.progress_ms !== 0 && info.isPlaying !== currentlyPlaying.body.is_playing){
        // User either paused or played
        let isPlaying = currentlyPlaying.body.is_playing;
        info.isPlaying = currentlyPlaying.body.is_playing;
        if(isPlaying){
            eventEmitter.emit("play")
        } else {
            eventEmitter.emit("pause")
        }
    }

    if (!info.currentSong.name || body.item.name !== info.currentSong.name) {
        // Get the information of the old song before updating
        
        if(info.currentSong.songLength !== 0){
            eventEmitter.emit("amountOfSongWatched", {
                progress_ms: info.progress_ms,
                songLength: info.currentSong.songLength,
                id: info.currentSong.id,
                body
            })
        }

        if(body.item.name !== info.currentSong.name){
            // Song is not the same! TODO figure out difference between reverse and skip
        }

        info.currentSong = {
            name: body.item.name,
            artists: body.item.artists,
            album: body.item.album,
            uri: body.item.uri,
            id: body.item.id,
            songLength: body.item.duration_ms,
            albumImage: body.item.album.images[0].url
        }
        info.progress_ms = body.progress_ms;
        info.isPlaying = body.is_playing;
        eventEmitter.emit('newSongPlay', currentlyPlaying);

        // User is still listening to the same song, check to see if the user is listening
        // If they are, determine if they have advanced in the song for more than 2 seconds
    } else if (body.is_playing) {
        if(info.currentSong.songLength === 0){
            return;
        }
        if (body.progress_ms - info.progress_ms > 4000) {
            eventEmitter.emit('skippedSameSong', body.progress_ms - info.progress_ms)
            let skipped_ms = info.currentSong.skipper_ms || 0;
            // Adds the amount of time skipped to a variable called skipped_ms
            info.currentSong.skipped_ms = skipped_ms + (body.progress_ms - info.progress_ms);
        } else if (body.progress_ms - info.progress_ms < 0) {
            // User went backwards, may have skipped, may have restarted the song
            if (body.progress_ms <= 4000) {
                // This should count as a new play
                eventEmitter.emit("amountOfSongWatched", {
                    progress_ms: info.progress_ms,
                    songLength: info.currentSong.songLength,
                    id: info.currentSong.id,
                    body
                })
                eventEmitter.emit('newSongPlay', currentlyPlaying);
            } else {
                // User just went backwards in the song manually
                eventEmitter.emit('reversedSameSong', body.progress_ms - info.progress_ms);
                let skipped_ms = info.currentSong.skipper_ms || 0;
                // Adds the amount of time skipped to a variable called skipped_ms
                info.currentSong.skipped_ms = skipped_ms + (body.progress_ms - info.progress_ms);
            }
        }

        info.progress_ms = body.progress_ms;

    }


})

module.exports = eventEmitter;