
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { AlertTriangle, Clock, MapPin, Phone, Shield, Zap } from 'lucide-react';

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-treehub-industrial-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Emergency Alert Banner */}
        <Alert variant="emergency" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-medium">ACTIVE STORM ALERT - Houston Metro Area</h3>
            <p className="text-sm mt-1">
              Severe thunderstorms with 70+ mph winds reported. Emergency tree services needed.
            </p>
          </div>
        </Alert>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            24/7 Emergency Tree Response
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            When storms strike, TreeHub's emergency response network connects you with 
            certified professionals ready to handle urgent tree care situations.
          </p>
        </div>

        {/* Emergency Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="h-8 w-8 text-treehub-safety-orange mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-treehub-forest-green mb-1">&lt;2 Hours</h3>
              <p className="text-gray-600">Average Response Time</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Shield className="h-8 w-8 text-treehub-safety-orange mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-treehub-forest-green mb-1">500+</h3>
              <p className="text-gray-600">Emergency Certified Pros</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Zap className="h-8 w-8 text-treehub-safety-orange mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-treehub-forest-green mb-1">24/7</h3>
              <p className="text-gray-600">Availability</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Emergency Jobs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Active Emergency Situations
            </CardTitle>
            <CardDescription>
              Current high-priority tree emergencies requiring immediate response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Tree Down Blocking Major Highway',
                  location: 'I-45 North, Houston, TX',
                  priority: 'CRITICAL',
                  time: '15 minutes ago',
                  responders: '3 teams dispatched'
                },
                {
                  title: 'Large Oak Fell on Residential Home',
                  location: 'Kingwood, TX',
                  priority: 'HIGH',
                  time: '45 minutes ago',
                  responders: '2 teams en route'
                },
                {
                  title: 'Power Line Entangled in Storm Damage',
                  location: 'The Woodlands, TX',
                  priority: 'HIGH',
                  time: '1 hour ago',
                  responders: '1 certified team assigned'
                }
              ].map((emergency, i) => (
                <div key={i} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-red-900">{emergency.title}</h4>
                    <Badge variant="emergency">{emergency.priority}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-red-700">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {emergency.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {emergency.time}
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      {emergency.responders}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-treehub-forest-green">Report an Emergency</CardTitle>
              <CardDescription>
                If you have an emergency tree situation, contact us immediately
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-100 rounded-lg text-center">
                  <Phone className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-red-900">Emergency Hotline</p>
                  <p className="text-2xl font-bold text-red-600">1-800-TREE-911</p>
                  <p className="text-sm text-red-700">Available 24/7</p>
                </div>
                <Button className="w-full" variant="emergency">
                  Report Emergency Online
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  For life-threatening situations, call 911 first
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-treehub-forest-green">Join Emergency Response Team</CardTitle>
              <CardDescription>
                Become a certified emergency responder and help your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• ISA Certified Arborist</li>
                    <li>• 5+ years experience</li>
                    <li>• Emergency response training</li>
                    <li>• 24/7 availability commitment</li>
                    <li>• Specialized equipment access</li>
                  </ul>
                </div>
                <Button className="w-full" variant="outline">
                  Apply for Emergency Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
