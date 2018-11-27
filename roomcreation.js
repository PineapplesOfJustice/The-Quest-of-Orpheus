// Each item and npc should have its own variable then, be added to the room later. This is to make it easily malleable elsewhere.
// The attack system should be arranged to make more function.
// Talk should have its own function to display text; this is useful because it can be called by the talk command, but also called manually by the coder.


var rooms = [];
//var things = [];
var lyre;

//The way milestone work is that the code will manually add the milestone when it is reached. So I just have to check if the property is defined.
var milestone = [];

var textarea = document.getElementById("adventuretext");

var explored = new Object;

var orpheus = { 
  name: "orpheus",
  textColor: "#8DB600",
  hp: 100,
  ac: 12, 
  status: "alive",
  attacks: {},
  addAttack: function(name, attack){
    this.attacks[name] = attack;
  }, 
};

orpheus.addAttack("fist", new Attack(orpheus, "fist", "orpheus", 10, "d4", "Orpheus clenchs his fist and charges at", "It is a critical hit! The fist bruised the astonished foe.", "It is a critical failure! Orpheus sprained his arm in attempt to land a devastating punch.", "By sheer luck, the fist misses it marks. The enemy grins, the counterattack begins.", "The fist strucks its mark."));
orpheus.addAttack("rock", new Attack(orpheus, "rock", "orpheus", 10, "d8", "Orpheus grips his obsidian rock and charges at", "It is a critical hit! The rock bruised the astonished foe.", "It is a critical failure! Orpheus stumbled and smacked himself with the rock.", "By sheer luck, the rock misses it marks. The enemy grins, the counterattack begins.", "The rock strucks its mark."));
orpheus.addAttack("sword", new Attack(orpheus, "sword", "orpheus", 10, "d20", "Orpheus grips his sword and charges at", "It is a critical hit! The gleaming blade sliced the astonished foe.", "It is a critical failure! Orpheus stumbled on a conveniently placed rock and stubbed his toe.", "By sheer luck, the sword misses it marks. The enemy grins, the counterattack begins.", "The blade strucks its mark."));

var masterQuestion = "";

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

