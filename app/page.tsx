'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TreePine, 
  Users, 
  Briefcase, 
  Shield, 
  Zap, 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Building,
  UserCheck,
  Home as HomeIcon,
  AlertTriangle
} from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();
  const [selectedUserType, setSelectedUserType] = useState<'professional' | 'company' | 'homeowner' | null>(null);

  if (session) {
    // Redirect to dashboard if already logged in
    window.location.href = '/dashboard';
    return null;
  }

  const features = [
    {
      icon: Users,
      title: 'Professional Network',
      description: 'Connect with verified arborists, climbers, and tree care specialists nationwide.',
    },
    {
      icon: Briefcase,
      title: 'Job Marketplace',
      description: 'Find consistent work or hire qualified professionals for your tree care projects.',
    },
    {
      icon: Shield,
      title: 'Verified Professionals',
      description: 'All professionals undergo certification verification and background checks.',
    },
    {
      icon: Zap,
      title: 'Emergency Response',
      description: '24/7 storm response network for urgent tree care emergencies.',
    },
    {
      icon: Star,
      title: 'Quality Assurance',
      description: 'Rating and review system ensures high-quality service delivery.',
    },
    {
      icon: MapPin,
      title: 'Nationwide Coverage',
      description: 'Serving all 50 states with focus on high-demand regions.',
    },
  ];

  const userTypes = [
    {
      id: 'professional',
      title: 'Tree Care Professional',
      description: 'Arborists, climbers, and specialists looking for consistent work',
      icon: UserCheck,
      benefits: ['Find quality jobs', 'Build your reputation', 'Flexible scheduling', 'Fair compensation'],
      cta: 'Find Work',
    },
    {
      id: 'company',
      title: 'Tree Service Company',
      description: 'Companies needing qualified professionals and growth opportunities',
      icon: Building,
      benefits: ['Hire verified pros', 'Scale your business', 'Manage projects', 'Emergency response'],
      cta: 'Hire Professionals',
    },
    {
      id: 'homeowner',
      title: 'Property Owner',
      description: 'Homeowners and property managers needing tree care services',
      icon: HomeIcon,
      benefits: ['Vetted professionals', 'Competitive pricing', 'Insured services', 'Emergency support'],
      cta: 'Get Service',
    },
  ];

  const stats = [
    { label: 'Active Professionals', value: '2,500+' },
    { label: 'Jobs Completed', value: '15,000+' },
    { label: 'States Covered', value: '50' },
    { label: 'Emergency Response Time', value: '<2hrs' },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-treehub-forest-green-900 to-treehub-forest-green-700 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='https://i.pinimg.com/736x/b4/7f/e6/b47fe6bbfa8a4546758e27de05beee31.jpg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Logo & Brand */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <TreePine className="h-16 w-16 text-treehub-safety-orange" />
              <div>
                <h1 className="text-4xl lg:text-6xl font-heading font-bold tracking-tight">
                  TreeHub
                </h1>
                <p className="text-lg text-treehub-safety-orange-200 font-medium">
                  Branch Out. Connect. Grow.
                </p>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl lg:text-5xl font-heading font-bold mb-6 max-w-4xl mx-auto leading-tight">
              The Professional Hub for the{' '}
              <span className="text-treehub-safety-orange">Tree Care Industry</span>
            </h2>

            <p className="text-xl lg:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Connect qualified professionals, grow your business, and access the largest network 
              of tree care specialists in North America.
            </p>

            {/* Emergency Alert Banner */}
            <div className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full mb-8 animate-pulse">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">24/7 Storm Response Network Active</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-4">
                Find Work Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-treehub-forest-green-900">
                Hire Professionals
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-treehub-safety-orange mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Type Selection */}
      <section className="py-20 bg-treehub-industrial-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-treehub-forest-green mb-4">
              Built for Every Role in Tree Care
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a professional arborist, tree service company, or property owner, 
              TreeHub has solutions tailored for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {userTypes.map((type) => {
              const IconComponent = type.icon;
              const isSelected = selectedUserType === type.id;
              
              return (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                    isSelected ? 'ring-2 ring-treehub-safety-orange shadow-xl' : ''
                  }`}
                  onClick={() => setSelectedUserType(type.id as any)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 w-16 h-16 bg-treehub-safety-orange-100 rounded-full flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-treehub-safety-orange" />
                    </div>
                    <CardTitle className="text-xl font-heading">{type.title}</CardTitle>
                    <CardDescription className="text-base">{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {type.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={isSelected ? 'primary' : 'outline'}>
                      {type.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-treehub-forest-green mb-4">
              Why TreeHub is Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by tree care professionals, for tree care professionals. 
              We understand the unique challenges of this industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-treehub-forest-green-100 rounded-full flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-treehub-forest-green" />
                    </div>
                    <CardTitle className="text-xl font-heading">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-treehub-forest-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-treehub-forest-green mb-4">
              Trusted by Tree Care Professionals
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of professionals who are growing their careers with TreeHub
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Testimonials */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "TreeHub has revolutionized how I find work. The quality of jobs and fair compensation 
                  has allowed me to build a sustainable career in arboriculture."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-treehub-safety-orange rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">MR</span>
                  </div>
                  <div>
                    <p className="font-medium">Mike Rodriguez</p>
                    <p className="text-sm text-gray-500">Certified Arborist, Texas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "As a growing tree service company, TreeHub helps us find qualified professionals 
                  quickly, especially during storm season. Game changer!"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-treehub-safety-orange rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">SJ</span>
                  </div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-500">Owner, GreenTop Tree Services, FL</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "After the hurricane, TreeHub's emergency network helped us get our property 
                  cleared safely and professionally. Highly recommend!"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-treehub-safety-orange rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">DT</span>
                  </div>
                  <div>
                    <p className="font-medium">David Thompson</p>
                    <p className="text-sm text-gray-500">Property Manager, NC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-treehub-forest-green text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6">
            Ready to Grow Your Tree Care Business?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Join the professional network that's changing the tree care industry. 
            Start today and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="primary" className="text-lg px-8 py-4">
                Join TreeHub Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-treehub-forest-green">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}