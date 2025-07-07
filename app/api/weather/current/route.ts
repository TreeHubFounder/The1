
import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '@/lib/services/weather-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get current weather for a specific location
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const weather = await WeatherService.getCurrentWeather(lat, lon);
    
    if (!weather) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
      );
    }

    // Store weather data if city and state are provided
    if (city && state) {
      await WeatherService.storeWeatherData(weather, city, state);
    }

    // Analyze for storm conditions
    const hasStorms = await WeatherService.analyzeStormConditions(lat, lon, city, state);

    return NextResponse.json({
      success: true,
      data: {
        location: {
          city,
          state,
          latitude: lat,
          longitude: lon,
        },
        current: {
          temperature: weather.main.temp,
          humidity: weather.main.humidity,
          windSpeed: weather.wind.speed,
          windDirection: weather.wind.deg,
          condition: weather.weather[0].main,
          description: weather.weather[0].description,
          pressure: weather.main.pressure,
          visibility: weather.visibility,
        },
        alerts: {
          hasStorms,
          stormRisk: hasStorms ? 'High' : 'Low',
          treeServiceDemand: hasStorms ? 'High' : 'Normal',
        },
        timestamp: new Date(weather.dt * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get current weather:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
