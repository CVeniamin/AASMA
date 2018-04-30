//Aliases
let Application = PIXI.Application,
	Container = PIXI.Container,
	loader = PIXI.loader,
	resources = PIXI.loader.resources,
	Graphics = PIXI.Graphics,
	Texture = PIXI.Texture,
	TextureCache = PIXI.utils.TextureCache,
	RenderTexture = PIXI.RenderTexture,
	Sprite = PIXI.Sprite,
	Text = PIXI.Text,
	TextStyle = PIXI.TextStyle;

let constants = {
	DESERT_COLOR: 0xFBB652,
	SALT_COLOR: 0xFFFFFF,
	FOOD_COLOR: 0x00FF00,
	FOOD_SIZE : 16,
	SILVER_COLOR: 0xC0C0C0,
	WATER_COLOR: 0x0077BE,
	WIDTH:1150,
	HEIGHT:730,
	WALL_SIZE:20,
	WALL_COLOR:0x000000,
	SCOREBOARD_SIZE:200,
};

//Create a Pixi Application
let app = new Application({
	width: constants.WIDTH,
	height: constants.HEIGHT,
	antialiasing: true,
	transparent: false,
	resolution: 1
});

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader
	.add("resources/treasureHunter.json")
	.load(setup);

//Define variables that might be used in more
//than one function
let state, desert,
	door, message, gameScene, scoreBoard, gameOverScene, enemies, id;

let numOfTribes = 10;
// let Food = {"red":50, "yellow":50, "green":50, "blue":50};
let Tribes = [];
let TribesInfluence = [];
let Food = [];

//Create the text sprite and add it to the `gameOver` scene
let scoreStyle = new TextStyle({
	fontFamily: "Futura",
	fontSize: 12,
	fill: "white"
});

function getInfluenceArea(tribe, influenceArea){
	return {
		x:((tribe.x + tribe.width ) - influenceArea) / 2,
		y:((tribe.y + tribe.height) - influenceArea) / 2,
		width: influenceArea,
		height: influenceArea
	};
}

function setInfluenceArea(tribe, influenceArea){
	return {
		x:(tribe.width  - influenceArea) / 2,
		y:(tribe.height - influenceArea) / 2,
		width: influenceArea,
		height: influenceArea
	};
}

// TODO : change weights given for each resource when calculating the influence
function initializeTribes(numOfTribes) {
	for (let i = 0; i < numOfTribes; i++){

		let resources = {
			"Food": 50,
			"Salt": 30,
			"Silver": 10
		};

		Tribes[i] = {
			"resources" : resources,
		};
		let updatedInfluence = updateTribeInfluence(i, [1, 1, 2]);
		// let tribe = new Sprite(id["explorer.png"]);
		let tribe = new Graphics();
		tribe.drawRect(0,0, 16, 16);
		tribe.endFill();
		tribe.x = randomInt(0, constants.WIDTH);
		tribe.y = randomInt(0, constants.HEIGHT);
		tribe.vx = 0;
		tribe.vy = 0;

		let tribeInfluence = new Graphics();
		tribeInfluence.lineStyle(2, 0x000000);  //(thickness, color)
		let influenceArea = setInfluenceArea(tribe, updatedInfluence);
		tribeInfluence.drawRect(influenceArea.x, influenceArea.y, influenceArea.width, influenceArea.height);
		tribeInfluence.endFill();
		Tribes[i].influence = influenceArea;

		let f = new Text(resources.Food, scoreStyle);
		f.y = influenceArea.y - 20;
		f.x = influenceArea.x;
		let salt = new Text(resources.Salt, scoreStyle);
		salt.y = influenceArea.y - 20;
		salt.x = influenceArea.x + 20;
		let silver = new Text(resources.Silver, scoreStyle);
		silver.y = influenceArea.y - 20;
		silver.x = influenceArea.x + 40;
		tribe.addChild(tribeInfluence, f, salt, silver);
		gameScene.addChild(tribe);
		Tribes[i].sprite = tribe;
	}
}

function updateTribeInfluence(index, influence){
	let updatedInfluence = Tribes[index].resources.Food * influence[0] + Tribes[index].resources.Salt * influence[1]  +  Tribes[index].resources.Silver * influence[2];
	/*TribesInfluence[index] = {
		"influence" : updatedInfluence
	};*/
	return updatedInfluence;
}

