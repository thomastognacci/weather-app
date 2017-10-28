var vm = new Vue({
  el: '#app',
  data: {
    api: 'http://api.openweathermap.org/data/2.5/',
    key: '&appid=66964d64a5e1ba9ccc91d5edf9e13a26',
    query: 'forecast?q=',
    city: '',
    response: {},
    url: ''
  },
  methods: {
    responseOK: function (param) {
      if (this.response.cod == 200) {
        switch(param) {
          case 'country':
            return this.response.city.country;
          case 'city':
            return this.response.city.name;
          case 'temp':
            return parseInt(this.response.list[0].main.temp - 273.15) + '°C';
        }
      }
    },
    getCity: function (event) {
      this.city = event.target.value;
    },
    ajaxCall: function () {
      let url = vm.api + vm.query + vm.city + vm.key;
      const REQUEST = new XMLHttpRequest();
      REQUEST.open('GET', url);
      REQUEST.responseType = 'json';
      REQUEST.send();
      REQUEST.onload = () => {
        vm.response = REQUEST.response;
        vm.url = url;
      };
    }
  }
})
