import './css/SettingsPanel.css'

export default function SettingsPanel({ temperatureUnit, onTemperatureUnitChange, isDarkMode, onToggleDarkMode, onClose }) {
    return (
        <div className="sky-settings-layer">
            <button className="sky-settings-backdrop" type="button" onClick={onClose} aria-label="Close settings" />
            <section className="sky-settings-panel" role="dialog" aria-modal="true" aria-label="Display settings">
                <div className="sky-settings-heading">
                    <div>
                        <p>Preferences</p>
                        <h2>Display settings</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close settings">x</button>
                </div>

                <div className="sky-setting-row">
                    <div>
                        <strong>Temperature unit</strong>
                        <span>Choose how temperatures are displayed</span>
                    </div>
                    <div className="sky-unit-toggle" role="group" aria-label="Temperature unit">
                        <button type="button" className={temperatureUnit === 'C' ? 'selected' : ''} onClick={() => onTemperatureUnitChange('C')} aria-pressed={temperatureUnit === 'C'}>°C</button>
                        <button type="button" className={temperatureUnit === 'F' ? 'selected' : ''} onClick={() => onTemperatureUnitChange('F')} aria-pressed={temperatureUnit === 'F'}>°F</button>
                    </div>
                </div>

                <div className="sky-setting-row">
                    <div>
                        <strong>Dark mode</strong>
                        <span>{isDarkMode ? 'Use the darker interface' : 'Use the lighter interface'}</span>
                    </div>
                    <button type="button" className={`sky-theme-toggle ${isDarkMode ? 'selected' : ''}`} onClick={onToggleDarkMode} aria-pressed={isDarkMode} aria-label="Toggle dark mode"><i /></button>
                </div>
            </section>
        </div>
    )
}
