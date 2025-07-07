
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Shield, CheckCircle, ExternalLink, Users, Clock } from 'lucide-react';

export default function CertificationsPage() {
  return (
    <div className="min-h-screen bg-treehub-industrial-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            Professional Certifications
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            TreeHub recognizes and verifies industry-standard certifications. 
            Build your credibility and earn more opportunities with proper credentials.
          </p>
        </div>

        {/* Certification Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <h3 className="font-bold text-treehub-forest-green mb-2">Higher Trust</h3>
              <p className="text-gray-600 text-sm">
                Certified professionals receive 40% more job inquiries
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <h3 className="font-bold text-treehub-forest-green mb-2">Premium Access</h3>
              <p className="text-gray-600 text-sm">
                Certified users get priority access to high-value jobs
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Award className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <h3 className="font-bold text-treehub-forest-green mb-2">Better Rates</h3>
              <p className="text-gray-600 text-sm">
                Certified professionals command 25% higher rates on average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recognized Certifications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recognized Professional Certifications</CardTitle>
            <CardDescription>
              Industry-standard certifications verified by TreeHub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ISA Certifications */}
              <div className="space-y-4">
                <h3 className="font-medium text-treehub-forest-green flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  International Society of Arboriculture (ISA)
                </h3>
                
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">ISA Certified Arborist</span>
                      <Badge variant="verified">Verified</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      The gold standard for tree care professionals
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Requires 3+ years experience
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Tree Worker Climber Specialist</span>
                      <Badge variant="verified">Verified</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Specialized certification for climbing arborists
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Additional safety training required
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Utility Specialist</span>
                      <Badge variant="verified">Verified</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      For professionals working near power lines
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Annual recertification required
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Certifications */}
              <div className="space-y-4">
                <h3 className="font-medium text-treehub-forest-green flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Other Industry Certifications
                </h3>
                
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">TCIA Accreditation</span>
                      <Badge variant="verified">Verified</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tree Care Industry Association company accreditation
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">OSHA 10/30 Hour Training</span>
                      <Badge variant="success">Required</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Occupational safety and health training
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">CDL License</span>
                      <Badge variant="info">Preferred</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Commercial driver's license for equipment operators
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Crane Operator License</span>
                      <Badge variant="info">Specialized</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      NCCCO certified crane operator certification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certification Process */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>How to Get Verified</CardTitle>
              <CardDescription>
                Simple steps to verify your certifications on TreeHub
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-treehub-safety-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Upload Documentation</p>
                    <p className="text-sm text-gray-600">
                      Scan and upload your certification documents
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-treehub-safety-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Verification Review</p>
                    <p className="text-sm text-gray-600">
                      Our team verifies with issuing organizations
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-treehub-safety-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Get Verified Badge</p>
                    <p className="text-sm text-gray-600">
                      Receive verified status on your profile
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-treehub-safety-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Ongoing Monitoring</p>
                    <p className="text-sm text-gray-600">
                      We track expiration dates and renewal requirements
                    </p>
                  </div>
                </div>

                <Button className="w-full mt-4">
                  Start Verification Process
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certification Resources</CardTitle>
              <CardDescription>
                Links to certification programs and training resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">ISA Certification Program</p>
                      <p className="text-sm text-gray-600">Get ISA certified</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">TCIA Training Programs</p>
                      <p className="text-sm text-gray-600">Professional development</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">OSHA Training Centers</p>
                      <p className="text-sm text-gray-600">Safety training locations</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Continuing Education</p>
                      <p className="text-sm text-gray-600">CEU requirements and courses</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="p-4 bg-treehub-safety-orange-50 border border-treehub-safety-orange-200 rounded-lg mt-4">
                  <p className="text-treehub-safety-orange-800 font-medium text-sm">
                    💡 Pro Tip: Maintain multiple certifications to access more job opportunities 
                    and command higher rates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-treehub-forest-green mb-2">
                Ready to Get Verified?
              </h3>
              <p className="text-gray-600 mb-6">
                Join thousands of verified professionals on TreeHub. 
                Upload your certifications and start earning more today.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg">
                  Upload Certifications
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
