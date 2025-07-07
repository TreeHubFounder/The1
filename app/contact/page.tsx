
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Clock, MessageSquare, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-treehub-industrial-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            Contact TreeHub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help. Reach out to our team for support, questions, 
            or to learn more about TreeHub.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-treehub-forest-green">Get in Touch</CardTitle>
              <CardDescription>
                Multiple ways to reach our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-treehub-safety-orange" />
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p className="text-gray-600">1-800-TREEHUB (1-800-873-3482)</p>
                  <p className="text-sm text-gray-500">Mon-Fri 8AM-6PM EST</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-treehub-safety-orange" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-gray-600">support@treehub.com</p>
                  <p className="text-sm text-gray-500">Response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-treehub-safety-orange" />
                <div>
                  <p className="font-medium">Live Chat</p>
                  <p className="text-gray-600">Available on platform</p>
                  <p className="text-sm text-gray-500">Sign in for instant help</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-treehub-safety-orange" />
                <div>
                  <p className="font-medium">Headquarters</p>
                  <p className="text-gray-600">Austin, Texas</p>
                  <p className="text-sm text-gray-500">Serving nationwide</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-treehub-forest-green">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form and we'll get back to you shortly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-treehub-safety-orange focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-treehub-safety-orange focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-treehub-safety-orange focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-treehub-safety-orange focus:border-transparent">
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Billing Question</option>
                    <option>Partnership Opportunity</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-treehub-safety-orange focus:border-transparent"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <Button className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contact */}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Phone className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-900">Emergency Tree Services</h3>
            </div>
            <p className="text-red-700 mb-4">
              For urgent tree emergencies requiring immediate response, 
              call our 24/7 emergency hotline:
            </p>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 mb-2">1-800-TREE-911</p>
              <p className="text-sm text-red-600">Available 24/7 for emergencies</p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Link */}
        <div className="text-center mt-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <HelpCircle className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <h3 className="text-lg font-bold text-treehub-forest-green mb-2">
                Have Questions?
              </h3>
              <p className="text-gray-600 mb-4">
                Check our comprehensive FAQ section for quick answers.
              </p>
              <Button variant="outline">
                View FAQ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
