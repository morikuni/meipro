
//----------------------------------------------------------------------------
//	Datas
//----------------------------------------------------------------------------

var GameData = {

	ObjectSize : 32,

	Game : null,

	Player : null,

	CurrentMaze : null,

	CurrentMazeNumber : null,

	GameSize : {
		width  : 500,
		height : 500
	},

	FPS : 30,

	Compass : {
		North : 'north',
		South : 'south',
		West  : 'west',
		East  : 'east'
	}

};

//----------------------------------------------------------------------------
//	functions
//----------------------------------------------------------------------------

function CompassToVector(/*GameData.Compass*/ compass){
	var c = GameData.Compass;
	switch(compass){
		case c.North:
			return new Vector(0, -1);
		case c.South:
			return new Vector(0,  1);
		case c.West:
			return new Vector(-1, 0);
		case c.East:
			return new Vector( 1, 0);
	}
}

/*配列を結合する。要素はユニークとなる*/
/*Array*/ function Array_concatUnique(/*Array*/ array1,  /*Array*/ array2){
	var array = [];
	array1 = array1 || [];
	array2 = array2 || [];

	for(var i=0; i<array1.length; i++){
		array.push(array1[i]);
	}

	for(var i=0; i<array2.length; i++){
		var hasSameValue = false;
		for(var j=0; j<array.length; j++){
			if(array2[i] == array[j]){
				hasSameValue = true;
				break;
			}
		}
		if(!hasSameValue){
			array.push(array2[j]);
		}
	}

	return array;
}

/*配列から要素を削除する*/
/*Array*/ function Array_remove(/*Array*/ array,  target){

	for(var i=0; i<array.length; i++){
		if(array[i] === target){
			array.splice(i, 1);
			break;
		}
	}

}


//----------------------------------------------------------------------------
//	classes
//----------------------------------------------------------------------------


var GameObject = Class.create(Sprite,{

	initialize : function(/*Number*/ width, /*Number*/ height){
		Sprite.call(this, width, height);
		/*function*/ this._currentTask = null;
		this._pos = new Vector(0, 0) //mazeの配列上での位置（どこのマスか）
		this.basicVelocity = 2; //x,y方向の移動速度
		this._currentFrameOnTask = 0; //Taskを実行し始めてからのフレーム数
		this.hasCollision = true; //当たり判定を持つかどうか
		/*Maze*/ this.maze = null; //自分が所属している迷路(MazeのentryObject()で値が入る)
	},

	update : function(){
		if(this._currentTask){
			this._currentFrameOnTask++;
			if(!this._currentTask()){
				this.removeTask()
			}
		}
	},

	setTask : function(/*String*/ task){
		this._currentFrameOnTask = 0;
		this._currentTask = this['_'+task];
	},

	removeTask : function(){
		this._currentTask = null;
	},

	/*bool*/ hasTask : function(/*String*/ task){
		for(var i=0; i<GameObject.AvailableTasks.length; i++){
			if(task == GameObject.AvailableTasks[i]){
				return true;
			}
		}
		return false;
	},

	/*bool*/ isWorking : function(){
		return !!this._currentTask;
	},

	//Posは配列上の位置
	setPos : function(/*Vector of Object{x, y}*/ p){
		if(this.maze){
			this.maze.updateObjectPos(this, this._pos, p);
		}
		this._pos.set(p);
		this.x = GameData.ObjectSize * p.x;
		this.y = GameData.ObjectSize * p.y;
	},

	/*bool*/ _moveNorth : function(){
		return this.__vectorMove({x :  0, y : -1});
	},

	/*bool*/ _moveSouth : function(){
		return this.__vectorMove({x :  0, y :  1});
	},

	/*bool*/ _moveWest : function(){
		return this.__vectorMove({x : -1, y :  0});
	},

	/*bool*/ _moveEast : function(){
		return this.__vectorMove({x :  1, y :  0});
	},

	/*bool*/ __vectorMove : function(/*Vector of Object{x, y}*/ v){ //vはthis._posに対しての移動量(配列上での移動量)
		var dest = this._pos.plus(v);
		var canMove = true;
		var frameForTask = parseInt(GameData.ObjectSize / this.basicVelocity, 10); //このタスクで使うフレーム数
		if(this.maze.hitTest(dest.x, dest.y) && this._currentFrameOnTask > frameForTask/2){
			canMove = false;
		}

		if(canMove){
			this.x += v.x * this.basicVelocity;
			this.y += v.y * this.basicVelocity;
	/*
			console.log('this._pos :'+this._pos.x+ '  '+this._pos.y);
			console.log('v        :'+v.x +'  '+v.y);
			console.log('this.xy  :'+this.x +'  '+this.y);
			console.log('destinate:'+(this._pos.x + v.x) * GameData.ObjectSize+' '+(this._pos.y + v.y) * GameData.ObjectSize + '\n\n');
	*/

			var isContinueX, isContinueY;
			if(v.x > 0){
				if(this.x < (this._pos.x + v.x) * GameData.ObjectSize){
					isContinueX = true;
				}
			}else if(v.x < 0){
				if(this.x > (this._pos.x + v.x) * GameData.ObjectSize){
					isContinueX = true;
				}
			}else{
				isContinueX = false;
			}

			if(v.y > 0){
				if(this.y < (this._pos.y + v.y) * GameData.ObjectSize){
					isContinueY = true;
				}
			}else if(v.y < 0){
				if(this.y > (this._pos.y + v.y) * GameData.ObjectSize){
					isContinueY = true;
				}
			}else{
				isContinueY = false;
			}

			if(isContinueX | isContinueY){
				return true;
			}else{
				this.setPos(this._pos.plus(v));
				return false;
			}
		}else{
			this.x = this._pos.x*GameData.ObjectSize;
			this.y = this._pos.y*GameData.ObjectSize;
			return false;
		}
	}

});
//実装してある命令の一覧
GameObject.AvailableTasks = ['moveNorth', 'moveSouth', 'moveWest', 'moveEast'];

