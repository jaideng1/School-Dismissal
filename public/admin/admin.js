var socket = io();

let selectedStudent = null;
let id = "";


function selectStudentPrompt() {
  let selectstud = null;
  if (selectedStudent != null) {
    let con = confirm("Do you want to use the selected student? (" + selectedStudent.name + ", ID: " + selectedStudent.id + ")");
    if (con) {
      selectstud = selectedStudent;
    }
  } else {
    let newsl = prompt("Enter ID of student that you want to select. Press the button without anything in the textbar to exit.")
    if (newsl.length > 0) {

    }
  }
  return selectstud;
}

let updateafter = null;

function updateStudents(afterFunc=null) {
  socket.emit()
  updateafter = afterfunc;
}


function resetAllStatuses() {
  //resetstatuses
  socket.emit('resetstatuses', {});
}



socket.on('recievestudents', function(data) {
  if (data.toId == id) {

    if (updateafter != null) {
      updateafter();
    }

  }


});

function resetSpecificStatus() {

}
