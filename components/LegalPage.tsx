import React from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

interface LegalPageProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

const LegalPage: React.FC<LegalPageProps> = ({ type, onBack }) => {
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const icon = isPrivacy ? <Shield className="h-8 w-8 text-green-600" /> : <FileText className="h-8 w-8 text-green-600" />;
  const lastUpdated = 'February 26, 2025';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-green-50 px-6 py-8 border-b border-green-100">
          <button 
            onClick={onBack}
            className="flex items-center text-green-700 hover:text-green-800 transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {icon}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
          <p className="mt-2 text-sm text-green-600 ml-14">Last Updated: {lastUpdated}</p>
        </div>

        <div className="px-8 py-8 prose prose-green max-w-none text-gray-600 space-y-6">
          {isPrivacy ? (
            <>
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as your shop name, phone number, and order details entered into the OrderBuddy system. We strictly use this data to provide our services.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">2. How We Use Your Information</h3>
                <p>We use the information we collect to operate, maintain, and improve our services, such as generating your PDF invoices and providing sales analytics.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">3. Data Security</h3>
                <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">4. Contact Us</h3>
                <p>If you have any questions about this Privacy Policy, please contact us at support@orderbuddy.pk.</p>
              </section>
            </>
          ) : (
             <>
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1. Acceptance of Terms</h3>
                <p>By accessing or using OrderBuddy, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">2. Use License</h3>
                <p>Permission is granted to temporarily download one copy of the materials (information or software) on OrderBuddy's website for personal, non-commercial transitory viewing only.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">3. Disclaimer</h3>
                <p>The materials on OrderBuddy's website are provided on an 'as is' basis. OrderBuddy makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-2">4. Governing Law</h3>
                <p>These terms and conditions are governed by and construed in accordance with the laws of Pakistan and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
              </section>
            </>
          )}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
          <button 
             onClick={onBack}
             className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;