function updateResources(tribe) {
	tribe.sprite.getChildAt(1).text = tribe.resources.Food;
	tribe.sprite.getChildAt(2).text = tribe.resources.Salt;
	tribe.sprite.getChildAt(3).text = tribe.resources.Silver;
}

function drawFood(quantity){
	for(let i = 0; i < quantity; i++){
		// let food = new PIXI.Circle(randomInt(0, constants.WIDTH - constants.FOOD_SIZE), randomInt(0, constants.HEIGHT - constants.FOOD_SIZE), constants.FOOD_SIZE);
		// console.log(food);
		let food = new Graphics();
		food.beginFill(constants.FOOD_COLOR);
		food.drawRect(0, 0, constants.FOOD_SIZE, constants.FOOD_SIZE);
		food.endFill();
		food.x = randomInt(0, constants.WIDTH - constants.FOOD_SIZE);
		food.y = randomInt(0, constants.HEIGHT - constants.FOOD_SIZE);
		Food[i] = {
			sprite : food,
			value : 20,
			point : new PIXI.Point(food.x, food.y)
		};
		gameScene.addChild(food);
	}
}

function drawDesert(){
	desert = new Graphics();
	desert.lineStyle(constants.WALL_SIZE, constants.WALL_COLOR, 1);
	desert.beginFill(constants.DESERT_COLOR);
	desert.drawRect(0, 0, constants.WIDTH, constants.HEIGHT);
	desert.endFill();
	desert.x = 0;
	desert.y = 0;
	gameScene.addChild(desert);
}
function setup() {

	//Make the game scene and add it to the stage
	gameScene = new Container();
	app.stage.addChild(gameScene);

	scoreBoard = new Container();
	gameScene.addChild(scoreBoard);

	//Make the sprites and add them to the `gameScene`
	//Create an alias for the texture atlas frame ids
	id = resources["resources/treasureHunter.json"].textures;

	// Desert
	drawDesert();

	drawFood(10);

	initializeTribes(5);

	let spacing = 48,
		xOffset = 150,
		speed = 2,
		direction = 1;

	for (let i = 0; i < Tribes.length; i++) {

		let tribe = Tribes[i].sprite;
		//Space each tribe horizontally according to the `spacing` value.
		//`xOffset` determines the point from the left of the screen
		//at which the first blob should be added
		let x = spacing * i + xOffset;

		//Give the blob a random y position
		let y = randomInt(0, constants.HEIGHT - tribe.height);

		//Set the blob's position
		tribe.x = x;
		tribe.y = y;

		//Set the blob's vertical velocity. `direction` will be either `1` or
		//`-1`. `1` means the enemy will move down and `-1` means the blob will
		//move up. Multiplying `direction` by `speed` determines the blob's
		//vertical direction
		tribe.vy = speed * direction;

		//Reverse the direction for the next blob
		direction *= -1;
	}

	//Create the `gameOver` scene
	gameOverScene = new Container();
	app.stage.addChild(gameOverScene);

	//Make the `gameOver` scene invisible when the game first starts
	gameOverScene.visible = false;

	//Set the game state
	state = play;

	//Start the game loop
	app.ticker.add(delta => gameLoop(delta));
}


function gameLoop(delta) {
	//Update the current game state:
	state(delta);
}