function importedFindElement(array, property, val) {
  return array.find( thing => thing[property] === val )
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
      for (var t of this.things) {
        if(t.takeAble){  
          tempString += t.name + ", "
        }
      }
      tempString = "Things in this room: " + tempString.substring(0, tempString.length - 2) + ".<br>"
      textarea.innerHTML += tempString
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
// STEPS 1 and 2: YOUR CODE HERE

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

// NPC Creation

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
          textarea.innerHTML += "<span style='color: " + this.textColor + ";'>[" + this.name + "]</span>&ensp;" + this.responseToMilestones[i].response + "<br>";
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
      textarea.innerHTML += "<span style='color: " + this.textColor + ";'>[" + this.name + "]</span>&ensp;" + this.dialogue[this.status] + "<br>";
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
    //if(this.questioner != "narrator"){
      textarea.innerHTML += "<span style='color: " + this.questionerTextColor + ";'>[" + this.questioner + "]</span>&ensp;";
    //}
    textarea.innerHTML += this.question + "<br>";  
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
      //if(this.questioner != "narrator"){      
        textarea.innerHTML += "<span style='color: " + this.questionerTextColor + ";'>[" + this.questioner + "]</span>&ensp;";
      //}
      textarea.innerHTML += response.response + "<br>";  
        
    }
    orpheus.status = "alive";
    if(response.specialEffect != null){
      response.specialEffect();  
    }
      
    masterQuestion = "";  
      
  };
  this.idleText = function(){
    //if(this.questioner != "narrator"){
      textarea.innerHTML += "<span style='color: " + this.questionerTextColor + ";'>[" + this.questioner + "]</span>&ensp;";
    //}
    textarea.innerHTML += this.incorrect + "<br>";     
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
    textarea.innerHTML += "<span style='color: " + this.pathToParent.textColor + ";'>[" + this.pathToParent.name + "]</span>&ensp;" + this.response + "<br>";
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

//this serve as reference guide.
function makeRooms(){

// The Lyre //    -------------------------------------------------------------------------------
    
  lyre = new Thing(currentRoomCreation, "lyre", "It is a beautiful golden lyre given by Apollo to him. It had been a dear friend and his sole source of solace during this painful time. Because of his musical skill, Orpheus cans charm anyone: living, dead, or inanimated.", "infinity", true);
    lyre.addUsage(new Usage(lyre, "The Main Gate", "Orpheus orchestrates a single sorrowful tune. It awes the observers. Cerberus howled along before settling down."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>";  
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }  
          }
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };
    lyre.addUsage(new Usage(lyre, "Training Ground", "Orpheus plays a short, but beautiful tune; however, the screeching symphony of the warriors drowns his lonely tune."));
    lyre.addUsage(new Usage(lyre, "The Field of Asphodel", "Orpheus plays a short, but beautiful tune. The gazes of a million absent-minded souls settled on him. Orpheus increases his pace slightly."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>";
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }
          }  
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };  
    lyre.addUsage(new Usage(lyre, "Hades's Palace", "Orpheus pours his heart, his soul, and his pain into a single sorrowful tune. It overwhelms the atmosphere. Although the gloomy god misted his eyes, his wife is a living fountains of tears."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>";
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }  
          }  
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };
    lyre.addUsage(new Usage(lyre, "Overworld's Tunnel", "Orpheus pours his heart and soul into a single joyous tune. He swells with pride knowing that Eurydice is in the audience."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>";
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }  
          }  
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };
    lyre.addUsage(new Usage(lyre, "any", "Orpheus plays a short, but beautiful tune. It awes all the onlooking observers to tears."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>"; 
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }
          }  
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };
  
    
// Room[0] //    -------------------------------------------------------------------------------
    
  rooms[0] = new Room("The Underworld", "red", "Orpheus enters a wide chasm settled with crimson diamonds glittering from the high ceiling above. They reflects the numerous torches that brighten the area. A pale soul greeted Orpheus. He resembles a mid-aged man of aristocratic descend. The air is humid signifying a nearby source of water. To the north-east, indeed, Orpheus spots a gushing river. To the north, he noted Cerberus, gatekeeper of the Underworld. Further beyond is a palace of dark obsidian where Hades resides.");  
  var currentRoomCreation = rooms[0];  
    explored["The Underworld"] = true;
    currentRoomCreation.addExit("north", "The Main Gate", "Orpheus sees a big three-headed dog and a large gate. Souls can be seen pouring into the entrance.", null, null);
    currentRoomCreation.addExit("northeast", "The River of Styx", "Orpheus sees a wide river, only one ferryman can be found.", null, null);
    currentRoomCreation.addExit("south", "Overworld's Tunnel", "Orpheus sees a long winding cave upward to the light.", "retreivedEurydice", "Unless Eurydice cans accompany him, Orpheus vowed to not desert his own selfish cause.");
    currentRoomCreation.addThing(new Thing(currentRoomCreation, "rock", "It is a plain obsidian rock. It feels cool when touched.", "infinity", true));
      var currentThing = currentRoomCreation.things[currentRoomCreation.things.length-1];
      currentThing.addUsage(new Usage(currentThing, "any", "Orpheus juggles the rock with his swift hand. Up and up it goes again."));
    
    currentRoomCreation.addNpc(new Npc(currentRoomCreation, "soul", "He seems to have been middle-aged man on his death day. Was he assigned to valet duty by the judges?", "#D9D6CF", 10, 8, 4, "neutral"));
    //console.log(currentRoomCreation)
      var currentNpc = currentRoomCreation.npcs[currentRoomCreation.npcs.length-1];
      currentNpc.addDialogue(new Dialogue(currentNpc, "Welcome to the Underworld.", "<span style='font-size: 10px;'>Calm Howard. Do not be provoked.</span> Begone enemy of the gods!", new Question(currentNpc.dialogue, currentNpc.name, currentNpc.textColor, "Do you like taking pointless detours on quests?", "Please refrain from being sidetracked."), "I will returns Orpheus. Your life will be haunted. Bewares of the night.", "You are annoying.", "Thank you, but I do not need this thing."));
        var currentQuestion = currentNpc.dialogue.friendly;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Go northeast to the river, attack it, then speak with it. Finally, response with yes."));
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "That is a shame."));      
      currentNpc.addAttack(new Attack(currentNpc, "life drain", "enemy", "userAC", "d20", "The soul attempts to drain the life force from Orpheus.", "The attack enfeebled Orpheus.", "The soul stumbled trying to approach Orpheus.", "The attack misses.", "Orpheus is damaged."));
      
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "rock", "Thank you kind sir, but a soul cannot entangles with inanimated objects", true, false));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){
          if(this.pathToParent.status == "friendly"){
            textarea.innerHTML += capitalize(this.pathToParent.name) + " is friendly.<br>";
          }
          else{
            textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes friendly.<br>";
          }
          this.pathToParent.status = "friendly";
          milestone.push("charmedSoul");
          this.pathToParent.description = "The busy soul is practicing his greeting lines. He looks happy to see Orpheus.";  
        };
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "coin", "Thank you kind sir, but a soul have no need for currency.", true, false));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){
          if(this.pathToParent.status == "friendly"){
            textarea.innerHTML += capitalize(this.pathToParent.name) + " is friendly.<br>";
          }
          else{
            textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes friendly.<br>";
          }
          this.pathToParent.status = "friendly";
          milestone.push("charmedSoul");
          this.pathToParent.description = "The busy soul is practicing his greeting lines. He looks happy to see Orpheus.";  
        };
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "retreivedEurydice", "You found Eurydice? The gods must truly favored you. Now, return to where you came from. May Hermes, himself, grace you with quick passage.", false));
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "angeredHades", "Why did you angered Hades! You cannot hide from the gods!", true));

    
// Room[1] //    -------------------------------------------------------------------------------
  
  rooms[1] = new Room("The Main Gate", "red", "Orpheus stands before a grand entrance. Surrounding it are thick spiked fortifications. Gruesome skulls collected dust at the bottom. Meanwhile, hoards of souls, fresh from their passage across the River of Styx crowd the entrance. They are waiting to cross the Field of Asphodel and be judged by their accomplishments while alive and assigned to one of three afterlives: the Fields of Punishment for the wicked, Elysium for the nobled, and the Field of Asphodel for the insipid. Orpheus dreads to see his beloved cramped inside this tight horde. With eyes looking forward, he saw Cerberus, a fierce three-headed dog and loyal guard of Hades. Orpheus realized that he is the focus of Cerberus's intense gaze.");  
  var currentRoomCreation = rooms[1];  
    currentRoomCreation.addExit("north", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", "charmedCerberus||killedCerberus", "Cerberus growls alarmingly. It is unadvised to attempt to cross.");
    currentRoomCreation.addExit("south", "The Underworld", "Orpheus sees a wide rocky area. Near it is the tunnel from which he had descended.", null, null);
    currentRoomCreation.addThing(new Thing(currentRoomCreation, "coin", "It is a golden drachma, the staple currency of classical Greece. People were buried with a coin to paid Charon for the ferry's fare.", "infinity", true));
      var currentThing = currentRoomCreation.things[currentRoomCreation.things.length-1];
      currentThing.addUsage(new Usage(currentThing, "any", "Orpheus flips the coin. It lands on its side."));
        currentThing.usages[currentThing.usages.length-1].specialEffect = function(){
          if(Math.floor(Math.random()*2)+1 == 0){
            this.use = "Orpheus flips the coin. It is head.";  
          }  
          else{
            this.use = "Orpheus flips the coin. It is tail.";  
          }  
        };
    currentRoomCreation.addNpc(new Npc(currentRoomCreation, "cerberus", "It is a a colossal three-headed dog with black fur and a very large red tongue. The souls are struggling to pass around the massive beast.", "#C9A0DC", 50, 10, 6, "hostile"));
    //console.log(currentRoomCreation)
      var currentNpc = currentRoomCreation.npcs[currentRoomCreation.npcs.length-1];
      currentNpc.deadEffect = function(){
        lyre.usages[0].use = "Orpheus orchestrates a single sorrowful tune. It awes the observers.";
      };
      currentNpc.addDialogue(new Dialogue(currentNpc, "Ggrrrrr.", "Grrrrroowllll!!!", "Grr.. [Cerberus looks excited]", "Grrrrooowl....", "...", "Gr... [Cerberus is shaking his head]"));
      currentNpc.addAttack(new Attack(currentNpc, "bite", "enemy", "userAC", "d20", "Ceberus attempts to bite Orpheus.", "The attack slaughtered Orpheus.", "Cerberus stumbled trying to approach Orpheus. A few souls were caught in the aftermath.", "The attack misses.", "Orpheus is damaged."));
      currentNpc.addAttack(new Attack(currentNpc, "slash", "enemy", "userAC", "d20", "Ceberus attempts to swipe Orpheus with his paw.", "The attack sends Orpheus flying.", "A soul accidentally trips Cerberus to get to the Field of Asphodel.", "The attack misses.", "Orpheus is damaged."));
      
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "rock", "Grrowwll!!! [Cerberus's enthusiasm is overflowing]", false, true));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){
          if(this.pathToParent.status == "friendly"){
            textarea.innerHTML += capitalize(this.pathToParent.name) + " is friendly.<br>";
          }
          else{
            textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes friendly.<br>";
          }
          this.pathToParent.status = "friendly";
          milestone.push("charmedCerberus");  
          this.pathToParent.description = "Cerberus is playing with his rock. He seems happy to smell Orpheus.";  
        };
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "retreivedEurydice", "Grrr.. [Cerberus seems to be looking at something behind Orpheus]", false));
    

