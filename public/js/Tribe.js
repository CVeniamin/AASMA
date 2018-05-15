// MASS MULTIPLIERS - these values represent the relationship between the Tribe's properties and its mass
var food = 10,
    silver = 10,
    water = 10,
    MAX_SPEED = 3,
    MAX_FORCE = .1,
    SEPARATION_RANGE = 30,
    LOOK_RANGE = 50,
    INFLUENCE_RANGE = 200,
    LENGTH = 20,
    GATHER_POWER = .2;


// Tribe constructor
class Tribe {
    constructor(mass, x, y, color, lookRange, influenceRange) {
        // Tribe's properties
        this.ID = Tribe.uid();
        this.mass = mass > 0 ? mass : -mass;
        this.food = food;
        this.silver = silver;
        this.water = water;
        this.maxspeed = MAX_SPEED * this.mass;
        this.maxforce = MAX_FORCE / (this.mass * this.mass);
        this.maxforce = MAX_FORCE / (this.mass * this.mass);
        this.separationRange = this.mass * SEPARATION_RANGE;
        this.lookRange = lookRange;
        this.influenceRange = influenceRange;
        this.length = mass * LENGTH;
        this.base = this.length * .5;
        this.location = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.wandering = new Vector(.2, .2);
	    this.hue = Math.random() < .5 ? Math.random() * .5 : 1 - Math.random() * .5; // <- the hue is used for color generation and cooperation
	    this.color = Color.hue2hex(this.hue);
        this.auxColor = this.color;
        // this.hue = Math.random() < .5 ? Color.hex2hsv(this.color).h * .5 : 1 -  Color.hex2hsv(this.color).h * .5; // <- the hue is used for color generation and cooperation
        this.dead = false;
        this.age = 1;
        this.developed = false;
        this.gather = this.mass * GATHER_POWER;
        // helper
        this.HALF_PI = Math.PI * .5;
    }

    // computes all the information from the environment and decides in which direction travel
    travel(desert) {
        // surrounding Tribes
        var neighbors = this.look(desert.population, this.lookRange, Math.PI * 2);

	    var nearbyWater = this.look(desert.water, this.influenceRange, Math.PI * 2);

	    // collect water
	    for (var index in nearbyWater) {
		    var water = nearbyWater[index];
		    if (water && !water.collected) {
			    // go to the silver
			    this.follow(water.location, water.radius / 10);

			    // if close enough...
			    if (this.location.dist(water.location) < water.radius) {
				    water.collectedBy(this);
			    }
		    }
	    }
        // nearby food
        var nearbyFood = this.look(desert.food, this.influenceRange, Math.PI * 2);

        // eat food
        for (var index in nearbyFood) {
            var food = nearbyFood[index];
            if (food && !food.eaten) {
                // go to the food
                this.follow(food.location, food.radius / 10);

                // if close enough...
                if (this.location.dist(food.location) < food.radius) {
                    // eat the food
                    food.eatenBy(this);
                }
            }
        }

        var nearbySilver = this.look(desert.silver, this.influenceRange, Math.PI * 2);

        // collect silver
        for (var index in nearbySilver) {
            var silver = nearbySilver[index];
            if (silver && !silver.collected) {
                // go to the silver
                this.follow(silver.location, silver.radius / 10);

                // if close enough...
                if (this.location.dist(silver.location) < silver.radius) {
                    silver.collectedBy(this);
                }
            }
        }

        // find nearby Tribes that aren't too big or too small
        var friends = [];
        for (var j in neighbors) {
            if (neighbors[j].mass < this.mass * 2 && neighbors[j].mass > this.mass / 2)
                friends.push(neighbors[j]);
        }

        // if any, unite with them
        if (friends.length){
            this.unite(friends);
        } else {
            // if nobody is nearby, wander around
            this.wander(200);
        }

        // simulate raiding/ghazzu behavior
        if(desert.ghazzu){

            // find nearby Tribes that are way bigger than the this Tribe
            var bigger = [];
            for (var j in neighbors) {
                if (neighbors[j].mass > this.mass * 2){
                    bigger.push(neighbors[j]);
                }
            }

            // if any, defend it/them
            if (bigger.length){
                this.defend(bigger, this.lookRange);
            }

            // find nearby Tribe that are way smaller than the this Tribe
            var smaller = [];
            for (var j in neighbors) {
                if (neighbors[j].mass < this.mass / 2)
                    smaller.push(neighbors[j]);
            }

            // if any, attack a smaller tribe
            if (smaller.length){
                this.attack(smaller);
            }
        }

        // TODO cooperation between developed tribes or similar colors
	    // if the Tribe is developed enough...
	    /*if (this.developed) {
			// find nearby developed Tribes
			var developed = [];
			for (var j in neighbors){
				if (neighbors[j].developed){
					developed.push(neighbors[j]);
				}
			}

			//this.divide(desert.population);

			// cooperate with it/them
			//this.cooperate(developed, desert.population);
		}*/

        // defend the boundaries of the desert
        this.boundaries(desert);
    }

