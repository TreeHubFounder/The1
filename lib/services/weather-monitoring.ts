
import * as cron from 'node-cron';
import { WeatherService } from './weather-service';

export class WeatherMonitoringService {
  private static isRunning = false;
  private static cronJob: any = null;

  // Start automated weather monitoring
  static startMonitoring() {
    if (this.isRunning) {
      console.log('Weather monitoring is already running');
      return;
    }

    console.log('Starting automated weather monitoring...');
    
    // Schedule monitoring every 30 minutes
    this.cronJob = cron.schedule('*/30 * * * *', async () => {
      console.log('Running scheduled weather monitoring...');
      await this.performMonitoringCycle();
    }, {
      timezone: 'America/New_York'
    });

    this.cronJob.start();
    this.isRunning = true;
    
    // Run initial monitoring cycle
    this.performMonitoringCycle();
    
    console.log('Weather monitoring service started successfully');
  }

  // Stop weather monitoring
  static stopMonitoring() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    this.isRunning = false;
    console.log('Weather monitoring service stopped');
  }

  // Perform a complete monitoring cycle
  private static async performMonitoringCycle() {
    try {
      const startTime = Date.now();
      const cities = WeatherService.getMajorCitiesForMonitoring();
      
      console.log(`Starting weather monitoring cycle for ${cities.length} cities...`);
      
      let successCount = 0;
      let stormCount = 0;
      
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
            
            if (hasStorms) {
              stormCount++;
              console.log(`⚠️  Storm conditions detected in ${cityData.city}, ${cityData.state}`);
            }
            
            successCount++;
          }
          
          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to monitor ${cityData.city}, ${cityData.state}:`, error);
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`Weather monitoring cycle completed: ${successCount}/${cities.length} cities processed in ${duration}ms, ${stormCount} storm events detected`);
      
      return {
        success: true,
        processed: successCount,
        total: cities.length,
        stormsDetected: stormCount,
        duration,
      };
    } catch (error) {
      console.error('Weather monitoring cycle failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get monitoring status
  static getStatus() {
    return {
      isRunning: this.isRunning,
      nextScheduledRun: this.cronJob?.getStatus(),
      lastRunTime: new Date().toISOString(),
    };
  }

  // Manual trigger for monitoring cycle
  static async triggerManualCycle() {
    console.log('Manually triggering weather monitoring cycle...');
    return await this.performMonitoringCycle();
  }
}

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  WeatherMonitoringService.startMonitoring();
}