// Room[2] //    -------------------------------------------------------------------------------
    
  rooms[2] = new Room("The River of Styx", "red", "Orpheus approaches a wide river of unknown depth. From old tales and experience, he knew that merely touching its water will bring extraordinary pain not replicable by any form of mortal torture techniques. In the distance, Charon is ferrying his way across with a boatload of the newly deads. The air is humid and damp. Orpheus cans travel no farther in this direction.");  
  var currentRoomCreation = rooms[2];  
    currentRoomCreation.addExit("southwest", "The Underworld", "Orpheus sees a wide rocky area. Near it is the tunnel from which he had descended.", null, null);
    currentRoomCreation.addNpc(new Npc(currentRoomCreation, "river", null, "#C2B280", 1000, 0, 0, "neutral"));
      var currentNpc = currentRoomCreation.npcs[currentRoomCreation.npcs.length-1];
      currentNpc.respawn = {hp: 1000, text: "Orpheus opens a chasm beneath the river, but it was soon patch up by sediment deposits.<br>", };
    
      currentNpc.description = new Question(currentNpc, "narrator", "#FF7518", "The River of Styx is running on its usual course - around the Underworld. Although it is a great natural landmark, the temptation to take a refreshing swim is suicidal.<br>Do you like to take a refreshing swim?", "Please answers the question.")
        var currentQuestion = currentNpc.description;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus paddles into the river. Almost immediately, a million needles tingles his pain receptors, but the gods were on his side. Orpheus was blessed by a quick death and reunited with Eurydice."));
          var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
          currentResponse.specialEffect = function(){
            orpheus.hp = 0;
            orpheus.status = "dead";  
            showStatus(); 
            gameOverText("river");  
          }
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and did not swim in the river."));      
      currentNpc.addDialogue(new Dialogue(currentNpc, "...", new Question(currentNpc.dialogue, "narrator", "#FF7518", "Do you like to take a refreshing swim?", "Please answers the question."), "...", "...", "...", "... [the dropped item was washed ashore]"));
        var currentQuestion = currentNpc.dialogue.hostile;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus dives into the river. Almost immediately, a million needles tingles his pain receptors, but the gods were on his side. Orpheus was blessed by a quick death and reunited with Eurydice in Elysium."));
          var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
          currentResponse.specialEffect = function(){
            orpheus.hp = 0;
            orpheus.status = "dead";  
            showStatus(); 
            gameOverText("river");  
          }
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and did not waddle into the river."));      
      currentNpc.addAttack(new Attack(currentNpc, "splash", "enemy", "userAC", 0, "The river splashes around on its normal course.", "The attack crippled Orpheus.", "The river splashes a little further than ususal.", "The attack misses.", "Orpheus is damaged."));
      
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "coin", "..!", false, true));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){
          if(this.pathToParent.status == "friendly"){
            textarea.innerHTML += capitalize(this.pathToParent.name) + " is friendly.<br>";
          }
          else{
            textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes friendly.<br>";
          }
          this.pathToParent.status = "friendly";  
          textarea.innerHTML += "The coin made ripples before sinking beneath the current. In the distance, Charon seemingly paddles a knot faster as he eyes the dropped drachma greedily.<br>"  
        };
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "rock", "..!", false, true));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){
          if(this.pathToParent.status == "hostile"){
            textarea.innerHTML += capitalize(this.pathToParent.name) + " is hostile.<br>";
          }
          else{
            textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes hostile.<br>";
          }
          this.pathToParent.status = "hostile";  
          textarea.innerHTML += "The rock made a big splash before sinking beneath the current. For some reason, the splash was mesmeric to watch.<br>"  
        };
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "pomegranate", "..!", true, false));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){  
          textarea.innerHTML += "The pomegranate bloated on the surface and was washed ashore.<br>"  
        };
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "retreivedEurydice", "... [a womanly shape seemed to be mirrored in the water]", false));
    currentRoomCreation.addThing(new Thing(currentRoomCreation, "charon", "He is the ferryman of the Styx. Charon is a loyal servant of Hades, though he does have a weakness for money. Currently, he is busy paddling away with a boatload of souls jumping to reach the afterlife.", 1, false));
    

