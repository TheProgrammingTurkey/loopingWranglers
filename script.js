//set up canvas object and related variables
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const movingSpeed = 60;
let secondsPassed = 0;
let oldTimeStamp = 0;
let timeObj = new Date();

let playing = false;
let day = 0;
let introTime = 0;

let predators;
let cattle;
let amtOfCattle = 20;

//sets canvas fullscreen
canvas.height = Math.floor(window.innerHeight)
canvas.width = Math.floor(window.innerWidth)

//keeps track of buttons pressed
let toggledKeys = {}

//The animal pen where the cattle are contained in
const pen = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 150
}

//Variables related to the cowboy
let cowboy = {
    theta: Math.PI/2,
    power: 0,
    shot: false,
    score: 0
}

//Variables for the lasso
let lasso = {
    x: -1,
    y: -1,
    radius: 60,
    timer: 0
}

//The radius of the cattle and predator
const cattleRadius = 15;
const predatorRadius = 30;

function reset(){
    //Set up the cattle and predators array and randomize locations and velocities
    cattle = [];
    for(let i = 0; i < amtOfCattle; i++){
        cattle.push(new Cattle(generatePoint(), new Vector(Math.random()*2-1, Math.random()*2-1)));
    }
    predators = [];
    for(let i = 0; i < day-1; i++){
        predators.push(new Predator(generatePredatorPoint(), new Vector(0, 0)));
    }
    Cattle.amtContained = 0;
}
reset();


//when key is pressed down, log the key
document.addEventListener("keydown", event => {
    toggledKeys[event.code] = true;
    event.preventDefault();
});
//when key is lifted, log the key
document.addEventListener("keyup", event => {
    //Throw Lasso
    if(event.code === "Space"){
        cowboy.shot = true;
    }
    toggledKeys[event.code] = false;
    event.preventDefault();
});

