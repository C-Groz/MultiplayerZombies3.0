var connectedUsers = [];
var bullets = [];
var userCounter = 0;
var doorsActive;
var currentDoorCoords;
var enemyRandomSpawnVariable = Math.random();
var enemySpawns = [
    //x   y   l    w   xdev            ydev
    [300, -5, 100, 10, 100, 0], //spawn 0 (top left)
    [1100, -5, 100, 10, 100, 0], //spawn 1 (top right)
    [-5, 300, 10, 100, 0, 100], //spawn 2 (left top)
    [-5, 800, 10, 100, 0, 100], //spawn 3 (left bottom)
    [500, 995, 100, 10, 100, 0], //spawn 4 (bottom left)
    [1300, 995, 100, 10, 100, 0], //spawn 5 (bottom right)
]
var enemies = [
    new Enemy(0, 0, 10, 25, .5),
    new Enemy(2, 1, 10, 25, .5),
]
var roundEnemyAmount;
var round = 1;
var enemiesRemaining = enemies.length;
var playerKills = [];
var spawnsActive = [0, 2];
var timeBetweenEnemies = 1000; 
var lastEnemySpawn = Date.now();
var enemyCounter;
//var gameActive = false;
    
    


var mapData;



function connectedUser(idNum, winL, winW, decX, decY, angle, gun, socketID){
    this.id = idNum; //counter 
    this.index = connectedUsers.length;
    this.winL = winL;
    this.winW = winW;
    this.decX = decX;
    this.decY = decY;
    this.angle = angle;
    this.socketID = socketID;
    this.gun = gun; //index of gun type in guns array in sketch
    this.kills = 0;
}

function Bullet(x, y, angle, damage, velocity, sprayDeviation, playerFired){
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.damage = damage;
    this.velocity = velocity;
    this.sprayDeviation = sprayDeviation;
    this.playerFired = playerFired;
    this.bulletInEnemy = -1;
}

function Enemy(spawn, index, speed, health, damage){
    this.spawn = spawn;
    this.x = enemySpawns[this.spawn][0] + enemySpawns[this.spawn][4] * enemyRandomSpawnVariable;
    this.y = enemySpawns[this.spawn][1] + enemySpawns[this.spawn][5] * enemyRandomSpawnVariable;
    this.index = index;
    this.speed = speed;
    this.health = health;
    this.damage = damage;
    this.initialHealth = this.health;
    this.healthPercent = 100;
    this.bulletInEnemy = -1;
}


var express = require('express');
var app = express();

var server = app.listen(process.env.PORT || 3000);
app.use(express.static('public'));

console.log("My socket server is running");

var socket = require('socket.io');

var io = socket(server);

io.sockets.on('connection', 

    function(socket) {
        console.log('new connection: ' + socket.id);

        userCounter++;

        var playerNum = {num: userCounter, index: connectedUsers.length};
        socket.emit('setPlayerNum', playerNum);

        socket.on('start', function(data){
            //console.log(socket.id + " " + data.winL + " " + data.winW);
            connectedUsers.push(new connectedUser(userCounter, data.winL, data.winW, data.decX, data.decY, 0, 0, socket.id));
        });

        socket.on('drawData', 

        function(data){
            if(connectedUsers[data.index] != null){
                connectedUsers[data.index].decY = data.decY;
                connectedUsers[data.index].decX = data.decX;
                connectedUsers[data.index].angle = data.angle;
                connectedUsers[data.index].gun = data.gunIndex;

            }
            socket.broadcast.emit('playerData', connectedUsers);

            doorData = {
                doorsActive: doorsActive,
                doorCoords: currentDoorCoords,
            }
            roundInfo = {
                roundNum: round,
                enemiesNum: enemiesRemaining
            }
            
            connectedUsers.forEach(element =>{
                playerKills.push(element.kills);
            });

            io.sockets.emit("doorData", doorData);

            io.sockets.emit('bulletsData', bullets);

            io.sockets.emit('enemyData', enemies);

            io.sockets.emit('roundData', roundInfo);

            io.sockets.emit('killData', playerKills);

            updateBullets();
            spawnEnemies();
            if(enemiesRemaining <= 0 && enemies.length == 0 && enemyCounter == roundEnemyAmount){
                newRound();
            }

            playerKills = [];
            
            
        });

        socket.on('bulletFired', 

        function(bulletData){
            if(bulletData.startX != null){
                bullets.push(new Bullet(bulletData.startX, bulletData.startY, bulletData.angle, bulletData.damage, bulletData.velocity, bulletData.sprayDeviation, bulletData.playerFired));
            }
        });

        socket.on('removeDoor', 

        function(doorData){
            for(var i = 0; i < doorsActive.length; i++){
                if(doorsActive[i] == doorData.n){
                    doorsActive.splice(i, 1);
                    doorData.spawns.forEach(element => {
                        spawnsActive.push(element);
                    });
                }
            }
            for(var i = 0; i < currentDoorCoords.length; i++){
                if(currentDoorCoords[i][0] == doorData.n){
                    currentDoorCoords.splice(i, 1);
                }
            }
        });

        socket.once('mapData', 

        function(mapCoords){
            mapData = mapCoords;
            doorsActive = mapCoords.doorsActive;
            currentDoorCoords = mapCoords.doorCoords;
        });

        socket.on('disconnect', function(){
            console.log('new disconnection: ' + socket.id);
            let newUserList = [];
            let removeIndex;
            for(let i = 0; i < connectedUsers.length; i++){
                if(connectedUsers[i].socketID == socket.id){
                    removeIndex = i;
                }
            }
            for(let i = 0; i < removeIndex; i++){
                newUserList.push(connectedUsers[i]);
            }
            for(let i = removeIndex + 1; i < connectedUsers.length; i++){
                newUserList.push(connectedUsers[i]);
                var indexData = {number: connectedUsers[i].number, index: connectedUsers[i].number - 1};
                socket.broadcast.emit('updateIndex', indexData);
            }
            connectedUsers = newUserList;
            
        });
    }
);

