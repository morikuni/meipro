
(function(){
	var maze = new Maze(GameData.ObjectSize, GameData.ObjectSize);
	maze.setFieldImage(GameData.Game.assets['./images/field_stone.png']);
	maze.setFieldData([
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0]
	]);
	maze.setObjectImage(GameData.Game.assets['./images/objects.png']);
	maze.setObjectData([
		[1, 1, 1, 1, 1, 1, 1],
		[1, 2, 1, 1, 1, 3, 1],
		[1, 0, 1, 1, 1, 0, 1],
		[1, 0, 1, 1, 1, 0, 1],
		[1, 0, 1, 1, 1, 0, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 1, 1, 1, 1, 1, 1]
	]);

	var sx=1, sy=1;
	maze.setStartPos(new Vector(sx, sy));
	maze.objects[sy][sx][0].hasCollision = false;
	var gx = 5, gy = 1;
	maze.objects[gy][gx][0].hasCollision = false;

	maze.setClearCondition((function(){
		if(GameData.Player._pos.x == gx && GameData.Player._pos.y == gy){
			return 1;
		}
		return 0;
	}));

	callbackAtEndOfLoadingStage(maze);
})();