// Room[3] //    -------------------------------------------------------------------------------
    
  rooms[3] = new Room("The Field of Asphodel", "red", "Orpheus enters a massive wasteland. The only thing green about this place is the black grass and the small poplar trees that dots the landscape; however, what it lacks in greenery, Asphodel makes up in the sheer amount of souls present. This is the fate for those who lives an insipid life. Far ahead, loomed Hades's Palace. To the northeast, a rich garden of pomegranate trees. To the northwest is a dark cave. Orpheus shuddered to think of what may lie in it.");  
  var currentRoomCreation = rooms[3];  
    currentRoomCreation.addExit("north", "Hades's Palace", "Orpheus sees a grand obsidian palace. Skeletons and zombies can be found patrolling", null, null);
    currentRoomCreation.addExit("northeast", "Persephone's Garden", "Orpheus sees a beautiful pomgrante garden. The air smells sweet from its fragrance.", null, null);
    currentRoomCreation.addExit("northwest", "Tartarus", "Orpheus feels a strong sense of fear from staring into a pitch black cave.", null, null);
    currentRoomCreation.addExit("south", "The Main Gate", "Orpheus sees a big three-headed dog besides a large gate. Souls can be seen passing from it.", "charmedCerberus||killedCerberus", "Cerberus growls alarmingly. It is unadvised to attempt to cross.");
    currentRoomCreation.addExit("west", "Training Ground", "Orpheus sees a military camp for skeletons. The air is dusty.", null, null);


// Room[4] //    -------------------------------------------------------------------------------
    
  rooms[4] = new Room("Training Ground", "red", "Orpheus approaches an open field cluttered with the undeads, each sparring another in organized pairs of two. Thousands of skeleton warriors hack at each others and dies. Although they crumpled to dust, the Underworld reanimates the bodies of these skeletons to prolong the haunting requiem. Orpheus fails to imagine what horrific battle they are preparing for. Turning his gaze to a nearby hut, Orpheus finds swords of every size to suit the preference of these warriors. One lone soldier stands by its side, training his mind mentally with an invisible foe. Here, conversations are nigh impossible beneath the clashing of swords.");  
  var currentRoomCreation = rooms[4];  
    currentRoomCreation.addExit("east", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", null, null);
    currentRoomCreation.addThing(new Thing(currentRoomCreation, "sword", "It is a gilded obsidian sword. It is cold, but well-balanced for Orpheus's strong physique.", "infinity", true));
      var currentThing = currentRoomCreation.things[currentRoomCreation.things.length-1];
      currentThing.addUsage(new Usage(currentThing, "Training Ground", "Orpheus sheaths and unsheath his sword. He silently prays to Hades, gratified by the gift."));
      currentThing.addUsage(new Usage(currentThing, "Hades's Palace", "Orpheus tries to unsheathes his sword. Hades gazes intently at his left hand. On further re-evaluation, Orpheus let go of the sword."));
      currentThing.addUsage(new Usage(currentThing, "any", "Orpheus swings his mighty sword purposely. Pleased by his strokes, Orpheus sheathes the obsidian blade."));
    
    currentRoomCreation.addNpc(new Npc(currentRoomCreation, "skeleton", "He is a living human corpse. Adorned with mail armor the skeleton is doing image training by himself. Where is his partner?", "#D9D6CF", 10, 12, 7, "neutral"));
    //console.log(currentRoomCreation)
      var currentNpc = currentRoomCreation.npcs[currentRoomCreation.npcs.length-1];
      currentNpc.addDialogue(new Dialogue(currentNpc, "... [the skeleton takes a fighting stance]", "... [the skeleton looks ready to return the next blow]", "... [the skeleton takes a fighting stance]", "..! [the skeleton grins]", "...", "... [the skeleton shakes his head slowly once]"));
      currentNpc.addAttack(new Attack(currentNpc, "slash", "enemy", "userAC", "d20", "The skeleton attempts to slash Orpheus with his sword.", "The attack devastated Orpheus.", "The skeleton was struck accidentally by a nearby colleague.", "The attack misses.", "Orpheus is damaged."));
      currentNpc.respawn = {hp: 10, text: "The necromantic power of Hades respawned Skeleton from the whirling dust.<br>", };
      
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "sword", "... [the skeleton draws his own blade]", true, false));
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "pomegranate", "... [out of courtesy, the skeleton ate the pomegranate]", true, false));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){  
          textarea.innerHTML += "Because the skeleton is hollow, it passed harmlessly through and down to the black earth. The skeleton grins, feigning ignorance.<br>";  
        };
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "retreivedEurydice", "... [the skeleton gazes at a spot behind Orpheus]", false));


