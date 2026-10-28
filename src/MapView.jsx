import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { locationApi } from './api/locationApi'
import {
    Circle,
    LayerGroup,
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './css/MapView.css'

const defaultLocation = {
    name: 'Berlin',
    city: 'Berlin',
    area: 'Berlin',
    country: 'Germany',
    latitude: 52.52,
    longitude: 13.41,
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
    61: 'Rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Rain showers',
    82: 'Heavy showers',
    95: 'Thunderstorm',
}

const mapLayers = {
    street: {
        label: 'Street map',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    satellite: {
        label: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
        labelsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        labelsAttribution: 'Labels &copy; Esri',
    },
    topographic: {
        label: 'Topographic',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: 'Map data &copy; OpenTopoMap contributors',
    },
}

function locationTitle(location) {
    return location.city || location.name || 'Pinned location'
}

function locationSubtitle(location) {
    return [location.area, location.country]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(' / ') || location.displayName || 'No city or area found for this point'
}

function displayLocation(location) {
    const title = locationTitle(location)
    const subtitle = [location.area, location.country]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(', ')

    return subtitle ? `${title}, ${subtitle}` : title
}

function weatherDescription(code) {
    return weatherLabels[code] || 'Current conditions'
}

function formatTemperature(value, unit) {
    if (value === undefined || value === null) return '--'
    const temperature = unit === 'F' ? ((value * 9) / 5) + 32 : value
    return `${Math.round(temperature)}°${unit}`
}

function MapPosition({ location }) {
    const map = useMap()
    const hasMounted = useRef(false)

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true
            return
        }

        map.flyTo([location.latitude, location.longitude], 10, { animate: true, duration: 0.7 })
    }, [location, map])

    return null
}

function MapClickHandler({ onSelect }) {
    useMapEvents({
        click: (event) => {
            if (event.originalEvent?.target?.closest?.('.map-locate-button')) return
            onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng })
        },
    })

    return null
}

function LocateControl({ onLocated, onError }) {
    const map = useMap()
    const [isLocating, setIsLocating] = useState(false)

    const requestLocation = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (!navigator.geolocation) {
            onError('This browser does not support location access.')
            return
        }

        setIsLocating(true)

        try {
            if (navigator.permissions?.query) {
                const permission = await navigator.permissions.query({ name: 'geolocation' })
                if (permission.state === 'denied') {
                    setIsLocating(false)
                    onError('Location is blocked for SkyData. Click the location icon in the address bar, allow access, then try again.')
                    return
                }
            }
        } catch {
            // Some browsers do not expose the Permissions API. The geolocation request still works.
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setIsLocating(false)
                const coordinates = { latitude: coords.latitude, longitude: coords.longitude }
                map.flyTo([coordinates.latitude, coordinates.longitude], 12, { animate: true, duration: 0.8 })
                onLocated(coordinates)
            },
            (geolocationError) => {
                setIsLocating(false)
                const messages = {
                    1: 'Location is blocked for SkyData. Click the location icon in the address bar, allow access, then try again.',
                    2: 'Your device could not determine your location. Check GPS or network access and try again.',
                    3: 'The location request timed out. Try again in a moment.',
                }
                onError(messages[geolocationError.code] || 'Location access was unavailable. Check your browser permission.')
            },
            { enableHighAccuracy: false, maximumAge: 300000, timeout: 15000 },
        )
    }

    return (
        <button className="map-locate-button" type="button" onMouseDown={(event) => event.stopPropagation()} onClick={requestLocation} disabled={isLocating} title="Center the map on your current location">
            {isLocating ? 'Locating...' : 'Locate me'}
        </button>
    )
}

