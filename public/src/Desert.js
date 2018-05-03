$(function() {
    var DESERT_COLOR = "#FBB652",
        SALT_COLOR = "#FFFFFF",
        FOOD_COLOR = "#00FF00",
        FOOD_SIZE = 16,
        SILVER_COLOR = "#C0C0C0",
        WATER_COLOR = "#0077BE",
        WIDTH = 1150,
        HEIGHT = 730,
        WALL_SIZE = 20,
        WALL_COLOR = "#000000",
        SCOREBOARD_SIZE = 200;

    var getValueFromElement = function(inputElement, outputElement, callback) {
        var slider = document.getElementById(inputElement);
        var output = document.getElementById(outputElement);
        output.innerHTML = slider.value;
        slider.addEventListener("input", function(event) {
            callback(slider, output);
        });
        // slider.oninput = callback(slider, output);
        return slider.value;
    };

    var MIN_MASS = .5;
    var MAX_MASS = 3.5;
    var SILVER_RATIO = .1;
    var SCREEN = 1;
    var colors = ["#00FF00", "#FF0000", "#F0F0F0", "#0000FF", "#000000", "#FFFFFF"];

    // canvas elements
    var canvas = $("#canvas")[0];
    var ctx = canvas.getContext('2d');

    // THE desert
    desert = {
        width: 1000,
        height: 700,
        population: [],
        food: [],
        silver: [],
        canvas: ctx
    }

    var populateDesert = function(size) {
        // populate the desert
        for (var i = 0; i < size; i++) {
            // random setup
            var randomX = Math.random() * desert.width;
            var randomY = Math.random() * desert.height
                // var randomMass = MIN_MASS + (Math.random() * Math.random() * Math.random() * Math.random()) * MAX_MASS;
            var color = colors[Math.floor(Math.random() * colors.length)];

            // create tribe
            var tribe = new Tribe(MIN_MASS, randomX, randomY, color);

            // add tribe to the desert population
            desert.population.push(tribe);
        }
    };

    var POPULATION = getValueFromElement("population", "populationSize", function(slider, output) {
        populateDesert(slider.value - desert.population.length);
        POPULATION = slider.value;
        output.innerHTML = slider.value;
    });

    var FOOD_RATIO = getValueFromElement("foodRatio", "foodR", function(slider, output) {
        FOOD_RATIO = slider.value;
        output.innerHTML = slider.value;
    });

    var createFood = function(size) {
        // add food to the desert
        var initialFood = size * FOOD_RATIO;
        for (var i = 0; i < initialFood; i++) {
            // initial values
            var randomX = Math.random() * desert.width;
            var randomY = Math.random() * desert.height;
            var foodAmmount = Math.random() * 100 + 20;

            // create food
            var food = new Food(randomX, randomY, foodAmmount);
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
            var silverAmount = Math.random() * 100 + 20;

            // create food
            var silver = new Silver(randomX, randomY, silverAmount);
            desert.silver.push(silver);
        }

    };

    populateDesert(POPULATION);
    createFood(POPULATION);
    createSilver(POPULATION);

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

            if (food && !food.dead) {
                food.draw(ctx);
                food.update(desert);
            } else {
                desert.food[i] = null;
                if (Math.random() < FOOD_RATIO / 50)
                    desert.food[i] = new Food(Math.random() * desert.width, Math.random() * desert.height, Math.random() * 100 + 20);
            }
        }

        // update the silver
        for (var i in desert.silver) {
            var silver = desert.silver[i];

            if (silver && !silver.dead) {
                silver.draw(ctx);
                silver.update(desert);
            } else {
                desert.silver[i] = null;
                if (Math.random() < SILVER_RATIO / 100)
                    desert.silver[i] = new Silver(Math.random() * desert.width, Math.random() * desert.height, Math.random() * 100 + 20);
            }
        }

        // list of tribe that died during this time-step
        var deadList = [];

        // update all the tribees
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

        // clean all the dead tribees from the desert population
        for (var j in deadList)
            desert.population.splice(deadList[j], 1);
    }

    // kick it off!
    setInterval(step, interval);

    // user-events listeners (clicks and keys)
    $(canvas).mouseup(function() {
        // toggle showBehaviour when clicking
        Tribe.showBehavior = !Tribe.showBehavior;
        $('#footer').html('click on gameboard to <b>' + (Tribe.showBehavior ? 'quit' : 'enter') + '</b> behaviour inspector');
    });

    // resizing the dimesions of the desert when resising the screen
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
        desert.population = [];
    }

    var restartButton = document.getElementById("restart");
    restartButton.onclick = function() {
        cleanDesert();
        populateDesert(POPULATION);
        createFood(POPULATION);
        createSilver(POPULATION);
    }
});