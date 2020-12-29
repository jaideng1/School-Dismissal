var socket = io();

const MANUAL_UPDATE = false;

var chrz = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","1","2","3","4","5","6","7","8","9","0"];

//Modes
const DUAL = "dual-mode";
const TEXTONLY = "text-only";
const STUDENTSONLY = "students-only";
const MENU = "menu"

const NO_STATUS = "Student has not been called yet.";
const NEEDS_TO_LEAVE = "Student needs to come down!";
const COMING = "Student is coming down!";

var mode = MENU;

var mainContent = document.getElementById("main-content");

var id = createId(10);
var waitingForResponse = false;

var updateIntervalSO = null;
var updateTimeoutsSO = [];
var startedInterval = false;
var updateTime = 0;

function toMode(ntype) {
  switch (ntype) {
    case 0:
      mode = DUAL;
      break;
    case 1:
      mode = STUDENTSONLY;
      if (!startedInterval) {
        updateIntervalSO = setInterval(function() {
          if (mode == STUDENTSONLY) {
            updateSection();
            //let d = new Date(new Date().getTime() + 5000);
            document.getElementById("nextupdate").textContent = "Updating...";
            updateTime = 0;
            for (let i = 0; i < 4; i++) {
              updateTimeoutsSO.push(setTimeout(function() {
                if (mode == STUDENTSONLY) {
                  updateTime++;
                  document.getElementById("nextupdate").textContent = "Next Update: " + (5 - updateTime) + " Seconds";

                }
              }, (i + 1) * 1000));
            }
            updateTimeoutsSO.push(setTimeout(function() {
              updateTimeoutsSO = [];
            }, 4500))
          }
        }, 5000);
        updateTime = 0;
        startedInterval = true;
      }

      break;
    case 2:
      mode = TEXTONLY;
      break;
    case 3:
      mode = MENU;
      break;
    default:
      return;
  }
  if (ntype >= 0 && ntype <= 2) {
    document.location.href = "#";
  }
  updatePage();
}

function cancelStudentOnlyTimers() {
  //for some reason doesn't work????
  clearInterval(updateById);
  for (let i = 0; i < updateTimeoutsSO.length; i++) {
    clearTimeout(updateTimeoutsSO[i]);
  }
  updateTimeoutsSO = [];
}

let schoolData = {};

function updatePage() {
  waitingForResponse = true;
  if (mode == MENU || mode == STUDENTSONLY || mode == DUAL || mode == TEXTONLY) {
    socket.emit('getdissmissalcode', {
      fromId: id,
      type: mode
    });
  } else {
    waitingForResponse = false;
  }
  if (mode == STUDENTSONLY) {
    setTimeout(function() {
      setupSearchbar();
    }, 100);
  }
  socket.emit('getschool', {
    fromId: id
  });

}

socket.on('senddissmissalcode', function(data) {
  if (waitingForResponse) {
    if (data.toId == id) {
      mainContent.innerHTML = data.code;
      waitingForResponse = false;
    }
  }

});


function goBackASection() {
  if (mode == STUDENTSONLY) {
    if (currentDirectory.length > 1) {
      currentDirectory.pop();
      let cdid = null;
      let tracker = schoolData;
      for (let i = 0; i < currentDirectory.length; i++) {
        tracker = tracker.children[currentDirectory[i]];
      }
      try {
        cdid = tracker.id;
      } catch (e) {
        cdid = schoolData.id;
        currentDirectory = [0];
      }
      currentDirectory.pop();
      openShownSection((cdid == null) ? "1" : cdid);
    } else if (currentDirectory.length == 1) {
      socket.emit('getschool', {
        fromId: id
      });
    } else {
      toMode(3);
    }
  }
  if (mode == TEXTONLY) {
    toMode(3);
  }
}

var typeofUpdater = NEEDS_TO_LEAVE; //TODO: make a thing that allows you to change it

function switchUpdater() {
  if (mode == STUDENTSONLY) {
    if (typeofUpdater == NEEDS_TO_LEAVE) {
      typeofUpdater = COMING;
    } else if (typeofUpdater == COMING) {
      typeofUpdater = NEEDS_TO_LEAVE;
    }
    document.getElementById("typeoftoggletext").textContent = 'Set to set students\' statuses to "' + typeofUpdater + '"';
  }
}

function updateById(stid) {
  let sure = confirm("Are you sure? OK for yes, CANCEL for no.");
  if (!sure) {
    return;
  }
  updateSection([{
    studentId: stid,
    updatedStatus: typeofUpdater
  }]);
}

function updateSection(edits=null) {
  //for an edit, send:
  /*
  {
    studentId: X,
    updatedStatus: X
  }
  */
  socket.emit('getschoolupdate', {
    fromId: id,
    edits: (edits == null) ? [] : edits
  })
}

