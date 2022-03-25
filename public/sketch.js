var socket;

function setup(){
    socket = io('https://cgrozzombies.herokuapp.com/', { transports : ['websocket'] });
    connectedUsersData = [];
    currentBullets = [];
    enemiesData = [];
    killData = [];

    guns = [
        //new Pistol(0,0),
        new M1911(0,0), //0
        new Magnum(0,0), //1
        new Deagle(0,0), //2
        new AK(0,0), //3 
        new M4(0,0), //4
        new Famas(0,0), //5
        new MP5(0,0), //6
        new Olympia(0,0), //7
        new Barrett(0,0), //8

    ]

    socket.on('setPlayerNum', function(playerNum){
        clientPlayer.number = playerNum.num;
        clientPlayer.index = playerNum.index;
    });

    socket.on('updateIndex', function(indexData){
        console.log(indexData.index);
        if(clientPlayer.number == indexData.number){
            clientPlayer.index = indexData.index;
        }
    });

    socket.on('killData', function(playerKills){
        if(playerKills[clientPlayer.index] > killData[clientPlayer.index]){
            score.money += 25 * (playerKills[clientPlayer.index] - killData[clientPlayer.index]);
        }
        killData = playerKills;
    });


    socket.on('playerData', function(connectedUsers){
        connectedUsersData = connectedUsers;
        for(var i = 0; i < connectedUsersData.length; i++){
            connectedUsersData[i].gun = guns[connectedUsers[i].gun];
        }
    });

    socket.on('roundData', function(roundInfo){
        score.round = roundInfo.roundNum;
        score.enemiesRemaining = roundInfo.enemiesNum;
    });

    socket.on('doorData', function(doorData){
        clientMap.doorsActive = doorData.doorsActive;
        clientMap.doorCoords = doorData.doorCoords;

        clientMap.doors.forEach(element => {
            if(element.doorNum != null){
                if(!clientMap.doorsActive.includes(element.doorNum)){
                    element.open = true;
                }
            }
                
            
        });
    });

    socket.on('bulletsData', function(bullets){
        currentBullets = bullets;
    });

    socket.on('enemyData', function(enemies){
        enemiesData = enemies;
    });
    
    //partner window

    clientPlayer = new ClientPlayer();
    clientMap = new ClientGameMap(windowWidth/2 - 300, windowHeight - 750);
    currentGun = new M1911(clientPlayer.x, clientPlayer.y);
    score = new Score();

    


    this.data = {
        winW: windowWidth,
        winL: windowHeight,
        decX: clientMap.decimalPlayerLocationX(),
        decY: clientMap.decimalPlayerLocationY(),
    }
    socket.emit('start', this.data);
    
    createCanvas(windowWidth, windowHeight);

    
    
    
}

function draw(){
    background(150);
    
    
    clientMap.move()
    clientMap.drawMap();
    clientPlayer.drawPlayer();
    clientPlayer.determineAngle();
    currentGun.drawGun(clientPlayer.x, clientPlayer.y, clientPlayer.angle);
    currentGun.shoot();
    score.drawScoreLayout();
    

    
    //doors
    clientMap.doors.forEach(element => {
        if(element.playerInProximity() && !element.open){
          element.offerInteraction();
          if(keyIsDown(70) && !element.pickedUpBool){
            element.userInteracted();
            element.pickedUpBool = true;
          }
          if(!keyIsDown(70)){
            element.pickedUpBool = false;
          }
        }
    });
    
    //pickups 
    clientMap.pickups.forEach(element => {
        if(element.playerInProximity()){
          element.offerPickup();
          if(keyIsDown(70) && !element.pickedUpBool){
            element.userPickedUp();
            element.pickedUpBool = true;
          }
          if(!keyIsDown(70)){
            element.pickedUpBool = false;
          }
        }
    });

    //reload
    if((keyIsDown(82) && !score.reloading) || score.ammoIn == 0 && !score.reloading){
        currentGun.startReload();
    }
    if(score.reloading && currentGun.tempTimeEnd < millis()){
        currentGun.reload();
    }

    //enemy contact 
    enemiesData.forEach(element => {
        if(element != null){
            if(clientPlayer.enemyContact(element.x, element.y)){
                clientPlayer.enemyHit(element.damage);
            }
        }
    });
    
  
    

    textSize(30);
    fill(0, 150, 0);
    text("" + clientPlayer.number, clientPlayer.x - 9, clientPlayer.y - 30);

    sendDrawData();
    //shooting
    //clientGun.shoot();
    
}



function sendDrawData(){
    let data = {
        index: clientMap.moveData.index,
        decX: clientMap.moveData.decX, 
        decY: clientMap.moveData.decY,
        angle: clientPlayer.angle, 
        gunIndex: clientPlayer.gunIndex,
    }
    socket.emit('drawData', data);
    
}

function sendBulletData(){
    let bulletData = {
        startX: clientPlayer.x - clientMap.x + currentGun.bulletDisplacement*cos(clientPlayer.angle),
        startY: clientPlayer.y - clientMap.y + currentGun.bulletDisplacement*sin(clientPlayer.angle),
        damage: currentGun.damage,
        velocity: currentGun.bulletVelocity,
        angle: clientPlayer.angle,
        sprayDeviation: 0,
        playerFired: clientPlayer.index,
    }
    socket.emit('bulletFired', bulletData);
}

function sendBulletDataShotgun(sprayDeviation){
    let bulletData = {
        startX: clientPlayer.x - clientMap.x + currentGun.bulletDisplacement*cos(clientPlayer.angle),
        startY: clientPlayer.y - clientMap.y + currentGun.bulletDisplacement*sin(clientPlayer.angle),
        damage: currentGun.damage,
        velocity: currentGun.bulletVelocity,
        angle: clientPlayer.angle,
        sprayDeviation: sprayDeviation,
        playerFired: clientPlayer.index,

        
    }
    socket.emit('bulletFired', bulletData);
}

function removeDoor(n, spawnsActivate){
    var doorData = {
        n: n,
        spawns: spawnsActivate,
    }
    socket.emit('removeDoor', doorData);
}