// Room[5] //    -------------------------------------------------------------------------------
    
  rooms[5] = new Room("Tartarus", "red", "Orpheus loomed before a titanic cavern. From within echoes dissonant whispers and screams of agony. Orpheus shuddered. From tales, he had heard of the Tartarus, the legendary prison of the Underworld from which there is no return. Its prisoners are said to be trapped in an indefinite cycle of gruesome torments. Even the gods, themselves, feared its power and imprisoned their worst foes here. Unlike the rest of the Underworld which is dimly-litted by torches, the Tartarus is a vortex of true darkness.");  
  var currentRoomCreation = rooms[5];  
    currentRoomCreation.addExit("southeast", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", null, null);
    currentRoomCreation.addNpc(new Npc(currentRoomCreation, "cave", null, "#C2B280", 1000, 0, 0, "neutral"));
      var currentNpc = currentRoomCreation.npcs[currentRoomCreation.npcs.length-1];
      currentNpc.respawn = {hp: 1000, text: "The cave collapsed, but its pull does not end. The rapid collisions from attracted debris create an improvised cave.<br>", };
    
      currentNpc.description = new Question(currentNpc, "narrator", "#FF7518", "Tartarus echoes the pains of its prisoners. Orpheus fights against the gravitational force that seems to pull him closer to prison.<br>Do you want to enter Tartarus?", "Please answers the question.");
        var currentQuestion = currentNpc.description;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus steps purposely into the cave before the floor abruptly shattered beneath his dangling feet. By the combined power of gravity and time, Orpheus reaches terminal velocity before crashing head first into the concrete and was prickled by the stalagmites that dotted the entire landscape. The chance of returning dismal, Orpheus grew conscious of the blackhole that is his stomach. Looking around, Orpheus sees only rocks, darkness, and a river of burning fire."));
        var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
        currentResponse.specialEffect = function(){
          orpheus.hp = -1;
          orpheus.status = "dead";  
          showStatus(); 
          gameOverText("cave");  
        }
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and backed away from the cave."));
      currentNpc.addDialogue(new Dialogue(currentNpc, "...", new Question(currentNpc.dialogue, "narrator", "#FF7518", "Do you want to enter Tartarus?", "Please answers the question."), "...", "...", "...", "... [for some odd reason, Tartarus expelled the item]"));
        var currentQuestion = currentNpc.dialogue.hostile;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus steps purposely into the cave before the floor abruptly shattered beneath his dangling feet. By the combined power of gravity and time, Orpheus reaches terminal velocity before crashing head first into the concrete and was prickled by the stalagmites that dotted the entire landscape. The chance of returning dismal, Orpheus grew conscious of the blackhole that is his stomach. Looking around, Orpheus sees only rocks, darkness, and a river of burning fire."));
          var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
          currentResponse.specialEffect = function(){
            orpheus.hp = -1;
            orpheus.status = "dead";  
            showStatus(); 
            gameOverText("cave");  
          }
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and backed away from the cave."));      
      currentNpc.addAttack(new Attack(currentNpc, "attract", "enemy", "userAC", 0, "The cave attempts to draw Orpheus closer to the entrance.", "The attack launched Orpheus forward.", "The cave pushed a little harder than ususal A nearby rock smacked it in the canopy.", "The attack misses.", "Orpheus is damaged."));
      
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "rock", "..!", false, true));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){  
          textarea.innerHTML += "The rock was sucked into the cave. Orpheus wonders where it went.<br>"  
        };
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "pomegranate", "..!", false, true));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){  
          textarea.innerHTML += "The pomegranate was sucked into the cave. Orpheus wonders where it went.<br>"  
        };
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "retreivedEurydice", "... [the gravitational force seems to tug at an existence behind Orpheus]", false));


