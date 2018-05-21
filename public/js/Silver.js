class Silver {
    constructor(x, y, amount) {
        // Silver properties
        this.location = new Vector(x, y);
        this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.value = amount;
        this.radius = 5;
        this.collected = false;
        this.isCaravan = false;
        // helper
        this.TWO_PI = Math.PI * 2;
    }

    // draw the Silver
    draw(ctx) {
        if (this.radius < 0) return;

        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.radius, 0, this.TWO_PI);

        var old = ctx.globalAlpha;
        ctx.globalAlpha = .5;
        ctx.fillStyle = "#C0C0C0";
        ctx.fill();
        ctx.font = '14px Verdana';
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = this.value > 0 ? .5 : this.radius / 100;
        ctx.fillText("Silver", this.location.x - 20, this.location.y + 5);
        ctx.globalAlpha = old;
    }

    // update the Silver
    update(world) {
        // calculate radius according to the amount of value (i.e. amount of Silver)
        var target = this.value > 0 ? this.value + 50 : 0;
        this.radius += (target - this.radius) / 5;

        // move Silver
        if(world.caravansEnabled && this.isCaravan){
	        this.location.add(this.velocity);
        }

        // if Silver goes out of the boundaries of the desert, kill it
        if (this.location.x > world.width || this.location.x < 0 || this.location.y > world.height || this.location.y < 0){
	        this.value = 0;
        }

        // die 
        if (this.radius < 5){
	        this.collected = true;
        }
    }

    collectedBy(tribe) {
        var collected = tribe.gather;
        this.value -= collected;
        tribe.silver += collected;
    }
}