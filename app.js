/*
  School Dismissal Program
  Made by jaideng, 2020
  jaideng1.github.io (my site)
*/

let modules = ['express', 'body-parser', 'socket.io', 'cors', 'colors'];
const { exec } = require('child_process');

function modulecheck() {
  for (let i = 0; i < modules.length; i++) {
    if (!moduleavaliable(modules[i])) {
      installmodules();
      return false;
    }
  }
  return true;
}

function moduleavaliable(name) {
  try {
      require.resolve(name);
      return true;
  } catch(e) {}
  return false;
}

function installmodules() {
  console.clear();
  for (let i = 0; i < modules.length; i++) {
    if (moduleavaliable(modules[i])) {
      console.log("Detected that " + modules[i] + " is installed, moving along...")
      continue;
    }
    let usesave = false;
    if (modules[i] == 'express') {
      usesave = true;
    }
    exec('npm i ' + ((usesave) ? ' -s ' : '') + modules[i], function (error, stdout, stderr) {
      console.log("Detected that " + modules[i] + " is not installed, installing...")
      if (error) {
        console.log("\x1b[31m", "ERROR!")
        console.log("\x1b[37m", error.stack);
        console.log(error.code);
        console.log('Signal: ' + error.signal);
      } else {
        console.log("\x1b[32m", "No error, downloading...")
      }
      console.log("\x1b[37m", stdout);
      console.log(stderr);
    });
  }
}

let checkresults = modulecheck();


if (!checkresults) {
  console.log("\x1b[32m", "Finished installing the packages, run the program again.")
  return;
}

const express = require('express');
const bodyParser = require('body-parser');
var socketIO = require('socket.io');
var http = require('http');
var path = require('path');
var fs = require('fs');
var cors = require('cors');
const colors = require('colors');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

var server = http.Server(app);
var io = socketIO(server);

const NO_STATUS = "Student has not been called yet.";
const NEEDS_TO_LEAVE = "Student needs to come down!";
const COMING = "Student is coming down!";

const STUDENT = "Student";
const SECTION = "Section";
const SCHOOL = "School";

var schoolIdPoint = 0;
var sectionIdPoint = 0;
var studentIdPoint = 0;

// id: S-000000 (note the capital S)
class School {
  constructor(schoolName, customChildren=null, customId=null) {
    this.id = (customId==null) ? "S-" + School.createNewSchoolId() : customId;
    this.name = schoolName;
    this.children = (customChildren == null) ? [] : customChildren;
  }
  convertChildrenToClasses() {
    for (let i = 0; i < this.children.length; i++) {
      let conv = convertStructToClass(this.children[i]);
      this.children[i] = conv;
      this.children[i].convertChildrenToClasses();
    }
  }
  getStudents() {
    let temp = [];
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i] instanceof Student) {
        temp.push(this.children[i]);
        //console.log("<School " + this.name + ">: found student " + this.children[i].name + ", adding to array.")
      } else if (this.children[i] instanceof Section) {
        //console.log("<School " + this.name + ">: found section " + this.children[i].name + ", letting it get their students...")
        let secStds = this.children[i].getStudents();
        for (let j = 0; j < secStds.length; j++) {
          temp.push(secStds[j]);
        }
      }
    }
    return temp;
  }
  resetAllStatuses() {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i] instanceof Student) {
        this.children[i].status = NO_STATUS;
      } else if (this.children[i] instanceof Section) {
        let secStds = this.children[i].resetStatuses();
      }
    }
  }
  getStudentById(id) {
    let stds = this.getStudents();
    for (let i = 0; i < stds.length; i++) {
      if (stds[i].id == id) {
        return stds[i];
      }
    }
    return null;
  }
  static createNewSchool(name, children=null) {
    let newSchool = new School(name, children);
    schools.push(newSchool);
  }
  static createNewSchoolId() {
    let tempId = schoolIdPoint + 1;
    schoolIdPoint++;
    return tempId;
  }
}

