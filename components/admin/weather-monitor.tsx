
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { 
  Cloud, 
  CloudRain, 
  Wind, 
  AlertTriangle, 
  MapPin,
  Thermometer,
  Eye,
  RefreshCw
} from 'lucide-react';

interface WeatherMonitorProps {
  data: any;
}

export default function WeatherMonitor({ data }: WeatherMonitorProps) {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [monitoring, setMonitoring] = useState(false);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      const response = await fetch('/api/weather/storms');
      const result = await response.json();
      setWeatherData(result.data);
    } catch (error) {
      console.error('Failed to load weather data:', error);
    }
  };

  const startWeatherMonitoring = async () => {
    try {
      setMonitoring(true);
      const response = await fetch('/api/weather/monitor', {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadWeatherData();
      }
    } catch (error) {
      console.error('Failed to start weather monitoring:', error);
    } finally {
      setMonitoring(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      'Extreme': 'bg-red-100 text-red-800 border-red-200',
      'Severe': 'bg-orange-100 text-orange-800 border-orange-200',
      'Major': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Moderate': 'bg-blue-100 text-blue-800 border-blue-200',
      'Minor': 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getDemandColor = (demand: string) => {
    const colors: { [key: string]: string } = {
      'Extreme': 'text-red-600',
      'High': 'text-orange-600',
      'Medium': 'text-yellow-600',
      'Low': 'text-green-600',
    };
    return colors[demand] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Weather Monitoring Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-blue-600" />
              <span>Weather Monitoring System</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={loadWeatherData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={startWeatherMonitoring} disabled={monitoring}>
                {monitoring ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Cloud className="h-4 w-4 mr-2" />
                )}
                {monitoring ? 'Monitoring...' : 'Run Weather Scan'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Cloud className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Active Storms</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {weatherData?.storms?.length || 0}
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-medium">High Severity</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {weatherData?.storms?.filter((s: any) => 
                  s.severity === 'Extreme' || s.severity === 'Severe'
                ).length || 0}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wind className="h-5 w-5 text-green-600" />
                <span className="font-medium">Service Demand</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {weatherData?.metrics?.estimatedTreeServiceDemand || 0}
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Affected States</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {Object.keys(weatherData?.metrics?.topAffectedStates || {}).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Storm Events */}
      <Card>
        <CardHeader>
          <CardTitle>Active Storm Events</CardTitle>
        </CardHeader>
        <CardContent>
          {weatherData?.storms?.length > 0 ? (
            <div className="space-y-4">
              {weatherData.storms.map((storm: any) => (
                <div key={storm.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {storm.name || `${storm.type} Event`}
                        </h3>
                        <Badge className={getSeverityColor(storm.severity)}>
                          {storm.severity}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{storm.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Started: {new Date(storm.startTime).toLocaleString()}
                      </p>
                      {storm.endTime && (
                        <p className="text-sm text-gray-500">
                          Ends: {new Date(storm.endTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Storm Characteristics</h4>
                      <div className="space-y-1 text-sm">
                        {storm.maxWindSpeed && (
                          <div className="flex items-center space-x-2">
                            <Wind className="h-4 w-4 text-gray-400" />
                            <span>Max Wind: {storm.maxWindSpeed} mph</span>
                          </div>
                        )}
                        {storm.impactRadius && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>Impact Radius: {storm.impactRadius} miles</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Affected Areas</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-600">States: </span>
                          <span>{storm.affectedStates.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cities: </span>
                          <span>{storm.affectedCities.slice(0, 3).join(', ')}</span>
                          {storm.affectedCities.length > 3 && (
                            <span className="text-gray-500"> +{storm.affectedCities.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Business Impact</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-600">Predicted Damage: </span>
                          <span className="font-medium">{storm.predictedDamage || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Service Demand: </span>
                          <span className={`font-medium ${getDemandColor(storm.treeServiceDemand)}`}>
                            {storm.treeServiceDemand || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storm Response Data */}
                  {storm.stormResponses && storm.stormResponses.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm mb-2">AI Response Activity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        {storm.stormResponses.map((response: any) => (
                          <div key={response.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Leads Generated</span>
                              <span className="text-lg font-bold text-blue-600">
                                {response.leadsGenerated}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Crews Alerted: {response.crewsAlerted}</div>
                              <div>Est. Revenue: ${response.estimatedRevenue?.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Cloud className="h-4 w-4" />
              <AlertDescription>
                No active storm events detected. The system is continuously monitoring weather conditions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Monitoring Statistics */}
      {weatherData?.metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Monitoring Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4">Severity Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(weatherData.metrics.severityBreakdown).map(([severity, count]: [string, any]) => (
                    <div key={severity} className="flex items-center justify-between p-2 border rounded">
                      <span className="capitalize">{severity}</span>
                      <Badge className={getSeverityColor(severity)}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Top Affected States</h4>
                <div className="space-y-2">
                  {Object.entries(weatherData.metrics.topAffectedStates)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([state, count]: [string, any]) => (
                    <div key={state} className="flex items-center justify-between p-2 border rounded">
                      <span>{state}</span>
                      <Badge variant="outline">{count} events</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