function play(delta) {

	//Loop through all the sprites in the `enemies` array
	Tribes.forEach(function(tribe, index) {
		let hitsWall = contain(tribe.sprite, {x: 28, y: 10, width: constants.WIDTH, height: constants.HEIGHT});
		switch (hitsWall){
			case "bottom":
			case "top":
				tribe.sprite.vy *= -1;
				break;
			case "left":
			case "right":
				tribe.sprite.vx *= -1;
				break;
			default:
				let moves = randomInt(-3, 3);
				randomInt(0, 1) ? tribe.sprite.vx += moves : tribe.sprite.vy += moves;
				break;
		}
		let foodDirection;
		let influenceArea = getInfluenceArea(tribe.sprite, tribe.influence.width);
		let auxFood = Food;
		Food.forEach(function (food, foodIndex, object) {
			let container = {
				x: food.sprite.x,
				y: food.sprite.y,
				width:food.sprite.width,
				height:food.sprite.height
			};
			foodDirection = contain(influenceArea, container);
			let gatheringFood = hitTestRectangle(influenceArea, container);
			if(food.value === 0){
				object.splice(foodIndex, 1);
				food.sprite.visible = false;
				food.sprite.destroy();
			}

			/*switch (foodDirection){
				case "bottom":
					tribe.sprite.vy += 1;
					break;
				case "top":
					tribe.sprite.vy -= 1;
					break;
				case "left":
					tribe.sprite.vx -= 1;
					break;
				case "right":
					tribe.sprite.vx += 1;
					break;
			}*/
			if(foodDirection && gatheringFood){
				food.value--;
				tribe.resources.Food++;
			}
			auxFood = object;
		});
		if(foodDirection){
			tribe.sprite.x += tribe.sprite.vx;
			tribe.sprite.vx = 0;
			tribe.sprite.y += tribe.sprite.vy;
			tribe.sprite.vy = 0;

		}
		tribe.influence = getInfluenceArea(tribe.sprite, tribe.influence.width);
		updateResources(tribe);
		Food = auxFood;
	});
}

function end() {
	gameScene.visible = false;
	gameOverScene.visible = true;
}

/* Helper functions */

function contain(sprite, container) {

	let collision = undefined;

	//Left
	if (sprite.x < container.x) {
		sprite.x = container.x;
		collision = "left";
	}

	//Top
	if (sprite.y < container.y) {
		sprite.y = container.y;
		collision = "top";
	}

	//Right
	if (sprite.x + sprite.width > container.width) {
		sprite.x = container.width - sprite.width;
		collision = "right";
	}

	//Bottom
	if (sprite.y + sprite.height > container.height) {
		sprite.y = container.height - sprite.height;
		collision = "bottom";
	}

	//Return the `collision` value
	return collision;
}

//The `hitTestRectangle` function
function hitTestRectangle(r1, r2) {

	//Define the variables we'll need to calculate
	let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

	//hit will determine whether there's a collision
	hit = false;

	//Find the center points of each sprite
	r1.centerX = r1.x + r1.width / 2;
	r1.centerY = r1.y + r1.height / 2;
	r2.centerX = r2.x + r2.width / 2;
	r2.centerY = r2.y + r2.height / 2;

	//Find the half-widths and half-heights of each sprite
	r1.halfWidth = r1.width / 2;
	r1.halfHeight = r1.height / 2;
	r2.halfWidth = r2.width / 2;
	r2.halfHeight = r2.height / 2;

	//Calculate the distance vector between the sprites
	vx = r1.centerX - r2.centerX;
	vy = r1.centerY - r2.centerY;

	//Figure out the combined half-widths and half-heights
	combinedHalfWidths = r1.halfWidth + r2.halfWidth;
	combinedHalfHeights = r1.halfHeight + r2.halfHeight;

	//Check for a collision on the x axis
	if (Math.abs(vx) < combinedHalfWidths) {

		//A collision might be occuring. Check for a collision on the y axis
		if (Math.abs(vy) < combinedHalfHeights) {

			//There's definitely a collision happening
			hit = true;
		} else {

			//There's no collision on the y axis
			hit = false;
		}
	} else {

		//There's no collision on the x axis
		hit = false;
	}

	//`hit` will be either `true` or `false`
	return hit;
}


//The `randomInt` helper function
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

//The `keyboard` helper function
function keyboard(keyCode) {
	var key = {};
	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;
	//The `downHandler`
	key.downHandler = function(event) {
		if (event.keyCode === key.code) {
			if (key.isUp && key.press) key.press();
			key.isDown = true;
			key.isUp = false;
		}
		event.preventDefault();
	};

	//The `upHandler`
	key.upHandler = function(event) {
		if (event.keyCode === key.code) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

	//Attach event listeners
	window.addEventListener(
		"keydown", key.downHandler.bind(key), false
	);
	window.addEventListener(
		"keyup", key.upHandler.bind(key), false
	);
	return key;
}