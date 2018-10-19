const Datastore = require('nedb');
const path = require('path');
const {app} = require('electron');
let db = {}
let userDataPath = app.getPath('userData');
console.log(path.join(userDataPath, 'stats.json'));
db.songs = new Datastore({filename: path.join(userDataPath, 'users.json'), timestampData: true, autoload: true});
db.listens = new Datastore({filename: path.join(userDataPath, 'listens.json'), timestampData: true, autoload: true});
db.stats = new Datastore({filename: path.join(userDataPath, 'stats.json'), timestampData: true, autoload: true});

db.update = (nameOfDB, query, update, options, callback) => {
    if(!callback && typeof options === "function"){
        callback = options;
        options = {};
    } else if(!options){
        options = {};
    }

    if(!callback){
        callback = ()=>{}
    }
    if(!db[nameOfDB]){
        return callback(new Error("No db with that name!", nameOfDB));
    }

    

    db[nameOfDB].find(query, (err, some)=>{
        if(err){
            return callback(err);
        }
        if(some.length === 0 ){
            // Object already exists update the info
            options.upsert = true;
        }

        db[nameOfDB].update(query, update, options, callback);
    })
}

module.exports = db;