socket.on('recieveschoolupdate', function(data) {
  if (data.toId == id) {
    schoolData = data.updatedData;
    try {setUpSearchTerms();} catch(ignored) {}
    currentDirectory.push(999);
    goBackASection();
  }

});

let studenttexts = [];

socket.on('recievetextupdate', function(data) {
  if (mode == TEXTONLY) {
    studenttexts = data.textupdate;
    let editedtexts = [];
    for (let j = 0; j < studenttexts.length; j++) {
      let addit = true;
      for (let k = 0; k < editedtexts.length; k++) {
        if (editedtexts[k].name == studenttexts[j].name) {
          editedtexts[k].amount += 1;
          addit = false;
        }
      }
      if (addit) {
        editedtexts.push({
          name: studenttexts[j].name,
          amount: 1
        })
      }

    }
    let addhtml = (studenttexts.length == 0) ? "Waiting for students to be called..." : "";
    if (editedtexts.length > 1) {
      editedtexts.sort((a,b) => {return b.amount-a.amount;})
    }
    for (let i = 0; i < editedtexts.length; i++) {
      let style = "lighter";
      if (editedtexts[i].amount == 2) {
        style = "bold";
      } else if (editedtexts[i].amount > 3) {
        style = "bolder";
      }
      addhtml += "<span style=\"font-weight: " + style +";\">" + editedtexts[i].name + "</span><br/>"
    }
    try {
      document.getElementById("text").innerHTML = addhtml;
    } catch (unused) {}

  }
});

function openShownSection(id) {
  if (mode == STUDENTSONLY) {
    let dir = schoolData;
    for (let i = 0; i < currentDirectory.length; i++) {
      dir = dir.children[currentDirectory[i]];
    }
    for (let j = 0; j < dir.children.length; j++) {
      if (dir.children[j].id == id) {
        //TODO: Make an update to the school data
        let studts = document.getElementById("students");
        studts.innerHTML = "";
        for (let k = 0; k < dir.children[j].children.length; k += 3) {
          //// TODO: Make it change based off of student or section
          let dc = dir.children[j].children;
          let sa = "";
          let style = "";
          if (k < dc.length) {
            if (dc[k].id.split("-")[0] == "st") {
              switch (dc[k].status) {
                case COMING:
                  style = "background-color: rgba(109, 162, 247, 150);";
                  break;
                case NEEDS_TO_LEAVE:
                  style = "background-color: rgba(237, 85, 116, 150);";
              }

            }
          }
          sa += "<div class=\"row boxrow\">"
          sa +=   "<div class=\"col-sm box\" style=\"" + style + "\" type=\"button\" onclick=\"" + ((k < dc.length) ? ((dc[k].id.split("-")[0] == "s") ? ("openShownSection('" + dc[k].id + "')") : "updateById('" + dc[k].id + "')") : "") + "\">"
          sa +=     "<br/>"
          sa +=     "<h5>" + ((k < dc.length) ? dc[k].name : "") + "</h5>"
          sa +=     "<p>" + ((k < dc.length) ? ((dc[k].id.split("-")[0] == "st") ? dc[k].status : "<i>Click on me to open the section...</i>") : "") + "</p>"
          sa +=     "<br/>"
          sa +=   "</div>"
          style = "";
          if (k + 1 < dc.length) {
            if (dc[k + 1].id.split("-")[0] == "st") {
              switch (dc[k + 1].status) {
                case COMING:
                  style = "background-color: rgba(109, 162, 247, 150);";
                  break;
                case NEEDS_TO_LEAVE:
                  style = "background-color: rgba(237, 85, 116, 150);";
              }

            }
          }
          sa +=   "<div class=\"col-sm box\" style=\"" + style + "\" type=\"button\" onclick=\"" + ((k + 1 < dc.length) ? ((dc[k + 1].id.split("-")[0] == "s") ? ("openShownSection('" + dc[k + 1].id + "')") : "updateById('" + dc[k + 1].id + "')") : "") + "\">"
          sa +=     "<br/>"
          sa +=     "<h5>" + ((k + 1 < dc.length) ? dc[k + 1].name : "") + "</h5>"
          sa +=     "<p>" + ((k + 1 < dc.length) ? ((dc[k + 1].id.split("-")[0] == "st") ? dc[k + 1].status : "<i>Click on me to open the section...</i>") : "") + "</p>"
          sa +=     "<br/>"
          sa +=   "</div>"
          style = "";
          if (k + 2 < dc.length) {
            if (dc[k + 2].id.split("-")[0] == "st") {
              switch (dc[k + 2].status) {
                case COMING:
                  style = "background-color: rgba(109, 162, 247, 150);";
                  break;
                case NEEDS_TO_LEAVE:
                  style = "background-color: rgba(237, 85, 116, 150);";
              }

            }
          }
          sa +=   "<div class=\"col-sm box\" style=\"" + style + "\" type=\"button\" onclick=\"" + ((k + 2 < dc.length) ? ((dc[k + 2].id.split("-")[0] == "s") ? ("openShownSection('" + dc[k + 2].id + "')") : "updateById('" + dc[k + 2].id + "')") : "") + "\">"
          sa +=     "<br/>"
          sa +=     "<h5>" + ((k + 2 < dc.length) ? dc[k + 2].name : "") + "</h5>"
          sa +=     "<p>" + ((k + 2 < dc.length) ? ((dc[k + 2].id.split("-")[0] == "st") ? dc[k + 2].status : "<i>Click on me to open the section...</i>") : "") + "</p>"
          sa +=     "<br/>"
          sa +=   "</div>"
          sa += "</div>";
          studts.innerHTML += sa;
        }
        currentDirectory.push(j);
        break;
      }
    }
  }

}