//runs every tick
function update(){
    if(playing){
        //Button presses
        if(toggledKeys["ArrowRight"]){
            //Turn Right
            cowboy.theta += movingSpeed * secondsPassed / 20;
        }
        if(toggledKeys["ArrowLeft"]){
            //Turn left
            cowboy.theta -= movingSpeed * secondsPassed / 20;
        }
        //Charge Lasso
        if(toggledKeys["Space"] && cowboy.power > -1 && cowboy.power < 100){
            cowboy.power += 1*secondsPassed*movingSpeed;
        }
        //Throw Lasso
        if(cowboy.shot){
            //Determine lasso location
            lasso.x = canvas.width/2 - Math.cos(cowboy.theta)*(pen.radius+lasso.radius-50) - Math.cos(cowboy.theta) * cowboy.power * (Math.sqrt(Math.pow(pen.x+50, 2) + Math.pow(pen.y+50, 2))-lasso.radius*2-pen.radius)/100;
            lasso.y = canvas.height/2 - Math.sin(cowboy.theta)*(pen.radius+lasso.radius-50) - Math.sin(cowboy.theta) * cowboy.power  * (Math.sqrt(Math.pow(pen.x+50, 2) + Math.pow(pen.y+50, 2))-lasso.radius*2-pen.radius)/100;
            lasso.timer += secondsPassed * movingSpeed;
            //Return Lasso
            if(lasso.timer > 10){
                cowboy.shot = false;
                lasso.x = -1;
                lasso.y = -1;
                lasso.timer = 0;
                cowboy.power = 0;
            }
        }

        //Get time
        timeObj = new Date();
        time = timeObj.getTime();

        //Add predators at certain intervals
        if (time-Predator.lastNew > Predator.newInterval && amtOfCattle - Cattle.amtContained != 0){
            Predator.lastNew = time;
            predators.push(new Predator(generatePredatorPoint(), new Vector(Math.random()*2-1, Math.random()*2-1)));
        }
        //Predator movement
        predators.forEach(predator => {
            //If no more to eat, stop
            if(cattle.length - Cattle.amtContained == 0 || cattle.length < 10){
                playing = false;
                return;
            }
            if(!playing){
                return;
            }
            //find closest prey
            let closestPrey = null;
            let closestDist = 0;
            cattle.forEach(prey => {
                if(prey.contained) return; // Skip contained cattle
                let distance = Math.sqrt(Math.pow(predator.position.x-prey.position.x, 2) + Math.pow(predator.position.y-prey.position.y, 2));
                if(closestPrey == null || distance < closestDist){
                    closestPrey = prey;
                    closestDist = distance;
                }
            })
            //Find angle to prey in radians
            let angle = predator.angleTo(closestPrey);
            //Chase the prey
            predator.velocity = new Vector(Math.cos(angle)*.5, -Math.sin(angle)*.5);
            predator.position.addVector(predator.velocity, secondsPassed*movingSpeed);
            //Collisions with the pen
            if(Math.sqrt(Math.pow(predator.position.x-pen.x, 2) + Math.pow(predator.position.y-pen.y, 2)) < pen.radius+predator.radius){
                let angle = predator.angleTo(new Cattle(new Vector(pen.x, pen.y), new Vector(0, 0)));
                predator.position = new Vector(pen.x - Math.cos(angle) * (pen.radius + predator.radius), pen.y + Math.sin(angle) * (pen.radius + predator.radius));
            }
        })
        //Cattle movement
        cattle.forEach(animal => {
            if(!playing){
                return;
            }
            //find closest predator
            let closestPredator = null;
            let closestDist = 0;
            //If lasso gets animal then go to pen
            if(Math.sqrt(Math.pow(animal.position.x-lasso.x, 2) + Math.pow(animal.position.y-lasso.y, 2)) < lasso.radius && !animal.contained && cowboy.shot){
                animal.contained = true;
                Cattle.amtContained++;
                cowboy.score++;
                animal.velocity = new Vector(Math.random()*2-1, Math.random()*2-1)
                animal.position = new Vector(pen.x, pen.y);
            }
            //If animal in pen
            if(animal.contained){
                //Movement
                if(time-animal.lastChangeTime > animal.nextChangeLength){
                    animal.lastChangeTime = time;
                    animal.nextChangeLength = Math.random() * 5000 + 5000; 
                    animal.velocity = new Vector(Math.random()*2-1, Math.random()*2-1);
                }
                animal.position.addVector(animal.velocity, secondsPassed*movingSpeed);
                //Wall collisions with pen
                if(Math.sqrt(Math.pow(animal.position.x-pen.x, 2) + Math.pow(animal.position.y-pen.y, 2)) > pen.radius-animal.radius){
                    let centerAngle = animal.angleTo(new Cattle(new Vector(pen.x, pen.y), new Vector(0, 0)));
                    let prevPosition = new Vector(animal.position.x, animal.position.y);
                    prevPosition.addVector(animal.velocity, -1);
                    let oldAngle = animal.angleTo(new Cattle(prevPosition, new Vector(0, 0)));
                    let angleDiff = centerAngle - oldAngle;
                    animal.velocity.addVector(animal.velocity, -2);
                    animal.velocity = rotateVector(animal.velocity, -angleDiff*2);
                    animal.position.addVector(animal.velocity, secondsPassed*movingSpeed);
                }
                return;
            }
            //Find closest predator to the animal
            predators.forEach(predator => {
                let distance = Math.sqrt(Math.pow(animal.position.x-predator.position.x, 2) + Math.pow(animal.position.y-predator.position.y, 2));
                if(closestPredator == null || distance < closestDist){
                    closestPredator = predator;
                    closestDist = distance;
                }
            });
            //If the predator is 200 pixels or less away --> run
            if(closestDist < 200){
                //Find angle to predator in radians
                let angle = animal.angleTo(closestPredator);
                //Run away from predator
                animal.velocity = new Vector(-Math.cos(angle), Math.sin(angle));
                animal.position.addVector(animal.velocity, secondsPassed*movingSpeed);
                //Wall collisions
                if(animal.position.x-animal.radius < 0 || animal.position.x+animal.radius > canvas.width){
                    animal.position.x = animal.position.x-animal.radius < 0 ? animal.radius : canvas.width - animal.radius;
                }
                if(animal.position.y-animal.radius < 0 || animal.position.y+animal.radius > canvas.height){
                    animal.position.y = animal.position.y-animal.radius < 0 ? animal.radius : canvas.height - animal.radius;
                }
            }
            //if not, random movements
            else{
                //Intervals for when to turn
                if(time-animal.lastChangeTime > animal.nextChangeLength){
                    animal.lastChangeTime = time;
                    animal.nextChangeLength = Math.random() * 2000 + 1000; 
                    animal.velocity = new Vector(Math.random()*2-1, Math.random()*2-1);
                }
                animal.position.addVector(animal.velocity, secondsPassed*movingSpeed);
                //Wall collisions
                if(animal.position.x-animal.radius < 0 || animal.position.x+animal.radius > canvas.width){
                    animal.velocity.x = -animal.velocity.x;
                    animal.position.x = animal.position.x-animal.radius < 0 ? animal.radius : canvas.width - animal.radius;
                }
                if(animal.position.y-animal.radius < 0 || animal.position.y+animal.radius > canvas.height){
                    animal.velocity.y = -animal.velocity.y;
                    animal.position.y = animal.position.y-animal.radius < 0 ? animal.radius : canvas.height - animal.radius;
                }
            }
            //Collisions with the pen
            if(Math.sqrt(Math.pow(animal.position.x-pen.x, 2) + Math.pow(animal.position.y-pen.y, 2)) < pen.radius+animal.radius){
                let angle = animal.angleTo(new Cattle(new Vector(pen.x, pen.y), new Vector(0, 0)));
                animal.position = new Vector(pen.x - Math.cos(angle) * (pen.radius + animal.radius), pen.y + Math.sin(angle) * (pen.radius + animal.radius));
            }
            //Eaten by a predator
            if(Math.sqrt(Math.pow(animal.position.x-closestPredator.position.x, 2) + Math.pow(animal.position.y-closestPredator.position.y, 2)) < predatorRadius+cattleRadius){
                cattle.splice(cattle.indexOf(animal), 1);
                amtOfCattle--;
            }    
        });
    }
}