    // makes the Tribe defend from a group of Tribes
    defend(TribeList, dist) {
        this.defendList = TribeList;

        for (var i in TribeList) {
            var d = this.location.dist(TribeList[i].location)
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

        this.chase(TribeList, function(Tribe) {
            that.food += 5;
            Tribe.food -= 5;
            that.water += 1;
            Tribe.water -= 1;
            that.silver += 1;
            Tribe.silver -= 1;

            var attack = Tribe.location.copy().sub(that.location).mul(that.lookRange / 10); 
            that.applyForce(attack);
        });

        if (Tribe.showBehavior){
            this.color = "red";
        }
    }

    unite(TribeList) {
        this.unitedList = TribeList;

        // compute vectors
        var separation = this.separate(TribeList, this.separationRange).limit(this.maxforce);
        var alignment = this.align(TribeList).limit(this.maxforce);
        var cohesion = this.cohesion(TribeList).limit(this.maxforce);
        var affinity = this.affinity(TribeList);

        //Tribes of very different colors won't stay together as tightly as Tribes of the same color
        separation.mul(2);
        alignment.mul(0.7 * affinity);
        cohesion.mul(0.5 * affinity);

        // apply forces
        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);

        if (Tribe.showBehavior)
            this.color = "black";
    }

    // makes the Tribe chase a developed Tribe or a group of developed Tribes, and cooperate with it/them
    cooperate(TribeList, desertPopulation) {
        this.cooperationList = TribeList;

        var that = this;

        this.chase(TribeList, function(tribe) {
            // TODO 
        }, 400);

        if (Tribe.showBehavior)
            this.color = "pink";
    }

    divide(desertPopulation){

        if (this.developed){
            
            this.developed = false;
            var location = this.location.copy();
            var mass = this.mass / 10;
            this.mass /=  2;
            this.food /= 2;
            this.silver /= 2;
            var color = this.color;

            // mutation
            var mutation_rate = .01;
            // mass += Math.random() < mutation_rate ? Math.random() * 2 - 1 : 0;
            color = Math.random() < mutation_rate ? Math.random() : color;

            // add to desert population
            desertPopulation.push(new Tribe(mass, location.x, location.y, color, this.lookRange, this.influenceRange));
        }
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
                if (d < radius && (a < angle / 2 || a > Math.PI * 2 - angle / 2))
                    neighbors.push(TribeList[i]);
            }

        return neighbors;
    }

    // wander behaviour (when the Tribe is alone, i.e. it can't see other neighbors around)
    wander(radius) {
        if (Math.random() < .05) {
            this.wandering.rotate(Math.PI * 2 * Math.random());
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
        if (TribeList.length == 0)
            return;

        for (var i in TribeList) {
            this.applyForce(TribeList[i].attract(this, force || 50));
            if (this.location.dist(TribeList[i].location) < (this.length + TribeList[i].length) / 2)
                action(TribeList[i]); // <- execute action when reaching a Tribe
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
            sum.sub(this.velocity)
            sum.limit(this.maxforce);
        }

        return sum;
    }

    // aligns the Tribe to the surrounding Tribes
    align(neighbors) {
        var sum = new Vector(0, 0);

        if (neighbors.length) {
            for (var i in neighbors) {
                sum.add(neighbors[i].velocity);
            }
            sum.div(neighbors.length);
            sum.normalize();
            sum.mul(this.maxspeed);

            sum.sub(this.velocity).limit(this.maxspeed);
        }

        return sum;
    }

    // moves the Tribe towards the center of the surrounding Tribes
    cohesion(neighbors) {
        var sum = new Vector(0, 0);

        if (neighbors.length) {
            for (var i in neighbors) {
                sum.add(neighbors[i].location);
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
            //var difference = Math.abs(TribeList[i].hue - this.hue);
            var difference = Color.difference(TribeList[i].color, this.color);// * Math.abs(TribeList[i].hue - this.hue);
            if (difference > .5)
                difference = 1 - difference;
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

        var x = this.location.x - Math.cos(angle) * this.length;
        var y = this.location.y - Math.sin(angle) * this.length;

        var x2 = this.location.x + Math.cos(angle + this.HALF_PI) * this.base;
        var y2 = this.location.y + Math.sin(angle + this.HALF_PI) * this.base;

        var x3 = this.location.x + Math.cos(angle - this.HALF_PI) * this.base;
        var y3 = this.location.y + Math.sin(angle - this.HALF_PI) * this.base;

        // draw the behaviour of the Tribe (lines)
        this.drawBehavior(ctx);

        if (this.food < 0)
            this.color = "black";

        if (Tribe.showBehavior && this.developed){
            this.color = "pink";
        }

        // draw the Tribe on the canvas
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        /* ctx.quadraticCurveTo(x2, y2, x, y);
        ctx.quadraticCurveTo(x3, y3, x1, y1); */
        var radiusX = (this.mass + this.food + this.length) * 1 / 3;
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

        this.mass = (this.food + this.silver + this.water) / 3;

        // spend food
        // this.food -= ((this.acceleration.mag() * (Math.exp(this.mass / 50))) * this.age * this.velocity.mag()) / 100;
        this.food -= this.mass / 1000;
        this.silver -= 0.0005;

        // die
        if (this.food < 0) {
            this.dead = true;
			this.trigger('death');
        }

        // grow older
        this.age *= 1.0005;
        this.developed = (this.age > 1.5 || this.mass == 40);

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
