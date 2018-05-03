// MASS MULTIPLIERS - these values represent the relationship between the Tribe's properties and its mass
var food = 10,
    silver = 10,
    MAX_SPEED = 3,
    MAX_FORCE = .1,
    SEPARATION_RANGE = 30,
    LOOK_RANGE = 100,
    INFLUENCE_RANGE = 500,
    LENGTH = 20,
    FERTILITY = .1,
    BITE = .1;


// Tribe constructor
class Tribe {
    constructor(mass, x, y, color, hue) {
        // Tribe's properties
        this.ID = Tribe.uid();
        this.mass = mass > 0 ? mass : -mass;
        this.food = food;
        this.silver = silver;
        this.maxspeed = MAX_SPEED * this.mass;
        this.maxforce = MAX_FORCE / (this.mass * this.mass);
        this.separationRange = this.mass * SEPARATION_RANGE;
        this.lookRange = this.mass * LOOK_RANGE;
        this.influenceRange = this.mass * INFLUENCE_RANGE;
        this.length = mass * LENGTH;
        this.base = this.length * .5;
        this.location = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.wandering = new Vector(.2, .2);
        this.hue = hue || Math.random() < .3 ? Math.random() * .2 : 1 - Math.random() * .3; // <- the hue is used for color generation and mating
        // this.color = Tribe.rgb2hex(Tribe.hsv2rgb(this.hue, 1, 1));
        this.color = color;
        this.skin = this.color;
        this.dead = false;
        this.age = 1;
        this.fertility = (this.mass) * FERTILITY + 1;
        this.mature = false;
        this.bite = this.mass * BITE;
        // helper
        this.HALF_PI = Math.PI * .5;
    }

    // Color Utilities
    static hex2rgb(h) {
        var hex = h.toString().substr(1);
        var r = parseInt(hex[0] + hex[1], 16);
        var g = parseInt(hex[2] + hex[3], 16);
        var b = parseInt(hex[4] + hex[5], 16);
        return {
            r: r,
            g: g,
            b: b
        };
    }

    static rgb2hex(rgb) {
        rgb.r |= 0;
        rgb.g |= 0;
        rgb.b |= 0;
        var r = rgb.r.toString(16);
        var g = rgb.g.toString(16);
        var b = rgb.b.toString(16);
        r = r.length == 1 ? "0" + r : r;
        g = g.length == 1 ? "0" + g : g;
        b = b.length == 1 ? "0" + b : b;
        return "#" + r.substr(0, 2) + g.substr(0, 2) + b.substr(0, 2);
    }