//Finds spawn points for cattle
function generatePoint(){
    while(true){
        const x = Math.random() * (canvas.width-cattleRadius*5);
        const y = Math.random() * (canvas.height-cattleRadius*5);
        if(Math.sqrt(Math.pow(x-pen.x, 2) + Math.pow(y-pen.y, 2)) > pen.radius+cattleRadius*5){
            return new Vector(x, y);
        } 
    }
}

//Finds spawn points for cattle
function generatePredatorPoint(){
    let tries = 0;
    let dist = 500;
    while(true){
        const x = Math.random() * (canvas.width-cattleRadius*5);
        const y = Math.random() * (canvas.height-cattleRadius*5);

        // Check if point is too close to pen
        if(Math.sqrt(Math.pow(x-pen.x, 2) + Math.pow(y-pen.y, 2)) < pen.radius+predatorRadius*2){
            continue;
        }
        let tooClose = false
        for(let i = 0; i < cattle.length; i++){
            let animal = cattle[i];
            if(Math.sqrt(Math.pow(animal.position.x-x, 2) + Math.pow(animal.position.y-y, 2)) < dist){
                tooClose = true
            }
        }
        if(!tooClose){
            return new Vector(x, y);
        }
        tries++;
        if(tries > 100){
            dist -= 50;
            tries = 0;
        }
    }
}

//Rotate Vector for pen collisions
function rotateVector(vector, angle) {
  const cosTheta = Math.cos(angle);
  const sinTheta = Math.sin(angle);

  const newX = vector.x * cosTheta - vector.y * sinTheta;
  const newY = vector.x * sinTheta + vector.y * cosTheta;

  return new Vector(newX, newY);
}