// Room[6] //    -------------------------------------------------------------------------------
    
  rooms[6] = new Room("Persephone's Garden", "red", "Orpheus enters a beautiful botanical garden humming with soft cricket sounds. On its trees hung glorious burgundy fruits called pomegranates. They are ripe and juicy. Though they exudes temptation, Orpheus knows better than to grasp the delicious treats. It is rumored that those who had once eaten the fruit of the Underworld shall be barred from re-entrance to the world of the living. Strangely enough, Persephone is nowhere to be found.");  
  var currentRoomCreation = rooms[6];  
    currentRoomCreation.addExit("southwest", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", null, null);
    currentRoomCreation.addExit("west", "Hades's Palace", "Orpheus sees a grand obsidian palace. Skeletons and zombies can be found patrolling", null, null);
    currentRoomCreation.addNpc(new Npc(currentRoomCreation, "tree", null, "#C2B280", 100, 0, 0, "neutral"));      
      var currentNpc = currentRoomCreation.npcs[currentRoomCreation.npcs.length-1];
      currentNpc.respawn = {hp: 100, text: "The tree felled, but another one rose to replace its fallen brethen.<br>", };
    
      currentNpc.description = new Question(currentNpc, "narrator", "#FF7518", "The garden rustles with awareness, one branch heavied with pomegranates drifts closer to Orpheus.<br>Do you want to take a pomegranate?", "Please answers the question.")
        var currentQuestion = currentNpc.description;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus added the pomegranate to his inventory."));
        var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
        currentResponse.specialEffect = function(){
          chest.push(pomegranate);  
          showInventory();  
        }
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and did not take a pomegranate."));
      currentNpc.addDialogue(new Dialogue(currentNpc, "...", new Question(currentNpc.dialogue, "narrator", "#FF7518", "Do you want to take a pomegranate?", "Please answers the question."), "...", "...", "...", "... [the tree silently slips the item into Orpheus's pocket]"));
        var currentQuestion = currentNpc.dialogue.hostile;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus added the pomegranate to his inventory."));
          var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
          currentResponse.specialEffect = function(){
            chest.push(pomegranate);  
            showInventory();  
          }
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and did not take a pomegranate."));      
      currentNpc.addAttack(new Attack(currentNpc, "temptation", "enemy", "userAC", 0, "The grove shakes its fruit-laden branches.", "The attack drew Orpheus forward.", "The grove shakes too hard and one branch tears from its root.", "The attack misses.", "Orpheus is damaged."));
      
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "pomegranate", "..!", false, true));
        currentNpc.responseToGifts[currentNpc.responseToGifts.length-1].specialEffect = function(){  
          textarea.innerHTML += "The tree silently slipped the fruit into Orpheus's open pocket. For good measure, it slipped another one in the other to balance the weight.<br>";
          chest.push(pomegranate);  
          showInventory();    
        };
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "retreivedEurydice", "... [a branch was brushed aside behind Orpheus]", false));
     var pomegranate = new Thing(currentRoomCreation, "pomegranate", "It is a ripe and juicy pomegranate. The fruit is purple and seedy.", 1, false);
      var currentThing = pomegranate;
      currentThing.addUsage(new Usage(currentThing, "any", "Orpheus greedily inhaled the tempting fruit. It tasted sweet; however, Orpheus feels the same as before. Was the tale false?"));
        currentThing.usages[currentThing.usages.length-1].specialEffect = function(){    
          for(var i=0, length=milestone.length; i<length; i++){
            if(milestone[i] == "atePomegrante"){
              milestone.splice(i, 1);
              i -= 1;
              length -=1;  
            }  
          }  
          milestone.push("atePomegrante");  
          orpheus.hp += 10;
          if(orpheus.hp > 100){
            orpheus.hp = 100;  
          }
          showStatus();  
        };
        

