
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Book, MessageSquare, Phone, Video, FileText } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-treehub-industrial-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-treehub-forest-green mb-4">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers, get support, and learn how to make the most of TreeHub
          </p>
        </div>

        {/* Quick Help Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Book className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <CardTitle>Getting Started Guide</CardTitle>
              <CardDescription>
                Complete walkthrough for new users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Guide</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <CardTitle>Live Chat Support</CardTitle>
              <CardDescription>
                Get instant help from our team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Video className="h-12 w-12 text-treehub-safety-orange mx-auto mb-4" />
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>
                Learn with step-by-step videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Watch Videos</Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Categories */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-treehub-forest-green">For Professionals</h3>
                <div className="space-y-2 text-sm">
                  <p className="border-b pb-2">• How do I create a professional profile?</p>
                  <p className="border-b pb-2">• What certifications should I upload?</p>
                  <p className="border-b pb-2">• How does the bidding process work?</p>
                  <p className="border-b pb-2">• When and how do I get paid?</p>
                  <p className="border-b pb-2">• How can I improve my visibility?</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-treehub-forest-green">For Companies</h3>
                <div className="space-y-2 text-sm">
                  <p className="border-b pb-2">• How do I post a job?</p>
                  <p className="border-b pb-2">• How are professionals verified?</p>
                  <p className="border-b pb-2">• What are the platform fees?</p>
                  <p className="border-b pb-2">• How does the payment system work?</p>
                  <p className="border-b pb-2">• Can I request emergency services?</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-treehub-forest-green">Still Need Help?</CardTitle>
              <CardDescription>
                Our support team is here to assist you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-treehub-safety-orange" />
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p className="text-gray-600">1-800-TREEHUB</p>
                  <p className="text-sm text-gray-500">Mon-Fri 8AM-6PM EST</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-treehub-safety-orange" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-gray-600">support@treehub.com</p>
                  <p className="text-sm text-gray-500">24-48 hour response</p>
                </div>
              </div>

              <Button className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-treehub-forest-green">Resources</CardTitle>
              <CardDescription>
                Additional helpful resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-treehub-safety-orange" />
                  <span>Platform Guidelines</span>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-treehub-safety-orange" />
                  <span>Safety Requirements</span>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-treehub-safety-orange" />
                  <span>Certification Guide</span>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Video className="h-5 w-5 text-treehub-safety-orange" />
                  <span>Training Videos</span>
                </div>
                <Button variant="ghost" size="sm">Watch</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
