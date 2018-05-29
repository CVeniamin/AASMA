var food = 10,
    silver = 10,
    water = 30,
    MAX_SPEED = 1.5,
    MAX_FORCE = .45,
    LENGTH = 10,
    GATHER_POWER = .2;


// Tribe constructor
class Tribe {
    constructor(x, y, hue, lookRange, influenceRange) {
        // Tribe's properties
        this.ID = Tribe.uid();
        this.food = food;
        this.silver = silver;
        this.water = water;
        this.mass = this.updateMass();
	    this.maxspeed = MAX_SPEED;
        this.maxforce = MAX_FORCE;
        this.lookRange = lookRange;
        this.influenceRange = influenceRange;
        this.length = LENGTH;
        this.base = this.length * .5;
        this.location = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.wandering = new Vector(.2, .2);
	    this.hue = hue; // used for color generation and cooperation
	    this.color = Color.hue2hex(this.hue);
	    this.auxColor = this.color;
	    this.dead = false;
        this.age = 1;
        this.developed = false;
        this.gather = GATHER_POWER;
        this.friends = [];
        this.enemies = [];
        // helper
        this.HALF_PI = Math.PI * .5;
        this.TWO_PI =  Math.PI * 2;
    }

    // computes all the information from the environment and decides in which direction travel
    travel(desert) {
        // surrounding Tribes
        var neighbors = this.look(desert.population, this.influenceRange, this.TWO_PI);

        // nearby food
        var nearbyFood = this.look(desert.food, this.lookRange, this.TWO_PI);
	    this.gatherResources(nearbyFood);

	    // collect silver
        var nearbySilver = this.look(desert.silver, this.lookRange, this.TWO_PI);
        this.gatherResources(nearbySilver);

	    // collect water
	    var nearbyWater = this.look(desert.water, this.lookRange, this.TWO_PI);
	    this.gatherResources(nearbyWater);

	    this.friends = [];
	    this.enemies = [];
        // find nearby Tribes that aren't too big or too small
        for (var j in neighbors) {
            if (neighbors[j].mass < this.mass * 2 && neighbors[j].mass > this.mass / 2){
	            this.friends.push(neighbors[j]);
            } else {
            	this.enemies.push(neighbors[j]);
            }
        }

        // if any, unite with them
        if (this.friends.length){
            this.unite(this.friends);
        } else {
            // if nobody is nearby, wander around
            this.wander(200);
        }

        // simulate raiding/ghazzu behavior
        if(desert.ghazzu){

            // find nearby Tribes that are bigger than the this Tribe
            var strong = [];
            for (var j in neighbors) {
                if (neighbors[j].mass > this.mass * 2){
                    strong.push(neighbors[j]);
                }
            }

            // if any, defend from them
            if (strong.length){
                this.defend(strong, this.lookRange);
            }

            // find nearby Tribe that are smaller than the this Tribe and of different hue
            var weak = [];
            for (var j in neighbors) {
	            var neighbor = neighbors[j];
                if (neighbor.mass < this.mass / 2 && Color.hueDifference(neighbor.hue, this.hue) > 0.3){
                    var friend = false;
                    for (var i in this.friends){
	                    if(this.friends[i].id === neighbor.id){
                            friend = true;
                        }
                    }
                    if(!friend){
                        weak.push(neighbor);
                    }
                }
            }

            // if any, attack a weak tribe
            if (weak.length){
                this.attack(weak);
            }
        }
        if (desert.trade){
	        // cooperate with it/them
	        var cooperate = [];
	        for (var j in this.friends){
		        if (Color.hueDifference(this.friends[j].hue, this.hue) < 0.3){
			        cooperate.push(this.friends[j]);
		        }
	        }
	        this.cooperate(this.friends);
        }

	    // if the Tribe is developed enough...
	    if (this.developed) {
		    this.divide(desert.population);
		    this.developed = false;
		}

        // defend the boundaries of the desert
        this.boundaries(desert);
    }

    gatherResources(resources){
	    for (var index in resources) {
		    var resource = resources[index];
		    if (resource && !resource.collected) {
			    this.follow(resource.location, resource.radius);

			    // if close enough...
			    if (this.location.dist(resource.location) < resource.radius) {
				    resource.collectedBy(this);
			    }
		    }
	    }
    }
    
    // makes the Tribe defend from a group of Tribes
    defend(TribeList, dist) {
        this.defendList = TribeList;

	    var separation = this.separate(TribeList, this.influenceRange);
	    this.applyForce(separation);

        for (var i in TribeList) {
            var d = this.location.dist(TribeList[i].location);
            if (d < dist) {
                var defend = TribeList[i].location.copy().sub(this.location).mul(-dist);
                this.applyForce(defend);
            }
        }

        if (Tribe.showBehavior){
            this.color = "blue";
        }
    }

