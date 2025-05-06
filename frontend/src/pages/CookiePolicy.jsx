import React from 'react';

const CookiePolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
      
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. What Are Cookies</h2>
          <p>Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide a better user experience.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Essential cookies: Required for the website to function properly</li>
            <li>Authentication cookies: To keep you logged in during your session</li>
            <li>Preference cookies: To remember your settings and preferences</li>
            <li>Analytics cookies: To understand how visitors interact with our website</li>
            <li>Marketing cookies: To deliver relevant advertisements</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Types of Cookies We Use</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Session Cookies</h3>
              <p>Temporary cookies that expire when you close your browser. These are essential for the website to function properly.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Persistent Cookies</h3>
              <p>Cookies that remain on your device for a set period of time or until you delete them. These help us remember your preferences.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Third-Party Cookies</h3>
              <p>Cookies set by third-party services we use, such as analytics and advertising partners.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Managing Cookies</h2>
          <p>You can control and manage cookies in various ways:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Browser settings: Most web browsers allow you to control cookies through their settings</li>
            <li>Cookie consent: We provide a cookie consent banner when you first visit our website</li>
            <li>Third-party opt-out: You can opt out of certain third-party cookies through their respective websites</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Impact of Disabling Cookies</h2>
          <p>Please note that disabling certain cookies may impact your experience on our website:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Some features may not function properly</li>
            <li>You may need to re-enter information more frequently</li>
            <li>Certain personalized content may not be available</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Updates to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
          <p className="mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact Us</h2>
          <p>If you have any questions about our Cookie Policy, please contact us at:</p>
          <p className="mt-2">Email: feelsfix@gmail.com</p>
          <p>Phone: +94 70 123 4567</p>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicy; 