//allows the ability to rotate an image
function drawRotatedImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, angle){ 
    ctx.save(); 
    ctx.translate(dx, dy);
    ctx.rotate(angle-Math.PI/2);
    ctx.drawImage(image, sx, sy, sWidth, sHeight, -dWidth/2, -dHeight/2, dWidth, dHeight);
    ctx.restore(); 
}

//drawing everything
function draw(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);    
    update();

    time = timeObj.getTime();
    if(playing){
        //Background
        ctx.drawImage(document.getElementById("backgroundIMG"), 0, 0, canvas.width, canvas.height)
        //Draw animals
        cattle.forEach(animal => {
            drawRotatedImage(document.getElementById("cattleIMG"), 9+48*Math.floor((time%999)/333)+144*(animal.style%4), 1+192*Math.floor(animal.style/4), 29, 47, animal.position.x, animal.position.y, animal.radius, animal.radius*2, Math.atan2(animal.velocity.y, animal.velocity.x));
        });
        predators.forEach(predator => {
            drawRotatedImage(document.getElementById("wolfIMG"), 12+48*Math.floor((time%999)/333)+144*(predator.style%4), 192*Math.floor(predator.style/4), 25, 48, predator.position.x, predator.position.y, predator.radius, predator.radius*2, Math.atan2(predator.velocity.y, predator.velocity.x));
        });
        //Draw the animal pen
        ctx.drawImage(document.getElementById("penIMG"), 50, 70, 924, 874, pen.x-pen.radius-5, pen.y-pen.radius-30, pen.radius*2+10, pen.radius*2+40);
        //Draw the cowboy
        drawRotatedImage(document.getElementById("cowboyIMG"), 6+200*Math.floor((time%999)/333), 58, 142, 280, canvas.width/2, canvas.height/2, 100, 100, cowboy.theta);
        //Draw the power gauge
        if(cowboy.power > 0){
            ctx.drawImage(document.getElementById("powerIMG"), canvas.width/2-50, canvas.height-100, 100, 50);
            ctx.beginPath();
            ctx.moveTo(canvas.width/2, canvas.height-50);
            ctx.lineTo(canvas.width/2-Math.cos(cowboy.power*Math.PI/100)*40, canvas.height-60-Math.sin(cowboy.power*Math.PI/100)*20);
            ctx.stroke();
        }
        //Draw the lasso
        if(cowboy.shot){
            ctx.drawImage(document.getElementById("lassoLoopIMG"), lasso.x-3*lasso.radius/2+2, lasso.y-3*lasso.radius/2+1, lasso.radius*3, lasso.radius*3);
            drawRotatedImage(document.getElementById("lassoArmIMG"), 0, 210, 1024, 80, pen.x, pen.y, 2*Math.sqrt(Math.pow(lasso.x-pen.x, 2) + Math.pow(lasso.y-pen.y, 2))-lasso.radius*2, 20, Math.atan2(lasso.y-canvas.height/2, lasso.x-canvas.width/2) - Math.PI/2);
        }
    }
    else{
        if(introTime == 0){
            day++;
        }
        ctx.font = "50px Arial";
        ctx.textAlign = "center";
        if(amtOfCattle >= 10){
            ctx.fillText("Day " + day, canvas.width/2, 100);
            ctx.fillText(amtOfCattle + " Cattle Remaining", canvas.width/2, 200);
            introTime+=secondsPassed*movingSpeed;
            if(introTime > 200){
                playing = true;
                reset();
                introTime = 0;
            }
        }
        else{
            ctx.fillText("Game Over", canvas.width/2, 100);
            if(day-2 == 1){
                ctx.fillText("You survived " + (day-2) + " Day", canvas.width/2, 200);
            }
            else{
                ctx.fillText("You survived " + (day-2) + " Days", canvas.width/2, 200); 
            }
            introTime+=secondsPassed*movingSpeed;
            if(introTime > 200){
                window.location.replace("index.html")
            }
        }
    }
    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);