var Character = Class.create(GameObject,{

	initialize : function(/*Number*/ width, /*Number*/ height){
		GameObject.call(this, width, height);
		this.direction = null;
		this.setDirection(GameData.Compass.South);
		this.animation = {
			north : null,
			south : null,
			west  : null,
			east  : null
		};
		this.setPos(1,1);
	},

	/*bool*/ hasTask : function(/*String*/ task){
		for(var i=0; i<Character.AvailableTasks.length; i++){
			if(task == Character.AvailableTasks[i]){
				return true;
			}
		}
		return false;
	},

	setDirection : function(/*GameData.Compass*/ direction){
		this.direction = direction;

		var c = GameData.Compass;
		switch(this.direction){
			case c.North:
				this.frame = 0;
				break;
			case c.South:
				this.frame = 1;
				break;
			case c.West:
				this.frame = 2;
				break;
			case c.East:
				this.frame = 3;
				break;
		}
	},

	frontPos : function(){
		return this._pos.plus(CompassToVector(this.direction));
	},

	leftPos : function(){
		var c = GameData.Compass;
		switch(this.direction){
			case c.North:
				return this._pos.plus(CompassToVector(c.West));
			case c.South:
				return this._pos.plus(CompassToVector(c.East));
			case c.West:
				return this._pos.plus(CompassToVector(c.South));
			case c.East:
				return this._pos.plus(CompassToVector(c.North));
		}
	},

	rightPos : function(){
		var c = GameData.Compass;
		switch(this.direction){
			case c.North:
				return this._pos.plus(CompassToVector(c.East));
			case c.South:
				return this._pos.plus(CompassToVector(c.West));
			case c.West:
				return this._pos.plus(CompassToVector(c.North));
			case c.East:
				return this._pos.plus(CompassToVector(c.South));
		}
	},

	setAnimationList : function(/*Array<Number>*/ north, /*Array<Number>*/ south, /*Array<Number>*/ west, /*Array<Number>*/ east){
			this.animation.north = north;
			this.animation.south = south;
			this.animation.west  = west;
			this.animation.east  = east;
	},

	/*bool*/ _moveNorth : function(){
		this.setDirection(GameData.Compass.North);
		return this.__animationMove(this.animation.north, {x :  0, y : -1});
	},

	/*bool*/ _moveSouth : function(){
		this.setDirection(GameData.Compass.South);
		return this.__animationMove(this.animation.south, {x :  0, y : 1});
	},

	/*bool*/ _moveWest : function(){
		this.setDirection(GameData.Compass.West);
		return this.__animationMove(this.animation.west, {x :  -1, y : 0});
	},

	/*bool*/ _moveEast : function(){
	 	this.setDirection(GameData.Compass.East);
	   	return this.__animationMove(this.animation.east, {x :  1, y : 0});
	},

	/*bool*/ __animationMove : function(/*Array<Number>*/ animationList, /*Vector or Object{x ,y}*/ v){
		var frameForTask = parseInt(GameData.ObjectSize / this.basicVelocity, 10); //このタスクで使うフレーム数
		var animationLength = animationList.length; //アニメーションの画像切り替え数

/*
		console.log('x, y :'+this.x +' ' +this.y);
		console.log('current :'+this._currentFrameOnTask);
		console.log('max :'+frameForTask);
		console.log('length :'+animationLength + '\n\n');

*/

		this.frame = animationList[Math.min(parseInt(animationLength * this._currentFrameOnTask / frameForTask, 10), animationLength-1)];

		if(!this.__vectorMove(v)){
			this.frame = animationList[0];
			return false;
		}else{
			return true;
		}
	},

	/*bool*/ _turnLeft : function(){
		var c = GameData.Compass;
		switch(this.direction){
			case c.North:
				this.setDirection(GameData.Compass.West);
				break;
			case c.South:
				this.setDirection(GameData.Compass.East);
				break;
			case c.West:
				this.setDirection(GameData.Compass.South);
				break;
			case c.East:
				this.setDirection(GameData.Compass.North);
				break;
		}
		return false;
	},

	/*bool*/ _turnRight : function(){
		var c = GameData.Compass;
		switch(this.direction){
			case c.North:
				this.setDirection(GameData.Compass.East);
				break;
			case c.South:
				this.setDirection(GameData.Compass.West);
				break;
			case c.West:
				this.setDirection(GameData.Compass.North);
				break;
			case c.East:
				this.setDirection(GameData.Compass.South);
				break;
		}
		return false;
	},

	/*bool*/ _moveFront : function(){
		var c = GameData.Compass;
		switch(this.direction){
			case c.North:
				return this._moveNorth();
			case c.South:
				return this._moveSouth();
			case c.West:
				return this._moveWest();
			case c.East:
				return this._moveEast();
		}
		return false;
	}

});
Character.AvailableTasks = Array_concatUnique(GameObject.AvailableTasks, ['moveNorth', 'moveSouth', 'moveWest', 'moveEast', 'turnLeft', 'turnRight', 'moveFront']);

