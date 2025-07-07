
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Shield, AlertTriangle, HardHat, Zap, Users, FileText } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            Safety First - Always
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            TreeHub is committed to the highest safety standards in the tree care industry. 
            Every professional on our platform must meet strict safety requirements.
          </p>
        </div>

        {/* Safety Alert */}
        <Alert variant="warning" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h3 className="font-medium">Safety is Non-Negotiable</h3>
            <p className="text-sm mt-1">
              All TreeHub professionals must maintain current safety certifications and follow OSHA guidelines.
            </p>
          </div>
        </Alert>

        {/* Safety Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Safety Incidents', value: '0.02%', subtext: 'Industry leading low rate' },
            { label: 'Certified Professionals', value: '100%', subtext: 'OSHA safety trained' },
            { label: 'Insurance Verified', value: '100%', subtext: 'All professionals covered' },
            { label: 'Safety Inspections', value: '24/7', subtext: 'Continuous monitoring' },
          ].map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-treehub-safety-orange mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-900 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.subtext}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Safety Requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-treehub-safety-orange" />
                Professional Safety Requirements
              </CardTitle>
              <CardDescription>
                Mandatory safety standards for all TreeHub professionals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Badge variant="success" size="sm">Required</Badge>
                  <div>
                    <p className="font-medium">OSHA 10-Hour Safety Training</p>
                    <p className="text-sm text-gray-600">Current certification required</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="success" size="sm">Required</Badge>
                  <div>
                    <p className="font-medium">First Aid/CPR Certification</p>
                    <p className="text-sm text-gray-600">Valid certification from recognized provider</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="success" size="sm">Required</Badge>
                  <div>
                    <p className="font-medium">General Liability Insurance</p>
                    <p className="text-sm text-gray-600">Minimum $1M coverage</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="success" size="sm">Required</Badge>
                  <div>
                    <p className="font-medium">Equipment Safety Inspections</p>
                    <p className="text-sm text-gray-600">Annual professional inspection</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="verified" size="sm">Preferred</Badge>
                  <div>
                    <p className="font-medium">ISA Safety Certification</p>
                    <p className="text-sm text-gray-600">Tree Worker Climber Specialist</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-treehub-safety-orange" />
                Required Safety Equipment
              </CardTitle>
              <CardDescription>
                Essential safety gear for all tree care operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-treehub-safety-orange rounded-full"></div>
                  <span>Hard hat (ANSI Z89.1 compliant)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-treehub-safety-orange rounded-full"></div>
                  <span>Safety glasses with side shields</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-treehub-safety-orange rounded-full"></div>
                  <span>Steel-toed boots</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-treehub-safety-orange rounded-full"></div>
                  <span>Cut-resistant chaps (chainsaw work)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-treehub-safety-orange rounded-full"></div>
                  <span>Climbing harness (certified)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-treehub-safety-orange rounded-full"></div>
                  <span>High-visibility vest</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-treehub-safety-orange rounded-full"></div>
                  <span>Hearing protection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-treehub-safety-orange rounded-full"></div>
                  <span>Work gloves (appropriate for task)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Protocols */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-treehub-safety-orange" />
              Emergency Safety Protocols
            </CardTitle>
            <CardDescription>
              Immediate response procedures for common tree care emergencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border-l-4 border-red-500 bg-red-50">
                <h4 className="font-medium text-red-900 mb-2">Power Line Contact</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Never touch equipment or person</li>
                  <li>• Call 911 immediately</li>
                  <li>• Contact utility company</li>
                  <li>• Establish 10-foot safety zone</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                <h4 className="font-medium text-yellow-900 mb-2">Equipment Malfunction</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Stop operation immediately</li>
                  <li>• Secure work area</li>
                  <li>• Assess situation safely</li>
                  <li>• Call for backup if needed</li>
                </ul>
              </div>

              <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-2">Weather Emergency</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Monitor weather constantly</li>
                  <li>• Cease climbing in high winds</li>
                  <li>• Secure all equipment</li>
                  <li>• Have evacuation plan ready</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-treehub-safety-orange" />
                Safety Resources
              </CardTitle>
              <CardDescription>
                Download guides, forms, and reference materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">OSHA Tree Care Guidelines</span>
                  <span className="text-sm text-gray-500">PDF</span>
                </div>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Equipment Inspection Checklist</span>
                  <span className="text-sm text-gray-500">PDF</span>
                </div>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Emergency Response Plan Template</span>
                  <span className="text-sm text-gray-500">DOC</span>
                </div>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Safety Training Videos</span>
                  <span className="text-sm text-gray-500">Video</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-treehub-safety-orange" />
                Report Safety Concerns
              </CardTitle>
              <CardDescription>
                Help us maintain the highest safety standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  If you observe unsafe practices or have safety concerns about a 
                  professional or job, please report it immediately.
                </p>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium mb-2">Emergency Safety Hotline</p>
                  <p className="text-red-600 text-lg font-bold">1-800-SAFE-TREE</p>
                  <p className="text-red-600 text-sm">Available 24/7</p>
                </div>

                <div className="p-4 bg-gray-50 border rounded-lg">
                  <p className="font-medium mb-2">Non-Emergency Reports</p>
                  <p className="text-gray-600 text-sm mb-3">
                    For non-urgent safety concerns, use our online reporting system.
                  </p>
                  <button className="text-treehub-safety-orange font-medium">
                    Submit Safety Report →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
