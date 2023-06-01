window.onload = function () {
  let currentview = localStorage.getItem("currentview");
  if (!currentview) {
    currentview = "welcomeview";
  }
  if (currentview === "profileview") {
    const savedtoken = localStorage.getItem("savetoken");
    if (savedtoken) {
      displayProfile();
      displayPersonalInformation(savedtoken);
    } else {
      currentview = "welcomeview";
    }
  }
  if (currentview === "browseview") {
    const savedtoken = localStorage.getItem("savetoken");
    displayProfile();
    displayPersonalInformation(savedtoken);
    document.querySelector(".boxbrowse").style.display = "block";
    document.querySelector(".boxhome").style.display = "none";
    document.querySelector(".boxaccount").style.display = "none";
    localStorage.setItem("currentview", "browseview");
  }
  if (currentview === "accountview") {
    const savedtoken = localStorage.getItem("savetoken");
    displayProfile();
    displayPersonalInformation(savedtoken);
    document.querySelector(".boxbrowse").style.display = "none";
    document.querySelector(".boxhome").style.display = "none";
    document.querySelector(".boxaccount").style.display = "block";
    localStorage.setItem("currentview", "accountview");
  }
  if (currentview === "welcomeview") {
    displayWelcome();
  }
};

function displayWelcome() {
  const body = document.getElementById("body");
  const welcomeview = document.getElementById("welcomeview");
  body.innerHTML = welcomeview.innerHTML;
  localStorage.setItem("currentview", "welcomeview");
}

function displayProfile() {
  const body = document.getElementById("body");
  const profileview = document.getElementById("profileview");
  body.innerHTML = profileview.innerHTML;
  localStorage.setItem("currentview", "profileview");
}