function MapLayerMenu({
    baseLayer,
    setBaseLayer,
    showSavedLocations,
    setShowSavedLocations,
    showRadius,
    setShowRadius,
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="map-layer-menu">
            <button className={`map-layer-trigger ${isOpen ? 'open' : ''}`} type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} aria-controls="map-layer-panel">
                <span className="map-layer-trigger-icon" aria-hidden="true">+</span>
                <span>Map layers</span>
                <small>{mapLayers[baseLayer].label}</small>
                <span className="map-layer-chevron" aria-hidden="true">{isOpen ? '-' : '+'}</span>
            </button>

            {isOpen && <div className="map-layer-panel" id="map-layer-panel">
                <div className="map-layer-panel-heading">
                    <div>
                        <span>Display controls</span>
                        <strong>Map layers</strong>
                    </div>
                    <button type="button" onClick={() => setIsOpen(false)} aria-label="Close map layers">x</button>
                </div>

                <p className="map-layer-label">Base map</p>
                <div className="map-layer-options">
                    {Object.entries(mapLayers).map(([key, layer]) => <button className={baseLayer === key ? 'active' : ''} type="button" key={key} onClick={() => setBaseLayer(key)} aria-pressed={baseLayer === key}>
                        <span className="map-layer-radio" aria-hidden="true">{baseLayer === key ? 'o' : ' '}</span>
                        {layer.label}
                    </button>)}
                </div>

                <p className="map-layer-label">Overlays</p>
                <label className="map-layer-toggle">
                    <span><strong>Saved locations</strong><small>Show your saved places</small></span>
                    <input type="checkbox" checked={showSavedLocations} onChange={(event) => setShowSavedLocations(event.target.checked)} />
                    <i aria-hidden="true" />
                </label>
                <label className="map-layer-toggle">
                    <span><strong>Selected radius</strong><small>Show a 15 km radius</small></span>
                    <input type="checkbox" checked={showRadius} onChange={(event) => setShowRadius(event.target.checked)} />
                    <i aria-hidden="true" />
                </label>
            </div>}
        </div>
    )
}

function MapSettingsPanel({ temperatureUnit, onTemperatureUnitChange, isDarkMode, onToggleDarkMode, onClose }) {
    return (
        <div className="map-settings-layer">
            <button className="map-settings-backdrop" type="button" onClick={onClose} aria-label="Close map settings" />
            <section className="map-settings-panel" role="dialog" aria-modal="true" aria-label="Map settings">
                <div className="map-settings-heading">
                    <div>
                        <p>Preferences</p>
                        <h2>Map settings</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close map settings">x</button>
                </div>

                <div className="map-setting-row">
                    <div>
                        <strong>Temperature unit</strong>
                        <span>Choose how temperatures are displayed</span>
                    </div>
                    <div className="map-unit-toggle" role="group" aria-label="Temperature unit">
                        <button type="button" className={temperatureUnit === 'C' ? 'selected' : ''} onClick={() => onTemperatureUnitChange('C')} aria-pressed={temperatureUnit === 'C'}>°C</button>
                        <button type="button" className={temperatureUnit === 'F' ? 'selected' : ''} onClick={() => onTemperatureUnitChange('F')} aria-pressed={temperatureUnit === 'F'}>°F</button>
                    </div>
                </div>

                <div className="map-setting-row">
                    <div>
                        <strong>Dark mode</strong>
                        <span>{isDarkMode ? 'Use the darker map interface' : 'Use the lighter map interface'}</span>
                    </div>
                    <button type="button" className={`map-theme-toggle ${isDarkMode ? 'selected' : ''}`} onClick={onToggleDarkMode} aria-pressed={isDarkMode} aria-label="Toggle dark mode"><i /></button>
                </div>
            </section>
        </div>
    )
}

