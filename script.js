'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class WorkOut {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationgain) {
    super(coords, distance, duration);
    this.elevationgain = elevationgain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}
// const runObj = new Running([42, 50], 40, 10, 20);
// const cycleObj = new Cycling([52, 100], 30, 24, 170);
// console.log(runObj);
// console.log(cycleObj);

/**ARCHITECTURE APPLICATION */
class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workOut = [];

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }

  _getPosition() {
    /**GET THE CURRENT POSITON OF USER */
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('COULD NOT LOAD THE IMAGE');
        }
      );
    }
  }

  _loadMap(position) {
    /**GEOLOCATION API */
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    // console.log(coords);

    /**INITIALISING LEAFLET LIBRARY AND ADDING IT IT DIV ELEMENT WITH ID = MAP */
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    /**WHENEVER USER CLICKS ON MAP I WANT TO SHOW THE FORM */
    this.#map.on('click', this._showForm.bind(this));
    this.#workOut.forEach(item => this._renderWorkout(item));
    this.#workOut.forEach(item => this._renderWorkOutMarker(item));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
  }
  _toggleElevationField() {
    /**WHENEVER USER SELECTS SOME OTHER OPTION I WANT TO CHANGE CADENCE AND ITS INPUT FIELD */
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    /**WHENEVER FORM IS SUBMITTED I WANT TO SHOW A POPUP AND MARKER AT EXACT POINT WHERE IT WAS CLCIKED */
    e.preventDefault();

    /**GET ALL DATA ENTERED  IN THE FORM */
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat } = this.#mapEvent.latlng;
    const { lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    let workout;
    /**FUNCTION THAT WILL RETURN TRUE IF ALL DATA PASSED IS VALID  */
    const validateData = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    /**IF WORKOUT RUNNING CREATE RUNNING OBJECT AND PASS ALL PARAMETERS */
    if (type === 'running') {
      const cadence = +inputCadence.value;

      /**DATA VALIDATION  */
      if (
        !validateData(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('DATA ENTERED IS NOT VALID');
      }
      workout = new Running(coords, distance, duration, cadence);
    }
    /**IF WORKOUT CYCLING CREATE CYCLING OBJECT AND PASS ALL PARAMETERS */
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      /**DATA VALIDATION  */
      if (
        !validateData(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('DATA ENTERED IS NOT VALID');
      }
      workout = new Cycling(coords, distance, duration, elevation);
    }
    /**ADD NEW OBJECT TO WORKOUT ARRAY */
    this.#workOut.push(workout);
    /**RENDER WORKOUT ON MAP  */
    this._renderWorkout(workout);
    /**RENDER WORKOUT MARKER*/
    this._renderWorkOutMarker(workout);
    /**HIDE FORM AND CLEAR INPUT FIELDS */
    this._hideForm();
    /**ADD LOCAL STORAGE */
    this._setLocalStorage();
  }
  _renderWorkOutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
       `;
    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
     <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
      </div>
  </li>
    `;
    }
    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
       </div>
      <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationgain}</span>
              <span class="workout__unit">m</span>
      </div>
   </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopUp(e) {
    const workOutEl = e.target.closest('.workout');

    if (!workOutEl) return;
    const working = this.#workOut.find(
      item => item.id === workOutEl.dataset.id
    );

    this.#map.setView(working.coords, this.#mapZoomLevel, {
      animate: true,
      duration: 1,
    });
    working.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workOut));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workOut = data;
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
