class Predator{
    constructor(position, velocity){
        this.position = position;
        this.radius = predatorRadius;
        this.velocity = velocity;
        this.closestPrey = null;
        this.style = Math.floor(Math.random()*8);
    }
    //Finds the angle between two points in radians
    angleTo(desired){
        return Math.atan2(this.position.y-desired.position.y, desired.position.x-this.position.x);
    }
    //For adding new predators
    static lastNew = 0;
    static newInterval = 10000;
}