function signUp() {
  const password1 = document.getElementById("signuppasswordfield").value;
  const password2 = document.getElementById("signuprepeatpswfield").value;
  if (password1 == password2) {
    const inputobject = {
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
    req.send(JSON.stringify(inputobject));
  }
  else {
    document.getElementById("differentpw").innerHTML = "No pw match";
  }
};

function signIn() {
  const email = document.getElementById("loginemailfield").value;
  const password = document.getElementById("loginpasswordfield").value;
  const inputobject = {
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
  req.send(JSON.stringify(inputobject));
  return false;
};

function displayPersonalInformation() {
  const savedtoken = localStorage.getItem("savetoken");
  const req = new XMLHttpRequest();
  req.open("GET", "/get_user_data_by_token", true);
  req.setRequestHeader("Authorization", savedtoken);
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
  const savedtoken = localStorage.getItem("savetoken");
  const filteredemails = document.getElementById("browseviewreloadsearchfield").value;
  const req = new XMLHttpRequest();
  req.open("GET", `/get_user_data_by_email/${filteredemails}`);
  req.setRequestHeader("Authorization", savedtoken);
  req.onreadystatechange = function () {
    const response = JSON.parse(req.responseText);
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
  req.send();
}

function callpostOnWall() {
  postOnWall();
}

function postOnWall() {
  const ownwallpost = document.getElementById("homeviewownwallpost");
  const ownwallshow = document.getElementById("homeviewownwallshow");
  const wallcontent = ownwallpost.value;
  const savedtoken = localStorage.getItem("savetoken");
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    postMessage();
  }
  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const authenticationnumber = "221681880901109136888x94724"; 
    const url = `https://geocode.xyz/${latitude},${longitude}?json=1&auth=${authenticationnumber}`;
    const req1 = new XMLHttpRequest();
    req1.open("GET", url, true);
    req1.onload = function () {
      const data = JSON.parse(req1.responseText);
      const location = `${data.city}, ${data.country}`;
      postMessage(location);
    };
    req1.send();
  }
  function error() {
    postMessage();
  }
  function postMessage(location = "") {
    const req2 = new XMLHttpRequest();
    req2.open("GET", "/get_user_data_by_token", true);
    req2.setRequestHeader("Authorization", savedtoken);
    req2.onload = function () {
      const response = JSON.parse(req2.responseText);
      const emailme = response.email;
      if (wallcontent.trim() !== "") {
        const req3 = new XMLHttpRequest();
        req3.open("POST", "/post_message", true);
        req3.setRequestHeader("Content-Type", "application/json");
        req3.setRequestHeader("Authorization", savedtoken);
        req3.onload = function () {
          ownwallshow.innerHTML = emailme + ": " + wallcontent + " (" + location + ") " + "<br>" + ownwallshow.innerHTML;
          document.getElementById("homeviewownwallpost").value = " ";
          const numofmessages = ownwallshow.getElementsByTagName("br").length;
          if (numofmessages > 7) {
            ownwallshow.innerHTML = ownwallshow.innerHTML.substring(0, ownwallshow.innerHTML.lastIndexOf("<br>"));
          }
        };
        req3.send(JSON.stringify({ "message": wallcontent + " (" + location + ") ", "email": emailme }));
      }
    };
    req2.send();
  }
}

function callpostOnSelectedWall() {
  postOnSelectedWall();
}

function postOnSelectedWall() {
  const savedtoken = localStorage.getItem("savetoken");
  const ownwallpost = document.getElementById("browseviewownwallpost");
  const ownwallshow = document.getElementById("browseviewownwallshow");
  const emailhim = document.getElementById("browseviewreloadsearchfield").value;
  const wallcontent = ownwallpost.value;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    postMessage();
  }
  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const authenticationnumber = "221681880901109136888x94724";
    const url = `https://geocode.xyz/${latitude},${longitude}?json=1&auth=${authenticationnumber}`;
    const req1 = new XMLHttpRequest();
    req1.open("GET", url, true);
    req1.onload = function () {
      const data = JSON.parse(req1.responseText);
      const location = `${data.city}, ${data.country}`;
      postMessage(location);
    };
    req1.send();
  }
  function error() {
    postMessage();
  }
  function postMessage(location = "") {
    const req2 = new XMLHttpRequest();
    req2.open("GET", "/get_user_data_by_token", true);
    req2.setRequestHeader("Authorization", savedtoken);
    req2.onload = function () {
      const response = JSON.parse(req2.responseText);
      const emailme = response.email;
      if (wallcontent.trim() !== "") {
        const req3 = new XMLHttpRequest();
        req3.open("POST", "/post_message", true);
        req3.setRequestHeader("Content-Type", "application/json");
        req3.setRequestHeader("Authorization", savedtoken);
        req3.onload = function () {
          ownwallshow.innerHTML = emailme + ": " + wallcontent + " (" + location + ") " + "<br>" + ownwallshow.innerHTML;
          document.getElementById("browseviewownwallpost").value = "";
          const numofmessages = ownwallshow.getElementsByTagName("br").length;
          if (numofmessages > 7) {
            ownwallshow.innerHTML = ownwallshow.innerHTML.substring(0, ownwallshow.innerHTML.lastIndexOf("<br>"));
          }
        };
        req3.send(JSON.stringify({ "message": wallcontent + " (" + location + ") ", "email": emailhim }));
      }
    };
    req2.send();
  }
}

function callreloadownwall() {
  reloadownwall();
}

function reloadownwall() {
  const savedtoken = localStorage.getItem("savetoken");
  const req = new XMLHttpRequest();
  req.open("GET", "/get_user_messages_by_token", true);
  req.setRequestHeader("Authorization", savedtoken);
  req.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const messages = JSON.parse(this.responseText).messages;
      messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recentmessages = messages.slice(0, 7);
      let messagesstring = "";
      for (let i = 0; i < recentmessages.length; i++) {
        messagesstring += recentmessages[i].sender_email + ": " + recentmessages[i].message + "<br>";
      }
      document.getElementById("homeviewownwallshow").innerHTML = messagesstring;
    }
  };
  req.send();
};

function callreloadselectedwall() {
  reloadselectedwall();
}

