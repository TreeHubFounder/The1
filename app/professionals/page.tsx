
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Star, Shield, Users } from 'lucide-react';

export default function ProfessionalsPage() {
  return (
    <div className="min-h-screen bg-treehub-industrial-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            Find Tree Care Professionals
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with verified, experienced tree care professionals in your area. 
            All professionals are background-checked and certified.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Professionals */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-treehub-safety-orange rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  Professional {i}
                  <Badge variant="verified" size="sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Certified Arborist with {5 + i} years experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Austin, TX ({10 + i} miles)
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-400" />
                    4.{8 + i}/5.0 ({20 + i * 3} reviews)
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {15 + i * 2} completed jobs
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Specializations:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="info" size="sm">Tree Removal</Badge>
                    <Badge variant="info" size="sm">Pruning</Badge>
                    {i % 2 === 0 && <Badge variant="info" size="sm">Emergency</Badge>}
                  </div>
                </div>
                <Button className="w-full">
                  Sign In to Contact
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Shield className="h-12 w-12 text-treehub-forest-green mx-auto mb-4" />
              <h3 className="text-xl font-bold text-treehub-forest-green mb-2">
                All Professionals Are Verified
              </h3>
              <p className="text-gray-600 mb-6">
                Every professional on TreeHub undergoes certification verification, 
                background checks, and insurance validation for your peace of mind.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg">
                  Post a Job
                </Button>
                <Button variant="outline" size="lg">
                  Join as Professional
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
