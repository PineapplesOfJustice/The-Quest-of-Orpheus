/***** Helper functions ******/

function  scrollSmoothToBottom() {
   var div = textarea;
   $('#adventuretext').animate({
      scrollTop: div.scrollHeight - div.clientHeight
   }, 250);
}

function scrollSmoothToTop() {
   var div = textarea;
   $('#adventuretext').animate({
      scrollTop: div.clientHeight - div.scrollHeight  
   }, 10);
}

window.addEventListener('keydown', function(e) {
  if(e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
});

function remove(array, element) {
    var index = array.indexOf(element);
    array.splice(index, 1);
}

function findElementInArray(array, property, val) {
  return array.find( thing => thing[property] === val )
}

// This is a specific function that apply to exactly one scenario.
function checkForDirection(object, property, val) {
  for(var direction in object){
    var something = object[direction][property].toLowerCase();
    var somethingArray = something.split(" ");
    while(somethingArray.length > 1){
      somethingArray[0] = somethingArray[0].concat(somethingArray[1]);
      somethingArray.splice(1, 1);  
    }
    //console.log(somethingArray[0])  
    if(somethingArray[0] == val){
      return direction;  
    }  
  }  
}

function characterDialogue(characterName, characterColor, characterText){
    var currentDialogue = "<span style='color: " + characterColor + ";'>[" + characterName + "]</span>&ensp;" + characterText + "<br>";
    return currentDialogue;
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


/***** Constructor functions *****/

// ROOM object

function Room(name, color, description) {
  this.name = name;
  this.color = color;
  this.description = description;

  this.showLocationName = function(){
    textarea.innerHTML += "<br><span style='color: " + this.color + "; text-shadow: -0.5px 0.5px 1px black;'>" + this.name + "</span><br>";
  }    
  this.showDescription = function() {
    textarea.innerHTML += this.description + "<br>"
    
  }
  
  this.addExit = function(direction, location, description, requirement, requirementText) {
    this.exits[direction] = new Object;
    this.exits[direction].direction = direction;
    this.exits[direction].location = location;
    this.exits[direction].description = description;
    this.exits[direction].requirement = requirement;
    this.exits[direction].requirementText = requirementText;
    this.exits[direction].showDescription = function() {
      if(typeof this.description == "object"){  
        this.description.ask();  
      }   
      else{  
        textarea.innerHTML += "Orpheus looks " + this.direction + ". " + this.description + "<br>";
        if(this.specialEffect != null){
          this.specialEffect();  
        }  
      }
    }  
    //this.exits[direction].explored = false;
  }

  this.addThing = function(thing) {
    this.things.push(thing);
  }

  this.addNpc = function(npc) {
    this.npcs.push(npc);
  }

  this.showThings = function() {
    var tempString = ""
    if (this.things.length > 0) {
      var haveTakeAbleThing = false; 
      for (var t of this.things) {
        if(t.takeAble){  
          haveTakeAbleThing = true;
          tempString += t.name + ", "
        }
      }
      if(haveTakeAbleThing){
        tempString = "Things in this room: " + tempString.substring(0, tempString.length - 2) + ".<br>"
        textarea.innerHTML += tempString;
      }
    }
      
    var tempString = ""
    if (this.npcs.length > 0) {
      for (var n of this.npcs) {
        tempString += n.name + " (" + n.status + "), "
      }
      tempString = "Npcs in this room: " + tempString.substring(0, tempString.length - 2) + ".<br>"
      textarea.innerHTML += tempString
    }
    
  }

  this.showExits = function() {
    var tempString = ""
    for (var n in this.exits) {
      if(explored[this.exits[n].location] != null){  
        tempString += n + " (" + this.exits[n].location + "), ";
      }
      else{
        tempString += n + ", ";
      }  
    }
    if(tempString == ""){
      tempString += "none, "; 
    }  
    tempString = "Exits in this room: " + tempString.substring(0, tempString.length - 2) + ".<br>"
    textarea.innerHTML += tempString
  
    
  }
  
  this.things = [];
  this.npcs = [];
  this.exits = {};
}

// THING object

function Thing(pathToParent, name, description, amountOfUse, takeAble) {
  this.pathToParent = pathToParent;
  this.name = name;
  this.description = description;
  this.amountOfUse = amountOfUse;
  this.takeAble = takeAble;
    
  this.showDescription = function() {
    if(typeof this.description == "object"){  
      this.description.ask();  
    }   
    else{  
      textarea.innerHTML += "Orpheus looks at the " + this.name + ". " + this.description + "<br>";
      if(this.specialEffect != null){
        this.specialEffect();  
      }    
    }
  }
  this.addUsage = function(usage){
    this.usages.push(usage);
  }
  this.usages = [];
  
  this.use = function(){
    var thingUsed = false;
    for(var use of this.usages){  
      if(use.room == currentRoom.name && !thingUsed|| use.room == "any" && !thingUsed){
        textarea.innerHTML += use.use + "<br>"
        
        if(use.specialEffect != null){
          use.specialEffect();  
        }  
        if(this.amountOfUse != "infinite"){  
          this.amountOfUse -= 1;
          if(this.amountOfUse <= 0){  
            remove(chest, this);
            showInventory();
          }
        }
        thingUsed = true;  
      }
    }
    if(!thingUsed){
      textarea.innerHTML += "This is an invalid usage of " + this.name + "<br>"
      
    }
  } 
}

function Usage(pathToParent, room, use){
  this.pathToParent = pathToParent;
  this.room = room;
  this.use = use;
}

// NPC object

function Npc(pathToParent, name, description, textColor, hp, ac, charmDC, status) {
  this.pathToParent = pathToParent;
  this.name = name;
  this.description = description;
  this.textColor = textColor;
  this.hp = hp;
  this.ac = ac;
  this.charmDC = charmDC;
    
  // this.status can be "neutral", "hostile", "friendly", "dead";    
  this.status = status;
  this.dialogue = {};
    
  this.addAttack = function(attack) {
    this.attacks.push(attack);
  }
  this.attacks = [];

  //this.dialogue should have property/method "neutral", "hostile", "friendly", "dead", "annoyed";
  this.addDialogue = function(dialogue) {
    this.dialogue = dialogue;
  }
  
  this.addResponseToGifts = function(response) {
    this.responseToGifts.push(response);
  }
  
  this.addResponseToMilestones = function(response) {
    this.responseToMilestones.push(response);
  }
  
  this.responseToGifts = [];
  this.responseToMilestones = [];
    
  this.showDescription = function() {
    if(typeof this.description == "object"){  
      this.description.ask();  
    }     
    else{  
      textarea.innerHTML += "Orpheus examines " + capitalize(this.name) + ". " + this.description + "<br>";
      
    }
  }
  
  this.talk = function(){  
    var milestoneFound = false;
    if(this.status != "dead" && this.status != "defeated"){
      for(var i=0, length=this.responseToMilestones.length; i<length && !milestoneFound; i++){
        var requirementNeeded = this.responseToMilestones[i].trigger;  
        var requirementFound = false; 
        if(requirementNeeded.includes("||")){ 
          var requirementArray = requirementNeeded.split("||");
          for(var x of requirementArray){
            if(x.charAt(0) == "!"){
              var notFound = true;  
              for(var y of milestone){
                if(x == ("!"+ y)) {  
                  notFound = false;  
                }
              }
              if(notFound){
                requirementFound = true; 
                milestoneFound = true;
              }  
            }
            else{  
              for(var y of milestone){
                if(x == y) {  
                  requirementFound = true;
                  milestoneFound = true;
                }
              }
            }
          }
        }
        else if(requirementNeeded.includes("&&")){
          var requirementArray = requirementNeeded.split("&&");
          var requirementHave = 0;  
          for(var x=0, thisLength=requirementArray.length; x<thisLength; x++){
            if(requirementArray[x].charAt(0) == "!"){
              var notFound = true;  
              for(var y of milestone){
                if(requirementArray[x] == ("!" + y)) {  
                  notFound = false;  
                }
              }
              if(notFound){
                requirementHave += 1;    
              }  
            }
            else{    
              for(var y of milestone){
                if(requirementArray[x] == y) {
                  requirementHave += 1;  
                }
              }
            }
          }  
          if(requirementHave == requirementArray.length){
            requirementFound = true;
            milestoneFound = true;
          }
        }
        else{  
          if(requirementNeeded.charAt(0) == "!"){
            requirementFound = true;  
            for(var x of milestone){     
              if(requirementNeeded == ("!" + x)){
                requirementFound = false; 
              }  
            }
          }
          else{ 
            for(var x of milestone){ 
              if(x == requirementNeeded){
                requirementFound = true;
                milestoneFound = true;  
              }
            }
          }
        }
        if(milestoneFound){
          textarea.innerHTML += characterDialogue(this.name, this.textColor, this.responseToMilestones[i].response);
          if(this.responseToMilestones[i].specialEffect != null){
            this.responseToMilestones[i].specialEffect();  
          }
          if(this.responseToMilestones[i] && !this.responseToMilestones[i].repeat){
            remove(this.responseToMilestones, this.responseToMilestones[i]);
          }
        }
      }
    }  
    if(!milestoneFound && this.status == "dead"){  
      textarea.innerHTML += "Orpheus talks to the air and a chill runs down his spine. It was an omen.<br>";
    }
    else if(!milestoneFound && typeof this.dialogue[this.status] == "object"){  
      this.dialogue[this.status].ask();  
    }
    else if(!milestoneFound){  
      textarea.innerHTML += characterDialogue(this.name, this.textColor, this.dialogue[this.status]);
    }
  }
    
}

function Dialogue(pathToParent, neutral, hostile, friendly, defeated, annoyed, declineGift) {
  this.pathToParent = pathToParent;
  this.neutral = neutral;
  this.hostile = hostile;
  this.friendly = friendly;
  this.defeated = defeated;
  this.annoyed = annoyed;
  this.declineGift = declineGift;
}

function Question(pathToParent, questioner, questionerTextColor, question, incorrect) {
  this.pathToParent = pathToParent;
  this.questioner = questioner;
  this.questionerTextColor = questionerTextColor;
  this.question = question;
  this.incorrect = incorrect;
    
  this.addResponse = function(response) {
    this.responses.push(response);
  }
  this.responses = [];
  this.ask = function(){  
    textarea.innerHTML += characterDialogue(this.questioner, this.questionerTextColor, this.question);
    var tempString = "";
    for (var x of this.responses) {  
      tempString += x.answer + ", ";
    }
    tempString = "[Response with " + tempString.substring(0, tempString.length - 2) + "]<br>"
    textarea.innerHTML += tempString;
      
    orpheus.status = "questionAsked";
    masterQuestion = this;  
  }
  this.resolve = function(response){
    if(response.response != ""){
      textarea.innerHTML += characterDialogue(this.questioner, this.questionerTextColor, response.response);
        
    }
    orpheus.status = "alive";
    if(response.specialEffect != null){
      response.specialEffect();  
    }
      
    masterQuestion = "";  
      
  };
  this.idleText = function(){
    textarea.innerHTML += characterDialogue(this.questioner, this.questionerTextColor, this.incorrect);
    var tempString = "";
    for (var x of this.responses) {  
      tempString += x.answer + ", ";
    }
    tempString = "[Response with " + tempString.substring(0, tempString.length - 2) + "]<br>"
    textarea.innerHTML += tempString;
      
  };  
}

function QuestionResponse(pathToParent, answer, response){
  this.pathToParent = pathToParent;
  this.answer = answer;
  this.response = response;  
}

function Attack(pathToParent, name, whoRollDice, DC, damage, initiation, criticalHit, criticalFailure, miss, hit) {
  this.pathToParent = pathToParent;
  this.name = name;
  this.whoRollDice = whoRollDice;
  this.DC = DC;
  this.damage = damage;
  this.text = new Object;
  this.text.initiation = initiation;
  this.text.criticalHit = criticalHit;
  this.text.criticalFailure = criticalFailure;
  this.text.miss = miss;
  this.text.hit = hit;
}

function ResponseToGift(pathToParent, trigger, response, repeat, removeObject) {
  this.pathToParent = pathToParent;
  this.trigger = trigger;
  this.response = response;
  this.repeat = repeat;
  this.give = function(thing){
    textarea.innerhTML += "Orpheus gives " + this.trigger + " to " + this.pathToParent.name + ". <br>";
    textarea.innerHTML += characterDialogue(this.pathToParent.name, this.pathToParent.textColor, this.response);
    if(removeObject){  
      remove(chest, thing);  
      showInventory();  
    }
    if(this.specialEffect != null){
      this.specialEffect();  
    }  
    if(!this.repeat){
      remove(this.pathToParent.responseToGifts, this);  
    }  
  }  
}

function ResponseToMilestone(pathToParent, trigger, response, repeat) {
  this.pathToParent = pathToParent;
  this.trigger = trigger;
  this.response = response;
  this.repeat = repeat;

}