// id: s-000000 (note the lowercase s)
class Section {
  constructor(sectionName, customChildren=null, customId=null) {
    this.id = (customId==null) ? "s-" + Section.createNewSectionId() : customId;
    this.name = sectionName;
    this.children = (customChildren == null) ? [] : customChildren;;
  }
  convertChildrenToClasses() {
    for (let i = 0; i < this.children.length; i++) {
      let conv = convertStructToClass(this.children[i]);
      this.children[i] = conv;
      this.children[i].convertChildrenToClasses();
    }
  }
  getStudents() {
    let temp = [];
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i] instanceof Student) {
        temp.push(this.children[i]);
        //console.log("<Section " + this.name + ">: found student " + this.children[i].name + ", adding to array.")
      } else if (this.children[i] instanceof Section) {
        //console.log("<Section " + this.name + ">: found section " + this.children[i].name + ", letting it get their students...");
        let secStds = this.children[i].getStudents();
        for (let j = 0; j < secStds.length; j++) {
          temp.push(secStds[j]);
        }
      }
    }
    return temp;
  }
  resetStatuses() {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i] instanceof Student) {
        this.children[i].status = NO_STATUS;
      } else if (this.children[i] instanceof Section) {
        this.children[i].resetStatuses();
      }
    }
  }
  static createNewSectionId() {
    let tempId = sectionIdPoint + 1;
    sectionIdPoint++;
    return tempId;
  }
}

// id: st-000000
class Student {
  constructor(studentName, customStatus=null, customId=null) {
    this.id = (customId==null) ? "st-" + Student.createNewStudentId() : customId;
    this.name = studentName;
    this.status = (customStatus == null) ? NO_STATUS : customStatus;
  }
  convertChildrenToClasses() {
    //There to make this easier for converting children to classes, it just activates then returns nothing.
    //This way, I don't have to go to the trouble of creating a "getTypeOfStruct()" func.
    return;
  }
  static createNewStudentId() {
    let tempId = studentIdPoint + 1;
    studentIdPoint++;
    return tempId;
  }
}

function convertStructToClass(struct) {
  let idType = struct.id.split("-")[0];
  let data = null;

  if (idType == "S") {
    data = new School(struct.name, struct.children, struct.id);
  } else if (idType == "s") {
    data = new Section(struct.name, struct.children, struct.id);
  } else if (idType == "st") {
    data = new Student(struct.name, struct.status, struct.id);
  }
  return data;
}

function convertWholeStructToClasses(struct) {
  let begin = convertStructToClass(struct);
  if (begin.children.length > 0) {
    begin.convertChildrenToClasses();
  }
  return begin;

}

let studentsToComeDown = [];


let a = new School("Test", [
  new Section("Foo", [
    new Student("Faa"),
    new Student("Fee"),
    new Section("Fuu", [
      new Student("Ahh")
    ])
  ]),
  new Student("Yaa")
]);


var schools = [
  a
  //keep blank, unless you want a test school or a hard coded school.
];

function loadSchools() {
  fs.readFile(__dirname + "/data.json", "utf-8", (err,data) => {
    if (err) throw err;

    let parsedJSON = JSON.parse(data);
    schools = [convertWholeStructToClasses(parsedJSON)];
    nl()
    nl()
    console.log("School data has been loaded, number of students: " + (schools[0].getStudents().length + "").grey.bold)

  });
}

//Load in JSON data
loadSchools();

// @Webpages

app.get('/', cors(), (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/dissmissal', cors(), (req, res) => {
  res.sendFile(__dirname + '/public/dissmissal/dissmissal.html');
});

app.get('/admin', cors(), (req, res) => {
  res.sendFile(__dirname + '/public/admin/admin.html');
});

app.get('/offline', cors(), (req, res) => {
  res.sendFile(__dirname + '/public/offline.html');
});


// @Scripts

app.get('/index.js', cors(), (req, res) => {
  res.sendFile(__dirname + '/public/index.js');
});

app.get('/dissmissal.js', cors(), (req, res) => {
  res.sendFile(__dirname + '/public/dissmissal/dissmissal.js');
});

app.get('/searchbar.js', cors(), (req, res) => {
  res.sendFile(__dirname + '/public/dissmissal/searchbar.js');
});

app.get('/admin.js', cors(), (req, res) => {
  res.sendFile(__dirname + '/public/admin/admin.js');
});

// @Images

app.get('/favicon.ico', cors(), (req, res) => {
  res.sendFile(__dirname + '/favicon.ico');
});

