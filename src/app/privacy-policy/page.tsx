import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4"><strong>Effective Date:</strong> January 19, 2025</p>
      <p className="mb-6">
        Simple Apps, LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
        This Privacy Policy outlines how we collect, use, and safeguard your information when you use the First Serve Seattle app (&quot;the App&quot;).
        By using the App, you agree to the terms of this Privacy Policy.
      </p>
      <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
      <ul className="list-disc list-inside mb-6">
        <li><strong>Personal Information:</strong> Name, email address, and payment information (processed securely through Stripe).</li>
        <li><strong>Usage Data:</strong> Information about how you interact with the App, such as court preferences and search history.</li>
        <li><strong>Device Information:</strong> Information about the device you use to access the App, including device type, operating system, and IP address.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
      <p className="mb-6">We use the information collected to:</p>
      <ul className="list-disc list-inside mb-6">
        <li>Provide and improve the App&apos;s functionality.</li>
        <li>Facilitate bookings and manage your account.</li>
        <li>Communicate with you about updates, promotions, or support inquiries.</li>
        <li>Analyze usage trends to improve the user experience.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">3. Data Sharing</h2>
      <p className="mb-6">We do not sell, rent, or share your personal information with third parties for their marketing purposes. However, we may share data with:</p>
      <ul className="list-disc list-inside mb-6">
        <li><strong>Service Providers:</strong> For payment processing (e.g., Stripe) or analytics.</li>
        <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
      <p className="mb-6">
        We implement reasonable measures to protect your information from unauthorized access, disclosure, or destruction.
        However, no security measures are completely secure, and we cannot guarantee absolute security.
      </p>
      <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
      <ul className="list-disc list-inside mb-6">
        <li>Access, update, or delete your personal information by contacting us.</li>
        <li>Opt out of promotional communications.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">6. Third-Party Links</h2>
      <p className="mb-6">
        The App may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites.
      </p>
      <h2 className="text-2xl font-semibold mb-4">7. Changes to This Privacy Policy</h2>
      <p className="mb-6">We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.</p>
      <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
      <p>
        If you have questions or concerns about this Privacy Policy, please contact us at:
      </p>
      <ul className="list-disc list-inside mt-4">
        <li>Email: support@firstserveseattle.com</li>
        <li>Address: Simple Apps, LLC, 1309 Coffeen Avenue STE 1200, Sheridan, Wyoming 82801</li>
      </ul>
    </div>
  );
};

export default PrivacyPolicy;
