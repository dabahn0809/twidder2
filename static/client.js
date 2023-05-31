
window.onload = function () {
  let currentView = localStorage.getItem("currentView");
  if (!currentView) {
    currentView = "welcomeview";
  }
  if (currentView === "profileview") {
    const savedToken = localStorage.getItem("savetoken");
    if (savedToken) {
      displayProfile();
      displayPersonalInformation(savedToken);
    } else {
      currentView = "welcomeview";
    }
  }
  if (currentView === "browseview") {
    const savedToken = localStorage.getItem("savetoken");
    displayProfile();
    displayPersonalInformation(savedToken);
    document.querySelector(".boxbrowse").style.display = "block";
    document.querySelector(".boxhome").style.display = "none";
    document.querySelector(".boxaccount").style.display = "none";
    localStorage.setItem("currentView", "browseview");
  }

  if (currentView === "accountview") {
    const savedToken = localStorage.getItem("savetoken");
    displayProfile();
    displayPersonalInformation(savedToken);
    document.querySelector(".boxbrowse").style.display = "none";
    document.querySelector(".boxhome").style.display = "none";
    document.querySelector(".boxaccount").style.display = "block";
    localStorage.setItem("currentView", "accountview");
  }

  if (currentView === "welcomeview") {
    displayWelcome();
  }
};

function displayWelcome() {
  const body = document.getElementById("body");
  const welcomeview = document.getElementById("welcomeview");
  body.innerHTML = welcomeview.innerHTML;
  localStorage.setItem("currentView", "welcomeview");
}

function displayProfile() {
  const body = document.getElementById("body");
  const profileview = document.getElementById("profileview");
  body.innerHTML = profileview.innerHTML;
  localStorage.setItem("currentView", "profileview");
}

function signUp() {
  const password1 = document.getElementById("signuppasswordfield").value;
  const password2 = document.getElementById("signuprepeatpswfield").value;
  if (password1 == password2) {
    const inputObject = {
      email: document.getElementById("signupemailfield").value,
      password: document.getElementById("signuppasswordfield").value,
      firstname: document.getElementById("signupfirstnamefield").value,
      familyname: document.getElementById("signupfamilynamefield").value,
      gender: document.getElementById("signupgenderfield").value,
      city: document.getElementById("signupcityfield").value,
      country: document.getElementById("signupcountryfield").value
    };
    const req = new XMLHttpRequest();
    req.open("POST", "/sign_up", true);
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    req.onload = function () {
      const response = JSON.parse(req.responseText);
      document.getElementById("signuphere").innerHTML = response.message;
      document.getElementById("differentpw").innerHTML = "";
    }
    req.send(JSON.stringify(inputObject));
  }
  else {
    document.getElementById("differentpw").innerHTML = "No pw match";
  }
};

function signIn() {
  const email = document.getElementById("loginemailfield").value;
  const password = document.getElementById("loginpasswordfield").value;
  const inputObject = {
    email: email,
    password: password,
  };
  const req = new XMLHttpRequest();
  req.open("POST", "/sign_in", true);
  req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  req.onload = function () {
    const response = JSON.parse(req.responseText);
    if (response.success === true) {
      const savetoken = response.access_token;
      localStorage.setItem("savetoken", savetoken);
      displayProfile();
      displayPersonalInformation();
    } else {
      document.getElementById("loginspace").innerHTML = response.error;
    }
  };
  req.send(JSON.stringify(inputObject));
  return false;

};

function displayPersonalInformation() {
  const savedToken = localStorage.getItem("savetoken");
  const req = new XMLHttpRequest();
  req.open("GET", "/get_user_data_by_token", true);
  req.setRequestHeader("Authorization", savedToken);
  req.onload = function () {
    const response = JSON.parse(req.responseText);
    if (response.message === "Token is not threre or invalid") {
      document.getElementById("loginspace").innerHTML = "User is not signed in";
      return;
    }
    document.getElementById("homeviewdatafirstnamefield").innerHTML = response.firstname;
    document.getElementById("homeviewdatafamilynamefield").innerHTML = response.familyname;
    document.getElementById("homeviewdatagenderfield").innerHTML = response.gender;
    document.getElementById("homeviewdatacityfield").innerHTML = response.city;
    document.getElementById("homeviewdatacountryfield").innerHTML = response.country;
    document.getElementById("homeviewdataemailfield").innerHTML = response.email;
  };
  req.send();
}