function PlacePanel({ location, weather, temperatureUnit, isWeatherLoading, isResolvingLocation, activeSavedLocation, isSavingLocation, onSave }) {
    const temperature = weather?.temperature_2m
    const feelsLike = weather?.apparent_temperature
    const humidity = weather?.relative_humidity_2m
    const wind = weather?.wind_speed_10m

    return (
        <aside className="map-place-panel" aria-label="Selected place information">
            <div className="map-place-panel-topline"><span>Selected point</span><span className="map-live-dot">Live</span></div>
            <h2>{locationTitle(location)}</h2>
            <p className="map-place-subtitle">{isResolvingLocation ? 'Finding city and area...' : locationSubtitle(location)}</p>

            <div className="map-current-weather">
                <div>
                    <span>Current temperature</span>
                    <strong>{isWeatherLoading ? '--' : formatTemperature(temperature, temperatureUnit)}</strong>
                </div>
                <div className="map-weather-state">{weatherDescription(weather?.weather_code)}</div>
            </div>

            <div className="map-place-grid">
                <div><span>Area</span><strong>{location.area || 'Not available'}</strong></div>
                <div><span>Country</span><strong>{location.country || 'Not available'}</strong></div>
                <div><span>Feels like</span><strong>{feelsLike == null ? '--' : formatTemperature(feelsLike, temperatureUnit)}</strong></div>
                <div><span>Humidity</span><strong>{humidity == null ? '--' : `${Math.round(humidity)}%`}</strong></div>
                <div><span>Wind</span><strong>{wind == null ? '--' : `${Math.round(wind)} km/h`}</strong></div>
                <div><span>Coordinates</span><strong>{location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}</strong></div>
            </div>

            <button className={`map-save-button ${activeSavedLocation ? 'saved' : ''}`} type="button" onClick={onSave} disabled={isSavingLocation}>
                {isSavingLocation ? 'Saving...' : activeSavedLocation ? 'Remove saved place' : 'Save this place'}
            </button>
        </aside>
    )
}

