const setGoals = (goal) => {
  chrome.storage.sync.get(['goals'], (result) => {
    const goalObj = { goals: [] };
    if (result.goals) {
      if (result.goals.length === 3) result.goals.shift();
      goalObj.goals = [...result.goals, goal];
    }
    chrome.storage.sync.set(goalObj, () => {
      displayGoals();
    });
  });
};

const displayGoals = () => {
  // Reset Data
  // chrome.storage.sync.set({ goals: [], appState: "" });
  chrome.storage.sync.get(['goals', 'activeIndex', 'appState'], result => {
    const goalsList = $("#goals-list");
    console.log(result.appState);
    if (result.appState === "completed") {
      chrome.storage.sync.set({ goals: [], appState: "recess" }, () => {
        displayGoals();
      });
    }

    let areAllGoalsComplete = true;

    result.goals.forEach(({ goalMsg, goalTime }, i) => {
      if (goalTime > 0) {
        areAllGoalsComplete = false;
      }
      
      goalsList.append(`
      <li id="goal-msg${i}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
        ${goalMsg}
        <span id="goal-time${i}" class="badge badge-primary badge-pill">${goalTime}</span>
      </li>
      `);
    });

    if (areAllGoalsComplete && (result.goals.length > 1)) {
      chrome.storage.sync.set({appState: "completed"});
      chrome.storage.sync.set({ goals: [], appState: "recess" })
      $('.list-group').empty();
      $('#goal-running').innerHTML = "YOU JUST GOT ZONED!!!";
      $('.input-group').append($('#goal-text'));
      $('.input-group').append($('.input-group-append'));
      
      displayGoals();
    }

    if (result.appState === "started") {
      $('#goal-running').detach();
      $('#start-day').detach();
      $('.input-group').append(`<div id="goal-running" class="alert alert-primary" role="alert">
      You have started on your goals for the day!!!
      </div>`);
      $('.input-group-append').detach();
      $('#goal-text').detach();
    }
    else {
      if (result.goals.length == 3 && result.appState !== "started") {
        chrome.storage.sync.set({appState: "stated"});
        $('.input-group-append').detach();
        $('#goal-text').detach();
        $('#goal-running').detach();
        $('.input-group').append('<button id="start-day" type="button" class="btn center btn-primary btn-large">Start Day</button>');
      } else if (result.goals.length < 3) {
        $('#start-day').detach();
        $('#goal-running').detach();
        $('.input-group').append($('#goal-text'));
        $('.input-group').append($('.input-group-append'));
      }
    }
  });
};

$( document ).ready(function() {
  const goalText = $("#goal-text");
  const time = $("#time");
  const saveGoalBtn = $("#save-goal");
  const goalsList = $("#goals-list");
  const listItem = $(".list-group-item");
  const breakActions = $('#break-actions');
  breakActions.hide();

  displayGoals();

  saveGoalBtn.click(e => {
    e.preventDefault();
    const goalMsg = goalText.val();
    const goalTime = $("#time").val();
    if (!goalMsg && goalMsg.trim() === "") return;
    setGoals({ goalMsg, goalTime });
    $(".list-group-item").remove();
    goalText.val("");
  });

  $( document ).click(e => {
    e.preventDefault();
    let targetElemID = e.target.id;
    if (targetElemID === "start-day") {
      chrome.storage.sync.set({appState: "started"});
      chrome.alarms.create("aminutepassedby", { delayInMinutes: 0 });
      $("#start-day").detach();
      $('.input-group').append(`<div id="goal-running" class="alert alert-primary" role="alert">
        You have started on your goals for the day!!!
      </div>`);
    }
  });

  chrome.alarms.onAlarm.addListener(alarm => {
    console.log(alarm.name);
    if (alarm.name == "goalTimeUp") {
      console.log("Goal Time up");
      console.log("show popup");
      chrome.storage.sync.set({appState: "recess"});
      chrome.alarms.create("recessStarted", { when: Date.now() });
    }

    if (alarm.name == "recessStarted") {
      showBreakActions();
      chrome.alarms.create("recessTimeUp", { delayInMinutes: 2 });
    } 
  
    if (alarm.name == "aminutepassedby") {
      console.log("aminutepassed");
      let areAllGoalsComplete = false;
      chrome.storage.sync.get(['goals'], ({goals}) => {
        goals.forEach((goal, i) => {
          if (areAllGoalsComplete) {
            chrome.storage.sync.set({appState: "completed"});
          }
          else {
            areAllGoalsComplete = true;
            if (goal.goalTime == 0) {
            chrome.alarms.create("goalTimeUp", { when: Date.now() });
          } else {
            areAllGoalsComplete = false;
            goal.goalTime -= 1;
          }}
        });
  
        chrome.storage.sync.set({ goals: goals }, () => {
          $(".list-group").empty();
          $(".list-group-item").remove();
          displayGoals();
        });
      });
    }
  
    if (alarm.name === "recessTimeUp") {
      $('.input-group').show();
      $('.list-group').show();
      $('#breack-actions').hide();
      chrome.storage.sync.set({appState: ""});
    }
  });

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
      var storageChange = changes[key];
      if (storageChange.newValue == "completed") {
        chrome.notifications.create('goalCompleted', {
          type: 'basic',
          iconUrl: '../../icons/image.png',
          title: 'Goal Completed!',
          message: 'You have completed your goals!'
       }, function(notificationId) {});
      //  chrome.notifications.create("goalCompleted", {message: "Goal Completed!"})
      }

      if (storageChange.newValue == "recess") {
        showBreakActions();
      }
    }
  });
});

// Break_Actions

const showBreakActions = () => {
  $('.input-group').hide();
  $('.list-group').hide();
  $('#break-actions').show();
  $('#break-actions').css("display", "block");
  var btn = document.getElementById('meditate');
  btn.addEventListener('click', function() {
      window.open("https://www.youtube.com/watch?v=8v45WSuAeYI");
  });

  var yoga = document.getElementById('yoga');
  yoga.addEventListener('click', function() {
      window.open("https://www.youtube.com/watch?v=fNN84pjAwYM");
  });

  var box = document.getElementById('box');
  box.addEventListener('click', function() {
      window.open("https://www.youtube.com/watch?v=xy4TsszEKIU");
  });


  var laugh = document.getElementById('laugh');
  laugh.addEventListener('click', function(){
      const dadUrl = "https://icanhazdadjoke.com/";
      let request = new Request(dadUrl, {
          headers: new Headers({
              'Accept': 'text/plain'
          })
      });
  
      let dadText =
      fetch(request)
          .then(
              response => response.text()
          ).then(
              text =>
              console.log(text)
          );
  });
};