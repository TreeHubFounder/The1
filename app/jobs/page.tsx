
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Clock, DollarSign, AlertTriangle } from 'lucide-react';

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-treehub-industrial-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            Find Tree Care Jobs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover professional tree care opportunities nationwide. Join TreeHub to access our full job marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Jobs */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Emergency Tree Removal {i}</CardTitle>
                  {i <= 2 && <Badge variant="emergency">Emergency</Badge>}
                </div>
                <CardDescription>
                  Professional tree removal needed after storm damage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Houston, TX
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    $2,500 - $3,000
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Posted {i} hours ago
                  </div>
                </div>
                <Button className="w-full">
                  Sign In to View & Bid
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <h3 className="text-xl font-bold text-treehub-forest-green mb-2">
                Join TreeHub for Full Access
              </h3>
              <p className="text-gray-600 mb-6">
                Sign up as a tree care professional to access our complete job marketplace, 
                bid on projects, and grow your business.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg">
                  Sign Up Now
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