// Room[7] //    -------------------------------------------------------------------------------
    
  rooms[7] = new Room("Hades's Palace", "red", "Orpheus settled into an obsidian palace of unmatched grandoise. From his first step to the last, Orpheus was watched. Undead servants of every ranks observe him with intense gazes as he pass by. Uneccesary motions will be reckless and suicidal. Ahead towered Hades above his throne of skulls. To his side is the fair Persephone, his wife and the goddess of spring. If one cans bring back the dead, it can only be the god of the Underworld, Hades.");  
  var currentRoomCreation = rooms[7];  
    currentRoomCreation.addExit("south", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", null, null);
    currentRoomCreation.addExit("east", "Persephone's Garden", "Orpheus sees a beautiful pomgrante garden. The air smells sweet from its fragrance.", null, null);
    currentRoomCreation.addNpc(new Npc(currentRoomCreation, "hades", "As a god, Hades cans assume any form he desires. Currently, he is mid-aged man with dark hair, dark eyes, and dark skin. He exudes a gloomy atmosphere. Not much had happens in the Underworld to pique his interest.", "#B57EDC", 100, 12, 10, "neutral"));
      var currentNpc = currentRoomCreation.npcs[currentRoomCreation.npcs.length-1];
      currentNpc.respawn = {hp: 100, text: "Although Hades seemed to be bleeding golden ichor, it faded away by a motion of Hades's hand. The illusion was dismissed.<br>", };
    
      currentNpc.addDialogue(new Dialogue(currentNpc, "Mortal, what do you seek?", "Insolence! You wishes to draw your blade against me?", "Remember your oath. Do not return!", "You made the wrong enemy Orpheus. A god cannot be felled by mortal hands.", "Quiet!", "I do not need this offering."));      
      currentNpc.addAttack(new Attack(currentNpc, "finger of death", "enemy", "userAC", "d50", "Hades gazes intensely at Orpheus.", "The attack assulted Orpheus.", "Hades gots dry eyes. He needs to rest them more often.", "The attack mgisses.", "Orpheus is damaged."));
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "pomegranate", "Orpheus, do you understand what you are holding in your hands?", true, false));
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "charmedPersephone&&killedCerberus&&atePomegrante", "Orpheus! You enters my domain, kills my servants, and now demands my favor? Persephone had pleaded in your stead, but that is not enough. It is against the law of gods to temper with the dead. You will only recover your beloved under one condition: do not acknowledge her until you leave the Underworld, though she will accompany you along the way. Now, leave.", false));
        currentNpc.responseToMilestones[currentNpc.responseToMilestones.length-1].specialEffect = function(){  
          for(var i=0, length=milestone.length; i<length; i++){
            if(milestone[i] == "charmedHades"){
              milestone.splice(i, 1);
              i -= 1;
              length -= 1;
            }  
          }
          this.pathToParent.responseToMilestones = [];
          milestone.push("retreivedEurydice");  
          chest.push(spirit);  
          showInventory();
          milestone.push("angeredHades");  
          rooms[7].npcs[1].responseToMilestones = [];    
        };
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "charmedPersephone&&killedCerberus", "Orpheus! You enters my domain, kills my servants, and now demands my favor? Persephone had pleaded in your stead, but that is not enough. It is against the law of gods to temper with the dead. You had send yourself on a fool's errand. Now, escorts yourself back. The Underworld shall not be swayed by one so arrogant.", false));
        currentNpc.responseToMilestones[currentNpc.responseToMilestones.length-1].specialEffect = function(){  
          for(var i=0, length=milestone.length; i<length; i++){
            if(milestone[i] == "charmedHades"){
              milestone.splice(i, 1);
              i -= 1;
              length -= 1;
            }  
          }
          this.pathToParent.responseToMilestones = [];  
          milestone.push("angeredHades");  
          rooms[7].npcs[1].responseToMilestones = [];  
        };
    
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "charmedPersephone", "Sigh, Persephone had personally requested the release of Eurydice for your sake. Cherish it well for such an occasion shall not occur again. In exchange, you must swear before me to not look at Eurydice until both of you exit the Underworld. Farewell, Orpheus.", false));
        currentNpc.responseToMilestones[currentNpc.responseToMilestones.length-1].specialEffect = function(){
          milestone.push("retreivedEurydice");  
          chest.push(spirit);  
          showInventory();  
          this.pathToParent.responseToMilestones = [];
          rooms[7].npcs[1].responseToMilestones = [];  
          setTimeout(function(){
            rooms[7].npcs[0].addResponseToMilestones(cerberusSurvival);
             console.log(rooms[7].npcs[0].pathToParent.responseToMilestones) 
          }, 1000);
        };
      var cerberusSurvival = new ResponseToMilestone(currentNpc, "killedCerberus", "Orpheus! I pitied you and granted you your desire, but you chose to mock me and kill my servants? You have nerves to return to me. An eye for an eye. What you took from me, I shall take from you. To atone for your crime, you shall be a dog. And a dog you shall be forevermore!", false);
        cerberusSurvival.specialEffect = function(){
          orpheus.hp = 100;
          orpheus.status = "dead";  
          showStatus(); 
          textarea.innerHTML += "The world went black. A sudden motion, barely recognizable as Hades's, grasps Orpheus by the head. Though he squirmed and struck with his arms, Orpheus cannot escape the frigidly tight palm. In a trance from close-suffocation, Orpheus experiences a massive growth, transforming into a quadrupedal colossus. His mind clouds with instincts as he struggles to retain his identity. Ferocity triumphs. The dog that was Orpheus shooks and growls, though it, too, fall unconscious. Dragged away by Hades, it was chained to a mighty gate by the field of poplar trees.<br>";
          textarea.innerHTML += "<span style='color: " + orpheus.textColor + ";'>[" + capitalize(orpheus.name) + "]</span>&ensp;Grrowwl!<br>" 
          gameOverText("transformation");  
        };
    
    currentRoomCreation.addNpc(new Npc(currentRoomCreation, "persephone", "As a goddess, Persephone cans assume any form she desires. Currently, she is mid-aged woman with black hair, olive eyes, and stunnningly white skin.", "#f5deb3", 100, 12, 10, "neutral"));
      var currentNpc = currentRoomCreation.npcs[currentRoomCreation.npcs.length-1];
      currentNpc.respawn = {hp: 100, text: "Persephone sparkles with energy. It is a final attack! Orpheus closed his eyes due to the intensity. He is undamaged, but Persephone glows with health as if his struggle was a pre-meal warm-up exercise.<br>", };
    
      currentNpc.addDialogue(new Dialogue(currentNpc, "Mortal, why have you descended to this dreary place?", "How pathetic!", "Remember your oath Orpheus.", "You made the wrong enemy Orpheus. I alone can persuade Hades!", "Tone it down!", "I do not need this offering."));      
      currentNpc.addAttack(new Attack(currentNpc, "slap", "enemy", "userAC", "d50", "Persephone reaches out to slap Orpheus.", "The attack hurls Orpheus across the room.", "Persephone misjudges her force and overstepped Orpheus. She almost went sprawling on the floor, but save herself with godly grace.", "The attack misses.", "Orpheus is damaged."));
      currentNpc.addResponseToGifts(new ResponseToGift(currentNpc, "pomegranate", "Orpheus, do you understand what you are holding in your hands? Do not meet the same fate as I!", true, false));
      currentNpc.addResponseToMilestones(new ResponseToMilestone(currentNpc, "charmedPersephone", "Do not worry sweet Orpheus, I shall convince Hades in your stead; however, the laws of the Underworld must be obeyed. You shall not see her until both of you resurfaced.", false));
      
    var spirit = new Thing(currentRoomCreation, "spirit", "It is the spirit of Eurydice! Orpheus is overcomed by joy and grief! It greatly sadden him that he could not look at his Eurydice right now.", "infinity", false);
      var currentThing = spirit;
      currentThing.addUsage(new Usage(currentThing, "any", "Orpheus daydreams about his future with Eurydice. His vitality is restored!"));
        currentThing.usages[currentThing.usages.length-1].specialEffect = function(){
          orpheus.hp = 100;  
          showStatus();  
        };
        

