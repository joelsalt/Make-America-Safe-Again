//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var stored="";

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];

var sql = require('mssql');

sql.close();

var cameras = [];
var users = [];

var videofeeds=[];



///////////////////////////////////////////////////////DB
function updateFromDB(){
  sql.connect("mssql://brendan:1brendan1@masatrump.co4trqkiqsku.us-east-1.rds.amazonaws.com:1433/masa", err => {
  if(err)throw err;
    // ... error checks 
 
    // Query 
 
    new sql.Request().query('SELECT * FROM Users', (err, result) => {
        if(err)throw err;
        //console.log(JSON.stringify(result));
        for(var i=0;i<result.recordsets.length;i++){
          users.push(result.recordsets[i]);
        }
        //console.log("users"+JSON.stringify(users));
    });
    
    new sql.Request().query('SELECT * FROM Cameras', (err, result) => {
        if(err)throw err;
        //console.log(JSON.stringify(result));
        for(var i=0;i<result.recordsets.length;i++){
          cameras.push(result.recordsets[i]);
        }
       // console.log("cameras"+JSON.stringify(cameras));
    });
 
});
 
sql.on('error', err => {
    if(err)throw err;
    
});

}
updateFromDB();
///////////////////////////////////////////



 
io.on('connection', function (socket) {
  
    // socket.on("User_Login")
  
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    socket.image="";
    sockets.push(socket);
    

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });
    
    
    socket.on('User_Login', function(data){
      //console.log("video choices" + JSON.stringify(cameras));
        //console.log("------------------------------------------------------jksfdfdfddsfafdfddfsafdsjfds");
        var usernameCheck = data.username;
        var passwordCheck = data.password;
        //console.log("usernmae shitttt" + data.username + data.password);
        //console.log("usersssssssss" + JSON.stringify(users[0]));
          for(var i =0; i < users[0].length; i++){
           // console.log("username-------------" + users[0][i].username)
            if(users[0][i].username == usernameCheck){
             // console.log("valid username now checking password");
              if(users[0][i].password == passwordCheck){
                console.log("good password log in user")
                socket.emit('Validated', { user: users[0][i], cams: cameras[0] });
                break;
              }
            }
          }
          socket.emit('Invalid', data);
    });
    
    socket.on('User_Register', function(data){
      console.log("user register");
      var username =data.username;
      var password =data.password;
      //console.log("passsssworddddddd" + password);
      //var email = data.email;
      
      // insert into User ('field','field') values (2,'title')
      
      //todo escape username and password
      var sql2 = "INSERT INTO Users (username, password) values ('xxx','zzz')";
      
      sql2=sql2.replace("xxx",username);
      sql2=sql2.replace("zzz",password);
      
      //console.log("the sql query string --> " + sql2);
      
      new sql.Request().query(sql2, (err, result) => {
          if(err)throw err;
      });
    
    });
    
    socket.on('Alert', function(data){
      console.log("ALERT" + JSON.stringify(data));
      broadcast('Alert_Admin',data);
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });
    
    socket.on('vote_up', function(data){
      var positive = 0;
      console.log("vote up data" + JSON.stringify(data));
      var sqlscore = "SELECT * FROM Users WHERE username = 'xxx'";
      sqlscore=sqlscore.replace('xxx', data.user);
      console.log(sqlscore);
      new sql.Request().query(sqlscore , (err, result) => {
          if(err) console.log("error" + sqlscore + err); 
          console.log("result from voteup" + JSON.stringify(result))
          console.log("result 0" + result.recordsets[0][0].positive);
          positive = parseInt(result.recordsets[0][0].positive) ;
          if (isNaN(positive)) positive=0;
          // if(typeof positive != "number"){
          //   positive = 0;
          // }
          positive = positive + 1;
          console.log("positive  " + positive);
            
            var sqlscoreadd = "UPDATE Users SET positive = xxx WHERE username = 'zzz'";
      
            sqlscoreadd=sqlscoreadd.replace('xxx', positive);
            sqlscoreadd=sqlscoreadd.replace('zzz', data.user);
            
            console.log("sql score add" + sqlscoreadd)
            new sql.Request().query(sqlscoreadd, (err, result) => {
                if(err)throw err;
            });
          
      });
      
    });
    
    socket.on('vote_down', function(data){
      var negative = 0;
      console.log("vote up data" + JSON.stringify(data));
      var sqlscore = "SELECT * FROM Users WHERE username = 'xxx'";
      sqlscore=sqlscore.replace('xxx', data.user);
      console.log(sqlscore);
      new sql.Request().query(sqlscore , (err, result) => {
          if(err) console.log("error" + sqlscore + err); 
          console.log("result from voteup" + JSON.stringify(result))
          console.log("result 0" + result.recordsets[0][0].negative);
          negative = parseInt(result.recordsets[0][0].negative);
          if (isNaN(negative)) negative=0;
          // if(typeof negative !== "number"){
          //   negative = 0;
          // }
          negative = negative + 1;
          console.log("positive  " + negative);
            
            var sqlscoreadd = "UPDATE Users SET negative = xxx WHERE username = 'zzz'";
      
            sqlscoreadd=sqlscoreadd.replace('xxx', negative);
            sqlscoreadd=sqlscoreadd.replace('zzz', data.user);
            
            console.log("sql score minus" + sqlscoreadd)
            new sql.Request().query(sqlscoreadd, (err, result) => {
                if(err)throw err;
            });
      });
    });

    socket.on('Profile', function(data){

      new sql.Request().query('SELECT * FROM Users', (err, result) => {
          if(err)throw err;
          //console.log(JSON.stringify(result));
          users = [];
          for(var i=0;i<result.recordsets.length;i++){
            users.push(result.recordsets[i]);
          }
       console.log("PROFILE@@@@@@@@@@@@@@@@@@@@@@@@@@@@" + JSON.stringify(data));
          for(var z=0; z < users[0].length;z++){
            console.log("users 0 z #######################" + users[0][z].username)
            if(users[0][z].username == data){
              console.log("emit profileeeeeeeeeeeeeeeeeeeeeeee");
              socket.emit('Profile_Updated', users[0][z]);
            }
          }          
          console.log("users"+JSON.stringify(users));
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