function callbrowsePersonalInformation() {
  browsePersonalInformation();
}

function browsePersonalInformation() {
  const savedToken = localStorage.getItem("savetoken");
  const filteredemails = document.getElementById("browseviewreloadsearchfield").value;
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/get_user_data_by_email/${filteredemails}`);
  xhr.setRequestHeader("Authorization", savedToken);
  xhr.onreadystatechange = function () {
    const response = JSON.parse(xhr.responseText);
    if (response.success) {
      document.getElementById("browseviewdatafirstnamefield").innerHTML = response.data.firstname;
      document.getElementById("browseviewdatafamilynamefield").innerHTML = response.data.familyname;
      document.getElementById("browseviewdatagenderfield").innerHTML = response.data.gender;
      document.getElementById("browseviewdatacityfield").innerHTML = response.data.city;
      document.getElementById("browseviewdatacountryfield").innerHTML = response.data.country;
      document.getElementById("browseviewdataemailfield").innerHTML = response.data.email;
      document.getElementById("browseviewreloadsearchlabel").innerHTML = response.message;
    } else {
      document.getElementById("browseviewdatafirstnamefield").innerHTML = "";
      document.getElementById("browseviewdatafamilynamefield").innerHTML = "";
      document.getElementById("browseviewdatagenderfield").innerHTML = "";
      document.getElementById("browseviewdatacityfield").innerHTML = "";
      document.getElementById("browseviewdatacountryfield").innerHTML = "";
      document.getElementById("browseviewdataemailfield").innerHTML = "";
      document.getElementById("browseviewownwallshow").innerHTML = "";
      document.getElementById("browseviewreloadsearchlabel").innerHTML = response.message;
    }
  };
  xhr.send();
}

function callpostOnWall() {
  postOnWall();
}

function postOnWall() {
  const ownwallpost = document.getElementById("homeviewownwallpost");
  const ownwallshow = document.getElementById("homeviewownwallshow");
  const wallcontent = ownwallpost.value;
  const savedToken = localStorage.getItem("savetoken");
  
  // Get user's location using HTML5 geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    console.log("Geolocation is not supported by this browser.");
    postMessage();
  }

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    // Use Geocode.xyz API to get the user's location details
    const geocodeUrl = `https://geocode.xyz/${latitude},${longitude}?json=1`;
    const geocodeReq = new XMLHttpRequest();
    geocodeReq.open("GET", geocodeUrl, true);
    geocodeReq.onload = function () {
      const geocodeData = JSON.parse(geocodeReq.responseText);
      const location = `${geocodeData.city}, ${geocodeData.country}`;
      
      postMessage(location);
    };
    geocodeReq.send();
  }

  function error() {
    console.log("Unable to retrieve your location.");
    postMessage();
  }

  function postMessage(location = "") {
    const req = new XMLHttpRequest();
    req.open("GET", "/get_user_data_by_token", true);
    req.setRequestHeader("Authorization", savedToken);
    req.onload = function () {
      const response = JSON.parse(req.responseText);
      const emailme = response.email;
      if (wallcontent.trim() !== "") {
        const postReq = new XMLHttpRequest();
        postReq.open("POST", "/post_message", true);
        postReq.setRequestHeader("Content-Type", "application/json");
        postReq.setRequestHeader("Authorization", savedToken);
        postReq.onload = function () {
          ownwallshow.innerHTML = emailme + ": " + wallcontent + " (" + location + ") " + "<br>" + ownwallshow.innerHTML;
          document.getElementById("homeviewownwallpost").value = " ";
          const numofmessages = ownwallshow.getElementsByTagName("br").length;
          if (numofmessages > 7) {
            ownwallshow.innerHTML = ownwallshow.innerHTML.substring(0, ownwallshow.innerHTML.lastIndexOf("<br>"));
          }
        };
        postReq.send(JSON.stringify({ "message": wallcontent + " (" + location + ") ", "email": emailme }));
      }
    };
    req.send();
  }
}