    // makes the Tribe chase another group of Tribes, and attack them when reaching
    attack(TribeList) {
        this.attackList = TribeList;

        var that = this;

        this.chase(TribeList, function(tribe) {
            // Attacking other tribe incurs in a penalty cost
            var cost = 100;
            var stronger = that.silver < tribe.silver;

            if (stronger){
                // bad idea attacking a stronger tribe
	            that.food -= 5 / cost;
	            that.water -= 5 / cost;
	            that.silver -= 1 / cost;
            }

            // in combat spend resources
	        that.food -= 5 / cost;
	        tribe.food -= 5 / cost;
	        that.water -= 5 / cost;
	        tribe.water -= 5 / cost;

	        // loose silver to create ammo
            that.silver -= 5 / cost;
            tribe.silver -= 5 / cost;

	        var attack = tribe.location.copy().sub(that.location).mul(that.maxforce);
	        that.applyForce(attack);
        });
        if (Tribe.showBehavior){
            this.color = "red";
        }
    }

    unite(TribeList) {
        this.unitedList = TribeList;

        // compute vectors
        var separation = this.separate(TribeList, this.influenceRange);
        var alignment = this.align(TribeList, this.influenceRange);
        var cohesion = this.cohesion(TribeList, this.influenceRange);
        var affinity = this.affinity(TribeList);

        //Tribes of very different colors won't stay together as tightly as Tribes of the same color
        separation.mul(-TribeList.length * Math.log(affinity));
        alignment.mul(0.8 * affinity); //
        cohesion.mul(1.2 * affinity);

        // apply forces
        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);

