// ==========================================
// 1. ESTADO (Usando SessionStorage - Nivel Pro)
// ==========================================
const appState = {
    currentCity: null,
    // RF06: Leemos la sesión actual. Si está vacía, iniciamos un array.
    favorites: JSON.parse(sessionStorage.getItem('campusFavorites')) || [] 
};

// ==========================================
// 2. ELEMENTOS DEL DOM
// ==========================================
const DOM = {
    select: document.getElementById('city-select'),
    btnLocation: document.getElementById('btn-location'),
    btnFavorite: document.getElementById('btn-favorite'),
    statusMsg: document.getElementById('status-message'),
    weatherCard: document.getElementById('weather-card'),
    cityName: document.getElementById('city-name'),
    temperature: document.getElementById('temperature'),
    condition: document.getElementById('condition'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    forecastContainer: document.getElementById('forecast-container'),
    favoritesList: document.getElementById('favorites-list')
};

// ==========================================
// 3. FUNCIONES UTILITARIAS
// ==========================================
function getWeatherCondition(code) {
    if (code === 0) return '☀️ Despejado';
    if (code > 0 && code <= 3) return '⛅ Parcialmente Nublado';
    if (code >= 45 && code <= 48) return '🌫️ Niebla';
    if (code >= 51 && code <= 67) return '🌧️ Lluvia';
    if (code >= 71 && code <= 77) return '❄️ Nieve';
    return '🌩️ Clima Inestable';
}

// RF03: Mostrar estado de carga usando Skeleton Loading
function toggleSkeleton(isLoading) {
    const elements = [DOM.cityName, DOM.temperature, DOM.condition, DOM.humidity, DOM.wind];
    if (isLoading) {
        DOM.statusMsg.classList.add('hidden');
        DOM.weatherCard.classList.remove('hidden');
        elements.forEach(el => el.classList.add('skeleton'));
        DOM.forecastContainer.innerHTML = ''; // Limpiar pronóstico viejo
    } else {
        elements.forEach(el => el.classList.remove('skeleton'));
    }
}

// Manejo de errores
function showError(message) {
    DOM.weatherCard.classList.add('hidden');
    DOM.statusMsg.textContent = message;
    DOM.statusMsg.classList.remove('hidden');
    DOM.statusMsg.className = 'status-box error';
    DOM.btnFavorite.disabled = true;
}

// ==========================================
// 4. LÓGICA PRINCIPAL (FETCH Y PROMESAS)
// ==========================================
// RF02: Consultar API
function fetchWeatherData(lat, lon, cityName) {
    toggleSkeleton(true); // Activar animación de carga
    DOM.btnFavorite.disabled = true;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            return response.json();
        })
        .then(data => {
            appState.currentCity = { lat, lon, name: cityName };
            renderWeather(data, cityName);
        })
        .catch(error => {
            console.error('Error en Fetch:', error);
            showError(`No pudimos cargar el clima de ${cityName}. Revisa tu conexión.`);
        });
}

// RF04: Renderizar datos
function renderWeather(data, cityName) {
    toggleSkeleton(false); // Apagar animación de carga
    DOM.btnFavorite.disabled = false;

    DOM.cityName.textContent = `Clima en ${cityName}`;
    DOM.temperature.textContent = `${data.current.temperature_2m}°C`;
    DOM.condition.textContent = getWeatherCondition(data.current.weather_code);
    DOM.humidity.textContent = `${data.current.relative_humidity_2m}%`;
    DOM.wind.textContent = `${data.current.wind_speed_10m} km/h`;

    for (let i = 1; i <= 3; i++) {
        if(data.daily.time[i]){
            const date = new Date(data.daily.time[i] + 'T00:00:00');
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
            const card = document.createElement('div');
            card.className = 'forecast-item';
            card.innerHTML = `
                <strong>${dayName}</strong>
                <div style="font-size: 1.5rem; margin: 0.5rem 0;">${getWeatherCondition(data.daily.weather_code[i]).split(' ')[0]}</div>
                <div><span style="color: #dc3545;">${data.daily.temperature_2m_max[i]}°</span> / <span style="color: #007bff;">${data.daily.temperature_2m_min[i]}°</span></div>
            `;
            DOM.forecastContainer.appendChild(card);
        }
    }
}

// ==========================================
// 5. GESTIÓN DE FAVORITOS (SESSION STORAGE)
// ==========================================
function saveFavorites() {
    sessionStorage.setItem('campusFavorites', JSON.stringify(appState.favorites));
    renderFavorites();
}

function renderFavorites() {
    DOM.favoritesList.innerHTML = '';
    if (appState.favorites.length === 0) {
        DOM.favoritesList.innerHTML = '<li class="empty-state">No tienes favoritos guardados en esta sesión.</li>';
        return;
    }

    appState.favorites.forEach(city => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${city.name}</strong></span>
            <div>
                <button class="btn btn-primary" style="padding: 0.3rem 0.6rem; margin-right: 0.5rem;" onclick="loadFavorite('${city.lat}', '${city.lon}', '${city.name}')">Ver</button>
                <button class="btn btn-danger" onclick="removeFavorite('${city.name}')">Eliminar</button>
            </div>
        `;
        DOM.favoritesList.appendChild(li);
    });
}

// ==========================================
// 6. EVENTOS (LISTENERS Y CALLBACKS)
// ==========================================
// Cambio en el Select
DOM.select.addEventListener('change', e => {
    if (!e.target.value) return;
    const [lat, lon, cityName] = e.target.value.split(',');
    fetchWeatherData(lat, lon, cityName);
});

// Callback de API Nativa: Geolocalización
DOM.btnLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showError('Tu navegador no soporta geolocalización.');
        return;
    }
    
    // Cambiamos el select para que no quede pegado en otra ciudad
    DOM.select.value = ""; 
    toggleSkeleton(true);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(4);
            const lon = position.coords.longitude.toFixed(4);
            fetchWeatherData(lat, lon, 'Tu Ubicación Exacta');
        },
        (error) => {
            console.error(error);
            showError('Permiso de ubicación denegado. Selecciona una ciudad de la lista.');
            toggleSkeleton(false);
            DOM.weatherCard.classList.add('hidden');
        }
    );
});

// Agregar Favorito
DOM.btnFavorite.addEventListener('click', () => {
    if (!appState.currentCity) return;
    const exists = appState.favorites.find(c => c.name === appState.currentCity.name);
    
    if (!exists) {
        appState.favorites.push(appState.currentCity);
        saveFavorites(); // Guarda en SessionStorage
    } else {
        alert('Esta ciudad ya está en tus favoritos.');
    }
});

// Funciones globales para los botones generados
window.removeFavorite = function(cityName) {
    appState.favorites = appState.favorites.filter(c => c.name !== cityName);
    saveFavorites(); // Actualiza SessionStorage
};

window.loadFavorite = function(lat, lon, cityName) {
    DOM.select.value = `${lat},${lon},${cityName}`;
    fetchWeatherData(lat, lon, cityName);
};

// Inicializar lista de favoritos al cargar la página
renderFavorites();