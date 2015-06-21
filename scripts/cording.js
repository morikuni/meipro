var toHex = function(num){
	var hex = num.toString(16);
	if(num < 10){
		hex = '0'+hex;
	}
	return hex;
}

/**
 * HSV配列 を RGB配列 へ変換します
 *
 * @param   {Number}  h         hue値        ※ 0～360の数値
 * @param   {Number}  s         saturation値 ※ 0～255 の数値
 * @param   {Number}  v         value値      ※ 0～255 の数値
 * @return  {Object}  {r, g, b} ※ r/g/b は 0～255 の数値
 */
function HSVtoRGB (h, s, v) {
  var r, g, b; // 0..255

  while (h < 0) {
    h += 360;
  }

  h = h % 360;

  // 特別な場合 saturation = 0
  if (s == 0) {
    // → RGB は V に等しい
    v = Math.round(v);
    return {'r': v, 'g': v, 'b': v};
  }

  s = s / 255;

  var i = Math.floor(h / 60) % 6,
      f = (h / 60) - i,
      p = v * (1 - s),
      q = v * (1 - f * s),
      t = v * (1 - (1 - f) * s)

  switch (i) {
    case 0 :
      r = v;  g = t;  b = p;  break;
    case 1 :
      r = q;  g = v;  b = p;  break;
    case 2 :
      r = p;  g = v;  b = t;  break;
    case 3 :
      r = p;  g = q;  b = v;  break;
    case 4 :
      r = t;  g = p;  b = v;  break;
    case 5 :
      r = v;  g = p;  b = q;  break;
  }

  return {'r': Math.round(r), 'g': Math.round(g), 'b': Math.round(b)};
}


var GUI_Instruction = Class.create({

	initialize : function(){
		this.element = document.createElement('div');
		this.element.className = 'instruction';
		this.instructionSpace = document.createElement('span');
		this.element.appendChild(this.instructionSpace);
		this.element.appendChild(document.createElement('hr'));
		this.word = new GUI_Word(TypeOfCode.StandAlone);
		this.word.onchange = this.update.bind(this);
		this.instruction = new GUI_INLINE(this.word);
		this.deleteButton = new GUI_DeleteButton(this);
		this.instruction.addButton(this.deleteButton);
		this.instructionSpace.appendChild(this.instruction.getElement());
		/*GUI_InstructionGroup*/this.group = null;
		this.update();
	},

	/*Element*/ getElement : function(){
		return this.element;
	},

	getCode : function(){
		return this.instruction.getCode();
	},

	update : function(){
		var value = this.word.getValue();
		switch(value){
			case Code.Instruction.StandAlone.Block.If.selectString :
				this.removeInstruction();
				this.instruction = new GUI_IF(this.word);
				this.instruction.addButton(this.deleteButton);
				this.instructionSpace.appendChild(this.instruction.getElement());
				break;
			case Code.Instruction.StandAlone.Block.Loop.selectString:
				this.removeInstruction();
				this.instruction = new GUI_LOOP(this.word);
				this.instruction.addButton(this.deleteButton);
				this.instructionSpace.appendChild(this.instruction.getElement());
				break;
			default :
				this.removeInstruction();
				this.instruction = new GUI_INLINE(this.word);
				this.instruction.addButton(this.deleteButton);
				this.instructionSpace.appendChild(this.instruction.getElement());
				break;
		}
	},

	removeInstruction : function(){
		this.instructionSpace.removeChild(this.instruction.getElement());
	},

	requestRemoveMe : function(){
		this.group.remove(this);
	}
});

Global_highLightingCODE = null;

GUI_CODE = Class.create({

	initialize : function(){
		this.element = document.createElement('table');
		this.element.className = 'codeDefault';
		var color = HSVtoRGB (parseInt(Math.random()*360), 100+parseInt(Math.random()*155), 255);
		var colorHex = toHex(color.r)+toHex(color.g)+toHex(color.b);
		this.element.style.backgroundColor = '#'+colorHex;
	},

	highLightON : function(){
		this.element.className = 'codeRun';
	},

	highLightOFF : function(){
		this.element.className = 'codeDefault';
	}
});

