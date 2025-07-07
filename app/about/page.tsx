
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TreePine, Users, Shield, Target, Award, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-treehub-forest-green text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TreePine className="h-16 w-16 text-treehub-safety-orange mx-auto mb-6" />
          <h1 className="text-4xl lg:text-5xl font-heading font-bold mb-6">
            About TreeHub
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            We're revolutionizing the tree care industry by connecting professionals, 
            companies, and property owners through technology and trust.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-treehub-industrial-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
                <CardTitle className="text-treehub-forest-green">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  To create a professional ecosystem where tree care specialists can thrive, 
                  businesses can grow, and communities receive the highest quality service.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
                <CardTitle className="text-treehub-forest-green">Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Safety first, professional excellence, environmental stewardship, 
                  and building lasting relationships based on trust and reliability.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
                <CardTitle className="text-treehub-forest-green">Our Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Empowering thousands of professionals, facilitating millions in economic activity, 
                  and contributing to healthier urban forests across North America.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-treehub-forest-green mb-4">
              TreeHub by the Numbers
            </h2>
            <p className="text-xl text-gray-600">
              Our growing impact on the tree care industry
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Active Professionals', value: '2,500+' },
              { label: 'Jobs Completed', value: '15,000+' },
              { label: 'States Served', value: '50' },
              { label: 'Equipment Transactions', value: '$2M+' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-treehub-safety-orange mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-treehub-industrial-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-treehub-forest-green mb-4">
              Built by Tree Care Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our founding team combines decades of tree care industry experience with 
              cutting-edge technology expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Mike Thompson',
                title: 'CEO & Co-Founder',
                background: 'ISA Certified Arborist, 15+ years industry experience',
                icon: Award,
              },
              {
                name: 'Sarah Rodriguez',
                title: 'CTO & Co-Founder',
                background: 'Former tech executive, tree care family business',
                icon: Users,
              },
              {
                name: 'David Chen',
                title: 'Head of Operations',
                background: 'Former TCIA board member, safety specialist',
                icon: Shield,
              },
            ].map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-treehub-safety-orange rounded-full flex items-center justify-center mx-auto mb-4">
                    <member.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-treehub-forest-green">{member.name}</CardTitle>
                  <CardDescription>{member.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{member.background}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-treehub-forest-green text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6">
            Ready to Join the TreeHub Community?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Whether you're a professional looking for opportunities or a business 
            seeking qualified experts, TreeHub is your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="primary" className="text-lg px-8 py-4">
              Get Started Today
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-treehub-forest-green">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
