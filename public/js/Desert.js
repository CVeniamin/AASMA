$(function() {
    var DESERT_COLOR = "#FBB652",
        SALT_COLOR = "#FFFFFF",
        FOOD_COLOR = "#00FF00",
        FOOD_SIZE = 16,
        SILVER_COLOR = "#C0C0C0",
        WATER_COLOR = "#74ccf4",
	    WATER_RATIO = 0.15,
	    FOOD_RATIO = 0.15,
	    SILVER_RATIO = 0.15,
        WIDTH = 1150,
        HEIGHT = 730,
        WALL_SIZE = 20,
        WALL_COLOR = "#000000",
        SCOREBOARD_SIZE = 200;

    var getValueFromElement = function(inputElement, outputElement, callback) {
        var slider = document.getElementById(inputElement);
        var output = document.getElementById(outputElement);
        output.innerHTML = slider.value;
        callback(slider, output);
        slider.addEventListener("input", function(event) {
            callback(slider, output);
        });
        // slider.oninput = callback(slider, output);
        return slider.value;
    };

    var MIN_MASS = .5;
    var MAX_MASS = 3.5;
    var SCREEN = 1;
    // var colors = ["#00FF00", "#FF0000", "#F0F0F0", "#0000FF", "#000000", "#FFFFFF"];

    // canvas elements
    var canvas = $("#canvas")[0];
    var ctx = canvas.getContext('2d');

    // THE desert
    var desert = {
        width: 1000,
        height: 700,
        population: [],
        food: [],
        silver: [],
        water: [],
        ghazzu: false,
        trading: false,
	    caravansEnabled: false,
	    statistics: [],
        canvas: ctx
    };

    var populateDesert = function(size, lookRange, influenceRange) {
        // populate the desert
        for (var i = 0; i < size; i++) {
            // random setup
            var randomX = Math.random() * desert.width;
            var randomY = Math.random() * desert.height;
            //var randomMass = MIN_MASS + (Math.random() * Math.random() * Math.random() * Math.random()) * MAX_MASS;
            var hue = Math.random() < .5 ? Math.random() * .5 : 1 - Math.random() * .5;

            // create tribe
            var tribe = new Tribe(randomX, randomY, hue, lookRange, influenceRange);

            // add tribe to the desert population
            desert.population.push(tribe);
        }
    };

    var INFLUENCE_AREA = getValueFromElement("influenceArea", "influenceA", function(slider, output) {
        INFLUENCE_AREA = slider.value;
        output.innerHTML = slider.value;
    });

    var LOOK_AREA = getValueFromElement("lookArea", "lookA", function(slider, output) {
        LOOK_AREA = slider.value;
        output.innerHTML = slider.value;
    });

    var populationSizeOutput;
    var populationSlider;
    var POPULATION = getValueFromElement("population", "populationSize", function(slider, output) {
        populateDesert(slider.value - desert.population.length, LOOK_AREA, INFLUENCE_AREA);
        populationSlider = slider;
        POPULATION = slider.value;
        output.innerHTML = slider.value;
        populationSizeOutput = output;
    });

    var RESOURCE_RATIO = getValueFromElement("resourcesRatio", "resourcesR", function(slider, output) {
        RESOURCE_RATIO = slider.value;
	    FOOD_RATIO = RESOURCE_RATIO;
	    SILVER_RATIO = RESOURCE_RATIO / 2;
	    WATER_RATIO = RESOURCE_RATIO / 2;
        output.innerHTML = slider.value;
    });

    var createFood = function(size) {
        // add food to the desert
        var initialFood = size * FOOD_RATIO;
        for (var i = 0; i < initialFood; i++) {
            // initial values
            var randomX = Math.random() * desert.width;
            var randomY = Math.random() * desert.height;
            var foodAmount = Math.random() * 100 + 20;

            // create food
            var food = new Food(randomX, randomY, foodAmount);
            desert.food.push(food);
        }
    };

    var createSilver = function(size) {
        // add food to the desert
        var initialSilver = size * SILVER_RATIO;
        for (var i = 0; i < initialSilver; i++) {
            // initial values
            var randomX = Math.random() * desert.width;
            var randomY = Math.random() * desert.height;
            var silverAmount = Math.random() * 50 + 10;

            // create silver
            var silver = new Silver(randomX, randomY, silverAmount);
            desert.silver.push(silver);
        }

    };

	var createWater = function(size) {
		// add food to the desert
		var initialWater = size * WATER_RATIO;
		for (var i = 0; i < initialWater; i++) {
			// initial values
			var randomX = Math.random() * desert.width;
			var randomY = Math.random() * desert.height;
			var quantity = Math.random() * 50 + 20;

			// create water
			var water = new Water(randomX, randomY, quantity);
			desert.water.push(water);
		}

	};
    createFood(POPULATION);
    createSilver(POPULATION);
	createWater(POPULATION);

    var raiding = document.getElementById("raiding");
    raiding.addEventListener("change", function(){
        desert.ghazzu = this.checked;
    });

	var trading = document.getElementById("trading");
	trading.addEventListener("change", function(){
		desert.trading = this.checked;
	});

	var caravansEnabled = document.getElementById("caravansEnabled");
	caravansEnabled.addEventListener("change", function(){
		desert.caravansEnabled = this.checked;
	});

	var statistics = document.getElementById('statistics').getContext('2d');
	var statisticsChart = Graph.createChart(statistics, "bar", [], "Desert Statistics", [1, 2]);

	// internal use
	var time = null;
	var interval = 20;
	var steps = 0;
    // one time-step of the timeline loop
    var step = function() {
	    // clear the screen (with a fade)
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = DESERT_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        // update the food
        for (var i in desert.food) {
            var food = desert.food[i];

            if (food && !food.collected) {
                food.draw(ctx);
                food.update(desert);
            } else {
                desert.food[i] = null;
                if (Math.random() < FOOD_RATIO){
	                desert.food[i] = new Food(Math.random() * desert.width, Math.random() * desert.height, Math.random() * 80 + 20);

	                // sometimes food is a caravan
                    if(Math.random() < 0.3){
	                    desert.food[i].isCaravan = true;
                    }
                }
            }
        }

        // update the silver
        for (var i in desert.silver) {
            var silver = desert.silver[i];

            if (silver && !silver.collected) {
                silver.draw(ctx);
                silver.update(desert);
            } else {
                desert.silver[i] = null;
                if (Math.random() < SILVER_RATIO){
	                desert.silver[i] = new Silver(Math.random() * desert.width, Math.random() * desert.height, Math.random() * 50 + 10);

	                // sometimes silver is a caravan
                    if(Math.random() < 0.3){
	                    desert.silver[i].isCaravan = true;
                    }
                }
            }
        }

	    // update the water
	    for (var i in desert.water) {
		    var water = desert.water[i];

		    if (water && !water.collected) {
			    water.draw(ctx);
			    water.update(desert);
		    } else {
			    desert.water[i] = null;
			    if (Math.random() < WATER_RATIO){
			        var x = Math.random() * desert.width;
			        var y = Math.random() * desert.height;
				    desert.water[i] = new Water(x, y, Math.random() * 50 + 50);
                }
		    }
	    }
        // list of tribe that died during this time-step
        var deadList = [];

        // update all the tribes
        for (var i in desert.population) {
            // current tribe
            var tribe = desert.population[i];

            // if the tribe is dead or null, skip it
            if (tribe == null) {
                deadList.push(i);
                continue;
            }

            // makes the tribe compute an action (which direction to travel) according to the information it can get from the environment
            tribe.travel(desert);

            // update the tribe (position and state)
            tribe.update(desert);

            // draw the tribe
            tribe.draw(ctx);
            
            // if dead, add the tribe to the dead list
            if (tribe.dead) {
                desert.population[i] = null;
                deadList.push(i);
            }
        }

        // clean all the dead tribes from the desert population
        for (var j in deadList){
            desert.population.splice(deadList[j], 1);
            populationSizeOutput.innerHTML = desert.population.length;
            populationSlider.value = desert.population.length;
        }
    };

    // kick it off!
    setInterval(step, interval);

	setInterval(function () {
		var totalFood = 0;
		var totalWater = 0;
		var totalSilver = 0;
		desert.population.forEach(function (tribe) {
			totalFood += tribe.food;
			totalSilver += tribe.silver;
			totalWater += tribe.water;
		});
		desert.statistics.push({
			tribes : desert.population.length,
			food: totalFood,
			water: totalWater,
			silver: totalSilver
		});
		// TODO draw new statistics
		// Graph.addData(statisticsChart, ["tribes", "food", "water", "silver"], [desert.statistics]);
	}, 20 * 1000); //every 20 seconds

    // user-events listeners (clicks and keys)
    $(canvas).mouseup(function() {
        // toggle showBehaviour when clicking
        Tribe.showBehavior = !Tribe.showBehavior;
        $('#footer').html('click on gameboard to <b>' + (Tribe.showBehavior ? 'exit' : 'enter') + '</b> debugging');
    });

    // resizing the dimensions of the desert when resizing the screen
    $(window).resize(function() {
        // resize desert
        // desert.width = $(window).width() * SCREEN;
        // desert.height = $(window).height() * SCREEN;

        // resize canvas element
        var e = document.getElementById("canvas");
        e.setAttribute("width", desert.width);
        e.setAttribute("height", desert.height);
    }).resize();


    var cleanDesert = function() {
        desert.food = [];
        desert.silver = [];
	    desert.water = [];
	    desert.population = [];
    };

    var restartButton = document.getElementById("restart");
    restartButton.onclick = function() {
        cleanDesert();
        populateDesert(POPULATION, LOOK_AREA, INFLUENCE_AREA);
        createFood(POPULATION);
        createSilver(POPULATION);
        createWater(POPULATION);
    }
});