export default function MapView() {
    const navigate = useNavigate()
    const [location, setLocation] = useState(defaultLocation)
    const [search, setSearch] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState('')
    const [weather, setWeather] = useState(null)
    const [isWeatherLoading, setIsWeatherLoading] = useState(true)
    const [savedLocations, setSavedLocations] = useState([])
    const [isSavingLocation, setIsSavingLocation] = useState(false)
    const [baseLayer, setBaseLayer] = useState('street')
    const [showSavedLocations, setShowSavedLocations] = useState(true)
    const [showRadius, setShowRadius] = useState(true)
    const [isResolvingLocation, setIsResolvingLocation] = useState(false)
    const [temperatureUnit, setTemperatureUnit] = useState(() => localStorage.getItem('temperature_unit') || 'C')
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true')
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const reverseRequestRef = useRef(0)
    const reverseControllerRef = useRef(null)

    const selectLocation = useCallback((nextLocation) => {
        setLocation(nextLocation)
        setError('')
    }, [])

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

    const resolveCoordinates = useCallback(async ({ latitude, longitude }, fallback) => {
        const requestId = reverseRequestRef.current + 1
        reverseRequestRef.current = requestId
        reverseControllerRef.current?.abort()
        const controller = new AbortController()
        reverseControllerRef.current = controller
        const pendingLocation = { ...fallback, latitude, longitude }
        const timeoutId = window.setTimeout(() => controller.abort(), 8000)

        selectLocation(pendingLocation)
        setIsResolvingLocation(true)

        try {
            const params = new URLSearchParams({
                format: 'jsonv2',
                lat: latitude,
                lon: longitude,
                zoom: 18,
                addressdetails: 1,
                'accept-language': 'en',
            })
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal: controller.signal })
            if (!response.ok) throw new Error('Reverse geocoding failed')

            const result = await response.json()
            const address = result.address || {}
            const city = address.city || address.town || address.village || address.municipality || address.county || ''
            const area = address.suburb || address.neighbourhood || address.city_district || address.district || address.state_district || address.state || ''
            const placeName = result.name || address.ocean || address.sea || ''

            if (requestId === reverseRequestRef.current) {
                selectLocation({
                    ...pendingLocation,
                    name: city || area || placeName || fallback.name,
                    city,
                    area,
                    country: address.country || fallback.country || null,
                    displayName: placeName || 'No city or area found for this point',
                })
            }
        } catch {
            if (requestId === reverseRequestRef.current) {
                selectLocation({ ...pendingLocation, displayName: 'Place details unavailable' })
                setError('The pin is selected, but place details could not be loaded.')
            }
        } finally {
            window.clearTimeout(timeoutId)
            if (requestId === reverseRequestRef.current) setIsResolvingLocation(false)
        }
    }, [selectLocation])

    const handleLocated = useCallback((coordinates) => {
        resolveCoordinates(coordinates, { name: 'My location', city: '', area: '', country: null })
    }, [resolveCoordinates])

    const handleLocationError = useCallback((message) => setError(message), [])

    useEffect(() => {
        let isCancelled = false

        locationApi.list()
            .then((response) => {
                if (!isCancelled) setSavedLocations(response.data)
            })
            .catch(() => {
                if (!isCancelled) setSavedLocations([])
            })

        return () => {
            isCancelled = true
        }
    }, [])

    const activeSavedLocation = savedLocations.find((savedLocation) =>
        Math.abs(Number(savedLocation.latitude) - location.latitude) < 0.0001
        && Math.abs(Number(savedLocation.longitude) - location.longitude) < 0.0001,
    )

    const toggleSavedLocation = async () => {
        setIsSavingLocation(true)
        setError('')

        try {
            if (activeSavedLocation) {
                await locationApi.remove(activeSavedLocation.id)
                setSavedLocations((current) => current.filter((savedLocation) => savedLocation.id !== activeSavedLocation.id))
            } else {
                const response = await locationApi.save({
                    name: locationTitle(location),
                    country: location.country,
                    latitude: location.latitude,
                    longitude: location.longitude,
                })
                setSavedLocations((current) => [response.data, ...current])
            }
        } catch {
            setError('Unable to update your saved locations.')
        } finally {
            setIsSavingLocation(false)
        }
    }

    useEffect(() => {
        let isCancelled = false
        const params = new URLSearchParams({
            latitude: location.latitude,
            longitude: location.longitude,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
            timezone: 'auto',
            models: 'dwd_icon_seamless',
        })

        const loadWeather = async () => {
            setIsWeatherLoading(true)
            try {
                const response = await fetch(`https://api.open-meteo.com/v1/dwd-icon?${params}`)
                if (!response.ok) throw new Error('Weather request failed')
                if (!isCancelled) setWeather((await response.json()).current)
            } catch {
                if (!isCancelled) setWeather(null)
            } finally {
                if (!isCancelled) setIsWeatherLoading(false)
            }
        }

        loadWeather()

        return () => {
            isCancelled = true
        }
    }, [location.latitude, location.longitude])

    const searchLocation = async (event) => {
        event.preventDefault()
        const query = search.trim()
        if (!query) return

        setIsSearching(true)
        setError('')

        try {
            const params = new URLSearchParams({ name: query, count: 1, language: 'en', format: 'json' })
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
            if (!response.ok) throw new Error('Search failed')
            const result = (await response.json()).results?.[0]
            if (!result) throw new Error('City not found')

            selectLocation({
                name: result.name,
                city: result.name,
                area: result.admin1 || '',
                country: result.country,
                latitude: result.latitude,
                longitude: result.longitude,
            })
            setIsResolvingLocation(false)
        } catch {
            setError('City not found. Try another search.')
        } finally {
            setIsSearching(false)
        }
    }

    const savedMarkers = savedLocations
        .filter((savedLocation) => savedLocation.id !== activeSavedLocation?.id)
        .map((savedLocation) => (
            <Marker
                key={savedLocation.id}
                position={[savedLocation.latitude, savedLocation.longitude]}
                eventHandlers={{
                    click: () => selectLocation({
                        name: savedLocation.name,
                        city: savedLocation.name,
                        area: '',
                        country: savedLocation.country,
                        latitude: Number(savedLocation.latitude),
                        longitude: Number(savedLocation.longitude),
                    }),
                }}
            >
                <Popup>
                    <strong>{displayLocation(savedLocation)}</strong><br />Saved location
                </Popup>
            </Marker>
        ))

    return (
        <main className={`map-view ${isDarkMode ? 'dark-mode' : ''}`}>
            <section className="map-card" aria-label="Interactive weather map">
                <MapContainer center={[location.latitude, location.longitude]} zoom={3} minZoom={2} maxZoom={18} maxBounds={[[-85.05112878, -180], [85.05112878, 180]]} maxBoundsViscosity={0.85} scrollWheelZoom worldCopyJump={false} className="weather-map">
                    <TileLayer
                        key={baseLayer}
                        attribution={mapLayers[baseLayer].attribution}
                        url={mapLayers[baseLayer].url}
                        noWrap
                    />
                    {baseLayer === 'satellite' && <TileLayer
                        key="satellite-labels"
                        attribution={mapLayers.satellite.labelsAttribution}
                        url={mapLayers.satellite.labelsUrl}
                        noWrap
                        zIndex={400}
                    />}
                    {showSavedLocations && <LayerGroup>{savedMarkers}</LayerGroup>}
                    {showRadius && <Circle center={[location.latitude, location.longitude]} radius={15000} pathOptions={{ color: '#3e7dd6', fillColor: '#6da0e4', fillOpacity: 0.12 }} />}
                    <MapPosition location={location} />
                    <MapClickHandler onSelect={(coordinates) => resolveCoordinates(coordinates, { name: 'Pinned location', city: '', area: '', country: null })} />
                    <LocateControl onLocated={handleLocated} onError={handleLocationError} />
                    <Marker position={[location.latitude, location.longitude]}>
                        <Popup>
                            <strong>{displayLocation(location)}</strong><br />
                            {isWeatherLoading ? 'Loading weather...' : `${formatTemperature(weather?.temperature_2m, temperatureUnit)}, ${weatherDescription(weather?.weather_code)}`}
                        </Popup>
                    </Marker>
                </MapContainer>

                <div className="map-intro">
                    <div className="map-intro-topline">
                        <div className="map-brand"><span className="map-brand-mark">S</span><span>SkyData</span><small>WEATHER ATLAS</small></div>
                        <div className="map-intro-actions">
                            <button className="map-settings-button" type="button" onClick={() => setIsSettingsOpen(true)} aria-label="Open map settings" title="Map settings">Settings</button>
                            <button className="map-back-button" type="button" onClick={() => navigate('/home')}>Dashboard</button>
                        </div>
                    </div>
                    <p className="map-eyebrow">Live atmospheric view</p>
                    <h1>Read the sky, anywhere.</h1>
                    <p className="map-intro-copy">Drop a pin to reveal the exact city, area, and live conditions beneath it.</p>
                    <form className="map-search" onSubmit={searchLocation}>
                        <span aria-hidden="true">Search</span>
                        <input type="search" placeholder="Find a city or region" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search city or region" />
                        <button type="submit" disabled={isSearching}>{isSearching ? '...' : 'Find'}</button>
                    </form>
                </div>

                <MapLayerMenu
                    baseLayer={baseLayer}
                    setBaseLayer={setBaseLayer}
                    showSavedLocations={showSavedLocations}
                    setShowSavedLocations={setShowSavedLocations}
                    showRadius={showRadius}
                    setShowRadius={setShowRadius}
                />

                <PlacePanel
                    location={location}
                    weather={weather}
                    temperatureUnit={temperatureUnit}
                    isWeatherLoading={isWeatherLoading}
                    isResolvingLocation={isResolvingLocation}
                    activeSavedLocation={activeSavedLocation}
                    isSavingLocation={isSavingLocation}
                    onSave={toggleSavedLocation}
                />

                <div className="map-hint"><span className="map-hint-dot" />Click anywhere on the map to inspect a new place</div>
                {error && <p className="map-error" role="alert">{error}</p>}

                {isSettingsOpen && <MapSettingsPanel
                    temperatureUnit={temperatureUnit}
                    onTemperatureUnitChange={updateTemperatureUnit}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={toggleDarkMode}
                    onClose={() => setIsSettingsOpen(false)}
                />}
            </section>
        </main>
    )
}
