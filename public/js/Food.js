class Food {
    constructor(x, y, amount) {
        // food properties
        this.location = new Vector(x, y);
        this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.nutrition = amount;
        this.radius = 5;
        this.eaten = false;
        // helper
        this.TWO_PI = Math.PI * 2;
    }

    // draw the food
    draw(ctx) {
        if (this.radius < 0) return;

        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.radius, 0, this.TWO_PI);

        var old = ctx.globalAlpha;
        ctx.globalAlpha = .5
        ctx.fillStyle = "#00FF00";
        ctx.fill();
        ctx.font = '14px Verdana';
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = this.nutrition > 0 ? .5 : this.radius / 100;
        ctx.fillText("FOOD", this.location.x - 20, this.location.y + 5);
        ctx.globalAlpha = old;
    }

    // update the food
    update(world) {
        // calculate radius according to the ammount of nutrition (i.e. ammount of food)
        var target = this.nutrition > 0 ? this.nutrition + 50 : 0;
        this.radius += (target - this.radius) / 5;

        // move food
        // this.location.add(this.velocity);

        // if food goes out of the boundaries of the sea, kill it
        if (this.location.x > world.width || this.location.x < 0 || this.location.y > world.height || this.location.y < 0)
            this.nutrition = 0;

        // got eaten
        if (this.radius < 5){
            this.eaten = true;
        }
    }

    // tribe gathers food
    eatenBy(tribe) {
        this.nutrition -= tribe.gather;
        tribe.food += tribe.gather;
    }
}