//updates bullets and enemies
function updateBullets(){

    if(bullets.length != 0){
        for(var i = 0; i < bullets.length; i++){
            mapData.rectCoords.forEach(element => {
                if(bullets[i] != null){
                    if(rectangleContains(bullets[i].x, bullets[i].y, element[0], element[1], element[2], element[3])){
                        bullets.splice(i, 1);
                    }
                }
            });
            currentDoorCoords.forEach(element => {
                if(bullets[i] != null){
                    if(rectangleContains(bullets[i].x, bullets[i].y, element[1], element[2], element[3], element[4])){
                        bullets.splice(i, 1);
                    }
                }
            });
            enemies.forEach(enemy => {
                if(bullets[i] != null && enemy != null){
                    if(enemyContainsBullet(enemy.x, enemy.y, bullets[i].x, bullets[i].y)){
                        if(enemy.bulletInEnemy != i && bullets[i].bulletInEnemy != enemy.index){
                            enemy.health -= bullets[i].damage;
                            enemy.healthPercent = enemy.health/enemy.initialHealth;
                        }
                        enemy.bulletInEnemy = i;
                        bullets[i].bulletInEnemy = enemy.index;
                    }else if(enemy.bulletInEnemy == i){
                        enemy.bulletInEnemy = -1;
                    }

                    if(enemy.health <= 0){
                        connectedUsers[bullets[i].playerFired].kills++;
                        removeEnemy(enemy.index);
                        console.log("removed Enemy: " + enemy.index);
                    }
                    }



                    
            });

            if(bullets[i] != null){
                bullets[i].x += bullets[i].velocity * Math.cos(bullets[i].angle) + (bullets[i].sprayDeviation * Math.sin(bullets[i].angle));
                bullets[i].y += bullets[i].velocity * Math.sin(bullets[i].angle) - (bullets[i].sprayDeviation * Math.cos(bullets[i].angle));
            }
        }
    }
        
    
}

function bulletBoundaryCollison(bulletX, bulletY){
    mapData.rectCoords.forEach(element => {
        if(rectangleContains(bulletX, bulletY, element[0], element[1], element[2], element[3])){
            return true;
        }
        
    });
    return false;
}

function rectangleContains(x, y, rectX, rectY, rectL, rectW){
    if((x > rectX) && (x < rectX + rectL) && (y > rectY) && (y < rectY + rectW)){
        return true;
    }
    return false
}

function enemyContainsBullet(enemyX, enemyY, bulletX, bulletY){
    if(bulletX == null || enemyX == null){
        return false;
    }
    var distance = Math.sqrt(Math.pow(enemyX - bulletX, 2) + Math.pow(enemyY - bulletY, 2));
    if(distance <=30){
        return true;
    }
    return false;
}

function removeEnemy(index){
    var enemiesTemp = [];
    enemies.splice(index, 1);
    if(enemies.length > 0){
        for(var i = 0; i < index; i++){
            enemiesTemp.push(enemies[i]);
        }
        for(var i = index; i < enemies.length; i++){
            if(enemies[i] != null){   
                enemies[i].index--;
                enemiesTemp.push(enemies[i]);
            }
        }
    }
    enemies = enemiesTemp;
    enemiesRemaining--;
}

function newRound(){
    round++;
    enemyCounter = 0;
    roundEnemyAmount = 2 * round + 4;
    enemiesRemaining = roundEnemyAmount;
}

function spawnEnemies(){
    if(((lastEnemySpawn + timeBetweenEnemies) < Date.now()) && (enemyCounter < roundEnemyAmount)){
        enemyRandomSpawnVariable = Math.random();
        enemies.push(new Enemy(spawnsActive[Math.trunc((spawnsActive.length) * Math.random())], enemies.length, 10, 25, .5),)
        lastEnemySpawn = Date.now();
        enemyCounter++;
    }
}




