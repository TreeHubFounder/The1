
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, MapPin, DollarSign, Calendar, Truck } from 'lucide-react';

export default function EquipmentPage() {
  return (
    <div className="min-h-screen bg-treehub-industrial-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            Equipment Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Buy, sell, or rent professional tree care equipment. Find everything 
            from chainsaws to bucket trucks in our specialized marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Equipment */}
          {[
            { name: 'Bucket Truck 2020', type: 'Rental', price: '$350/day', category: 'Trucks' },
            { name: 'Wood Chipper', type: 'Sale', price: '$15,000', category: 'Chippers' },
            { name: 'Stump Grinder', type: 'Rental', price: '$200/day', category: 'Grinders' },
            { name: 'Professional Chainsaw Set', type: 'Sale', price: '$1,200', category: 'Chainsaws' },
            { name: 'Climbing Gear Kit', type: 'Sale', price: '$800', category: 'Safety' },
            { name: 'Crane Service', type: 'Rental', price: '$500/day', category: 'Cranes' },
          ].map((item, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                  <Settings className="h-16 w-16 text-gray-400" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {item.name}
                  <Badge variant={item.type === 'Rental' ? 'info' : 'success'}>
                    {item.type}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Professional grade {item.category.toLowerCase()} equipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {item.price}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Dallas, TX
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Available now
                  </div>
                  {item.type === 'Rental' && (
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Delivery available
                    </div>
                  )}
                </div>
                <Button className="w-full">
                  Sign In to Contact Seller
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Settings className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <h3 className="text-xl font-bold text-treehub-forest-green mb-2">
                Professional Equipment Marketplace
              </h3>
              <p className="text-gray-600 mb-6">
                Access our comprehensive marketplace for tree care equipment. 
                Buy, sell, or rent with confidence from verified suppliers.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg">
                  List Your Equipment
                </Button>
                <Button variant="outline" size="lg">
                  Browse All Categories
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