const DUAL = "dual-mode";
const TEXTONLY = "text-only";
const STUDENTSONLY = "students-only";
const MENU = "menu"

// io@connection
io.on('connection', function(socket) {
  //Recieving Data//

  /* recieving: type, fromId */
  /* sending: code, toId */
  socket.on('getdissmissalcode', function(data) {
    let nameOfFile = "nothing";
    if (data.type == MENU) {
      nameOfFile = "menu";
    } else if (data.type == STUDENTSONLY) {
      nameOfFile = "students";
    } else if (data.type == TEXTONLY) {
      nameOfFile = "text";
    }
    fs.readFile(__dirname + "/public/dissmissal/dissmissal-mode-code/" + nameOfFile + ".html", 'utf-8', (err, dta) => {
      if (err) throw err;
      io.sockets.emit('senddissmissalcode', {
        toId: data.fromId,
        code: dta
      });
    });
  });

  /* recieving: fromId */
  /* sending: students, toId */
  socket.on('getstudents', function(data) {
    let stds = schools[0].getStudents()
    io.sockets.emit('recievestudents', {
      toId: data.fromId,
      students: JSON.parse(JSON.stringify(stds))
    });

  });

  /* recieving: fromId */
  /* sending: students, toId */
  socket.on('getschool', function(data) {
    io.sockets.emit('recieveschool', {
      toId: data.fromId,
      school: JSON.parse(JSON.stringify(schools[0]))
    });
  });

  /* recieving: fromId, edits */
  /* sending: toId, updatedData */
  socket.on('getschoolupdate', function(data) {
    //TODO: check if edits, then do that
    if (data.edits.length > 0) {
      for (let i = 0; i < data.edits.length; i++) {
        let st = schools[0].getStudentById(data.edits[i].studentId);
        st.status = data.edits[i].updatedStatus;
        if (data.edits[i].updatedStatus == NEEDS_TO_LEAVE) {
          studentsToComeDown.push(st);
        } else if (data.edits[i].updatedStatus == COMING) {
          for (let j = 0; j < studentsToComeDown.length; j++) {
            if (studentsToComeDown[j].id == st.id) {
              studentsToComeDown.splice(j,1);
            }
          }
        }
      }
    }
    io.sockets.emit('recieveschoolupdate', {
      toId: data.fromId,
      updatedData: schools[0]
    });
  });

  /* recieving: <nothing> */
  /* sending: <nothing> */
  socket.on('resetstatuses', function(data) {
    console.log("All student statuses have been reset.")
    schools[0].resetAllStatuses();
    studentsToComeDown = [];
  });

});

let textupdateInterval = setInterval(function() {
  io.sockets.emit('recievetextupdate', {
    textupdate: JSON.parse(JSON.stringify(studentsToComeDown))
  });
}, 1000);

function nl() {
  console.log("")
}


const PORT = 3000;

server.listen(PORT, () => {
  console.clear();
  nl()
  nl()
  console.log(('Starting server on port ' + PORT).green);
  console.log('If this is started locally, go to ' + ('https://localhost:' + PORT).magenta);
  console.log('Program made by ' + 'jaideng'.yellow + '.');
  console.log('(' + 'https://jaideng1.github.io'.blue + ')')
});


var lastNum = -1;
var updateConsole = true;
let didFirstUpdate = false

setInterval(function() {
  if (didFirstUpdate && !updateConsole) {
    return;
  }
  if (studentsToComeDown > lastNum) {
    didFirstUpdate = true;
    console.clear();
    nl()
    nl()
    console.log(('Starting server on port ' + PORT).green);
    console.log('If this is started locally, go to ' + ('https://localhost:' + PORT).magenta);
    console.log('Program made by ' + 'jaideng'.yellow + '.');
    console.log('(' + 'https://jaideng1.github.io'.blue + ')')
    nl()
    nl()
    console.log("School data has been loaded, number of students: " + (schools[0].getStudents().length + "").grey.bold)
    nl()
    nl()
    let ns = "Number of students that need to come down: " + (studentsToComeDown.length + "").red.bold;
    if (!updateConsole) {
      ns = "Console Updating has been turned off. You can re-enable it by *enter method*";
    }
    console.log(ns);
  }

}, 1000)