function callpostOnSelectedWall() {
  postOnSelectedWall();
}

function postOnSelectedWall() {
  const savedToken = localStorage.getItem("savetoken");
  const ownwallpost = document.getElementById("browseviewownwallpost");
  const ownwallshow = document.getElementById("browseviewownwallshow");
  const emailhim = document.getElementById("browseviewreloadsearchfield").value;
  const wallcontent = ownwallpost.value;

  // Get user's location using HTML5 geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    console.log("Geolocation is not supported by this browser.");
    postMessage();
  }

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Use Geocode.xyz API to get the user's location details
    const geocodeUrl = `https://geocode.xyz/${latitude},${longitude}?json=1`;
    const geocodeReq = new XMLHttpRequest();
    geocodeReq.open("GET", geocodeUrl, true);
    geocodeReq.onload = function () {
      const geocodeData = JSON.parse(geocodeReq.responseText);
      const location = `${geocodeData.city}, ${geocodeData.country}`;

      postMessage(location);
    };
    geocodeReq.send();
  }

  function error() {
    console.log("Unable to retrieve your location.");
    postMessage();
  }

  function postMessage(location = "") {
    const req = new XMLHttpRequest();
    req.open("GET", "/get_user_data_by_token", true);
    req.setRequestHeader("Authorization", savedToken);
    req.onload = function () {
      const response = JSON.parse(req.responseText);
      const emailme = response.email;
      if (wallcontent.trim() !== "") {
        const postReq = new XMLHttpRequest();
        postReq.open("POST", "/post_message", true);
        postReq.setRequestHeader("Content-Type", "application/json");
        postReq.setRequestHeader("Authorization", savedToken);
        postReq.onload = function () {
          ownwallshow.innerHTML = emailme + ": " + wallcontent + " (" + location + ") " + "<br>" + ownwallshow.innerHTML;
          document.getElementById("browseviewownwallpost").value = "";
          const numofmessages = ownwallshow.getElementsByTagName("br").length;
          if (numofmessages > 7) {
            ownwallshow.innerHTML = ownwallshow.innerHTML.substring(0, ownwallshow.innerHTML.lastIndexOf("<br>"));
          }
        };
        postReq.send(JSON.stringify({ "message": wallcontent + " (" + location + ") ", "email": emailhim }));
      }
    };
    req.send();
  }
}


function callreloadownwall() {
  reloadownwall();
}

function reloadownwall() {
  const savedToken = localStorage.getItem("savetoken");
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/get_user_messages_by_token", true);
  xhttp.setRequestHeader("Authorization", savedToken);
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const messages = JSON.parse(this.responseText).messages;
      messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recentMessages = messages.slice(0, 7);
      let messagesstring = "";
      for (let i = 0; i < recentMessages.length; i++) {
        messagesstring += recentMessages[i].sender_email + ": " + recentMessages[i].message + "<br>";
      }
      document.getElementById("homeviewownwallshow").innerHTML = messagesstring;
    }
  };
  xhttp.send();
};


function callreloadselectedwall() {
  reloadselectedwall();
}

