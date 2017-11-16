function RuleHead(string) {
	var index = 0;
	var conditionIndex = string.indexOf(":");
	var predecessorIndex = string.indexOf("<");
	var successorIndex = string.indexOf(">");
	
	if(conditionIndex != -1) {
		if(predecessorIndex > conditionIndex)
			predecessorIndex = -1;
		
		if(successorIndex > conditionIndex)
			successorIndex = -1;
	}
	
	if(predecessorIndex != -1) {
		this.predecessor = new Symbol(string, index);
		
		index = predecessorIndex + 1;
	}
	else
		this.predecessor = null;
	
	this.symbol = new Symbol(string, index);
	
	if(successorIndex != -1)
		this.successor = new Symbol(string, successorIndex + 1);
	else
		this.successor = null;
	
	if(conditionIndex != -1)
		this.condition = string.substr(conditionIndex + 1);
	else
		this.condition = null;
}

function RuleBody(string) {
	this.body = Lindenmayer.prototype.toSymbols(string);
}

function Rule(string) {
	var source = string.replace(/\s/g, "");
	
	this.head = new RuleHead(source.substring(0, source.lastIndexOf("=")));
	this.body = new RuleBody(source.substring(source.lastIndexOf("=") + 1));
}

Rule.prototype = {
	isApplicable(symbol, predecessor, successor) {
		if(!symbol.matches(this.head.symbol))
			return false;
		
		if(this.head.predecessor != null && !this.head.predecessor.matches(predecessor))
			return false;
		
		if(this.head.successor != null && !this.head.successor.matches(successor))
			return false;
		
		this.key = this.setKey(symbol, predecessor, successor);
		
		if(this.head.condition != null)
			return eval("with(this.key){" + this.head.condition + ";}");
		else
			return true;
	},
	
	assignVariables(object, key, values) {
		for(var index = 0; index < key.parameters.length; ++index)
			object[key.parameters[index]] = Number(values.parameters[index]);
	},
	
	setKey(symbol, predecessor, successor) {
		this.key = new Object();
		
		this.assignVariables(this.key, this.head.symbol, symbol);
		
		if(this.head.predecessor != null)
			this.assignVariables(this.key, this.head.predecessor, predecessor);
		
		if(this.head.successor != null)
			this.assignVariables(this.key, this.head.successor, successor);
		
		return this.key;
	}
}

function Symbol(string, index) {
	if(string != null)
		this.parse(string, index);
}

Symbol.prototype = {
	parse(string, index) {
		var startIndex = index;
		
		this.symbol = string[index];
		
		if(index + 1 < string.length && string[index + 1] == "(") {
			var start = ++index + 1;
			while(string[++index] != ")");
			
			this.parameters = string.substr(start, index - start).split(",");
		}
		else
			this.parameters = [];
		
		this.length = index - startIndex;
	},
	
	construct(symbol, parameters) {
		return {
			symbol: symbol,
			parameters: parameters
		};
	},
	
	getArity() {
		if(this.parameters == null)
			return 0;
		
		return this.parameters.length;
	},
	
	matches(other) {
		return other != null && this.symbol == other.symbol && this.getArity() == other.getArity();
	},
	
	print() {
		var str = this.symbol;
		
		if(this.parameters.length != 0) {
			str += "(";
			
			for(var parameter = 0; parameter < this.parameters.length; ++parameter)
				if(parameter == this.parameters.length - 1)
					str += this.parameters[parameter] + ")";
				else
					str += this.parameters[parameter] + ",";
		}
		
		return str;
	}
}

function Lindenmayer() {
	this.rules = [];
	this.constants = "";
}

Lindenmayer.prototype = {
	MAX_ITERATIONS: 16,
	
	setConstants(constants) {
		this.constants = constants;
	},
	
	setRules(rules) {
		for(var rule = 0; rule < rules.length; ++rule)
			this.addRule(rules[rule]);
	},
	
	removeRules() {
		this.setRules([]);
	},
	
	addRule(rule) {
		this.rules.push(new Rule(rule));
	},
	
	process(axiom, iterations) {
		var axiom = this.toSymbols(axiom.replace(/\s/g, ""));
		
		if(iterations > this.MAX_ITERATIONS)
			iterations = this.MAX_ITERATIONS;
		
		for(var iteration = 0; iteration < iterations; ++iteration)
			axiom = this.applyRules(axiom);
		
		return axiom;
	},
	
	toSymbols(string) {
		var symbols = [];
		
		for(var index = 0; index < string.length; ++index) {
			var symbol = new Symbol(string, index);
			
			index += symbol.length;
			symbols.push(symbol);
		}
		
		return symbols;
	},
	
	getRules(symbol, predecessor, successor) {
		var rules = [];
		
		for(var rule = 0; rule < this.rules.length; ++rule)
			if(this.rules[rule].isApplicable(symbol, predecessor, successor))
				rules.push(this.rules[rule]);
		
		return rules;
	},
	
	applyRule(rule, symbol, predecessor, successor) {
		var returnSymbols = [];
		
		for(var index = 0; index < rule.body.body.length; ++index) {
			var s = rule.body.body[index];
			var code = "with(rule.key){var result=new Symbol();result.symbol=\"" + s.symbol + "\";";
			
			if(s.parameters.length > 0) {
				code += "result.parameters=[";
				
				for(var parameter = 0; parameter < s.parameters.length; ++parameter) {
					code += s.parameters[parameter];
					
					if(parameter != s.parameters.length - 1)
						code += ",";
					else
						code += "];";
				}
			}
			else
				code += "result.parameters=[];";
			
			eval(code + "}");
			returnSymbols.push(result);
		}
		
		return returnSymbols;
	},
	
	parseSymbol(predecessor, symbol, successor) {
		var rules = this.getRules(symbol, predecessor, successor);
		
		if(rules.length == 0)
			return [symbol];
		else if(rules.length == 1)
			return this.applyRule(rules[0], symbol, predecessor, successor);
		else {
			var ruleIndex = Math.floor(Math.random() * rules.length);
			
			return this.applyRule(rules[ruleIndex], symbol, predecessor, successor);
		}
	},
	
	applyRules(sentence) {
		var newSentence = [];
		
		for(var symbol = 0; symbol < sentence.length; ++symbol) {
			var predecessor = null;
			var successor = null;
			
			if(symbol > 0)
				predecessor = sentence[symbol - 1];
			
			if(symbol + 1 < sentence.length)
				successor = sentence[symbol + 1];
			
			newSentence = newSentence.concat(this.parseSymbol(predecessor, sentence[symbol], successor));
		}
		
		return newSentence;
	},
	
	toString(symbols) {
		var sentence = "";
		
		for(var index = 0; index < symbols.length; ++index)
			sentence += symbols[index].print()
		
		return sentence;
	}
}