    static hsv2rgb(h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (h && s === undefined && v === undefined) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v, g = t, b = p;
                break;
            case 1:
                r = q, g = v, b = p;
                break;
            case 2:
                r = p, g = v, b = t;
                break;
            case 3:
                r = p, g = q, b = v;
                break;
            case 4:
                r = t, g = p, b = v;
                break;
            case 5:
                r = v, g = p, b = q;
                break;
        }
        return {
            r: Math.floor(r * 255),
            g: Math.floor(g * 255),
            b: Math.floor(b * 255)
        };
    }

    static hue2hex(hue) {
        var rgb = Tribe.hsv2rgb(hue, 1, 1);
        var hex = Tribe.rgb2hex(rgb);
        return hex;
    }

    static interpolate(colorA, colorB) {
        var interpolation = -1,
            difference = Math.abs(colorA - colorB);
        if (difference > .5) {
            interpolation = (colorA > colorB ? colorA : colorB) + (1 - difference) / 2;
            if (interpolation > 1)
                interpolation -= 1;
        } else
            interpolation = (colorA + colorB) / 2;
        return interpolation;
    }

    // computes all the information from the enviroment and decides in which direction travel
    travel(desert) {
        // surrounding Tribes
        var neighboors = this.look(desert.population, this.lookRange, Math.PI * 2);

        // nearby food
        var nearbyFood = this.look(desert.food, this.influenceRange, Math.PI * 2);

        // eat food
        for (var index in nearbyFood) {
            var food = nearbyFood[index];
            if (food && !food.dead) {
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
            if (silver && !silver.dead) {
                // go to the food
                this.follow(silver.location, silver.radius / 10);

                // if close enough...
                if (this.location.dist(silver.location) < silver.radius) {
                    silver.collectedBy(this);
                }
            }
        }

        // find nearby Tribes that aren't too big or too small
        var friends = [];
        for (var j in neighboors) {
            if (neighboors[j].mass < this.mass * 2 && neighboors[j].mass > this.mass / 2)
                friends.push(neighboors[j]);
        }

        // if any, shoal with them
        if (friends.length)
            this.shoal(friends);

        // if nobody is nearby, wander around
        else this.wander(200);

        // find nerby Tribees that are way bigger than the this Tribe
        var bigger = [];
        for (var j in neighboors) {
            if (neighboors[j].mass > this.mass * 2)
                bigger.push(neighboors[j]);
        }

        // if any, avoid it/them
        if (bigger.length)
            this.avoid(bigger, 300);

        // find nearby Tribe that are way smaller than the this Tribe
        var smaller = [];
        for (var j in neighboors) {
            if (neighboors[j].mass < this.mass / 2)
                smaller.push(neighboors[j]);
        }

        // if any, chase and eat it/them
        if (smaller.length)
            this.eat(smaller);

        // if the Tribe is mature enough...
        if (this.mature) {
            // find nearby mature Tribees
            var mature = [];
            for (var j in neighboors)
                if (neighboors[j].mature)
                    mature.push(neighboors[j]);

                // mate with it/them
            this.mate(mature, desert.population);
        }

        // avoid the boundaries of the desert
        this.boundaries(desert);
    }

    // makes the Tribe avoid a group of Tribes
    avoid(TribeList, dist) {
        this.avoidList = TribeList;

        for (var i in TribeList) {
            var d = this.location.dist(TribeList[i].location)
            if (d < dist) {
                var avoid = TribeList[i].location.copy().sub(this.location).mul(-100);
                this.applyForce(avoid);
            }
        }

        if (Tribe.showBehavior)
            this.color = "blue";
    }

    // makes the Tribe chase another group of Tribes, and eat them when reaching
    eat(TribeList) {
        this.eatList = TribeList;

        var that = this;

        this.chase(TribeList, function(Tribe) {
            that.food += Tribe.food;
            Tribe.food = 0;
        });

        if (Tribe.showBehavior)
            this.color = "red";
    }


    // emulates the shoal behaviour
    shoal(TribeList) {
        this.shoalList = TribeList;

        // compute vectors
        var separation = this.separate(TribeList, this.separationRange).limit(this.maxforce);
        var alignment = this.align(TribeList).limit(this.maxforce);
        var cohesion = this.cohesion(TribeList).limit(this.maxforce);
        var affinity = this.affinity(TribeList);

        //Tribes of very different colors won't stay together as tightly as Tribes of the same color
        separation.mul(1.2);
        alignment.mul(1.2 * affinity);
        cohesion.mul(1 * affinity);

        // apply forces
        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);

        if (Tribe.showBehavior)
            this.color = "black";
    }

    // makes the Tribe chase a mature Tribe or a group of mature Tribees, and mate with it/them
    mate(TribeList, desertPopulation) {
        this.mateList = TribeList;

        var that = this;

        this.chase(TribeList, function(Tribe) {

            // set both Tribes unable to mate till reaching next fertility threashold
            that.fertility += that.mass;
            that.mature = false;

            Tribe.fertility += Tribe.mass;
            Tribe.mature = false;

            // DNA of the offspring
            var location = that.location.copy().lerp(Tribe.location, .5);
            var mass = (that.mass + Tribe.mass) / 2;
            var color = Tribe.interpolate(that.hue, Tribe.hue);

            // mutation
            var mutation_rate = .01;
            mass += Math.random() < mutation_rate ? Math.random() * 2 - 1 : 0;
            color = Math.random() < mutation_rate ? Math.random() : color;

            // create offspring
            var offspring = new Tribe(mass, location.x, location.y, color);

            // add to desert population
            desertPopulation.push(offspring);
        }, 400);

        if (Tribe.showBehavior)
            this.color = "pink";
    }

    // avoid boundaries of the screen
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

    /* boundaries(desert) {
        var d = 0;
        var desired = null;
        if (this.location.x < d) {
            // desired = createVector(this.maxspeed, this.velocity.y);
            desired = new Vector(this.maxspeed, this.velocity.y);
        } else if (this.location.x > desert.width - d) {
            // desired = createVector(-this.maxspeed, this.velocity.y);
            desired = new Vector(-this.maxspeed, this.velocity.y);
        }

        if (this.location.y < d) {
            // desired = createVector(this.velocity.x, this.maxspeed);
            desired = new Vector(this.velocity.x, this.maxspeed);
        } else if (this.location.y > desert.height - d) {
            // desired = createVector(this.velocity.x, -this.maxspeed);
            desired = new Vector(this.velocity.x, -this.maxspeed);
        }

        if (desired !== null) {
            desired.setMag(this.maxspeed);
            // var steer = p5.Vector.sub(desired, this.velocity);
            var steer = desired.sub(this.velocity);
            steer.limit(this.maxforce);
            this.applyForce(steer);
        }
    } */

    // return an array of the nearby Tribe that are ahead
    look(TribeList, radius, angle) {
        var neighboors = [];
        for (var i in TribeList)
            if (TribeList[i] != null && TribeList[i] != this) {
                var diff = this.location.copy().sub(TribeList[i].location);
                var a = this.velocity.angleBetween(diff);
                var d = this.location.dist(TribeList[i].location);
                if (d < radius && (a < angle / 2 || a > Math.PI * 2 - angle / 2))
                    neighboors.push(TribeList[i]);
            }

        return neighboors;
    }

    // wander behaviour (when the Tribe is alone, i.e. it can't see other neighboors around)
    wander(radius) {
        if (Math.random() < .05) {
            this.wandering.rotate(Math.PI * 2 * Math.random());
        }
        this.velocity.add(this.wandering);

        if (Tribe.showBehavior)
            this.color = "gray";
    }

    // makes the Tribe folow a target (vector)
    follow(target, arrive) {
        var dest = target.copy().sub(this.location);
        var d = dest.dist(this.location);

        if (d < arrive)
            dest.setMag(d / arrive * this.maxspeed);
        else
            dest.setMag(this.maxspeed);

        this.applyForce(dest.limit(this.maxforce * 2));
    }

    // chase behaviour - makes the Tribe chase a group of other Tribees
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

    // makes the Tribe separate from the surrounding Tribees
    separate(neighboors, range) {
        var sum = new Vector(0, 0);

        if (neighboors.length) {
            for (var i in neighboors) {
                var d = this.location.dist(neighboors[i].location)
                if (d < range) {
                    var diff = this.location.copy().sub(neighboors[i].location);
                    diff.normalize();
                    diff.div(d);
                    sum.add(diff);
                }
            }
            sum.div(neighboors.length);
            sum.normalize();
            sum.mul(this.maxspeed);
            sum.sub(this.velocity)
            sum.limit(this.maxforce);
        }

        return sum;
    }

    // aligns the Tribe to the surrounding Tribees
    align(neighboors) {
        var sum = new Vector(0, 0);

        if (neighboors.length) {
            for (var i in neighboors) {
                sum.add(neighboors[i].velocity);
            }
            sum.div(neighboors.length);
            sum.normalize();
            sum.mul(this.maxspeed);

            sum.sub(this.velocity).limit(this.maxspeed);
        }

        return sum;
    }

    // moves the Tribe towards the center of the surrounding Tribes
    cohesion(neighboors) {
        var sum = new Vector(0, 0);

        if (neighboors.length) {
            for (var i in neighboors) {
                sum.add(neighboors[i].location);
            }
            sum.div(neighboors.length);
            return this.seek(sum);
        }

        return sum;
    }

    // return a coeficient represanting the color affinity in a group of neighboor Tribes
    affinity(TribeList) {
        var coef = 0;
        for (var i in TribeList) {
            var difference = Math.abs(TribeList[i].hue - this.hue);
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

        if (Tribe.showBehavior && this.mature)
            this.color = "pink";

        // draw the Tribe on the canvas
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        /* ctx.quadraticCurveTo(x2, y2, x, y);
        ctx.quadraticCurveTo(x3, y3, x1, y1); */
        ctx.ellipse(x1, y1, (this.mass + this.food + this.length) * 1 / 3, (this.mass + this.food + this.length) * 1 / 3, 45 * Math.PI / 180, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText(this.ID, x, y);
        ctx.fill();
    }

    // draw what's going on inside the Tribe's head
    drawBehavior(ctx) {
        if (Tribe.showBehavior) {
            var old = ctx.globalAlpha;
            ctx.globalAlpha = .2;

            // draw avoid behaviour
            if (this.avoidList && this.avoidList.length) {
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 4;
                ctx.beginPath();
                for (var i in this.avoidList) {
                    ctx.moveTo(this.location.x, this.location.y);
                    ctx.lineTo(this.avoidList[i].location.x, this.avoidList[i].location.y);
                }
                ctx.stroke();
            }

            // draw chase behaviour
            if (this.eatList && this.eatList.length) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 4;
                ctx.beginPath();
                for (var i in this.eatList) {
                    ctx.moveTo(this.location.x, this.location.y);
                    ctx.lineTo(this.eatList[i].location.x, this.eatList[i].location.y);
                }
                ctx.stroke();
            }

            // draw shoal behaviour
            if (this.shoalList && this.shoalList.length) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = "black";
                ctx.beginPath();
                for (var i in this.shoalList) {
                    ctx.moveTo(this.location.x, this.location.y);
                    ctx.lineTo(this.shoalList[i].location.x, this.shoalList[i].location.y);
                }
                ctx.stroke();
            }

            // draw mate behaviour
            if (this.mateList && this.mateList.length) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = "pink";
                ctx.beginPath();
                for (var i in this.mateList) {
                    ctx.moveTo(this.location.x, this.location.y);
                    ctx.lineTo(this.mateList[i].location.x, this.mateList[i].location.y);
                }
                ctx.stroke();
            }

            // clear the lists
            this.avoidList = null;
            this.eatList = null;
            this.shoalList = null;
            this.mateList = null;

            // restore alpha
            ctx.globalAlpha = old;
        } else
            this.color = this.skin;
    }

    // update the Tribe's position and state
    update(desert) {
        // move the Tribe
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxspeed);
        if (this.velocity.mag() < 3)
            this.velocity.setMag(5);

        this.location.add(this.velocity);
        this.acceleration.limit(this.maxforce);

        // spend food
        this.food -= ((this.acceleration.mag() * this.mass) * this.age * this.velocity.mag()) / 100;

        // die
        if (this.food < 0) {
            this.dead = true;
        }

        // grow older
        this.age *= 1.00005;
        this.mature = this.age > this.fertility;

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