function reloadselectedwall() {
  const searchLabel = document.getElementById("browseviewreloadsearchlabel").innerHTML;

  if (searchLabel === "User data retrieved successfully") {
    const savedToken = localStorage.getItem("savetoken");
    const emailhim = document.getElementById("browseviewreloadsearchfield").value;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/get_user_messages_by_email/${emailhim}`, true);
    xhr.setRequestHeader("Authorization", savedToken);
    xhr.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        const response = JSON.parse(this.responseText);
        if (response.messages) {
          const messages = response.messages;
          messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          const recentMessages = messages.slice(0, 7);
          let messagesstring = "";

          for (let i = 0; i < recentMessages.length; i++) {
            messagesstring += recentMessages[i].sender_email + ": " + recentMessages[i].message + "<br>";
          }

          document.getElementById("browseviewownwallshow").innerHTML = messagesstring;
        }
      }
    };

    xhr.send();
  }
}

function callcheckPasswordsMatch() {
  checkPasswordsMatch();
}

function checkPasswordsMatch() {
  const oldpassword = document.getElementById("accountviewoldpwfield").value;
  const password1 = document.getElementById("accountviewnewpwfield").value;
  const password2 = document.getElementById("accountviewreppwfield").value;
  const error = document.getElementById("accountviewsubmiterror");
  if ((oldpassword.length < 6) || (password1.length < 6) || (password2.length < 6)) {
    error.innerHTML = "Password too short";
    document.getElementById("accountviewoldpwfield").value = "";
    document.getElementById("accountviewreppwfield").value = "";
    document.getElementById("accountviewnewpwfield").value = "";
    return false;
  }
  if (password1 !== password2) {
    error.innerHTML = "Passwords do not match";
    document.getElementById("accountviewreppwfield").value = "";
    document.getElementById("accountviewnewpwfield").value = "";
    return false;
  }
  if (password1 == password2) {
    const savedToken = localStorage.getItem("savetoken");
    document.getElementById("accountviewoldpwfield").value = "";
    document.getElementById("accountviewreppwfield").value = "";
    document.getElementById("accountviewnewpwfield").value = "";

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/change_password");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", savedToken);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const response = JSON.parse(xhr.responseText);
        error.innerHTML = response.message;
        if (xhr.status === 200) {
          return true;
        }
      }
    };
    xhr.send(JSON.stringify({
      "oldpassword": oldpassword,
      "newpassword": password1
    }));
  }
  return false;
}


function homeshowBrowseView() {
  document.querySelector(".boxhome").style.display = "none";
  document.querySelector(".boxbrowse").style.display = "block";
  localStorage.setItem("currentView", "browseview");
}


function homeshowAccountView() {
  document.querySelector(".boxhome").style.display = "none";
  document.querySelector(".boxaccount").style.display = "block";
  localStorage.setItem("currentView", "accountview");
}

function browseshowHomeView() {
  document.querySelector(".boxbrowse").style.display = "none";
  document.querySelector(".boxhome").style.display = "block";
  localStorage.setItem("currentView", "profileview");
}

function browseshowAccountView() {
  document.querySelector(".boxbrowse").style.display = "none";
  document.querySelector(".boxaccount").style.display = "block";
  localStorage.setItem("currentView", "accountview");
}

function accountshowHomeView() {
  document.querySelector(".boxaccount").style.display = "none";
  document.querySelector(".boxhome").style.display = "block";
  localStorage.setItem("currentView", "profileview");
}

function accountshowBrowseView() {
  document.querySelector(".boxaccount").style.display = "none";
  document.querySelector(".boxbrowse").style.display = "block";
  localStorage.setItem("currentView", "browseview");
}

function accountSignout() {
  const savedToken = localStorage.getItem("savetoken");

  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/sign_out", true);
  xhttp.setRequestHeader("Authorization", savedToken);
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      displayWelcome();
      document.getElementById("loginspace").innerHTML = JSON.parse(this.responseText).message;
    }
  };
  xhttp.send();
}

function openWebSocket() {
  const savedToken = localStorage.getItem("savetoken");

  const ws = new WebSocket(`ws://${window.location.host}/websocket?access_token=${savedToken}`);

  ws.onopen = function () {
    console.log("WebSocket connection opened.");
  };

  ws.onmessage = function (event) {
    console.log("Received message from server: " + event.data);
  };

  ws.onclose = function (event) {
    console.log(`WebSocket connection closed with code ${event.code}.`);
  };
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  ev.target.appendChild(document.getElementById(data));
}