// ============================================
// WEATHER DASHBOARD - WITH AUTOCOMPLETE & REDESIGN
// ============================================

const API_KEY = '3e194ea437c773f7a95d7fc5e3ddfbe3'; // ⚠️ REPLACE WITH YOUR WORKING KEY

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingSpinner = document.getElementById('loadingSpinner');
const currentWeatherDiv = document.getElementById('currentWeather');
const forecastSection = document.getElementById('forecastSection');
const forecastDiv = document.getElementById('forecast');
const suggestionsDropdown = document.getElementById('suggestionsDropdown');
const themeToggle = document.getElementById('themeToggle');

// Default city
const DEFAULT_CITY = 'London';

// Debounce timer for autocomplete
let debounceTimer;

// ============================================
// HELPER FUNCTIONS
// ============================================

function showLoading() {
    loadingSpinner.classList.remove('hidden');
    currentWeatherDiv.classList.add('hidden');
    forecastSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    currentWeatherDiv.classList.add('hidden');
    forecastSection.classList.add('hidden');
    hideLoading();
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function saveLastCity(city) {
    localStorage.setItem('lastWeatherCity', city);
}

function getLastCity() {
    return localStorage.getItem('lastWeatherCity') || DEFAULT_CITY;
}

// ============================================
// CITY AUTOCOMPLETE (USING OPENWEATHERMAP GEO API)
// ============================================

async function fetchCitySuggestions(query) {
    if (query.length < 2) {
        suggestionsDropdown.classList.add('hidden');
        return;
    }
    
    try {
        // Using OpenWeatherMap's Geocoding API
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
        const response = await fetch(geoUrl);
        const cities = await response.json();
        
        if (cities.length > 0) {
            displaySuggestions(cities);
        } else {
            suggestionsDropdown.classList.add('hidden');
        }
    } catch (error) {
        console.error('Autocomplete error:', error);
        suggestionsDropdown.classList.add('hidden');
    }
}

function displaySuggestions(cities) {
    suggestionsDropdown.innerHTML = '';
    
    cities.forEach(city => {
        const countryName = getCountryName(city.country);
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.innerHTML = `
            <span class="suggestion-name">${city.name}</span>
            <span class="suggestion-country">${countryName}</span>
            ${city.state ? `<span class="suggestion-country">, ${city.state}</span>` : ''}
        `;
        
        suggestion.addEventListener('click', () => {
            cityInput.value = city.name;
            suggestionsDropdown.classList.add('hidden');
            fetchWeather(city.name);
        });
        
        suggestionsDropdown.appendChild(suggestion);
    });
    
    suggestionsDropdown.classList.remove('hidden');
}

// Helper: Convert country code to full name (common countries)
function getCountryName(code) {
    const countries = {
        'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada',
        'AU': 'Australia', 'IN': 'India', 'DE': 'Germany', 'FR': 'France',
        'JP': 'Japan', 'CN': 'China', 'BR': 'Brazil', 'ZA': 'South Africa',
        'IT': 'Italy', 'ES': 'Spain', 'MX': 'Mexico', 'KR': 'South Korea',
        'NL': 'Netherlands', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark',
        'FI': 'Finland', 'NZ': 'New Zealand', 'SG': 'Singapore', 'MY': 'Malaysia'
    };
    return countries[code] || code;
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
        suggestionsDropdown.classList.add('hidden');
    }
});

// ============================================
// API FUNCTIONS
// ============================================

async function fetchWeather(city) {
    try {
        showLoading();
        hideError();
        suggestionsDropdown.classList.add('hidden');
        
        // Fetch current weather
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const currentResponse = await fetch(currentUrl);
        
        if (!currentResponse.ok) {
            if (currentResponse.status === 404) {
                throw new Error(`"${city}" not found. Please check spelling.`);
            } else if (currentResponse.status === 401) {
                throw new Error('API key error. Please check your key.');
            } else {
                throw new Error('Unable to fetch weather data.');
            }
        }
        
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        
        saveLastCity(city);
        hideLoading();
        
    } catch (error) {
        showError(error.message);
    }
}

function displayCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${getCountryName(data.sys.country)}`;
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('windSpeed').textContent = Math.round(data.wind.speed);
    document.getElementById('feelsLike').textContent = Math.round(data.main.feels_like);
    
    const visibilityKm = (data.visibility / 1000).toFixed(1);
    document.getElementById('visibility').textContent = visibilityKm;
    
    // Get weather condition with better icon mapping (SOLID icons)
    const weatherMain = data.weather[0].main.toLowerCase();
    const weatherIcon = data.weather[0].icon;
    const isNight = weatherIcon.includes('n');
    
    // Map to SOLID FontAwesome icons (visible!)
    let iconClass = '';
    
    if (weatherMain === 'clear') {
        iconClass = isNight ? 'fa-moon' : 'fa-sun';
    } else if (weatherMain === 'clouds') {
        iconClass = 'fa-cloud';
    } else if (weatherMain === 'rain') {
        iconClass = 'fa-cloud-rain';
    } else if (weatherMain === 'drizzle') {
        iconClass = 'fa-cloud-rain';
    } else if (weatherMain === 'thunderstorm') {
        iconClass = 'fa-cloud-bolt';
    } else if (weatherMain === 'snow') {
        iconClass = 'fa-snowflake';
    } else if (weatherMain === 'mist' || weatherMain === 'fog' || weatherMain === 'haze') {
        iconClass = 'fa-smog';
    } else {
        iconClass = 'fa-cloud-sun';
    }
    
    // Replace the icon element
    const weatherIconContainer = document.getElementById('weatherIcon');
    weatherIconContainer.outerHTML = `<i id="weatherIcon" class="fas ${iconClass}" style="font-size: 72px; color: var(--accent);"></i>`;
    
    currentWeatherDiv.classList.remove('hidden');
}

function displayForecast(data) {
    forecastDiv.innerHTML = '';
    
    const dailyForecasts = [];
    const seenDates = new Set();
    
    for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0];
        if (!seenDates.has(date) && item.dt_txt.includes('12:00:00')) {
            seenDates.add(date);
            dailyForecasts.push(item);
        }
        if (dailyForecasts.length === 5) break;
    }
    
    if (dailyForecasts.length < 5) {
        seenDates.clear();
        dailyForecasts.length = 0;
        for (const item of data.list) {
            const date = item.dt_txt.split(' ')[0];
            if (!seenDates.has(date)) {
                seenDates.add(date);
                dailyForecasts.push(item);
            }
            if (dailyForecasts.length === 5) break;
        }
    }
    
    dailyForecasts.forEach(forecast => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const date = new Date(forecast.dt_txt);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const weatherMain = forecast.weather[0].main.toLowerCase();
        const weatherIcon = forecast.weather[0].icon;
        const isNight = weatherIcon.includes('n');
        
        // Map to SOLID icons
        let iconClass = '';
        if (weatherMain === 'clear') {
            iconClass = isNight ? 'fa-moon' : 'fa-sun';
        } else if (weatherMain === 'clouds') {
            iconClass = 'fa-cloud';
        } else if (weatherMain === 'rain' || weatherMain === 'drizzle') {
            iconClass = 'fa-cloud-rain';
        } else if (weatherMain === 'thunderstorm') {
            iconClass = 'fa-cloud-bolt';
        } else if (weatherMain === 'snow') {
            iconClass = 'fa-snowflake';
        } else if (weatherMain === 'mist' || weatherMain === 'fog' || weatherMain === 'haze') {
            iconClass = 'fa-smog';
        } else {
            iconClass = 'fa-cloud-sun';
        }
        
        const temp = Math.round(forecast.main.temp);
        const description = forecast.weather[0].description;
        
        card.innerHTML = `
            <div class="forecast-date">${dayName}<br><small>${monthDay}</small></div>
            <i class="fas ${iconClass}" style="font-size: 38px; color: var(--accent); margin: 10px 0;"></i>
            <div class="forecast-temp">${temp}°C</div>
            <div class="forecast-desc">${description}</div>
        `;
        
        forecastDiv.appendChild(card);
    });
    
    forecastSection.classList.remove('hidden');
}

// ============================================
// EVENT HANDLERS
// ============================================

function searchWeather() {
    const city = cityInput.value.trim();
    if (city === '') {
        showError('Please enter a city name');
        return;
    }
    fetchWeather(city);
}

function refreshWeather() {
    const currentCity = document.getElementById('cityName').textContent.split(',')[0];
    if (currentCity) {
        fetchWeather(currentCity);
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================

function initTheme() {
    const savedTheme = localStorage.getItem('weatherTheme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'light') {
        icon.className = 'fas fa-moon';
    } else {
        icon.className = 'fas fa-sun';
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('weatherTheme', newTheme);
    updateThemeIcon(newTheme);
}

// Add event listener for theme toggle
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Autocomplete with debouncing
cityInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    debounceTimer = setTimeout(() => {
        if (query.length >= 2) {
            fetchCitySuggestions(query);
        } else {
            suggestionsDropdown.classList.add('hidden');
        }
    }, 300);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

searchBtn.addEventListener('click', searchWeather);
if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshWeather);
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    initTheme();  // Add this line
    const lastCity = getLastCity();
    cityInput.value = lastCity;
    fetchWeather(lastCity);
}

init();