function reloadselectedwall() {
  const searchlabel = document.getElementById("browseviewreloadsearchlabel").innerHTML;
  if (searchlabel === "User data retrieved successfully") {
    const savedtoken = localStorage.getItem("savetoken");
    const emailhim = document.getElementById("browseviewreloadsearchfield").value;
    const req = new XMLHttpRequest();
    req.open("GET", `/get_user_messages_by_email/${emailhim}`, true);
    req.setRequestHeader("Authorization", savedtoken);
    req.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        const response = JSON.parse(this.responseText);
        if (response.messages) {
          const messages = response.messages;
          messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          const recentmessages = messages.slice(0, 7);
          let messagesstring = "";
          for (let i = 0; i < recentmessages.length; i++) {
            messagesstring += recentmessages[i].sender_email + ": " + recentmessages[i].message + "<br>";
          }
          document.getElementById("browseviewownwallshow").innerHTML = messagesstring;
        }
      }
    };
    req.send();
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
    const savedtoken = localStorage.getItem("savetoken");
    document.getElementById("accountviewoldpwfield").value = "";
    document.getElementById("accountviewreppwfield").value = "";
    document.getElementById("accountviewnewpwfield").value = "";
    const req = new XMLHttpRequest();
    req.open("PUT", "/change_password");
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("Authorization", savedtoken);
    req.onreadystatechange = function () {
      if (req.readyState === XMLHttpRequest.DONE) {
        const response = JSON.parse(xhr.responseText);
        error.innerHTML = response.message;
        if (req.status === 200) {
          return true;
        }
      }
    };
    req.send(JSON.stringify({
      "oldpassword": oldpassword,
      "newpassword": password1
    }));
  }
  return false;
}

function homeshowBrowseView() {
  document.querySelector(".boxhome").style.display = "none";
  document.querySelector(".boxbrowse").style.display = "block";
  localStorage.setItem("currentview", "browseview");
}

function homeshowAccountView() {
  document.querySelector(".boxhome").style.display = "none";
  document.querySelector(".boxaccount").style.display = "block";
  localStorage.setItem("currentview", "accountview");
}

function browseshowHomeView() {
  document.querySelector(".boxbrowse").style.display = "none";
  document.querySelector(".boxhome").style.display = "block";
  localStorage.setItem("currentview", "profileview");
}

function browseshowAccountView() {
  document.querySelector(".boxbrowse").style.display = "none";
  document.querySelector(".boxaccount").style.display = "block";
  localStorage.setItem("currentview", "accountview");
}

function accountshowHomeView() {
  document.querySelector(".boxaccount").style.display = "none";
  document.querySelector(".boxhome").style.display = "block";
  localStorage.setItem("currentview", "profileview");
}

function accountshowBrowseView() {
  document.querySelector(".boxaccount").style.display = "none";
  document.querySelector(".boxbrowse").style.display = "block";
  localStorage.setItem("currentview", "browseview");
}

function accountSignout() {
  const savedtoken = localStorage.getItem("savetoken");
  const req = new XMLHttpRequest();
  req.open("GET", "/sign_out", true);
  req.setRequestHeader("Authorization", savedtoken);
  req.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      displayWelcome();
      document.getElementById("loginspace").innerHTML = JSON.parse(this.responseText).message;
    }
  };
  req.send();
}

function openWebSocket() {
  const savedtoken = localStorage.getItem("savetoken");
  const ws = new WebSocket(`ws://${window.location.host}/websocket?access_token=${savedtoken}`);
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

function recoverPassword() {
  const email = document.getElementById("loginemailfield").value;
  const password = document.getElementById("loginpasswordfield").value;
  const req = new XMLHttpRequest();
  req.open("POST", "/recover_password", true);
  req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  req.onload = function () {
    const response = JSON.parse(req.responseText);
    document.getElementById("loginspace").innerHTML = response.message;
  };
  req.send(JSON.stringify({ email, password }));
}