        if (Tribe.showBehavior){
	        this.color = "black";
        }
    }

    // makes the Tribe chase a developed Tribe or a group of developed Tribes, and cooperate with it/them
    cooperate(TribeList) {
        this.cooperationList = TribeList;

        var that = this;

	    var cohesion = this.cohesion(TribeList, this.influenceRange);
	    this.applyForce(cohesion);
        this.trade(TribeList, function(tribe) {
            var trade = 1 / 100;
            // "fake" trade of food with water
            if (that.food < tribe.food && that.water > tribe.water) {
                // water more valuable
	            that.food += trade * 5;
	            tribe.food -= trade * 5;
	            that.water -= trade;
	            tribe.water += trade;
            }
            else if (that.silver < tribe.silver && that.water > tribe.water){
	            that.silver += trade * 2;
	            tribe.silver -= trade * 2;
	            that.water -= trade;
	            tribe.water += trade;
            }
            else if (that.food < tribe.food && that.silver > tribe.silver){
	            that.food += trade * 3;
	            tribe.food -= trade * 3;
	            that.silver -= trade;
	            tribe.silver += trade;
            }
        });

        if (Tribe.showBehavior){
	        this.color = "pink";
        }
    }

    divide(desertPopulation){
	    var location = this.location.copy();

	    // divide equally all resources between new tribe and old one
	    this.food /= 2;
	    this.silver /= 2;
	    this.water /= 2;

	    // mutation
	    var mutation_rate = .1;

	    var hue = this.hue;
	    hue = Math.random() < mutation_rate ? Math.random() : hue;

	    // add to desert population
	    var tribe = new Tribe(location.x, location.y, hue, this.lookRange, this.influenceRange);

	    tribe.food = this.food;
	    tribe.water = this.water;
	    tribe.silver = this.silver;
	    desertPopulation.push(tribe);
    }

    // defend boundaries of the screen
    boundaries(desert) {
        if (this.location.x < 50)
            this.applyForce(new Vector(this.maxforce * 3, 0));

        if (this.location.x > desert.width - 50)
            this.applyForce(new Vector(-this.maxforce * 3, 0));

        if (this.location.y < 50)
            this.applyForce(new Vector(0, this.maxforce * 3));

        if (this.location.y > desert.height - 50)
            this.applyForce(new Vector(0, -this.maxforce * 3));
    }

    // return an array of the nearby Tribe that are ahead
    look(TribeList, radius, angle) {
        var neighbors = [];
        for (var i in TribeList)
            if (TribeList[i] != null && TribeList[i] != this) {
                var diff = this.location.copy().sub(TribeList[i].location);
                var a = this.velocity.angleBetween(diff);
                var d = this.location.dist(TribeList[i].location);
                if (d < radius && (a < angle / 2 || a > this.TWO_PI - angle / 2))
                    neighbors.push(TribeList[i]);
            }

        return neighbors;
    }

    // wander behaviour (when the Tribe is alone, i.e. it can't see other neighbors around)
    wander(radius) {
        if (Math.random() < .05) {
            this.wandering.rotate(this.TWO_PI * Math.random());
        }
        this.velocity.add(this.wandering);

        if (Tribe.showBehavior)
            this.color = "gray";
    }

    // makes the Tribe follow a target (vector)
    follow(target, arrive) {
        var dest = target.copy().sub(this.location);
        var d = dest.dist(this.location);

        if (d < arrive)
            dest.setMag(d / arrive * this.maxspeed);
        else
            dest.setMag(this.maxspeed);

        this.applyForce(dest.limit(this.maxforce * 2));
    }

    // chase behaviour - makes the Tribe chase a group of other Tribes
    chase(TribeList, action, force) {
        if (TribeList.length === 0){
	        return;
        }

        for (var i in TribeList) {
            this.applyForce(TribeList[i].attract(this, force || 50));
            if (this.location.dist(TribeList[i].location) < this.lookRange){
	            action(TribeList[i]); // <- execute action when reaching a Tribe
            }
        }
    }

	trade(TribeList, action) {
		if (TribeList.length === 0){
			return;
		}

		// this.applyForce(this.cohesion(TribeList));
		for (var i in TribeList) {
			if (this.location.dist(TribeList[i].location) < this.lookRange){
				action(TribeList[i]); // <- execute action when reaching a Tribe
			}
		}
	}

    // given a target vector, return a vector that would steer the Tribe in that direction
    seek(target) {
        var seek = target.copy().sub(this.location);
        seek.normalize();
        seek.mul(this.maxspeed);
        seek.sub(this.velocity).limit(this.maxforce);

        return seek;
    }

    // attracts the Tribe to a desired body 
    attract(body, attractionForce) {
        var force = this.location.copy().sub(body.location);
        var distance = force.mag();
        distance = distance < 5 ? 5 : distance > 25 ? 25 : distance;
        force.normalize();

        var strength = (attractionForce * this.mass * body.mass) / (distance * distance);
        force.mul(strength);
        return force;
    }

    // makes the Tribe separate from the surrounding Tribes
    separate(neighbors, range) {
        var sum = new Vector(0, 0);

        if (neighbors.length) {
            for (var i in neighbors) {
                var d = this.location.dist(neighbors[i].location)
                if (d < range) {
                    var diff = this.location.copy().sub(neighbors[i].location);
                    diff.normalize();
                    diff.div(d);
                    sum.add(diff);
                }
            }
            sum.div(neighbors.length);
            sum.normalize();
            sum.mul(this.maxspeed);
            sum.sub(this.velocity);
            sum.limit(this.maxforce);
        }

        return sum;
    }

    // aligns the Tribe to the surrounding Tribes
    align(neighbors, range) {
        var sum = new Vector(0, 0);

        if (neighbors.length) {
            for (var i in neighbors) {
	            var d = this.location.dist(neighbors[i].location);
	            if((d > 0) && (d < range)){
		            sum.add(neighbors[i].velocity);
                }
            }
            sum.div(neighbors.length);
            sum.normalize();
            sum.mul(this.maxspeed);

            sum.sub(this.velocity).limit(this.maxforce);
        }

        return sum;
    }

    // moves the Tribe towards the center of the surrounding Tribes
    cohesion(neighbors, range) {
        var sum = new Vector(0, 0);

        if (neighbors.length) {
            for (var i in neighbors) {
                var d = this.location.dist(neighbors[i].location);
                if((d > 0) && (d < range)){
	                sum.add(neighbors[i].location);
                }
            }
            sum.div(neighbors.length);
            return this.seek(sum);
        }

        return sum;
    }

    // return a coefficient representing the color affinity in a group of neighbor Tribes
    affinity(TribeList) {
        var coef = 0;
        for (var i in TribeList) {
            var difference = Color.hueDifference(TribeList[i].hue, this.hue);
            if (difference > .5){
	            difference = 1 - difference;
            }
            coef += difference
        }
        var affinity = 1 - (coef / TribeList.length);

        return affinity * affinity;
    }

    // paint the Tribe on the screen
    draw(ctx) {

        // get the points to draw the Tribe
        var angle = this.velocity.angle();

        var x1 = this.location.x + Math.cos(angle) * this.base;
        var y1 = this.location.y + Math.sin(angle) * this.base;

        var x = this.location.x - Math.cos(angle) * this.mass;
        var y = this.location.y - Math.sin(angle) * this.mass;

        // draw the behaviour of the Tribe (lines)
        this.drawBehavior(ctx);

        if (Tribe.showBehavior && this.developed){
            this.color = "pink";
        }

        // draw the Tribe on the canvas
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        var radiusX = Math.abs(this.mass);
        var radiusY = radiusX;
        var rotation = 45 * Math.PI / 180;
        ctx.ellipse(x1, y1, radiusX, radiusY, rotation, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText(this.ID, x, y);
        ctx.fill();
        
        if(Tribe.showBehavior){
            // draws the influence area 
            ctx.save();
            ctx.beginPath();
            ctx.restore();
            ctx.arc(x1, y1, this.influenceRange, 0, 2 * Math.PI);
            ctx.strokeStyle= '#000000';
            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            ctx.stroke();
            ctx.fill();

	        // draws the look area
            ctx.save();
            ctx.beginPath();
            ctx.restore();
            ctx.arc(x1, y1, this.lookRange, 0, 2 * Math.PI);
            ctx.strokeStyle= '#FFFFFF';
            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            ctx.stroke();
            ctx.fill();
        }
    }

    // draw what's going on inside the Tribe's head
    drawBehavior(ctx) {
        if (Tribe.showBehavior) {
            var old = ctx.globalAlpha;
            ctx.globalAlpha = .2;

            // draw defend behaviour
            if (this.defendList && this.defendList.length) {
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 4;
                ctx.beginPath();
                for (var i in this.defendList) {
                    ctx.moveTo(this.location.x, this.location.y);
                    ctx.lineTo(this.defendList[i].location.x, this.defendList[i].location.y);
                }
                ctx.stroke();
            }

            // draw chase behaviour
            if (this.attackList && this.attackList.length) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 4;
                ctx.beginPath();
                for (var i in this.attackList) {
                    ctx.moveTo(this.location.x, this.location.y);
                    ctx.lineTo(this.attackList[i].location.x, this.attackList[i].location.y);
                }
                ctx.stroke();
            }

            // draw united behaviour
            if (this.unitedList && this.unitedList.length) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = "black";
                ctx.beginPath();
                for (var i in this.unitedList) {
                    ctx.moveTo(this.location.x, this.location.y);
                    ctx.lineTo(this.unitedList[i].location.x, this.unitedList[i].location.y);
                }
                ctx.stroke();
            }

            // draw cooperation behaviour
            if (this.cooperationList && this.cooperationList.length) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = "pink";
                ctx.beginPath();
                for (var i in this.cooperationList) {
                    ctx.moveTo(this.location.x, this.location.y);
                    ctx.lineTo(this.cooperationList[i].location.x, this.cooperationList[i].location.y);
                }
                ctx.stroke();
            }

            // clear the lists
            this.defendList = null;
            this.attackList = null;
            this.unitedList = null;
            this.cooperationList = null;

            // restore alpha
            ctx.globalAlpha = old;
        } else{
            this.color = this.auxColor;
        }
    }

    updateMass(){
        return (this.food + this.silver + this.water) / 3;
    }

    // update the Tribe's position and state
    update(desert) {
        // move the Tribe
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxspeed);
        if (this.velocity.mag() < 3){
            this.velocity.setMag(5);
        }

        this.location.add(this.velocity);
        this.acceleration.limit(this.maxforce);

        this.mass = this.updateMass();

        // spend food
        // this.food -= ((this.acceleration.mag() * (Math.exp(this.mass / 50))) * this.age * this.velocity.mag()) / 100;
        this.food -= this.mass / 1500;
        this.water -= this.mass / 1500;
        this.silver -= 0.0005;


        // silver can't have negative values
        if (this.silver <= 0 ){
            this.silver = 0;
        }

        // die
        if (this.food < 0 || this.water < 0) {
            this.food = 0;
            this.water = 0;
            this.dead = true;
			// this.trigger('death');
        }

        // grow older
        this.age *= 1.0005;
        this.developed = (this.age > 3 && this.mass >= 30);

        if(this.developed){
            this.age = 1;
        }

        // reset acceleration
        this.acceleration.mul(0);
    }

    // apply all the force vectors to the Tribe's acceleration
    applyForce(f) {
        this.acceleration.add(f);
    }
}
(function() {
    var id = 0;
    Tribe.uid = function() {
        return id++;
    }
})();

// draw behaviour flag
Tribe.showBehavior = false;

Tribe.random = Math.random();

// Inherit Concert event manager
require('underscore').extend(Tribe.prototype, require('concert'));
