
import axios from 'axios';
import { prisma } from '@/lib/db';

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'demo_key';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Weather data interfaces
export interface WeatherResponse {
  coord: { lat: number; lon: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: { all: number };
  rain?: { '1h': number; '3h': number };
  snow?: { '1h': number; '3h': number };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface StormAlert {
  id: string;
  event: string;
  start: number;
  end: number;
  description: string;
  instruction?: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  urgency: 'Immediate' | 'Expected' | 'Future' | 'Past';
  areas: Array<{
    geocode: {
      SAME: string[];
      UGC: string[];
    };
    areaDesc: string;
  }>;
}

export class WeatherService {
  // Get current weather for a location
  static async getCurrentWeather(lat: number, lon: number): Promise<WeatherResponse | null> {
    try {
      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'imperial', // Fahrenheit for US tree care industry
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch current weather:', error);
      return null;
    }
  }

  // Get weather forecast for storm prediction
  static async getWeatherForecast(lat: number, lon: number, cnt = 40): Promise<any> {
    try {
      const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'imperial',
          cnt, // Number of forecast points (max 40 for 5-day/3-hour forecast)
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch weather forecast:', error);
      return null;
    }
  }

  // Store weather data in database
  static async storeWeatherData(weatherData: WeatherResponse, city: string, state: string): Promise<void> {
    try {
      const weather = weatherData.weather[0];
      const isStormCondition = this.isStormCondition(weather.main, weatherData.wind.speed);
      
      await prisma.weatherData.create({
        data: {
          city,
          state,
          latitude: weatherData.coord.lat,
          longitude: weatherData.coord.lon,
          temperature: weatherData.main.temp,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          windDirection: this.getWindDirection(weatherData.wind.deg),
          precipitation: (weatherData.rain?.['1h'] || weatherData.snow?.['1h']) || 0,
          pressure: weatherData.main.pressure,
          visibility: weatherData.visibility / 1000, // Convert to kilometers
          condition: weather.main,
          description: weather.description,
          severity: this.getWeatherSeverity(weather.main, weatherData.wind.speed, weatherData.main.temp),
          isStormCondition,
          stormType: isStormCondition ? this.getStormType(weather.main, weatherData.wind.speed) : null,
          alertLevel: isStormCondition ? this.getAlertLevel(weatherData.wind.speed) : null,
          dataSource: 'OpenWeatherMap',
          externalId: weatherData.id.toString(),
          observationTime: new Date(weatherData.dt * 1000),
        },
      });
    } catch (error) {
      console.error('Failed to store weather data:', error);
    }
  }

  // Analyze storm conditions and create storm events
  static async analyzeStormConditions(lat: number, lon: number, city: string, state: string): Promise<boolean> {
    try {
      const forecast = await this.getWeatherForecast(lat, lon);
      if (!forecast) return false;

      const stormPeriods = this.identifyStormPeriods(forecast.list);
      
      for (const period of stormPeriods) {
        await this.createStormEvent(period, city, state, lat, lon);
      }

      return stormPeriods.length > 0;
    } catch (error) {
      console.error('Failed to analyze storm conditions:', error);
      return false;
    }
  }

  // Storm detection algorithms
  private static isStormCondition(condition: string, windSpeed: number): boolean {
    const stormConditions = ['Thunderstorm', 'Tornado', 'Squall'];
    const highWindThreshold = 25; // mph
    
    return stormConditions.includes(condition) || windSpeed > highWindThreshold;
  }

  private static getStormType(condition: string, windSpeed: number): string {
    if (condition === 'Thunderstorm') return 'Thunderstorm';
    if (condition === 'Tornado') return 'Tornado';
    if (windSpeed > 40) return 'High Wind Event';
    if (windSpeed > 25) return 'Wind Advisory';
    return 'Weather Event';
  }

  private static getWeatherSeverity(condition: string, windSpeed: number, temperature: number): string {
    if (condition === 'Tornado' || windSpeed > 50) return 'Severe';
    if (condition === 'Thunderstorm' || windSpeed > 35) return 'High';
    if (windSpeed > 20 || temperature < 32) return 'Medium';
    return 'Low';
  }

  private static getAlertLevel(windSpeed: number): string {
    if (windSpeed > 50) return 'Emergency';
    if (windSpeed > 35) return 'Warning';
    if (windSpeed > 20) return 'Watch';
    return 'Advisory';
  }

  private static getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // Identify storm periods from forecast data
  private static identifyStormPeriods(forecastList: any[]): any[] {
    const stormPeriods = [];
    let currentStorm = null;

    for (const item of forecastList) {
      const weather = item.weather[0];
      const isStorm = this.isStormCondition(weather.main, item.wind.speed);

      if (isStorm) {
        if (!currentStorm) {
          currentStorm = {
            startTime: new Date(item.dt * 1000),
            endTime: new Date(item.dt * 1000),
            type: this.getStormType(weather.main, item.wind.speed),
            maxWindSpeed: item.wind.speed,
            severity: this.getWeatherSeverity(weather.main, item.wind.speed, item.main.temp),
            forecast: [item],
          };
        } else {
          currentStorm.endTime = new Date(item.dt * 1000);
          currentStorm.maxWindSpeed = Math.max(currentStorm.maxWindSpeed, item.wind.speed);
          currentStorm.forecast.push(item);
        }
      } else {
        if (currentStorm) {
          stormPeriods.push(currentStorm);
          currentStorm = null;
        }
      }
    }

    if (currentStorm) {
      stormPeriods.push(currentStorm);
    }

    return stormPeriods;
  }

  // Create storm event in database
  private static async createStormEvent(stormData: any, city: string, state: string, lat: number, lon: number): Promise<void> {
    try {
      const duration = Math.round((stormData.endTime.getTime() - stormData.startTime.getTime()) / (1000 * 60 * 60)); // hours
      
      await prisma.stormEvent.create({
        data: {
          type: stormData.type,
          severity: stormData.severity,
          affectedStates: [state],
          affectedCities: [city],
          affectedZipCodes: [], // Would need geocoding service to determine
          centerLatitude: lat,
          centerLongitude: lon,
          impactRadius: this.calculateImpactRadius(stormData.severity),
          maxWindSpeed: stormData.maxWindSpeed,
          expectedDuration: duration,
          startTime: stormData.startTime,
          endTime: stormData.endTime,
          predictedDamage: this.predictDamageLevel(stormData.maxWindSpeed, stormData.severity),
          treeServiceDemand: this.predictServiceDemand(stormData.maxWindSpeed, stormData.severity),
        },
      });
    } catch (error) {
      console.error('Failed to create storm event:', error);
    }
  }

  // Calculate storm impact radius based on severity
  private static calculateImpactRadius(severity: string): number {
    switch (severity) {
      case 'Severe': return 50;
      case 'High': return 30;
      case 'Medium': return 15;
      default: return 10;
    }
  }

  // Predict damage level for tree services
  private static predictDamageLevel(windSpeed: number, severity: string): string {
    if (windSpeed > 50 || severity === 'Severe') return 'High';
    if (windSpeed > 35 || severity === 'High') return 'Medium';
    return 'Low';
  }

  // Predict tree service demand
  private static predictServiceDemand(windSpeed: number, severity: string): string {
    if (windSpeed > 50 || severity === 'Severe') return 'Extreme';
    if (windSpeed > 35 || severity === 'High') return 'High';
    if (windSpeed > 25 || severity === 'Medium') return 'Medium';
    return 'Low';
  }

  // Get major US cities for monitoring
  static getMajorCitiesForMonitoring() {
    return [
      { city: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
      { city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
      { city: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
      { city: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
      { city: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
      { city: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
      { city: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936 },
      { city: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
      { city: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970 },
      { city: 'San Jose', state: 'CA', lat: 37.3382, lon: -121.8863 },
      { city: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
      { city: 'Jacksonville', state: 'FL', lat: 30.3322, lon: -81.6557 },
      { city: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
      { city: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988 },
      { city: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
      { city: 'Fort Worth', state: 'TX', lat: 32.7555, lon: -97.3308 },
      { city: 'Indianapolis', state: 'IN', lat: 39.7684, lon: -86.1581 },
      { city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
      { city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
      { city: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
      { city: 'El Paso', state: 'TX', lat: 31.7619, lon: -106.4850 },
      { city: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
      { city: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816 },
      { city: 'Memphis', state: 'TN', lat: 35.1495, lon: -90.0490 },
      { city: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
      { city: 'Oklahoma City', state: 'OK', lat: 35.4676, lon: -97.5164 },
      { city: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
      { city: 'Louisville', state: 'KY', lat: 38.2527, lon: -85.7585 },
      { city: 'Baltimore', state: 'MD', lat: 39.2904, lon: -76.6122 },
      { city: 'Milwaukee', state: 'WI', lat: 43.0389, lon: -87.9065 },
      { city: 'Albuquerque', state: 'NM', lat: 35.0844, lon: -106.6504 },
      { city: 'Tucson', state: 'AZ', lat: 32.2226, lon: -110.9747 },
      { city: 'Fresno', state: 'CA', lat: 36.7378, lon: -119.7871 },
      { city: 'Sacramento', state: 'CA', lat: 38.5816, lon: -121.4944 },
      { city: 'Kansas City', state: 'MO', lat: 39.0997, lon: -94.5786 },
      { city: 'Mesa', state: 'AZ', lat: 33.4152, lon: -111.8315 },
      { city: 'Virginia Beach', state: 'VA', lat: 36.8529, lon: -75.9780 },
      { city: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880 },
      { city: 'Colorado Springs', state: 'CO', lat: 38.8339, lon: -104.8214 },
      { city: 'Raleigh', state: 'NC', lat: 35.7796, lon: -78.6382 },
      { city: 'Omaha', state: 'NE', lat: 41.2565, lon: -95.9345 },
      { city: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
      { city: 'Oakland', state: 'CA', lat: 37.8044, lon: -122.2711 },
      { city: 'Minneapolis', state: 'MN', lat: 44.9778, lon: -93.2650 },
      { city: 'Tulsa', state: 'OK', lat: 36.1540, lon: -95.9928 },
      { city: 'Cleveland', state: 'OH', lat: 41.4993, lon: -81.6944 },
      { city: 'Wichita', state: 'KS', lat: 37.6872, lon: -97.3301 },
      { city: 'Arlington', state: 'TX', lat: 32.7357, lon: -97.1081 },
      { city: 'New Orleans', state: 'LA', lat: 29.9511, lon: -90.0715 },
      { city: 'Bakersfield', state: 'CA', lat: 35.3733, lon: -119.0187 },
      { city: 'Tampa', state: 'FL', lat: 27.9506, lon: -82.4572 },
    ];
  }
}
