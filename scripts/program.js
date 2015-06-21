//----------------------------------------------------------------------------
//	Datas
//----------------------------------------------------------------------------
var Code = {};

Code.Instruction = {};

Code.Instruction.StandAlone = {};

Code.Instruction.StandAlone.Inline = null; //順番調整のため

Code.Instruction.StandAlone.Block = {};

Code.Instruction.Control = {}

Code.Data = {};

Code.Data.Pos = {};

Code.Data.Task = {};

Code.Data.Figure = {};

var TypeOfCode = {
	Code		: Code,
	Instruction	: Code.Instruction,
	Data		: Code.Data,
	StandAlone	: Code.Instruction.StandAlone,
	Control		: Code.Instruction.Control,
	Pos			: Code.Data.Pos,
	Task		: Code.Data.Task,
	Figure		: Code.Data.Figure
}


//----------------------------------------------------------------------------
//	functions
//----------------------------------------------------------------------------

function getChildList(/*TypeOfCode*/ type){
	var list = [];
	if(typeof type == 'object'){
		for(var key in type){
			list = list.concat(getChildList(type[key]));
		}
	}else{
		list.push(type);
	}
	return list;
}


//----------------------------------------------------------------------------
//	classes
//----------------------------------------------------------------------------

var Program = Class.create({

	initialize : function(/*GameObject*/ object){
		this.owner = object;
		this.instructions = new InstructionGroup();
		this.hasToDo = true;
	},

	/*bool*/ execute : function(){
		if(this.hasToDo){
			this.hasToDo = this.instructions.execute(this.owner);
		}
		return this.hasToDo;
	},

	add : function(/*Instruction*/ instruction){
		this.reset();
		this.instructions.add(instruction);
		return this;
	},

	add2 : function(/*Array<Instruction>*/ instructions){
		this.reset();
		this.instructions.add2(instructions);
		return this;
	},

	set : function(/*InstructionGroup*/ instructions){
		this.reset();
		this.instructions = instructions;
	},

	/*String*/ toString : function(){
		var str = '---------- start ----------\n';
		str += this.instructions.toString('');
		str +=    '----------  end  ----------\n';
		return str;
	},

	reset : function(){
		this.hasToDo = true;
		this.instructions.reset();
	}

});



//命令をひとまとめにして、実行するたびに順に一つづつ命令を実行する
var InstructionGroup = Class.create({

	initialize : function(){
		this.instructions = [];
		this.currentIndex = 0;
	},

	add : function(/*Instruction*/ instruction){
		this.instructions.push(instruction);
		return this;
	},

	add2 : function(/*Array<Instruction>*/ instructions){
		for(var i=0; i<instructions.length; i++){
			this.add(instructions[i]);
		}
		return this;
	},

	/*bool*/ execute : function(/*GameObject*/ target){
		if(this.currentIndex < this.instructions.length){
			if(this.instructions[this.currentIndex].option){
				this.instructions[this.currentIndex].option();
			}

			if(!this.instructions[this.currentIndex].execute(target)){
				this.currentIndex++;
			}
			return true;
		}else{
			this.reset();
			return false;
		}
	},

	reset : function(){
		this.currentIndex = 0;
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		var str = '';
		for(var i=0; i<this.instructions.length; i++){
			str += this.instructions[i].toString(indent);
		}
		return str;
	}

});



//---------------------------- Instructions ---------------------------------------

//子要素を持たず、単体で実行される命令
Code.Instruction.StandAlone.Inline = Class.create({

	initialize : function(/*Code.Data.Task*/ task){
		this.task = task;
	},

	/*bool*/ execute : function(/*GameObject*/ target){
//console.log('do : '+this.task);
		var task = this.task.execute();
		if(target.hasTask(task)){
			target.setTask(task);
		}
		return false;
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + this.task.toString();
	}


});
Code.Instruction.StandAlone.Inline.selectString = 'キャラクターが';
Code.Instruction.StandAlone.Inline.beforeChild = '';
Code.Instruction.StandAlone.Inline.afterChild = '';
Code.Instruction.StandAlone.Inline.argumentType = TypeOfCode.Task;