var Player = Class.create(Character,{

	initialize : function(/*Number*/ width, /*Number*/ height){
		Character.call(this, width, height);
	}

});
Player.AvailableTasks = Array_concatUnique(Character.AvailableTasks);

var Maze = Class.create(Group,{

	initialize : function(/*Number*/ width, /*Number*/ height){
		Group.call(this);

		this.width = 0;
		this.height = 0;

		this.map = new Map(width, height);
		this.addChild(this.map);

		this.objects = null;

		this.clearCondition = function(){ //ステージクリアの条件 0:未クリア 1:クリア
			return 0;
		}

		this.startPos = new Vector(1,1);
	},

	update : function(){
		for(var y=0; y<this.objects.length; y++){
			for(var x=0; x<this.objects[y].length; x++){
				for(var i=0; i<this.objects[y][x].length; i++){
					this.objects[y][x][i].update();
				}
			}
		}
		return this.clearCondition();
	},

	/*bool*/ isWorking : function(){
		for(var y=0; y<this.objects.length; y++){
			for(var x=0; x<this.objects[y].length; x++){
				for(var i=0; i<this.objects[y][x].length; i++){
					if(this.objects[y][x][i].isWorking()){
						return true;
					}
				}
			}
		}
		return false;
	},

	setFieldImage : function(/*Surface?*/ image){
		this.map.image = image;
	},

	setFieldData : function(/*Array<Array<Number>>*/ fieldData){
		this.map.loadData(fieldData);
	},

	setObjectImage : function(/*Surface?*/ image){
		this.objectImage = image;
		if(this.objects){
			for(var y=0; y<this.objects.length; y++){
				for(var x=0; x<this.objects[y].length; x++){
					for(var i=0; i<this.objects[y][x].length; i++){
						this.objects[y][x][i].image = image;
					}
				}
			}
		}
	},

	//0はなにもなしということ
	setObjectData : function(/*Array<Array<Number>>*/ objectData){
		this.objects = [];
		for(var y=0; y<objectData.length; y++){
			this.objects[y] = [];
			for(var x=0; x<objectData[y].length; x++){
				this.objects[y][x] = [];
				if(objectData[y][x] != 0){
					var object = new GameObject(GameData.ObjectSize, GameData.ObjectSize);
					if(this.objectImage){
						object.image = this.objectImage;
					}
					object.frame = objectData[y][x] - 1;
					object.setPos({x : x, y : y});
					this.entryObject(object);
				}
			}
		}
		this.height = this.objects.length * GameData.ObjectSize;
		this.width  = this.objects[0].length * GameData.ObjectSize;
	},

	setStartPos : function(/*Vector*/ pos){
		this.startPos.set(pos);
	},

	hitTest : function(/*Number*/ posX, /*Number*/ posY){
		for(var i=0; i<this.objects[posY][posX].length; i++){
			if(this.objects[posY][posX][i].hasCollision){
				return true;
			}
		}
		return false;
	},

	/*bool*/ entryObject : function(/*GameObject*/ object){
		var p = object._pos;
		if(object && this.objects){
			this.objects[p.y][p.x].push(object);
			this.addChild(object);
			object.maze = this;
			return true;
		}
		return false;
	},

	/*bool*/ entryCharacter : function(/*Character*/ character){
		character.setPos(this.startPos);
		character.setDirection(GameData.Compass.South);
		return this.entryObject(character);
	},

	/*bool*/updateObjectPos : function(/*GameObject*/ object, /*Vector or Object{x, y}*/ oldPos, /*Vector or Object{x, y}*/ newPos){
		if(newPos.y >= 0 &&
		   newPos.y < this.objects.length &&
		   newPos.x >= 0 &&
		   newPos.x < this.objects[0].length){
			this.objects[newPos.y][newPos.x].push(object);
			Array_remove(this.objects[oldPos.y][oldPos.x], object);
			return true;
		}else{
			return false;
		}
	},

	setClearCondition : function(func){
		this.clearCondition = func;
	}

});

/*メソッドチェーンできる*/
var Vector = Class.create({

	initialize : function(/*Number*/ x, /*Number*/ y){
		this.x = x;
		this.y = y;
	},

	set : function(/*Vector of Object{x, y}*/ v){
		this.x = v.x;
		this.y = v.y;
		return this;
	},

	add : function(/*Vector of Object{x, y}*/ v){
		this.x += v.x;
		this.y += v.y;
		return this;
	},

	sub : function(/*Vector of Object{x, y}*/ v){
		this.x -= v.x;
		this.y -= v.y;
		return this;
	},

	mul : function(/*Number*/ num){
		this.x *= num;
		this.y *= num;
		return this;
	},

	plus : function(/*Vector of Object{x, y}*/ v){
		return new Vector(this.x+v.x, this.y+v.y);
	},

	minus : function(/*Vector of Object{x, y}*/ v){
		return new Vector(this.x-v.x, this.y-v.y);
	}

});

