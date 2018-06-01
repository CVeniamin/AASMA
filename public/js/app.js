$(function() {
    const concert = require('concert');

    var DESERT_COLOR = "#FBB652",
        WATER_RATIO = 0.15,
        FOOD_RATIO = 0.15,
        SILVER_RATIO = 0.15;

    var getValueFromElement = function(inputElement, outputElement, callback) {
        var slider = document.getElementById(inputElement);
        var output = document.getElementById(outputElement);
        output.innerHTML = slider.value;
        callback(slider, output);
        slider.addEventListener("input", function(event) {
            callback(slider, output);
        });
        return slider.value;
    };

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

    var populateDesertTribes = function(size, lookRange, influenceRange) {
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

    var populateDesertResources = function(size) {
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

        createFood(size);
        createSilver(size);
        createWater(size);
    };

    var SPEED = getValueFromElement("speed", "speedValue", function(slider, output) {
        SPEED = slider.value;
        output.innerHTML = slider.value + 'x';
    });

    var populationSizeOutput;
    var populationSlider;
    var POPULATION = getValueFromElement("population", "populationSize", function(slider, output) {
        populateDesertTribes(slider.value - desert.population.length, LOOK_AREA, INFLUENCE_AREA);
        populationSlider = slider;
        POPULATION = slider.value;
        output.innerHTML = slider.value;
        populationSizeOutput = output;
    });

    var INFLUENCE_AREA = getValueFromElement("influenceArea", "influenceA", function(slider, output) {
        INFLUENCE_AREA = slider.value;
        output.innerHTML = slider.value;
    });

    var LOOK_AREA = getValueFromElement("lookArea", "lookA", function(slider, output) {
        LOOK_AREA = slider.value;
        output.innerHTML = slider.value;
    });

    var RESOURCE_RATIO = getValueFromElement("resourcesRatio", "resourcesR", function(slider, output) {
        RESOURCE_RATIO = slider.value;
        FOOD_RATIO = RESOURCE_RATIO;
        SILVER_RATIO = RESOURCE_RATIO / 2;
        WATER_RATIO = RESOURCE_RATIO / 2;
        output.innerHTML = slider.value;
    });

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

    var step = function(recursive) {
        if (!recursive) {
            var steps = SPEED - 1;
            while (steps-- > 0) {
                step(true);
            }

            // clear the screen (with a fade)
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = DESERT_COLOR;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
        }

        // update the food
        for (let i in desert.food) {
            var food = desert.food[i];

            if (food && !food.collected) {
                if (!recursive) {
                    food.draw(ctx);
                }

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
        for (let i in desert.silver) {
            var silver = desert.silver[i];

            if (silver && !silver.collected) {
                if (!recursive) {
                    silver.draw(ctx);
                }

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
        for (let i in desert.water) {
            var water = desert.water[i];

            if (water && !water.collected) {
                if (!recursive) {
                    water.draw(ctx);
                }

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

        // update all the tribes
        let deadCount = 0;
        for (let i in desert.population) {
            // current tribe
            var tribe = desert.population[i];

            // makes the tribe compute an action (which direction to travel) according to the information it can get from the environment
            tribe.travel(desert);

            // update the tribe (position and state)
            tribe.update(desert);

            if (!recursive) {
                // draw the tribe
                tribe.draw(ctx);
            }

            // if dead, queue for removal
            if (tribe.dead) {
                desert.population[i] = null;
                deadCount++;
            }
        }

        if (deadCount) {
            // Remove dead tribes
            desert.population = desert.population.filter(tribe => tribe);
            populationSizeOutput.innerHTML = desert.population.length;
            populationSlider.value = desert.population.length;
        }
    };

    var gameLoopInterval = null;
    var runGameLoop = function() {
        if (!gameLoopInterval) {
            gameLoopInterval = setInterval(step, 20);
            concert.trigger("run");
        }
    };
    var pauseGameLoop = function() {
        if (gameLoopInterval) {
            clearInterval(gameLoopInterval);
            gameLoopInterval = null;
            concert.trigger("pause");
        }
    };

    // resizing the dimensions of the desert when resizing the screen
    $(window).resize(function() {
        var e = document.getElementById("canvas");
        e.setAttribute("width", desert.width);
        e.setAttribute("height", desert.height);
    }).resize();

    var initGameState = function() {
        pauseGameLoop();

        Math.setRandomSeed($('#seed').val());

        desert.food = [];
        desert.silver = [];
        desert.water = [];
        desert.population.forEach(function(tribe) {
            tribe.trigger('deleted', tribe);
        });
        desert.population = [];

        concert.trigger("reset");

        populateDesertTribes(POPULATION, LOOK_AREA, INFLUENCE_AREA);
        populateDesertResources(POPULATION);
    };

    $(canvas).on('mousedown', function(e) {
        // toggle showBehaviour when clicking
        Tribe.showBehavior = !Tribe.showBehavior;
        $('#footer').html('click on gameboard to <b>' + (Tribe.showBehavior ? 'exit' : 'enter') + '</b> debugging');

        e.preventDefault();
    });

    $('#run').on('click', function() {
        runGameLoop();
    });

    $('#pause').on('click', function() {
        pauseGameLoop();
    });

    $('#reset').on('click', function() {
        initGameState();
    });

    $('#seed').val(Math.getRandomSeed());
    $('#newSeed').on('mousedown', function(e) {
        Math.setRandomSeed();
        $('#seed').val(Math.getRandomSeed());
        e.preventDefault();
    });

    initGameState();
});