
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Video, Users, Award, Clock, CheckCircle } from 'lucide-react';

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-treehub-industrial-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            Professional Training Programs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advance your career with TreeHub's comprehensive training programs. 
            From safety basics to advanced techniques, we offer training for every level.
          </p>
        </div>

        {/* Training Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <CardTitle>Online Courses</CardTitle>
              <CardDescription>
                Self-paced learning modules available 24/7
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Browse Courses</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <CardTitle>Hands-On Workshops</CardTitle>
              <CardDescription>
                In-person training with expert instructors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Find Workshops</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Video className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <CardTitle>Live Webinars</CardTitle>
              <CardDescription>
                Interactive sessions with industry experts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Schedule</Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured Courses */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Featured Training Programs</CardTitle>
            <CardDescription>
              Popular courses designed for tree care professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                {
                  title: 'Tree Climbing Safety Fundamentals',
                  level: 'Beginner',
                  duration: '4 hours',
                  format: 'Online + Practical',
                  price: '$149',
                  rating: 4.9,
                  students: 1250,
                  topics: ['Safety protocols', 'Equipment inspection', 'Climbing techniques', 'Emergency procedures']
                },
                {
                  title: 'Chainsaw Operation & Maintenance',
                  level: 'Intermediate',
                  duration: '6 hours',
                  format: 'Hands-on Workshop',
                  price: '$199',
                  rating: 4.8,
                  students: 980,
                  topics: ['Proper operation', 'Maintenance procedures', 'Safety techniques', 'Troubleshooting']
                },
                {
                  title: 'Emergency Storm Response',
                  level: 'Advanced',
                  duration: '8 hours',
                  format: 'Live Workshop',
                  price: '$299',
                  rating: 4.9,
                  students: 756,
                  topics: ['Risk assessment', 'Emergency protocols', 'Power line safety', 'Team coordination']
                },
                {
                  title: 'Business Development for Arborists',
                  level: 'All Levels',
                  duration: '5 hours',
                  format: 'Online',
                  price: '$99',
                  rating: 4.7,
                  students: 2100,
                  topics: ['Marketing strategies', 'Customer relations', 'Pricing', 'Business growth']
                }
              ].map((course, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-treehub-forest-green">{course.title}</h3>
                    <Badge variant={course.level === 'Beginner' ? 'success' : course.level === 'Advanced' ? 'emergency' : 'info'}>
                      {course.level}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {course.duration}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {course.students} students
                    </div>
                    <div className="flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      {course.rating}/5.0
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Topics covered:</p>
                    <div className="flex flex-wrap gap-1">
                      {course.topics.slice(0, 3).map((topic, i) => (
                        <Badge key={i} variant="info" size="sm">{topic}</Badge>
                      ))}
                      {course.topics.length > 3 && (
                        <Badge variant="info" size="sm">+{course.topics.length - 3} more</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-treehub-safety-orange">{course.price}</span>
                      <span className="text-sm text-gray-500 ml-1">• {course.format}</span>
                    </div>
                    <Button size="sm">Enroll Now</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Paths */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Professional Learning Paths</CardTitle>
            <CardDescription>
              Structured programs to advance your career step by step
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Entry-Level Arborist',
                  description: 'Start your tree care career with foundational knowledge',
                  courses: 5,
                  duration: '20 hours',
                  certification: 'TreeHub Safety Certificate',
                  color: 'bg-green-100 text-green-800'
                },
                {
                  title: 'Professional Climber',
                  description: 'Master advanced climbing and pruning techniques',
                  courses: 7,
                  duration: '35 hours',
                  certification: 'Professional Climber Certificate',
                  color: 'bg-blue-100 text-blue-800'
                },
                {
                  title: 'Business Owner',
                  description: 'Build and grow your tree care business',
                  courses: 6,
                  duration: '25 hours',
                  certification: 'Business Development Certificate',
                  color: 'bg-purple-100 text-purple-800'
                }
              ].map((path, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    <CardDescription>{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Courses: {path.courses}</span>
                        <span>Duration: {path.duration}</span>
                      </div>
                      <div className={`p-2 rounded text-sm ${path.color}`}>
                        Earn: {path.certification}
                      </div>
                      <Button className="w-full" variant="outline">
                        Start Learning Path
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Why Choose TreeHub Training?</CardTitle>
              <CardDescription>
                Industry-leading education designed by professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Courses developed by certified arborists</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Industry-recognized certifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Practical, hands-on learning approach</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Flexible scheduling options</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Ongoing support and resources</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Direct connection to job opportunities</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corporate Training Programs</CardTitle>
              <CardDescription>
                Custom training solutions for tree care companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  We offer customized training programs for tree care companies 
                  looking to upskill their teams and improve safety standards.
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Corporate Benefits:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Volume discounts for team training</li>
                    <li>• On-site training options</li>
                    <li>• Customized curriculum</li>
                    <li>• Progress tracking and reporting</li>
                    <li>• Certification management</li>
                  </ul>
                </div>

                <Button className="w-full">
                  Request Corporate Training Quote
                </Button>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Questions about training? Call 1-800-TREEHUB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
