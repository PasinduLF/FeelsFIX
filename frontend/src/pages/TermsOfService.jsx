import React from 'react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using FeelsFix, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Use License</h2>
          <p>Permission is granted to temporarily access the materials on FeelsFix for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software contained on FeelsFix</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Responsibilities</h2>
          <p>As a user of FeelsFix, you agree to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account</li>
            <li>Use the service in compliance with all applicable laws</li>
            <li>Respect the privacy and rights of other users</li>
            <li>Not engage in any fraudulent or harmful activities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Medical Disclaimer</h2>
          <p>FeelsFix is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Payment Terms</h2>
          <p>By using our services, you agree to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Pay all fees associated with your appointments</li>
            <li>Provide accurate payment information</li>
            <li>Understand our cancellation and refund policies</li>
            <li>Accept our payment processing terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Limitation of Liability</h2>
          <p>In no event shall FeelsFix or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on FeelsFix.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.</p>
          <p className="mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us at:</p>
          <p className="mt-2">Email: feelsfix@gmail.com</p>
          <p>Phone: +94 70 123 4567</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService; 