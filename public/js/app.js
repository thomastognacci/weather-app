var app = (function () {
  "use strict";

  const API = 'https://api.openweathermap.org/data/2.5/',
        METRIC = '&units=metric',
        KEY = '&appid=66964d64a5e1ba9ccc91d5edf9e13a26',
        TRANSITION_DURATION = 500;

  const Selectors = {
        APP: document.getElementById('app'),
        WEATHER_APP: document.getElementById('weather-app'),
        INPUT_CITY: document.getElementById('input-city'),
        BUTTON_CITY: document.getElementById('submit-city'),
        GPS_BUTTON: document.getElementById('btn-geoloc'),
        PANES: document.querySelectorAll('.pane-bot, .pane-top'),
        LOADER: document.getElementById('intro-loader'),
        BACK_BTN: document.getElementById('button__back'),
        INTRO: document.getElementById('intro'),
        HELLO: document.querySelector('#hello span'),
        TEMP_TODAY: document.getElementById('today-temp'),
        TEMP_FORECAST: document.querySelectorAll('.forecast__temp'),
        SKY_TODAY: document.getElementById('today-sky'),
        ICON_TODAY: document.getElementById('today-icon'),
        WEATHER_TODAY: document.getElementById('today-weather'),
        WEATHER_FORECAST_DAY: document.querySelectorAll('.forecast__day'),
        WEATHER_FORECAST_IMG: document.querySelectorAll('.forecast__img'),
        WEATHER_TEMPS: document.querySelectorAll('.forecast__temp, #today-temp'),
        ERROR_DIV: ''
  };


  var intro = function () {
    this.error = false;
    this.errorScale = 1;
    this.city = '';
    this.geolocation = false;

    this.events();
  };

  intro.prototype.events = function () {
    var that = this;
    Selectors.GPS_BUTTON.addEventListener('click', function(){
      that.getLocation();
    });
    Selectors.INPUT_CITY.addEventListener('change', function(){
      that.getCityName('text-field');
    });
    Selectors.BUTTON_CITY.addEventListener('click', function(){
      that.getCityName('button');
    });

    document.getElementById('button__infos').addEventListener('click', function() {
      Selectors.WEATHER_APP.classList.toggle('blurry');
    });
  };


  intro.prototype.getLocation = function () {
    let that = this;
    this.geolocation = true;
    navigator.geolocation.getCurrentPosition(success, error);
    if (this.error) {
      Selectors.INTRO.removeChild(Selectors.ERROR_DIV);
      this.error = false;
    }

    function success (pos) {
      var crd = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            city: function() {return `lat=${this.lat}&lon=${this.lon}`;}
          };
      return that.apiCall(crd, '');
    }
    Selectors.LOADER.classList.add('loading');

    function error (err) {
      Selectors.LOADER.classList.remove('loading');
      Selectors.GPS_BUTTON.innerHTML = "Couldn't get your location";
      Selectors.GPS_BUTTON.setAttribute("disabled", "");
      Selectors.GPS_BUTTON.removeAttribute("onclick");
      Selectors.GPS_BUTTON.classList.add('btn-disabled');
      console.error('ERROR(' + err.code + '): ' + err.message);
    }
  };

  intro.prototype.getCityName = function (trigger) {
    this.city = 'q=' + Selectors.INPUT_CITY.value;
    this.apiCall('',this.city);

    if (trigger == 'text-field') {
      if (this.error) {
        Selectors.INTRO.removeChild(Selectors.ERROR_DIV);
        Selectors.LOADER.classList.add('loading');
        this.error = false;
      }
    }
    else if (trigger == 'button') {
      if (!this.error) {
        Selectors.LOADER.classList.add('loading');
      }
    }
  };

  intro.prototype.apiCall = function (crd, city) {
    let that = this,
        urlPresent,
        urlForecast;

      if (this.geolocation) {
        city = crd.city();
        this.geolocation = false;
      }

    urlPresent = API + 'weather?' + city + METRIC + KEY;
    urlForecast = API + 'forecast?' + city + METRIC + KEY;

    function handleErrors(resp) {
      if (resp.cod != 200) {
        throw Error(resp.message);
      }
      return resp;
    }

    function displayErrors(message) {
      Selectors.LOADER.classList.remove('loading');

      let div = document.createElement("DIV"),
          txt = document.createTextNode(message);
          div.appendChild(txt);

      div.classList.add('intro__error');
      div.setAttribute('id', 'intro__error');
      Selectors.INTRO.appendChild(div);
      Selectors.ERROR_DIV = document.getElementById('intro__error');

      setTimeout(() => {
        div.classList.add('visible');
      }, 20);

      that.error = true;
    }

    fetch(urlPresent)
      .then((respPresent) => respPresent.json())
      .then(handleErrors)
      .then(function(dataPresent) {

        fetch(urlForecast)
          .then((respForecast) => respForecast.json())
          .then(handleErrors)
          .then(function(dataForecast) {

            const RESPONSE = {
              dataPresent,
              dataForecast
            };

            new Weather (RESPONSE.dataPresent, RESPONSE.dataForecast);

            // start css intro animation
              Selectors.APP.classList.remove('block-animations');
              Selectors.LOADER.classList.remove('loading');
              Selectors.INTRO.classList.add('done');

              // hide intro button
              setTimeout( () => {
                Selectors.INPUT_CITY.hidden = true;
                Selectors.GPS_BUTTON.hidden = true;
              }, TRANSITION_DURATION);

          });
      })

      .catch(function(error) {
        if (!that.error && error.toString().indexOf("Nothing to geocode") > -1) {
          displayErrors("Please enter a city or use your GPS location");
        }
        else if (!that.error && error.toString().indexOf("city not found") > -1) {
          displayErrors("I'm pretty sure this city doesn't exist");
        }
        else if (!that.error) {
          displayErrors(error);
        }
        else {
          if (that.errorScale < 5) {
            Selectors.ERROR_DIV.style.transform = 'translate(-50%, -150%) scale(1.' + that.errorScale + ')';
            that.errorScale += 1;
          }
          else {
            Selectors.ERROR_DIV.style.transform = 'translate(-50%, -150%) scale(1.2)';
            Selectors.ERROR_DIV.innerHTML = 'Sorry but something is definitely wrong with your location...';
          }
        }
        console.error(error);
      });
  };

  function Weather (dataPresent, dataForecast) {
    this.dataPresent = dataPresent;
    this.dataForecast = dataForecast;
    this.weatherIDs = [dataPresent.weather[0].id, dataForecast.list[8].weather["0"].id, dataForecast.list[16].weather["0"].id,dataForecast.list[24].weather["0"].id];
    this.cityName = dataPresent.name;
    this.tempToday = dataPresent.main.temp;
    this.tempForecast = [dataForecast.list[8].main.temp, dataForecast.list[16].main.temp, dataForecast.list[24].main.temp];

    this.weatherType(this.weatherIDs);
    this.convertUnits();
    this.getTheDays();
    this.events();
    this.init(this);
  }

  Weather.prototype.events = () => {
    Selectors.BACK_BTN.addEventListener('click', function (e) {
      Selectors.INPUT_CITY.hidden = false;
      Selectors.GPS_BUTTON.hidden = false;
      setTimeout( () => {
        Selectors.INTRO.classList.remove('done');
      }, 10);
      setTimeout( () => {
        Selectors.APP.className = 'block-animations';
      }, TRANSITION_DURATION);
    });
  };

  Weather.prototype.init = (that) => {
      Selectors.HELLO.innerHTML = `${that.cityName}`;
      Selectors.TEMP_TODAY.innerHTML = Math.round(that.tempToday) + '°C';

      for (let i = 0; i < Selectors.TEMP_FORECAST.length; i++) {
        Selectors.TEMP_FORECAST[i].innerHTML = Math.round(that.tempForecast[i]) + '°C';
      }
  };

  Weather.prototype.getTheDays = () => {
    let d = new Date(),
        n = d.getDay(),
        forecastDiv = Selectors.WEATHER_FORECAST_DAY;
    for (let i=0; i < forecastDiv.length; i++) {
      switch (i + ( n + 1 )) {
        case 7:
        case 0: forecastDiv[i].innerHTML = "sunday";
        break;
        case 8:
        case 1: forecastDiv[i].innerHTML = "monday";
        break;
        case 9:
        case 2: forecastDiv[i].innerHTML = "tuesday";
        break;
        case 3: forecastDiv[i].innerHTML = "wednesday";
        break;
        case 4: forecastDiv[i].innerHTML = "thurday";
        break;
        case 5: forecastDiv[i].innerHTML = "friday";
        break;
        case 6: forecastDiv[i].innerHTML = "saturday";
        break;
      }
    }
  };

  Weather.prototype.weatherType = (weatherIDs) => {
    let sentences = [];
    let weatherIcon = {
      lightning: "img/lightning.svg",
      rain: "img/rain.svg",
      rainHeavy: "img/rain-heavy.svg",
      snow: "img/snow.svg",
      sun: "img/sun.svg",
      cloud: "img/cloud.svg",
      bio: "img/bio.svg"
    };

    for (let i = 0; i < weatherIDs.length ; i++) {

      switch (true) {
        case (200  <= weatherIDs[i] && weatherIDs[i] <= 232):         // THUNDERSTORM
          if (i === 0) { // Weather at the current moment
            Selectors.APP.classList.add('rainy');
            Selectors.ICON_TODAY.src = weatherIcon.lightning;
            Selectors.WEATHER_TODAY.innerHTML = "oh my... <br/>stay inside";
          }
          else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.lightning;
          }
          break;
        case (300  <= weatherIDs[i]  && weatherIDs[i]  <= 321):         // DRIZZLE
          if (i === 0) {
            Selectors.APP.classList.add('rainy');
            Selectors.ICON_TODAY.src = weatherIcon.rain;
            Selectors.WEATHER_TODAY.innerHTML = "not great... <br/>take an umbrella";
          } else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.rain;
          }
          break;
        case (500  <= weatherIDs[i]  && weatherIDs[i]  <= 531):          // RAIN
          if (i === 0) {
            Selectors.APP.classList.add('rainy');
            Selectors.ICON_TODAY.src = weatherIcon.rainHeavy;
            sentences = ["it's raining :` (", "please do not drink water drops", "sad sad day...<br/>yes, it's raining"];
            Selectors.WEATHER_TODAY.innerHTML = sentences[Math.floor(Math.random()*sentences.length)];
          } else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.rainHeavy;
          }
          break;
        case (600  <= weatherIDs[i]  && weatherIDs[i]  <= 622):          // SNOW
          if (i === 0) {
            Selectors.APP.classList.add('snowy');
            Selectors.ICON_TODAY.src = weatherIcon.snow;
            sentences = ["do you want to build a snowman?", "is it christmas yet?<br/>It looks like it!", "let it snow, she said", "do not write your name in it", "i always wanted a white christmas", "is it snowing yet?<br/>i can't see from here"];
            Selectors.WEATHER_TODAY.innerHTML = sentences[Math.floor(Math.random()*sentences.length)];
          } else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.snow;
          }
          break;
        case (701  <= weatherIDs[i]  && weatherIDs[i]  <= 781):          // ATMOSPHERE
          break;
        case (weatherIDs[i]  == 800):                                    // CLEAR
          if (i === 0) {
            Selectors.APP.classList.add('sunny');
            Selectors.ICON_TODAY.src = weatherIcon.sun;
            sentences = ["what a day!<br/>feels like summer", "not a single cloud in the sky, said the weatherman", "refill you vitamin D stocks and get back to work", "what about not going to work today?"];
            Selectors.WEATHER_TODAY.innerHTML = sentences[Math.floor(Math.random()*sentences.length)];
          } else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.sun;
          }
          break;
        case (801  <= weatherIDs[i]  && weatherIDs[i]  <= 804):          // CLOUDS
          if (i === 0) {
            Selectors.APP.classList.add('cloudy');
            Selectors.ICON_TODAY.src = weatherIcon.cloud;
            sentences = ["not a great day<br/>but you will survive", "look at the shape of this cloud!", "this cloud definitely looks like a dog"];
            Selectors.WEATHER_TODAY.innerHTML = sentences[Math.floor(Math.random()*sentences.length)];
          } else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.cloud;
          }
          break;
        case (900  <= weatherIDs[i]  && weatherIDs[i]  <= 906):          // EXTREME
          if (i === 0) {
            Selectors.APP.classList.add('rainy');
            Selectors.ICON_TODAY.src = weatherIcon.bio;
            sentences = ["that's suppose to be a terrible day", "stay home<br/>i'm not kidding"];
            Selectors.WEATHER_TODAY.innerHTML = sentences[Math.floor(Math.random()*sentences.length)];
          } else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.bio;
          }
          break;
        case (951  <= weatherIDs[i]  && weatherIDs[i]  <= 962):          // Other
          if (i === 0) {
            Selectors.APP.classList.add('rainy');
            Selectors.ICON_TODAY.src = weatherIcon.bio;
            sentences = ["that's suppose to be a terrible day", "stay home<br/>i'm not kidding", "i don't have an icon but that doesn't look good"];
            Selectors.WEATHER_TODAY.innerHTML = sentences[Math.floor(Math.random()*sentences.length)];
          } else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.bio;
          }
          break;
        default:
          if (i === 0) {
            Selectors.APP.classList.add('nighty');
            Selectors.WEATHER_TODAY.innerHTML = "either a new meteorological phenomenon was just discovered or i'm out of date";
          } else {
            Selectors.WEATHER_FORECAST_IMG[i - 1].src = weatherIcon.bio;
          }
      }
    }

  };

  Weather.prototype.convertUnits = () => {
    let transitionDurationTemp =  parseFloat(window.getComputedStyle(Selectors.TEMP_TODAY)['animation-duration']),
        celsius = true,
        allTheTemps = Selectors.WEATHER_TEMPS;


    Selectors.SKY_TODAY.addEventListener('click', (e) => {
      if (celsius) {
        for (let i = 0; i < allTheTemps.length; i++) {
          allTheTemps[i].classList.remove('temp-anim-celsius');
          setTimeout( () => {
            allTheTemps[i].classList.add('temp-anim-fahrenheit');
          }, 10);
          setTimeout( () => {
            allTheTemps[i].innerHTML = Math.round((parseInt(allTheTemps[i].innerHTML) * 9/5) + 32)  + '°F';
          }, (transitionDurationTemp / 2 * 1000));
        }
        celsius = false;
      }
      else {
        for (let i = 0; i < allTheTemps.length; i++) {
          allTheTemps[i].classList.remove('temp-anim-fahrenheit');
          setTimeout( () => {
            allTheTemps[i].classList.add('temp-anim-celsius');
          }, 10);
          setTimeout( () => {
            allTheTemps[i].innerHTML = Math.round((parseInt(allTheTemps[i].innerHTML) - 32) * 5/9) + '°C';
          }, (transitionDurationTemp / 2 * 1000));
        }
        celsius = true;
      }
    });
  };

  new intro();
})();