GUI_INLINE = Class.create(GUI_CODE, {

	initialize : function(/*GUI_Word*/ word){
		GUI_CODE.call(this);
		this.word = word;
		this.td = document.createElement('td');
		var tr = document.createElement('tr');
		this.element.appendChild(tr);
		tr.appendChild(this.td);
		this.td.appendChild(this.word.getElement());
	},

	getElement : function(){
		return this.element;
	},

	getCode : function(){
		var ret = this.word.getCode();
		ret.option = (function(){
			if(Global_highLightingCODE != null){
				Global_highLightingCODE.highLightOFF();
			}
			Global_highLightingCODE = this;
			this.highLightON();
		}).bind(this);
		return ret;
	},

	addButton : function(button){
		this.td.appendChild(button.getElement());
	}

});

var GUI_IF = Class.create(GUI_CODE, {

	initialize : function(/*GUI_Word*/ word){
		GUI_CODE.call(this);
		this.word = word;
		this.header = document.createElement('td');
		this.header.colSpan = 2;
		this.header.appendChild(this.word.getElement());
		this.ifGroup = new GUI_InstructionGroup();
		this.elseGroup = new GUI_InstructionGroup();

		var tr, td;
		tr = document.createElement('tr');
		tr.appendChild(this.header);
		this.element.appendChild(tr);
		tr = document.createElement('tr');
		td = document.createElement('td');
		td.className = 'indent';
		tr.appendChild(td);
		tr.appendChild(this.ifGroup.getElement());
		this.element.appendChild(tr);
		tr = document.createElement('tr');
		td = document.createElement('td');
		td.colSpan = 2;
		td.innerHTML = 'でなければ';
		tr.appendChild(td);
		this.element.appendChild(tr);
		tr = document.createElement('tr');
		td = document.createElement('td');
		td.className = 'indent';
		tr.appendChild(td);
		tr.appendChild(this.elseGroup.getElement());
		this.element.appendChild(tr);

	},

	getElement : function(){
		return this.element;
	},

	getCode : function(){
		var code = this.word.getCode();
		code.add2(this.ifGroup.getCode(), this.elseGroup.getCode());
		code.option = (function(){
			if(Global_highLightingCODE != null){
				Global_highLightingCODE.highLightOFF();
			}
			Global_highLightingCODE = this;
			this.highLightON();
		}).bind(this);
		return code;
	},

	addButton : function(button){
		this.header.appendChild(button.getElement());
	}

});

var GUI_LOOP = Class.create(GUI_CODE, {

	initialize : function(/*GUI_Word*/ word){
		GUI_CODE.call(this);
		this.word = word;
		this.header = document.createElement('td');
		this.header.colSpan = 2;
		this.header.appendChild(this.word.getElement());
		this.group = new GUI_InstructionGroup();

		var tr, td;
		tr = document.createElement('tr');
		tr.appendChild(this.header);
		this.element.appendChild(tr);
		tr = document.createElement('tr');
		td = document.createElement('td');
		td.className = 'indent';
		tr.appendChild(td);
		tr.appendChild(this.group.getElement());
		this.element.appendChild(tr);
	},

	getElement : function(){
		return this.element;
	},

	getCode : function(){
		var code = this.word.getCode();
		code.add2(this.group.getCode());
		code.option = (function(){
			if(Global_highLightingCODE != null){
				Global_highLightingCODE.highLightOFF();
			}
			Global_highLightingCODE = this;
			this.highLightON();
		}).bind(this);
		return code;
	},

	addButton : function(button){
		this.header.appendChild(button.getElement());
	}

});

var GUI_InstructionGroup = Class.create({

	initialize : function(){
		this.element = document.createElement('div');
		this.element.className = 'instructionGroup';
		this.instructionsSpace = document.createElement('div');
		this.element.appendChild(this.instructionsSpace);
		this.element.appendChild((new GUI_AddButton(this)).getElement());
		/*Array<GUI_Instruction>*/ this.instructions = [];
	},

	getElement : function(){
		return this.element;
	},

	getCode : function(){
		var codes = [];
		for(var i=0; i<this.instructions.length; i++){
			codes.push(this.instructions[i].getCode());
		}
		return codes;
	},

	add : function(/*GUI_Instruction*/ instruction){
		instruction.group = this;
		this.instructions.push(instruction);
		this.instructionsSpace.appendChild(instruction.getElement());
	},

	remove : function(/*GUI_Instruction*/ instruction){
		instruction.group = null;
		Array_remove(this.instructions, instruction);
		this.instructionsSpace.removeChild(instruction.getElement());
	}

});

var GUI_AddButton = Class.create({

	initialize : function(/*GUI_InstructionGroup*/ group){
		this.group = group;
		this.button = document.createElement('button');
		this.button.innerHTML = '追加';
		this.button.onclick = (function(){
			this.group.add(new GUI_Instruction());
		}).bind(this);
	},

	getElement : function(){
		return this.button;
	}

});