var currentDirectory = [];

socket.on('recieveschool', function(data) {
  setTimeout(function() {
    schoolData = data.school;
    if (mode == STUDENTSONLY) {
      let studts = document.getElementById("students");
      currentDirectory = [];
      studts.innerHTML = "";
      for (let i = 0; i < schoolData.children.length; i += 3) {
        //// TODO: Make it change based off of student or section
        let sa = "";
        sa += "<div class=\"row boxrow\">"
        sa +=   "<div class=\"col-sm box\" type=\"button\" onclick=\"" + ((i < schoolData.children.length) ? ((schoolData.children[i].id.split("-")[0] == "s") ? ("openShownSection('" + schoolData.children[i].id + "')") : "updateById('" + dc[k].id + "')") : "") + "\">"
        sa +=     "<br/>"
        sa +=     "<h5>" + ((i < schoolData.children.length) ? schoolData.children[i].name : "") + "</h5>"
        sa +=     "<p>" + ((i < schoolData.children.length) ? ((schoolData.children[i].id.split("-")[0] == "st") ? schoolData.children[i].status : "<i>Click on me to open the section...</i>") : "") + "</p>"
        sa +=     "<br/>"
        sa +=   "</div>"
        sa +=   "<div class=\"col-sm box\" type=\"button\" onclick=\"" + ((i + 1 < schoolData.children.length) ? ((schoolData.children[i + 1].id.split("-")[0] == "s") ? ("openShownSection('" + schoolData.children[i + 1].id + "')") : "updateById('" + dc[k + 1].id + "')") : "") + "\">"
        sa +=     "<br/>"
        sa +=     "<h5>" + ((i + 1 < schoolData.children.length) ? schoolData.children[i + 1].name : "") + "</h5>"
        sa +=     "<p>" + ((i + 1 < schoolData.children.length) ? ((schoolData.children[i + 1].id.split("-")[0] == "st") ? schoolData.children[i + 1].status : "<i>Click on me to open the section...</i>") : "") + "</p>"
        sa +=     "<br/>"
        sa +=   "</div>"
        sa +=   "<div class=\"col-sm box\" type=\"button\" onclick=\"" + ((i + 2 < schoolData.children.length) ? ((schoolData.children[i + 2].id.split("-")[0] == "s") ? ("openShownSection('" + schoolData.children[i + 2].id + "')") : "updateById('" + dc[k + 2].id + "')") : "") + "\">"
        sa +=     "<br/>"
        sa +=     "<h5>" + ((i + 2 < schoolData.children.length) ? schoolData.children[i + 2].name : "") + "</h5>"
        sa +=     "<p>" + ((i + 2 < schoolData.children.length) ? ((schoolData.children[i + 2].id.split("-")[0] == "st") ? schoolData.children[i + 2].status : "<i>Click on me to open the section...</i>") : "") + "</p>"
        sa +=     "<br/>"
        sa +=   "</div>"
        sa += "</div>";
        studts.innerHTML += sa;
      }
    }
  }, 50);

});

function createId(length) {
  let temp = "";
  for (let i = 0; i < length; i++) {
    temp += chrz[Math.floor(Math.random() * chrz.length)];
  }
  return temp;
}

var errorCount = 0;
//If errorCount == 100, there's probally a issue with socket.io, so my computer is most likely off.
//So it fixes this by changing the page to /offline
window.onerror = function (msg, url, lineNo, columnNo, error) {
  // ... handle error ...
  errorCount++;
  if (errorCount > 49) {
    document.location.href = "/offline";
  }
  return false;
}

if (!MANUAL_UPDATE) {
  updatePage();
}
