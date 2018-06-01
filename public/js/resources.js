class Resource {
    constructor(x, y, quantity) {
        // Resource properties
        this.location = new Vector(x, y);
        this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.quantity = quantity;
        this.radius = 5;
        this.collected = false;

        // helper
        this.TWO_PI = Math.PI * 2;

        // Queue microtask
        Promise.resolve().then(() => {
            this.trigger('created', this);
        });
    }

    // draw the Resource
    draw(ctx) {}

    // update the Resource
    update(world) {}

    // tribe gathers Water
    collectedBy(tribe) {}
}
require('underscore').extend(Resource.prototype, require('concert'));

class Food extends Resource {
    constructor(x, y, quantity) {
        super(x, y, quantity);
        this.isCaravan = false;
    }

    // draw the food
    draw(ctx) {
        if (this.radius < 0) return;

        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.radius, 0, this.TWO_PI);

        var old = ctx.globalAlpha;
        ctx.globalAlpha = .5;
        ctx.fillStyle = "#00FF00";
        ctx.fill();
        ctx.font = '14px Verdana';
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = this.quantity > 0 ? .5 : this.radius / 100;
        ctx.fillText("Food", this.location.x - 20, this.location.y + 5);
        ctx.globalAlpha = old;
    }

    // update the food
    update(world) {
        // calculate radius according to the amount of quantity (i.e. amount of food)
        var target = this.quantity > 0 ? this.quantity + 50 : 0;
        this.radius += (target - this.radius) / 5;

        // move food
        if (world.caravansEnabled && this.isCaravan){
            this.location.add(this.velocity);
        }

        // if food goes out of the boundaries of the desert, remove it
        if (this.location.x > world.width || this.location.x < 0 || this.location.y > world.height || this.location.y < 0){
            this.quantity = 0;
        }

        // got eaten
        if (this.radius < 5){
            this.collected = true;
        }
    }

    // tribe gathers food
    collectedBy(tribe) {
        var gatherAmount = Math.min(this.quantity, tribe.gather);
	    if (gatherAmount <= 0) {
            return;
        }

        tribe.food += gatherAmount;
        this.quantity -= gatherAmount;
        this.trigger('collected', gatherAmount);

        if (this.quantity === 0) {
            this.collected = true;
        }
    }
}

class Silver extends Resource {
    constructor(x, y, quantity) {
        super(x, y, quantity);
        this.isCaravan = false;
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
        var target = this.quantity > 0 ? this.quantity + 50 : 0;
        this.radius += (target - this.radius) / 5;

        // move Silver
        if(world.caravansEnabled && this.isCaravan){
            this.location.add(this.velocity);
        }

        // if Silver goes out of the boundaries of the desert, kill it
        if (this.location.x > world.width || this.location.x < 0 || this.location.y > world.height || this.location.y < 0){
            this.quantity = 0;
        }

        // die
        if (this.radius < 5){
            this.collected = true;
        }
    }

    collectedBy(tribe) {
        var gatherAmount = Math.min(this.quantity, tribe.gather);
        if (gatherAmount <= 0) {
            return;
        }

        tribe.silver += gatherAmount;
        this.quantity -= gatherAmount;
        this.trigger('collected', gatherAmount);

        if (this.quantity === 0) {
            this.collected = true;
        }
    }
}

class Water extends Resource {
    constructor(x, y, quantity) {
        super(x, y, quantity);
    }

    // draw the Water
    draw(ctx) {
        if (this.radius < 0) return;

        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.radius, 0, this.TWO_PI);

        var old = ctx.globalAlpha;
        ctx.globalAlpha = .5;
        ctx.fillStyle = "#2389da";
        ctx.fill();
        ctx.font = '14px Verdana';
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = this.quantity > 0 ? .5 : this.radius / 100;
        ctx.fillText("Water", this.location.x - 20, this.location.y + 5);
        ctx.globalAlpha = old;
    }

    // update the Water
    update(world) {
        // calculate radius according to the quantity of Water
        var target = this.quantity > 0 ? this.quantity + 50 : 0;
        this.radius += (target - this.radius) / 5;

        // move Water
        // this.location.add(this.velocity);

        // if Water goes out of the boundaries of the desert, kill it
        if (this.location.x > world.width || this.location.x < 0 || this.location.y > world.height || this.location.y < 0){
            this.quantity = 0;
        }

        // got collected
        if (this.radius < 5){
            this.collected = true;
        }
    }

    // tribe gathers Water
    collectedBy(tribe) {
        var gatherAmount = Math.min(this.quantity, tribe.gather);
        if (gatherAmount <= 0) {
            return;
        }

        tribe.water += gatherAmount;
        this.quantity -= gatherAmount;
        this.trigger('collected', gatherAmount);

        if (this.quantity === 0) {
            this.collected = true;
        }
    }
}
