class Vector{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
    addVector(other, scale) {
        this.x += other.x * scale;
        this.y += other.y * scale;
    }
    magnitude(){
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
}