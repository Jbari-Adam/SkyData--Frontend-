import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { locationApi } from './api/locationApi'
import './css/Home.css'

const locations = {
    'Berlin, Germany': { latitude: 52.52, longitude: 13.41 },
}

const weatherLabels = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy showers',
    95: 'Thunderstorm',
    96: 'Hail storm',
    99: 'Hail storm',
}

function weatherSymbol(code = 0) {
    if (code >= 95) return '⚡'
    if (code >= 71) return '❄'
    if (code >= 51 && code <= 82) return '☂'
    if (code >= 45) return '☁'
    if (code === 2 || code === 3) return '◒'
    return '☀'
}

function formatTime(value, options = {}) {
    return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        ...options,
    }).format(new Date(value))
}

function formatDay(value, index) {
    if (index === 0) return 'Today'
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(value))
}

function formatTemperature(value, unit) {
    if (value === undefined || value === null) return '--'
    const temperature = unit === 'F' ? (value * 9) / 5 + 32 : value
    return `${Math.round(temperature)}°${unit}`
}

export default function Home() {
    const navigate = useNavigate()
    const { logout, user } = useAuth()
    const [locationName, setLocationName] = useState('Berlin, Germany')
    const [locationCoordinates, setLocationCoordinates] = useState(locations['Berlin, Germany'])
    const [locationSearch, setLocationSearch] = useState('')
    const [weather, setWeather] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSearching, setIsSearching] = useState(false)
    const [savedLocations, setSavedLocations] = useState([])
    const [savedWeather, setSavedWeather] = useState({})
    const [isSavingLocation, setIsSavingLocation] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [selectedDayIndex, setSelectedDayIndex] = useState(0)
    const [temperatureUnit, setTemperatureUnit] = useState(() => localStorage.getItem('temperature_unit') || 'C')
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true')
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const updateTemperatureUnit = (unit) => {
        setTemperatureUnit(unit)
        localStorage.setItem('temperature_unit', unit)
    }

    const toggleDarkMode = () => {
        setIsDarkMode((current) => {
            localStorage.setItem('dark_mode', String(!current))
            return !current
        })
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)

        try {
            await logout()
            navigate('/login', { replace: true })
        } catch {
            setErrorMessage('Unable to log out. Please try again.')
            setIsLoggingOut(false)
        }
    }

    const handleLocationSearch = async (event) => {
        event.preventDefault()
        const query = locationSearch.trim()

        if (!query) return

        setIsSearching(true)
        setErrorMessage('')

        try {
            const parameters = new URLSearchParams({
                name: query,
                count: 1,
                language: 'en',
                format: 'json',
            })
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${parameters}`)
            if (!response.ok) throw new Error('Location search unavailable')

            const data = await response.json()
            const result = data.results?.[0]
            if (!result) throw new Error('City not found')

            setLocationName(`${result.name}, ${result.country}`)
            setLocationCoordinates({ latitude: result.latitude, longitude: result.longitude })
        } catch {
            setErrorMessage('We could not find that city. Try another name.')
        } finally {
            setIsSearching(false)
        }
    }

    const activeSavedLocation = savedLocations.find((location) =>
        location.name === locationName.split(', ')[0] && location.country === locationName.split(', ')[1],
    )

    const handleSaveLocation = async () => {
        setIsSavingLocation(true)

        try {
            if (activeSavedLocation) {
                await locationApi.remove(activeSavedLocation.id)
                setSavedLocations((current) => current.filter((location) => location.id !== activeSavedLocation.id))
            } else {
                const [name, ...countryParts] = locationName.split(', ')
                const response = await locationApi.save({
                    name,
                    country: countryParts.join(', '),
                    ...locationCoordinates,
                })
                setSavedLocations((current) => [response.data, ...current])
            }
        } catch {
            setErrorMessage('Unable to update your saved locations.')
        } finally {
            setIsSavingLocation(false)
        }
    }

    useEffect(() => {
        locationApi.list()
            .then((response) => setSavedLocations(response.data))
            .catch(() => setSavedLocations([]))
    }, [])

    useEffect(() => {
        let isCancelled = false
        const loadSavedWeather = async () => {
            if (savedLocations.length === 0) {
                setSavedWeather({})
                return
            }

            const weatherEntries = await Promise.all(savedLocations.map(async (savedLocation) => {
                try {
                    const parameters = new URLSearchParams({
                        latitude: savedLocation.latitude,
                        longitude: savedLocation.longitude,
                        current: 'temperature_2m,weather_code',
                        timezone: 'auto',
                        models: 'dwd_icon_seamless',
                    })
                    const response = await fetch(`https://api.open-meteo.com/v1/dwd-icon?${parameters}`)
                    if (!response.ok) return [savedLocation.id, null]
                    return [savedLocation.id, (await response.json()).current]
                } catch {
                    return [savedLocation.id, null]
                }
            }))

            if (!isCancelled) setSavedWeather(Object.fromEntries(weatherEntries))
        }

        loadSavedWeather()

        return () => {
            isCancelled = true
        }
    }, [savedLocations])

    useEffect(() => {
        const parameters = new URLSearchParams({
            latitude: locationCoordinates.latitude,
            longitude: locationCoordinates.longitude,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
            hourly: 'temperature_2m,precipitation_probability,wind_speed_10m,pressure_msl,uv_index',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max',
            timezone: 'auto',
            forecast_days: 7,
            models: 'dwd_icon_seamless',
        })

        const loadForecast = async () => {
            setIsLoading(true)
            setErrorMessage('')

            try {
                const response = await fetch(`https://api.open-meteo.com/v1/dwd-icon?${parameters}`)
                if (!response.ok) throw new Error('Weather service unavailable')
                setWeather(await response.json())
            } catch {
                setErrorMessage('Unable to load the latest forecast.')
            } finally {
                setIsLoading(false)
            }
        }

        loadForecast()
    }, [locationCoordinates, locationName])

    const current = weather?.current
    const daily = weather?.daily
    const hourly = weather?.hourly
    const currentWeatherLabel = weatherLabels[current?.weather_code] || 'Current conditions'
    const hourlyStart = hourly?.time?.findIndex((time) => time >= current?.time) ?? 0
    const currentHourIndex = hourlyStart >= 0 ? hourlyStart : 0
    const hourlyIndexes = [0, 1, 2, 3].map((offset) => currentHourIndex + offset).filter((index) => hourly?.time?.[index])
    const weeklyTemperatures = daily?.temperature_2m_max || []
    const chartMinimum = weeklyTemperatures.length ? Math.floor(Math.min(...weeklyTemperatures) / 5) * 5 : 0
    const chartMaximum = weeklyTemperatures.length ? Math.ceil(Math.max(...weeklyTemperatures) / 5) * 5 : 40
    const chartRange = chartMaximum - chartMinimum || 1
    const chartTicks = [chartMaximum, chartMaximum - chartRange / 3, chartMaximum - (chartRange * 2) / 3, chartMinimum]
    const selectedDay = daily?.time?.[selectedDayIndex] ? {
        date: daily.time[selectedDayIndex],
        high: daily.temperature_2m_max[selectedDayIndex],
        low: daily.temperature_2m_min[selectedDayIndex],
        weatherCode: daily.weather_code[selectedDayIndex],
        rainChance: daily.precipitation_probability_max[selectedDayIndex],
        wind: daily.wind_speed_10m_max[selectedDayIndex],
        sunrise: daily.sunrise[selectedDayIndex],
        sunset: daily.sunset[selectedDayIndex],
    } : null

    return (
        <main className={`dashboard-shell ${isDarkMode ? 'dark-mode' : ''}`}>
            <aside className="dashboard-sidebar">
                <div className="brand-lockup">
                    <span className="brand-icon">✦</span>
                    <span>SkyData</span>
                </div>
                <nav className="dashboard-nav" aria-label="Main navigation">
                    <button className="nav-item active"><span>⌂</span>Dashboard</button>
                    <button className="nav-item" onClick={() => navigate('/map')}><span>◫</span>Map</button>
                    <button className="nav-item" onClick={() => document.getElementById('saved-locations')?.scrollIntoView({ behavior: 'smooth' })}><span>☆</span>Saved location</button>
                </nav>
                <div className="sidebar-footer">
                    <p>System</p>
                    <button className="nav-item" onClick={() => setIsSettingsOpen((current) => !current)}><span>⚙</span>Settings</button>
                    <button className="nav-item logout" onClick={handleLogout} disabled={isLoggingOut}>
                        <span>↪</span>{isLoggingOut ? 'Logging out...' : 'Logout account'}
                    </button>
                </div>
            </aside>

            <section className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <p className="eyebrow">Weather forecast</p>
                        <h1>Good morning.</h1>
                        <p className="date-line">{current ? new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(current.time)) : 'Loading forecast...'}</p>
                    </div>
                    <div className="header-actions">
                        <form className="location-search" onSubmit={handleLocationSearch}>
                            <span>⌕</span>
                            <input
                                type="search"
                                placeholder="Search location"
                                value={locationSearch}
                                onChange={(event) => setLocationSearch(event.target.value)}
                                aria-label="Search location"
                            />
                            <button type="submit" className="search-submit" disabled={isSearching} aria-label="Search location">{isSearching ? '...' : 'Go'}</button>
                        </form>
                        <label className="location-picker">
                            <span>◉</span>
                            <select value={locations[locationName] ? locationName : ''} onChange={(event) => {
                                const selectedLocation = event.target.value
                                const savedLocation = savedLocations.find((location) => `${location.name}, ${location.country}` === selectedLocation)
                                setLocationName(selectedLocation)
                                setLocationCoordinates(locations[selectedLocation] || savedLocation)
                                setLocationSearch(selectedLocation)
                            }} aria-label="Select saved location">
                                <option value="" disabled>Saved locations</option>
                                {Object.keys(locations).map((location) => <option key={location}>{location}</option>)}
                                {savedLocations.map((location) => <option key={location.id} value={`${location.name}, ${location.country}`}>{location.name}, {location.country}</option>)}
                            </select>
                        </label>
                        <button className="round-action" onClick={() => setIsSettingsOpen((current) => !current)} aria-label="Open settings">⚙</button>
                        <button className="avatar" onClick={() => navigate('/profile')} aria-label="Open profile" title="Open profile">{user?.name?.charAt(0).toUpperCase() || 'A'}</button>
                    </div>
                </header>

                {isSettingsOpen && <div className="settings-layer">
                    <button className="settings-backdrop" onClick={() => setIsSettingsOpen(false)} aria-label="Close settings" />
                    <section className="settings-panel" aria-label="Dashboard settings">
                    <div className="settings-heading"><div><p className="eyebrow">Preferences</p><h2>Dashboard settings</h2></div><button className="settings-close" onClick={() => setIsSettingsOpen(false)} aria-label="Close settings">×</button></div>
                    <div className="setting-row"><div><strong>Temperature unit</strong><span>Choose how temperatures are displayed</span></div><div className="unit-toggle"><button type="button" className={temperatureUnit === 'C' ? 'selected' : ''} onClick={() => updateTemperatureUnit('C')} aria-pressed={temperatureUnit === 'C'}>°C</button><button type="button" className={temperatureUnit === 'F' ? 'selected' : ''} onClick={() => updateTemperatureUnit('F')} aria-pressed={temperatureUnit === 'F'}>°F</button></div></div>
                    <div className="setting-row"><div><strong>Dark mode</strong><span>Use a darker dashboard theme</span></div><button type="button" className={`theme-toggle ${isDarkMode ? 'selected' : ''}`} onClick={toggleDarkMode} aria-pressed={isDarkMode}><i /></button></div>
                    </section>
                </div>}

                {errorMessage && <div className="error-banner">{errorMessage}</div>}
                {isLoading && <div className="loading-line">Updating forecast...</div>}

                <div className="overview-heading">
                    <div>
                        <p className="eyebrow">Live conditions</p>
                        <h2>Today overview</h2>
                    </div>
                    <span className="updated-label">DWD ICON model</span>
                </div>

                <section className="metric-grid" aria-label="Weather metrics">
                    <article className="metric-card">
                        <div className="metric-icon wind">≋</div>
                        <div><p>Wind speed</p><strong>{Math.round(current?.wind_speed_10m ?? 0)} <small>km/h</small></strong></div>
                        <span className="metric-trend">↗</span>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon rain">⌁</div>
                        <div><p>Rain chance</p><strong>{daily?.precipitation_probability_max?.[0] ?? 0}<small>%</small></strong></div>
                        <span className="metric-trend">↗</span>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon pressure">≋</div>
                        <div><p>Pressure</p><strong>{Math.round(current?.pressure_msl ?? 0)} <small>hPa</small></strong></div>
                        <span className="metric-trend">↘</span>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon uv">☼</div>
                        <div><p>UV index</p><strong>{hourly?.uv_index?.[currentHourIndex]?.toFixed(1) ?? '0.0'}</strong></div>
                        <span className="metric-trend">↘</span>
                    </article>
                </section>

                <section className="saved-locations-section" id="saved-locations">
                    <div className="panel-heading">
                        <div><p className="eyebrow">Your places</p><h2>Saved locations</h2></div>
                        <span className="updated-label">{savedLocations.length} saved</span>
                    </div>
                    {savedLocations.length === 0 ? (
                        <p className="empty-saved-locations">Search for a city and save it to see its weather here.</p>
                    ) : (
                        <div className="saved-location-grid">
                            {savedLocations.map((savedLocation) => {
                                const savedCondition = savedWeather[savedLocation.id]
                                return <button className="saved-location-card" key={savedLocation.id} onClick={() => {
                                    setLocationName(`${savedLocation.name}, ${savedLocation.country}`)
                                    setLocationCoordinates({ latitude: savedLocation.latitude, longitude: savedLocation.longitude })
                                }}>
                                    <span className="saved-location-name">{savedLocation.name}</span>
                                    <span className="saved-location-country">{savedLocation.country}</span>
                                    <strong>{savedCondition ? formatTemperature(savedCondition.temperature_2m, temperatureUnit) : `--°${temperatureUnit}`}</strong>
                                    <span className="saved-location-status">{savedCondition ? weatherLabels[savedCondition.weather_code] || 'Current conditions' : 'Loading weather...'}</span>
                                </button>
                            })}
                        </div>
                    )}
                </section>

                <section className="temperature-panel">
                    <div className="panel-heading">
                        <div><p className="eyebrow">The week ahead</p><h2>Average weekly temperature</h2></div>
                        <span className="panel-location">{locationName}⌄</span>
                    </div>
                    <div className="chart-area">
                        <div className="chart-y-axis">{chartTicks.map((tick) => <span key={tick}>{formatTemperature(tick, temperatureUnit)}</span>)}</div>
                        <div className="chart-content">
                            <div className="chart-gridlines"><i /><i /><i /><i /></div>
                            <div className="temperature-bars">
                                {weeklyTemperatures.map((temperature, index) => {
                                    const height = Math.max(8, ((temperature - chartMinimum) / chartRange) * 100)
                                    return <button type="button" className={`temperature-point ${index === selectedDayIndex ? 'highlighted' : ''}`} key={`${daily.time[index]}-temperature`} style={{ height: `${height}%` }} onClick={() => setSelectedDayIndex(index)} aria-label={`Show forecast for ${formatDay(daily.time[index], index)}`}><span>{formatTemperature(temperature, temperatureUnit)}</span><b /></button>
                                })}
                            </div>
                            <div className="chart-x-axis">{daily?.time?.map((time, index) => <span key={time}>{formatDay(time, index)}</span>)}</div>
                        </div>
                    </div>
                    {selectedDay && <div className="selected-day-panel">
                        <div><span className="eyebrow">Selected day</span><strong>{formatDay(selectedDay.date, selectedDayIndex)}</strong></div>
                        <div><span>Condition</span><strong>{weatherLabels[selectedDay.weatherCode] || 'Forecast'}</strong></div>
                        <div><span>Temperature</span><strong>{formatTemperature(selectedDay.high, temperatureUnit)} / {formatTemperature(selectedDay.low, temperatureUnit)}</strong></div>
                        <div><span>Rain chance</span><strong>{selectedDay.rainChance ?? 0}%</strong></div>
                        <div><span>Wind</span><strong>{Math.round(selectedDay.wind ?? 0)} km/h</strong></div>
                        <div><span>Sunrise / sunset</span><strong>{formatTime(selectedDay.sunrise)} / {formatTime(selectedDay.sunset)}</strong></div>
                    </div>}
                </section>
            </section>

            <aside className="conditions-panel">
                <div className="conditions-topline"><span>Current location</span><span>{current ? formatTime(current.time) : '--:--'}</span></div>
                <div className="conditions-location-row">
                    <div>
                        <p className="conditions-location">{locationName}</p>
                        <p className="conditions-country">Local forecast</p>
                    </div>
                    <button className={`save-location ${activeSavedLocation ? 'saved' : ''}`} onClick={handleSaveLocation} disabled={isSavingLocation} aria-label={activeSavedLocation ? 'Remove saved location' : 'Save location'}>
                        {activeSavedLocation ? '★' : '☆'}
                    </button>
                </div>
                <div className="current-weather-symbol">{weatherSymbol(current?.weather_code)}</div>
                <div className="current-temperature">{formatTemperature(current?.temperature_2m, temperatureUnit)}</div>
                <div className="current-weather-label">{currentWeatherLabel}</div>
                <div className="conditions-divider" />
                <p className="chance-heading">Chance of rain</p>
                <div className="hourly-rain-list">
                    {hourlyIndexes.map((index) => <div className="rain-row" key={hourly.time[index]}><span>{formatTime(hourly.time[index], { hour: 'numeric' })}</span><i><b style={{ width: `${hourly.precipitation_probability?.[index] || 8}%` }} /></i><em>{hourly.precipitation_probability?.[index] || 0}%</em></div>)}
                </div>
                <div className="conditions-divider" />
                <div className="sunrise-heading"><p>Sunrise & sunset</p><span>{locationName.split(',')[0]}⌄</span></div>
                <div className="sun-card"><span>☼</span><div><small>Sunrise</small><strong>{daily ? formatTime(daily.sunrise[0]) : '--:--'}</strong></div><em>today</em></div>
                <div className="sun-card"><span>☾</span><div><small>Sunset</small><strong>{daily ? formatTime(daily.sunset[0]) : '--:--'}</strong></div><em>today</em></div>
            </aside>
        </main>
    )
}
