class ClientDoor {
    constructor(n, x, y, l, w, cost, xInteractionDist, yInteractionDist, spawns){
        this.doorNum = n;
        this.cost = cost;
        this.open = false;
        this.x = x;
        this.y = y;
        this.l = l;
        this.w = w;

        this.xDist = xInteractionDist;
        this.yDist = yInteractionDist;
        this.pickedUpBool = false;

        this.activateSpawns = spawns;
    }

    playerInProximity(){
        if(this.rectangleContains(this.x - this.xDist + clientMap.x, this.y - this.yDist + clientMap.y, this.l + this.xDist * 2, this.w + this.yDist * 2, clientPlayer.x, clientPlayer.y)){
            return true;
        }
        return false;
    }

    userInteracted(){
        if(score.money >= this.cost){
            this.openDoor();
        }
    }

    offerInteraction(){
        if(!this.open){
            fill(255, 255, 255);
            textSize(30);
            text("F to Open Door $" + this.cost, clientPlayer.x - 150, clientPlayer.y + 100);
        }
    }

    openDoor(){
        this.open = true;
        score.money -= this.cost;

        //this.activateSpawns.forEach(element => {
        //    spawnsActive.push(element);
        //});

        removeDoor(this.doorNum, this.activateSpawns);
    }

    rectangleContains(rectX, rectY, rectL, rectW, x, y){
        if((x > rectX) && (x < rectX + rectL) && (y > rectY) && (y < rectY + rectW)){
            return true;
        }
        return false
    }
}