(function () {
  "use strict";

  //set to true for debugging output
  var debug = false;

  // our current position
  var positionCurrent = {
    lat: null,
    lng: null,
    hng: null
  };


  // the outer part of the compass that rotates
  var rose = document.getElementById("rose");


  // elements that ouput our position
  var positionLat = document.getElementById("position-lat");
  var positionLng = document.getElementById("position-lng");
  var positionHng = document.getElementById("position-hng");


  // debug outputs
  var debugOrientation = document.getElementById("debug-orientation");
  var debugOrientationDefault = document.getElementById("debug-orientation-default");


  // info popup elements, pus buttons that open popups
  var popup = document.getElementById("popup");
  var popupContents = document.getElementById("popup-contents");
  var popupInners = document.querySelectorAll(".popup__inner");
  var btnsPopup = document.querySelectorAll(".btn-popup");


  // buttons at the bottom of the screen
  var btnLockOrientation = document.getElementById("btn-lock-orientation");
  var btnNightmode = document.getElementById("btn-nightmode");
  var btnMap = document.getElementById("btn-map");
  var btnInfo = document.getElementById("btn-info");


  // if we have shown the heading unavailable warning yet
  var warningHeadingShown = false;


  // switches keeping track of our current app state
  var isOrientationLockable = false;
  var isOrientationLocked = false;
  var isNightMode = false;


  // the orientation of the device on app load
  var defaultOrientation;


  // browser agnostic orientation
  function getBrowserOrientation() {
    var orientation;
    if (screen.orientation && screen.orientation.type) {
      orientation = screen.orientation.type;
    } else {
      orientation = screen.orientation ||
        screen.mozOrientation ||
        screen.msOrientation;
    }

    /*
  'portait-primary':      for (screen width < screen height, e.g. phone, phablet, small tablet)
                            device is in 'normal' orientation
                          for (screen width > screen height, e.g. large tablet, laptop)
                            device has been turned 90deg clockwise from normal

  'portait-secondary':    for (screen width < screen height)
                            device has been turned 180deg from normal
                          for (screen width > screen height)
                            device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal

  'landscape-primary':    for (screen width < screen height)
                            device has been turned 90deg clockwise from normal
                          for (screen width > screen height)
                            device is in 'normal' orientation

  'landscape-secondary':  for (screen width < screen height)
                            device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal
                          for (screen width > screen height)
                            device has been turned 180deg from normal
                            */

    return orientation;
  }


  // browser agnostic orientation unlock
  function browserUnlockOrientation() {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    } else if (screen.unlockOrientation) {
      screen.unlockOrientation();
    } else if (screen.mozUnlockOrientation) {
      screen.mozUnlockOrientation();
    } else if (screen.msUnlockOrientation) {
      screen.msUnlockOrientation();
    }
  }


  // browser agnostic document.fullscreenElement
  function getBrowserFullscreenElement() {
    if (typeof document.fullscreenElement !== "undefined") {
      return document.fullscreenElement;
    } else if (typeof document.webkitFullscreenElement !== "undefined") {
      return document.webkitFullscreenElement;
    } else if (typeof document.mozFullScreenElement !== "undefined") {
      return document.mozFullScreenElement;
    } else if (typeof document.msFullscreenElement !== "undefined") {
      return document.msFullscreenElement;
    }
  }


  // browser agnostic document.documentElement.requestFullscreen
  function browserRequestFullscreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  }


  // browser agnostic document.documentElement.exitFullscreen
  function browserExitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  const good = [
    "communicate\nur feelings",
    "it's okay\nto want things",
    "it's okay, they\nprobably have a\nlot going on",
    "seek first to understand",
    "accepr ur feelings",
    "they're okay\nif they're not\nhurting anyone",
    "it's okay\nif you aren't\nhurting anyone",
    "they act like\nthat because\nthey're in pain",
    "gee maybe\ntry therapy",
    "resolve problems\nnow before they\nget bigger",
    "people make mistakes,\n doesn't mean\nthey're evil",
    "you can't be responsible\n for other people's feelings"
  ]

  const bad = [
    "force someone to be\nyour moral compass",
    "what have they\ndone for you\nlately",
    "who cares?",
    "boys will\nbe boys",
    "gotta be a\njerk to be\nrich",
    "make someone\nfeel bad so\nyou feel good",
    "gossip behind\ntheir backs",
    "blame the\ngovernment",
    "the grapes\nare sour\nanyway",
    "every man\nfor himself",
    "it's a meritocracy",
    "your manager\nis a jerk",
    "maybe beat\nyourself up\babout it",
    "it's them\nor us",
    "nah",
    "reward yourself\n by upvoting",
    "derive it\nfrom first\nprinciples",
    "\"be normal\"",
    "let it slide,\nhe's rich",
    "you worked\nhard so\nyou deserve it",
    "there's not\nmuch maths\n in IT",
    "therapy is for\n dumb people",
    "just suck it up",
    "stiff upper lip",
    "the money will\ntrickle down",
    "the sharing economy",
    "they're not like\nyou, so they're a threat",
    "oh just\ntell them later",
    "hide your problems",
    "ignore your feelings",
    "the important thing\nis to be right"
  ]

  const numDirs = 4 + getRandomInt(3)
  const moralNorth = getRandomInt(numDirs);
  var dirs = []
  for (var i = 0; i < numDirs; i++) {
    dirs.push(randomChoice(bad));
  }
  // Replace one bad one with ~moral north~
  dirs[moralNorth] = randomChoice(good)
  console.log(dirs);

  // I can't believe we're out here doing university mathematics unironically.
  var spacing_angle = 2 * Math.PI / dirs.length;
  const spacingAngleDegrees = 360 / dirs.length;

  var drawDirections = () => {
    const cx = 65;
    const cy = 65;
    var r = 46;
    const textWidth = 40;
    const textHeight = 20;


    var svg = document.getElementById('compass-svg'); //Get svg element

    for (var i = 0; i < dirs.length; i++) {
      const dir = dirs[i];
      const lines = dirs[i].split("\n");


      const text_x = cx + (r + 5 + lines.length * 6) * Math.cos(-Math.PI / 2 + spacing_angle * i);
      const text_y = cy + (r + 5 + lines.length * 6) * Math.sin(-Math.PI / 2 + spacing_angle * i);


      var textNode = document.createElementNS("http://www.w3.org/2000/svg", 'text');
      //textNode.setAttribute("x",text_x); 
      textNode.setAttribute("y", text_y);
      textNode.setAttribute("font-size", "6");
      //textNode.setAttribute("textLength","300"); 
      //textNode.setAttribute("lengthAdjust","spacingAndGlyphs"); 
      textNode.setAttribute("text-anchor", "middle");
      if (i === moralNorth) {
        textNode.setAttribute("id", "moralNorth");
      }
      textNode.setAttribute("fill", "white");
      textNode.setAttribute("transform", `rotate(${(spacingAngleDegrees * i)}, ${text_x}, ${text_y})`);


      for (const line of lines) {
        var tspan = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
        tspan.setAttribute("x", text_x)
        tspan.setAttribute("dy", 6)
        tspan.textContent = line;
        textNode.appendChild(tspan)
      }

      svg.appendChild(textNode);
    }
  }

  function getHeadingGoof(h) {
    if (h < 90) {
      return "disregard"
    }
    if (h < 180) {
      return "shaky"
    }
    if (h < 270) {
      return "savoury"
    }
    return "makes u think"

  }

  // called on device orientation change
  function onHeadingChange(event) {
    var heading = event.alpha;

    if (typeof event.webkitCompassHeading !== "undefined") {
      heading = event.webkitCompassHeading; //iOS non-standard
    }

    var orientation = getBrowserOrientation();

    if (typeof heading !== "undefined" && heading !== null) { // && typeof orientation !== "undefined") {
      // we have a browser that reports device heading and orientation


      if (debug) {
        debugOrientation.textContent = orientation;
      }


      // what adjustment we have to add to rotation to allow for current device orientation
      var adjustment = 0;
      if (defaultOrientation === "landscape") {
        adjustment -= 90;
      }

      if (typeof orientation !== "undefined") {
        var currentOrientation = orientation.split("-");

        if (defaultOrientation !== currentOrientation[0]) {
          if (defaultOrientation === "landscape") {
            adjustment -= 270;
          } else {
            adjustment -= 90;
          }
        }

        if (currentOrientation[1] === "secondary") {
          adjustment -= 180;
        }
      }

      positionCurrent.hng = heading + adjustment;

      var phase = positionCurrent.hng < 0 ? 360 + positionCurrent.hng : positionCurrent.hng;

      positionHng.textContent = getHeadingGoof(positionCurrent.hng);


      // apply rotation to compass rose
      if (typeof rose.style.transform !== "undefined") {
        rose.style.transform = "rotateZ(" + positionCurrent.hng + "deg)";
      } else if (typeof rose.style.webkitTransform !== "undefined") {
        rose.style.webkitTransform = "rotateZ(" + positionCurrent.hng + "deg)";
      }

      const northWindow = 20;
      const moralNorthOffset = moralNorth * spacingAngleDegrees;

      const boing = document.getElementById("boing")
      const offsetHeading = (positionCurrent.hng + moralNorthOffset) % 360
      // Draw moral north, if it's north
      if (offsetHeading < northWindow || offsetHeading > 360 - northWindow) {
        document.getElementById("moralNorth").setAttribute("fill", "#ba5edd");
        boing.classList.add("fadein")

      } else {
        document.getElementById("moralNorth").setAttribute("fill", "white");
        boing.classList.add("remove")
      }


    } else {
      // device can't show heading

      positionHng.textContent = "n/a";
      showHeadingWarning();
    }
  }

  function showHeadingWarning() {
    if (!warningHeadingShown) {
      popupOpen("noorientation");
      warningHeadingShown = true;
    }
  }

  function onFullscreenChange() {
    if (isOrientationLockable && getBrowserFullscreenElement()) {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock(getBrowserOrientation()).then(function () {
        }).catch(function () {
        });
      }
    } else {
      lockOrientationRequest(false);
    }
  }

  function toggleOrientationLockable(lockable) {
    isOrientationLockable = lockable;

    if (isOrientationLockable) {
      btnLockOrientation.classList.remove("btn--hide");

      btnNightmode.classList.add("column-25");
      btnNightmode.classList.remove("column-33");
      btnMap.classList.add("column-25");
      btnMap.classList.remove("column-33");
      btnInfo.classList.add("column-25");
      btnInfo.classList.remove("column-33");
    } else {
      btnLockOrientation.classList.add("btn--hide");

      btnNightmode.classList.add("column-33");
      btnNightmode.classList.remove("column-25");
      btnMap.classList.add("column-33");
      btnMap.classList.remove("column-25");
      btnInfo.classList.add("column-33");
      btnInfo.classList.remove("column-25");
    }
  }

  function checkLockable() {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock(getBrowserOrientation()).then(function () {
        toggleOrientationLockable(true);
        browserUnlockOrientation();
      }).catch(function (event) {
        if (event.code === 18) { // The page needs to be fullscreen in order to call lockOrientation(), but is lockable
          toggleOrientationLockable(true);
          browserUnlockOrientation(); //needed as chrome was locking orientation (even if not in fullscreen, bug??)
        } else {  // lockOrientation() is not available on this device (or other error)
          toggleOrientationLockable(false);
        }
      });
    } else {
      toggleOrientationLockable(false);
    }
  }

  function lockOrientationRequest(doLock) {
    if (isOrientationLockable) {
      if (doLock) {
        browserRequestFullscreen();
        lockOrientation(true);
      } else {
        browserUnlockOrientation();
        browserExitFullscreen();
        lockOrientation(false);
      }
    }
  }

  function lockOrientation(locked) {
    if (locked) {
      btnLockOrientation.classList.add("active");
    } else {
      btnLockOrientation.classList.remove("active");
    }

    isOrientationLocked = locked;
  }

  function toggleOrientationLock() {
    if (isOrientationLockable) {
      lockOrientationRequest(!isOrientationLocked);
    }
  }

  function locationUpdate(position) {
    positionCurrent.lat = position.coords.latitude;
    positionCurrent.lng = position.coords.longitude;

    positionLat.textContent = decimalToSexagesimal(positionCurrent.lat, "lat");
    positionLng.textContent = decimalToSexagesimal(positionCurrent.lng, "lng");
  }

  function locationUpdateFail(error) {
    positionLat.textContent = "n/a";
    positionLng.textContent = "n/a";
    console.log("location fail: ", error);
  }

  function setNightmode(on) {

    if (on) {
      btnNightmode.classList.add("active");
    } else {
      btnNightmode.classList.remove("active");
    }

    window.setTimeout(function () {
      if (on) {
        document.documentElement.classList.add("nightmode");
      } else {
        document.documentElement.classList.remove("nightmode");
      }
    }, 1);


    isNightMode = on;
  }

  function toggleNightmode() {
    setNightmode(!isNightMode);
  }


  function popupOpenFromClick(event) {
    popupOpen(event.currentTarget.dataset.name);
  }

  function popupOpen(name) {
    var i;
    for (i = 0; i < popupInners.length; i++) {
      popupInners[i].classList.add("popup__inner--hide");
    }
    document.getElementById("popup-inner-" + name).classList.remove("popup__inner--hide");

    popup.classList.add("popup--show");
  }

  function popupClose() {
    popup.classList.remove("popup--show");
  }

  function popupContentsClick(event) {
    event.stopPropagation();
  }

  function decimalToSexagesimal(decimal, type) {
    var degrees = decimal | 0;
    var fraction = Math.abs(decimal - degrees);
    var minutes = (fraction * 60) | 0;
    var seconds = (fraction * 3600 - minutes * 60) | 0;

    var direction = "";
    var positive = degrees > 0;
    degrees = Math.abs(degrees);
    switch (type) {
      case "lat":
        direction = positive ? "N" : "S";
        break;
      case "lng":
        direction = positive ? "E" : "W";
        break;
    }

    return degrees + "° " + minutes + "' " + seconds + "\" " + direction;
  }
  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  function randomChoice(arr) {
    return arr[getRandomInt(arr.length)]
  }

  function reload() {
    location.reload();
  }

  drawDirections()
  if (screen.width > screen.height) {
    defaultOrientation = "landscape";
  } else {
    defaultOrientation = "portrait";
  }
  if (debug) {
    debugOrientationDefault.textContent = defaultOrientation;
  }

  var done = false;
  function iosIsGood() {
    if (done) {
      return;
    }
    // iOS 13+
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          window.addEventListener('deviceorientation', onHeadingChange)
        }
      }).catch(console.error)
    done = true;
  }
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    document.querySelector("div.compass").addEventListener("click", iosIsGood)
  } else {
    window.addEventListener('deviceorientation', onHeadingChange)
  }


  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  document.addEventListener("mozfullscreenchange", onFullscreenChange);
  document.addEventListener("MSFullscreenChange", onFullscreenChange);

  btnLockOrientation.addEventListener("click", toggleOrientationLock);
  btnNightmode.addEventListener("click", toggleNightmode);
  btnMap.addEventListener("click", reload);

  var i;
  for (i = 0; i < btnsPopup.length; i++) {
    btnsPopup[i].addEventListener("click", popupOpenFromClick);
  }

  popup.addEventListener("click", popupClose);
  popupContents.addEventListener("click", popupContentsClick);

  navigator.geolocation.watchPosition(locationUpdate, locationUpdateFail, {
    enableHighAccuracy: false,
    maximumAge: 30000,
    timeout: 27000
  });


  setNightmode(false);
  checkLockable();


}());