var GUI_DeleteButton = Class.create({

	initialize : function(/*GUI_Instruction*/ parent){
		this.parent = parent;
		this.button = document.createElement('button');
		this.button.innerHTML = '×';
		this.button.onclick = (function(){
			this.parent.requestRemoveMe();
		}).bind(this);
	},

	getElement : function(){
		return this.button;
	}

});



var GUI_Word = Class.create({

	initialize : function(/*TypeOfCode*/ type){
		this.element = document.createElement('span');
		this.inputSpace = document.createElement('span');
		this.beforeChildSpace = document.createElement('span');
		this.afterChildSpace = document.createElement('span');
		this.childSpace = document.createElement('span');
		this.element.appendChild(this.inputSpace);
		this.element.appendChild(this.beforeChildSpace);
		this.element.appendChild(this.childSpace);
		this.element.appendChild(this.afterChildSpace);
		this.input = InputMethodFactory.create(type);
		this.inputSpace.appendChild(this.input.getElement());
		(this.input.getElement()).onchange = this.update.bind(this);
		/*GUI_Word*/ this.child = null;
		this.onchange = null;
		this.update();
	},

	getElement : function(){
		return this.element;
	},

	getValue : function(){
		return this.input.getValue();
	},

	/*Code*/ getCode : function(){
		if(this.child){
			return new (this.input.getCodeConstructor())(this.child.getCode());
		}else{
			return new (this.input.getCodeConstructor())();
		}
	},

	update : function(){
		if(this.onchange){
			this.onchange();
		}

		this.beforeChildSpace.innerHTML = this.input.getBeforeString();
		this.afterChildSpace.innerHTML = this.input.getAfterString();

		var type = this.input.getChildType();
		if(type){
			var child = new GUI_Word(type);
			this.setChild(child);
		}
	},

	setChild : function(/*GUI_Word*/ word){
		if(word){
			if(this.childSpace.hasChildNodes()){
				this.childSpace.replaceChild(word.getElement(), this.child.getElement())
			}else{
				this.childSpace.appendChild(word.getElement());
			}
		}else{
			if(this.childSpace.hasChildNodes()){
				this.childSpace.removeChild(this.child.getElement());
			}
		}
		this.child = word;
	}


});

GUI_InputMethod = Class.create({

	getElement : function(){

	},

	getValue : function(){

	},

	getCodeConstructor : function(){
	},

	getBeforeString : function(){
		return '';
	},

	getAfterString : function(){
		return '';
	},

	getChildType : function(){
		return null;
	}

});

GUI_Select = Class.create(GUI_InputMethod, {

	initialize : function(/*TypeOfCode*/ type){
		this.type = type;
		this.argsList = getChildList(this.type);

		this.element = document.createElement('select');
		for(var i=0; i<this.argsList.length; i++){
			var option = document.createElement('option');
			option.value = this.argsList[i].selectString;
			option.innerHTML = this.argsList[i].selectString;
			this.element.appendChild(option);
		}
	},

	getElement : function(){
		return this.element;
	},

	getValue : function(){
		return this.element.options[this.element.selectedIndex].value;
	},

	/*Constructor*/ getCodeConstructor : function(){
		return this.argsList[this.element.selectedIndex];
	},

	getBeforeString : function(){
		return this.argsList[this.element.selectedIndex].beforeChild;
	},

	getAfterString : function(){
		return this.argsList[this.element.selectedIndex].afterChild;
	},

	getChildType : function(){
		return this.argsList[this.element.selectedIndex].argumentType;
	}

});

GUI_Text = Class.create(GUI_InputMethod, {

	initialize : function(type){
		this.type = Code.Data.Figure.Int;
		this.element = document.createElement('input');
		this.element.type = 'number';
		this.element.placeholder = '数字を入力';
	},

	getElement : function(){
		return this.element;
	},

	getValue : function(){
		return this.element.value;
	},

	/*Constructor*/ getCodeConstructor : function(){
		var num = this.element.value;
		var ctor = this.type;

		return function(){return new ctor(num)};
	},

	getBeforeString : function(){
		return '';
	},

	getAfterString : function(){
		return '';
	},

	getChildType : function(){
		return null;
	}

});


var InputMethodFactory = {

	/*GUI_InputMethiod*/ create : function(/*TypeOfCode*/ type){
		if(type == TypeOfCode.Figure){
			return new GUI_Text(type);
		}else{
			return new GUI_Select(type);
		}
	}

}

