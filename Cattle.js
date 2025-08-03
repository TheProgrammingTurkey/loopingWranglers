class Cattle{
    constructor(position, velocity){
        this.position = position;
        this.radius = cattleRadius;
        this.velocity = velocity;
        this.contained = false;
        this.style = Math.floor(Math.random()*8);
        this.lastChangeTime = timeObj.getTime();
        this.nextChangeLength = Math.random() * 2000 + 1000; 
    }
    //Finds the angle between two points in radians
    angleTo(desired){
        return Math.atan2(this.position.y-desired.position.y, desired.position.x-this.position.x);
    }  

    //Amount of cattle in the pen
    static amtContained = 0
}