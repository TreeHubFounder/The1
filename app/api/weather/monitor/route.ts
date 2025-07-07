
import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '@/lib/services/weather-service';

export const dynamic = 'force-dynamic';

// Monitor weather for all major cities
export async function POST(request: NextRequest) {
  try {
    const cities = WeatherService.getMajorCitiesForMonitoring();
    const results = [];

    console.log(`Starting weather monitoring for ${cities.length} cities...`);

    for (const cityData of cities) {
      try {
        // Get current weather
        const weather = await WeatherService.getCurrentWeather(cityData.lat, cityData.lon);
        
        if (weather) {
          // Store weather data
          await WeatherService.storeWeatherData(weather, cityData.city, cityData.state);
          
          // Analyze for storm conditions
          const hasStorms = await WeatherService.analyzeStormConditions(
            cityData.lat, 
            cityData.lon, 
            cityData.city, 
            cityData.state
          );

          results.push({
            city: cityData.city,
            state: cityData.state,
            status: 'success',
            hasStorms,
            conditions: weather.weather[0]?.main,
            temperature: weather.main?.temp,
            windSpeed: weather.wind?.speed,
          });
        } else {
          results.push({
            city: cityData.city,
            state: cityData.state,
            status: 'failed',
            error: 'No weather data received',
          });
        }

        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to monitor weather for ${cityData.city}, ${cityData.state}:`, error);
        results.push({
          city: cityData.city,
          state: cityData.state,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const stormCount = results.filter(r => r.hasStorms).length;

    console.log(`Weather monitoring completed: ${successCount}/${cities.length} cities processed, ${stormCount} storm events detected`);

    return NextResponse.json({
      success: true,
      message: `Weather monitoring completed for ${cities.length} cities`,
      results: {
        total: cities.length,
        successful: successCount,
        failed: cities.length - successCount,
        stormsDetected: stormCount,
      },
      data: results,
    });
  } catch (error) {
    console.error('Weather monitoring failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Weather monitoring failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Get weather monitoring status
export async function GET() {
  try {
    // This could be expanded to show monitoring statistics
    return NextResponse.json({
      success: true,
      message: 'Weather monitoring service is active',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get monitoring status',
      },
      { status: 500 }
    );
  }
}
