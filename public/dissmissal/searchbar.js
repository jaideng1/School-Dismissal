// Source: jaideng1.github.io, or https://github.com/jaideng1/jaideng1.github.io/blob/master/searchbar.js
// by jaideng (me)

var searchbar = document.getElementById("searchbar");
var searchbarResults = document.getElementById("search-results");

function setupSearchbar() {
  searchbar = document.getElementById("searchbar");
  searchbarResults = document.getElementById("search-results");

  searchbar.addEventListener('input', searchBarUpdate);
  // searchbar.addEventListener('keyup', goToSearchTab);
  searchbar.addEventListener('click', onSearchbarClick);
  searchbar.addEventListener('mouseenter', onMouseOverSearchbar);
  searchbar.addEventListener('mouseleave', onMouseLeaveSearchbar);
  document.body.addEventListener('click', onBodyClick);

  setUpSearchTerms();
}


var hasBeenBigger = false;

function searchBarUpdate(e) {
  checkElements(searchbar.value.toLowerCase())
}


var searchTerms = [];

function setUpSearchTerms() {
  socket.emit('getstudents', { //// TODO: specify which school, ect
    fromId: id
  });
}


socket.on('recievestudents', function(data) {
  if (data.toId == id) {
    searchTerms = data.students;
  }
});



function checkElements(search) {
  if (search.length > 0) {
    let results = [];
    for (let i = 0; i < searchTerms.length; i++) {
      let keywords = search.split(" ");
      for (let n = 0; n < keywords.length; n++) {
        if (keywords[n].length < 1) keywords.splice(n, 1);
      }
      for (let j = 0; j < keywords.length; j++) {
        let accuracyTracker = 0;
        if (searchTerms[i].name.toLowerCase().includes(keywords[j])) {
          //accuracyTracker += 100 / keywords.length;
          results.push(searchTerms[i]);
          break;
        }
        // if (accuracyTracker > 7) {
        //   results.push({
        //     name: searchTerms[i].name,
        //     accuracy: accuracyTracker
        //   });
        // }


      }
      //results.sort(function(a, b){return b.accuracy-a.accuracy});
    }
    let htmlResults = "";
    for (let k = 0; k < results.length; k++) {
      let styl = '';
      if (results[k].status == NEEDS_TO_LEAVE) {
        styl = 'background-color: rgba(237, 85, 116, 150);';
      } else if (results[k].status == COMING) {
        styl = 'background-color: rgba(109, 162, 247, 150);'
      }
      htmlResults += '<div style="' + styl + '" onclick="onSearchTermClick(\'' + results[k].id + '\')"><span>' + results[k].name + "</span></div>";
    }
    if (results.length == 0) {
      htmlResults += "<div><span><i>No Results Found...</i></span></div>"
    }
    document.getElementById("search-results").innerHTML = htmlResults;

  } else {
    document.getElementById("search-results").innerHTML = "";
  }
}

// function goToSearchTab(e) {
//   if (e.keyCode === 13) {
//     document.location.href = "/search.html";
//   }
// }

let overSearchbar = false;
let searchbarActive = false;

function onMouseOverSearchbar(e) {
  overSearchbar = true;
}

function onMouseLeaveSearchbar(e) {
  overSearchbar = false;
}

function onSearchbarClick(e) {
  let search = searchbar.value;
  checkElements(search);
}

function onSearchTermClick(searchTermId) {
  for (let stud of searchTerms) {
    if (stud.id == searchTermId) {
      updateById(stud.id);
      setUpSearchTerms();
    }
  }
}

function onBodyClick(e) {
  try {
    if (!overSearchbar) {
      document.getElementById("search-results").innerHTML = "";
    }
  } catch (ignored) {}

}
