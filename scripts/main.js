'use strict';

var loadStage = function(stageNumber){
	var filePath = './stage/stage'+stageNumber+'.js';
	GameData.CurrentStageNumber = stageNumber;
	GameData.Game.pause();
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.charset = 'utf-8';
	script.src = filePath;
	document.head.appendChild(script);
};

var callbackAtEndOfLoadingStage = function(maze){
	GameData.CurrentMaze = maze;
	maze.entryCharacter(GameData.Player);
	maze.x = Math.round((GameData.GameSize.width - maze.width)/2);
	maze.y = Math.round((GameData.GameSize.height - maze.height)/2);
	var scene = new Scene();
	scene.addChild(maze);
	GameData.Game.replaceScene(scene);
	GameData.Game.resume();
};

var getParameter = function(){
	var urlparameter = location.search.substring(1).split('&');
	var parameters = {};
	for(var i=0; i<urlparameter.length; i++){
		var keyAndValue = urlparameter[i].toString().split('=');
		parameters[keyAndValue[0]] = keyAndValue[1];
	}
	return parameters;
}

window.onload = function(){

	//端末に合わせた大きさに調整
	document.getElementById('program').style.width = (document.getElementById('wrapper').clientWidth - GameData.GameSize.width) - 6*2 - 5 + 'px';

	var game = new Game(GameData.GameSize.width, GameData.GameSize.height);
	GameData.Game = game;
	game.fps = GameData.FPS;
	game.preload('./images/player.png', './images/field_stone.png', './images/objects.png');

	var params = getParameter();
	var stageNumber = params['stage'] || 1;

	game.onload = function() {
		var player = new Player(GameData.ObjectSize, GameData.ObjectSize);
		GameData.Player = player;
		player.image = game.assets['./images/player.png'];
		player.setAnimationList(
			[0, 4, 0,  8, 0, 4, 0],
			[1, 5, 1,  9, 1, 5, 1],
			[2, 6, 2, 10, 2, 6, 2],
			[3, 7, 3, 11, 3, 7, 3]
		);

		loadStage(stageNumber);

		//プログラミングエリアを作成
		var gui = new GUI_InstructionGroup();
		document.getElementById('program').appendChild(gui.getElement());
		var program = new Program(player);
	console.log(program);

		//スタートボタンにイベントをつける
		document.getElementById('start').onclick=function(){
			var group = new InstructionGroup();
			player.setPos(GameData.CurrentMaze.startPos);
			player.setDirection(GameData.Compass.South);
			group.add2(gui.getCode());
			program.set(group);
			console.log(program.toString());
			stopFlag = false;
		};

		//ストップボタンにイベントをつける
		var stopFlag = false;
		var stopFunc = function(){
			if(Global_highLightingCODE){
				Global_highLightingCODE.highLightOFF();
			}
			stopFlag = true;
		}
		document.getElementById('stop').onclick = stopFunc;

		var minFrame = GameData.FPS;
		document.getElementById('slow').onclick=function(){
			if(minFrame < GameData.FPS){
				minFrame++;
			}
		};
		document.getElementById('fast').onclick=function(){
			if(minFrame > 1){
				minFrame--;
			}
		};


		document.getElementById('change').onclick=function(){
			console.log('hoge');
			game.pause();
			stopFunc();
			var num = window.prompt('ステージ番号を入力してください','1');
			loadStage(parseInt(num));
		};

		//ゲームのメインループ
		var count = 0;
		game.addEventListener(Event.ENTER_FRAME, function(){
			if(GameData.CurrentMaze.update()){
				game.pause();
				stopFunc();
				alert('ステージ'+GameData.CurrentStageNumber+' クリア!');
				loadStage(parseInt(GameData.CurrentStageNumber, 10)+1);
			}
			if(!GameData.CurrentMaze.isWorking() && count > minFrame && !stopFlag){
/*
if (game.input.left) {
	player.setTask('moveWest');
} else if (game.input.right) {
	player.setTask('moveEast');
} else if (game.input.up) {
	player.setTask('moveNorth');
} else if (game.input.down) {
	player.setTask('moveSouth');
}
*/
				if(!program.execute()){
					stopFunc();
				}
				count = 0;
			}
			count++;
		});
	};
	game.start();
};