Code.Instruction.StandAlone.Block.Loop = Class.create({

	initialize : function(/*Code.Instruction.Control*/ master){
		this._letChildsExecute = false;
		this.masterInstruction = master;
		this.childs = new InstructionGroup();
	},

	/*bool*/ execute : function(/*GameObject*/ target){
		if(this._letChildsExecute){
			this._letChildsExecute = this.childs.execute(target);
		}
		if(!this._letChildsExecute){
			this._letChildsExecute = this.masterInstruction.execute(target);
		}
		if(!this._letChildsExecute){
			this.reset();
		}
		return this._letChildsExecute;
	},

	reset : function(){
		this._letChildsExecute = false;
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		var str = indent + 'Loop : ' + this.masterInstruction.toString();
		str += this.childs.toString(indent+'\t');
		return str;
	},

	add : function(/*Instruction*/ instruction){
		this.childs.add(instruction);
		return this;
	},

	add2 : function(/*Array<Instruction>*/ instructions){
		this.childs.add2(instructions);
		return this;
	}

});
Code.Instruction.StandAlone.Block.Loop.selectString = '繰り返す';
Code.Instruction.StandAlone.Block.Loop.beforeChild = '(';
Code.Instruction.StandAlone.Block.Loop.afterChild = ')の間';
Code.Instruction.StandAlone.Block.Loop.argumentType = TypeOfCode.Control;


Code.Instruction.StandAlone.Block.If = Class.create({

	initialize : function(/*Code.Instruction.Control*/ master){
		this.masterInstruction = master;
		this._letChildsExecute = false;
		this._letMasterExecute = true;
		this._masterAnswer = false;
		this.childsForTrue = new InstructionGroup();
		this.childsForFalse = new InstructionGroup();
	},

	/*bool*/ execute : function(/*GameObject*/ target){
		if(this._letMasterExecute){
			this._masterAnswer = this.masterInstruction.execute(target);
			this._letMasterExecute = false;
			this._letChildsExecute = true;
		}else if(this._masterAnswer){
			this._letChildsExecute = this.childsForTrue.execute(target);
		}else{
			this._letChildsExecute = this.childsForFalse.execute(target);
		}

		if(!this._letChildsExecute){
			this.reset();
		}
		return this._letChildsExecute;
	},

	reset : function(){
		this._letChildsExecute = false;
		this._letMasterExecute = true;
	},

	add : function(/*Instruction*/ instructionForTrue, /*Instruction*/ instructionForFalse){
		if(instructionForTrue){
			this.childsForTrue.add(instructionForTrue);
		}
		if(instructionForFalse){
			this.childsForFalse.add(instructionForFalse);
		}

		return this;
	},

	add2 : function(/*Array<Instruction>*/ instructionsForTrue, /*Array<Instruction>*/ instructionsForFalse){
		if(instructionsForTrue){
			this.childsForTrue.add2(instructionsForTrue);
		}
		if(instructionsForFalse){
			this.childsForFalse.add2(instructionsForFalse);
		}

		return this;
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		var str = indent + 'If ' + this.masterInstruction.toString();
		str += this.childsForTrue.toString(indent+'\t');
		str += indent + 'Else\n';
		str += this.childsForFalse.toString(indent+'\t');
		return str;
	}

});
Code.Instruction.StandAlone.Block.If.selectString = 'もし';
Code.Instruction.StandAlone.Block.If.beforeChild = '';
Code.Instruction.StandAlone.Block.If.afterChild = 'なら';
Code.Instruction.StandAlone.Block.If.argumentType = TypeOfCode.Control;



Code.Instruction.Control.For = Class.create({

	initialize : function(/*Code.Data.Figure*/ untill){
		this.untill = untill;
		this.count = 0;
	},

	/*bool*/ execute : function(/*GameObject*/ target){
		this.count++;
		if(this.count <= this.untill){
			return true;
		}else{
			this.reset();
			return false;
		}

	},

	reset : function(){
		this.count = 0;
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'For ' + this.untill + '\n';
	}

});
Code.Instruction.Control.For.selectString = '回数';
Code.Instruction.Control.For.beforeChild = '';
Code.Instruction.Control.For.afterChild = '';
Code.Instruction.Control.For.argumentType = TypeOfCode.Figure;



Code.Instruction.Control.HitTest = Class.create({

	initialize : function(/*Code.Data.Pos*/ posData){
		this.posData = posData;
	},

	/*bool*/ execute : function(/*GameObject*/ target){
		var maze = target.maze;
		var pos = this.posData.execute(target);
		return !maze.hitTest(pos.x, pos.y);
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'HitTest ' + this.posData.toString(indent);
	}

});
Code.Instruction.Control.HitTest.selectString = '通れる';
Code.Instruction.Control.HitTest.beforeChild = '(';
Code.Instruction.Control.HitTest.afterChild = ')';
Code.Instruction.Control.HitTest.argumentType = TypeOfCode.Pos;



Code.Instruction.Control.Not = Class.create({

	initialize : function(/*Code.Instruction.Control*/ child){
		this.child = child;
	},

	/*bool*/ execute : function(/*GameObject*/ target){
		return !this.child.execute(target);
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'Not ' + this.child.toString();
	}

});
Code.Instruction.Control.Not.selectString = '反対';
Code.Instruction.Control.Not.beforeChild = '(';
Code.Instruction.Control.Not.afterChild = ')';
Code.Instruction.Control.Not.argumentType = TypeOfCode.Control;



