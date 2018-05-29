class Water {
	constructor(x, y, quantity) {
		// Water properties
		this.location = new Vector(x, y);
		this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
		this.quantity = quantity;
		this.radius = 5;
		this.collected = false;
		// helper
		this.TWO_PI = Math.PI * 2;
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
		this.quantity -= tribe.gather;
		tribe.water += tribe.gather;
	}
}