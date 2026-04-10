import { useState, useEffect } from 'react';

export default function WeatherWidget() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeather();
    }, []);

    async function fetchWeather() {
        try {
            const res = await fetch(
                'https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.85&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=Asia/Kolkata&forecast_days=3'
            );
            const data = await res.json();
            setWeather(data);
        } catch (err) {
            console.error('Weather fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }

    function getWeatherEmoji(code) {
        if (code <= 3) return '☀️';
        if (code <= 48) return '☁️';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        if (code <= 82) return '🌧️';
        if (code <= 86) return '🌨️';
        return '⛈️';
    }

    function getWeatherText(code) {
        if (code <= 1) return 'Clear';
        if (code <= 3) return 'Partly Cloudy';
        if (code <= 48) return 'Foggy';
        if (code <= 57) return 'Drizzle';
        if (code <= 67) return 'Rain';
        if (code <= 77) return 'Snow';
        if (code <= 82) return 'Heavy Rain';
        return 'Thunderstorm';
    }

    function isHighRisk() {
        if (!weather?.daily?.precipitation_probability_max) return false;
        return weather.daily.precipitation_probability_max[0] > 70;
    }

    if (loading) {
        return (
            <div className="glass-card p-6 animate-pulse">
                <div className="h-4 bg-eco-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-eco-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (!weather) return null;

    const current = weather.current;
    const daily = weather.daily;

    return (
        <div className={`glass-card p-6 card-hover ${isHighRisk() ? 'border-2 border-red-400 shadow-red-100' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-eco-900">🌤️ Pune Weather</h3>
                {isHighRisk() && (
                    <span className="badge bg-red-100 text-red-700 animate-pulse">
                        ⚠️ High Risk
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{getWeatherEmoji(current.weather_code)}</span>
                <div>
                    <p className="text-3xl font-bold text-eco-900">{current.temperature_2m}°C</p>
                    <p className="text-gray-600">{getWeatherText(current.weather_code)}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-eco-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Humidity</p>
                    <p className="font-semibold text-eco-800">{current.relative_humidity_2m}%</p>
                </div>
                <div className="bg-eco-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Wind</p>
                    <p className="font-semibold text-eco-800">{current.wind_speed_10m} km/h</p>
                </div>
            </div>

            {daily && (
                <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Rain Probability (3 days)</p>
                    <div className="flex gap-2">
                        {daily.precipitation_probability_max.map((prob, i) => (
                            <div key={i} className={`flex-1 rounded-lg p-2 text-center text-xs font-medium ${prob > 70 ? 'bg-red-100 text-red-700' : prob > 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                }`}>
                                <p className="text-lg font-bold">{prob}%</p>
                                <p>Day {i + 1}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isHighRisk() && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">
                        ⚠️ Heavy rainfall expected. Landslide risk zones may be active. Stay alert!
                    </p>
                </div>
            )}
        </div>
    );
}