//---------------------------- Datas ---------------------------------------


Code.Data.Pos.Front = Class.create({

	/*Vector*/ execute : function(/*GameObject*/ target){
		return target.frontPos();
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'Front\n';
	}

});
Code.Data.Pos.Front.selectString = '前に';
Code.Data.Pos.Front.beforeChild = '';
Code.Data.Pos.Front.afterChild = '';
Code.Data.Pos.Front.argumentType = null;



Code.Data.Pos.Left = Class.create({

	/*Vector*/ execute : function(/*GameObject*/ target){
		return target.leftPos();
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'Left\n';
	}

});
Code.Data.Pos.Left.selectString = '左に';
Code.Data.Pos.Left.beforeChild = '';
Code.Data.Pos.Left.afterChild = '';
Code.Data.Pos.Left.argumentType = null;



Code.Data.Pos.Right = Class.create({

	/*Vector*/ execute : function(/*GameObject*/ target){
		return target.rightPos();
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'Right\n';
	}

});
Code.Data.Pos.Right.selectString = '右に';
Code.Data.Pos.Right.beforeChild = '';
Code.Data.Pos.Right.afterChild = '';
Code.Data.Pos.Right.argumentType = null;



Code.Data.Task.MoveNorth = Class.create({
	/*String*/ execute : function(/*GameObject*/ target){
		return 'moveNorth';
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'moveNorth\n';
	}
});
Code.Data.Task.MoveNorth.selectString = '上に動く';
Code.Data.Task.MoveNorth.beforeChild = '';
Code.Data.Task.MoveNorth.afterChild = '';
Code.Data.Task.MoveNorth.argumentType = null;



Code.Data.Task.MoveSouth = Class.create({
	/*String*/ execute : function(/*GameObject*/ target){
		return 'moveSouth';
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'moveSouth\n';
	}
});
Code.Data.Task.MoveSouth.selectString = '下に動く';
Code.Data.Task.MoveSouth.beforeChild = '';
Code.Data.Task.MoveSouth.afterChild = '';
Code.Data.Task.MoveSouth.argumentType = null;



Code.Data.Task.MoveWest = Class.create({
	/*String*/ execute : function(/*GameObject*/ target){
		return 'moveWest';
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'moveWest\n';
	}
});
Code.Data.Task.MoveWest.selectString = '左に動く';
Code.Data.Task.MoveWest.beforeChild = '';
Code.Data.Task.MoveWest.afterChild = '';
Code.Data.Task.MoveWest.argumentType = null;



Code.Data.Task.MoveEast = Class.create({
	/*String*/ execute : function(/*GameObject*/ target){
		return 'moveEast';
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'moveEast\n';
	}
});
Code.Data.Task.MoveEast.selectString = '右に動く';
Code.Data.Task.MoveEast.beforeChild = '';
Code.Data.Task.MoveEast.afterChild = '';
Code.Data.Task.MoveEast.argumentType = null;



Code.Data.Task.MoveFront = Class.create({
	/*String*/ execute : function(/*GameObject*/ target){
		return 'moveFront';
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'moveFront\n';
	}
});
Code.Data.Task.MoveFront.selectString = '前に進む';
Code.Data.Task.MoveFront.beforeChild = '';
Code.Data.Task.MoveFront.afterChild = '';
Code.Data.Task.MoveFront.argumentType = null;



Code.Data.Task.TurnLeft = Class.create({
	/*String*/ execute : function(/*GameObject*/ target){
		return 'turnLeft';
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'turnLeft\n';
	}
});
Code.Data.Task.TurnLeft.selectString = '左に振り向く';
Code.Data.Task.TurnLeft.beforeChild = '';
Code.Data.Task.TurnLeft.afterChild = '';
Code.Data.Task.TurnLeft.argumentType = null;


Code.Data.Task.TurnRight = Class.create({
	/*String*/ execute : function(/*GameObject*/ target){
		return 'turnRight';
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + 'turnRight\n';
	}
});
Code.Data.Task.TurnRight.selectString = '右に振り向く';
Code.Data.Task.TurnRight.beforeChild = '';
Code.Data.Task.TurnRight.afterChild = '';
Code.Data.Task.TurnRight.argumentType = null;



Code.Data.Figure.Int = Class.create({

	initialize : function(/*Number*/ num){
		this.num = parseInt(Number(num) || 0, 10);
	},

	/*String*/ execute : function(/*GameObject*/ target){
		return this.num;
	},

	/*String*/ toString : function(/*String*/ indent){
		var indent = indent || '';
		return indent + this.num;
	}
});
Code.Data.Figure.Int.selectString = '整数';
Code.Data.Figure.Int.beforeChild = '';
Code.Data.Figure.Int.afterChild = '';
Code.Data.Figure.Int.argumentType = null;