// Room[8] //    -------------------------------------------------------------------------------
    
  rooms[8] = new Room("Overworld's Tunnel", "red", "Orpheus ascends through a long narrow tunnel. It is dirty, it is dusty, and it is dry. He held sole responsiblity for its creation, having carved it with his music. Strangely, there is a 20-sided dice on the floor. Treading up, Orpheus is reminded of the pains he felt, but he smiles. The shackle is off! Looking ahead he saw the shining light, signifying the end of his quest and the beginning of his reward.");  
  var currentRoomCreation = rooms[8];  
    currentRoomCreation.addExit("north", "The Underworld", "Orpheus sees a wide rocky area. It is dark.", null, null);
    currentRoomCreation.addExit("south", "Ancient Greece", "Orpheus sees a beautiful meadow with butterflies and blooming flowers.", "!atePomegrante", "The words echo in his ears. Those who eat the fruits of the Underworld cans no longer returns to the world of light.");  
    currentRoomCreation.addThing(new Thing(currentRoomCreation, "dice", "It is a 20-sided dice of polished bone. It exudes an eerie vibe.", "infinity", true));
      var currentThing = currentRoomCreation.things[currentRoomCreation.things.length-1];
        currentThing.takeQuestion = new Question(currentThing, "narrator", "#FF7518", "The dice was cursed! Orpheus feels an insatiable desire to turn around and take his beloved by the hand.<br>Make a charisma saving throw with 'roll dice'.", "Fight against the curse of being sidetracked Orpheus!");
        var currentQuestion = currentThing.takeQuestion;
          currentQuestion.addResponse(new QuestionResponse(currentQuestion, "roll dice", "")); 
             currentQuestion.responses[currentQuestion.responses.length-1].specialEffect = function(){
               var savingRoll = Math.floor(Math.random()*20)+1;  
               var tempString = textarea.innerHTML;  
               var wordLocation = tempString.lastIndexOf("<br>");
                 //console.log(wordLocation)
               tempString = tempString.slice(0, wordLocation) + tempString.slice(wordLocation).replace("<br>", "");
               //console.log(tempString);  
               tempString += "&ensp;(" + savingRoll + ")<br>";
               if(savingRoll >= 12){   
                 tempString += "Orpheus exorcises the the curse with his willpower. As it dissipates into nothingness, Orpheus resumes his tread up to the promised land, Eurydice behind him.<br>"; 
                 textarea.innerHTML = tempString;
               }
               else{
                 for(var i=0, length=milestone.length; i<length; i++){
                   if(milestone[i] == "retreivedEurydice"){
                     milestone.splice(i, 1);
                     i=length;  
                   }  
                 }
                 remove(chest, spirit);
                 showInventory();  
                 orpheus.status = "dead";  
                 milestone.push("lostEurydice");
                 tempString += "The curse triumphed. Orpheus's last glimpse of his beloved Eurydice was a face twisted by horror and surpise. She dissipates and is no more. Saddened by this turns of event, Orpheus wepts as he treads alone vowing to be reunited by death.<br>";  
                 gameOverText("lostEurydice");
                 textarea.innerHTML = tempString; 
                 gameOverText("lostEurydice"); 
               }    
             }
      currentThing.addUsage(new Usage(currentThing, "any", "Orpheus rolls the dice. It is " + (Math.floor(Math.random()*20)+1) + "."));
        currentThing.usages[currentThing.usages.length-1].specialEffect = function(){ 
          this.use = "Orpheus rolls the dice. It is " + (Math.floor(Math.random()*20)+1) + "."; 
        };
        

// Room[9] //    -------------------------------------------------------------------------------
    
  rooms[9] = new Room("Ancient Greece", "red", "Orpheus resurfaces to the meadow of old. The sun dawns on a distinct day, but the butterflies still flutter and the flowers bloom in vivid golds the way he remembered. The air smell sweet with the fragrance of honey and pollen. In the far distance, Orpheus observed an approaching presence. He noted it with Eurydice, but made no further remarks. Is it a bird? A god? No. It is the credit sequence! The quest concludes as Orpheus and Eurydice frolic beneath the shining sun, giver of life.");  
  var currentRoomCreation = rooms[9];  
    currentRoomCreation.addExit("north", "Overworld's Tunnel", "Orpheus sees a long winding cave downward into the darkness.", null, null);  
    currentRoomCreation.specialEffect = function(){
      orpheus.status = "dead";  
      gameOverText("finishedGame");  
    }
   
}
/******* DO NOT TOUCH THE CODE BELOW THIS LINE **********/

function gameBackground(){
  textarea.innerHTML += "<span style='color: blue;; text-shadow: -0.5px 0.5px 1px black;'>Prelogue</span><br>";
  textarea.innerHTML += "Long ago, there was a man by the name of Orpheus. He was a master of the lyre and was gifted even among the mythological heroes of Greece. He have, but one love: the fair Eurydice. On one sunlit day, darkness abruptly stormed above the star-crossed couples. As Eurydice danced across a blooming meadow with Orpheus playing his signature lyre, a malicious snake sent Eurydice to her swift death with a decisive bite to the ankle. Devastated, Orpheus wills the door to the Underworld with his music, tainted by sorrow. Down he goes, and thus, the story goes.<br>";  
}

makeRooms();
var currentRoom = rooms[0];
gameBackground();
currentRoom.showLocationName();
currentRoom.showDescription();
currentRoom.showThings();
currentRoom.showExits();
//scrollSmoothToTop();