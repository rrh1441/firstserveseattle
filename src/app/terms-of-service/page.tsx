import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4"><strong>Effective Date:</strong> January 19, 2025</p>
      <p className="mb-6">
        These Terms of Service (&quot;Terms&quot;) govern your use of the First Serve Seattle app (&quot;the App&quot;),
        owned and operated by Simple Apps, LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using the App,
        you agree to these Terms. If you do not agree, please refrain from using the App.
      </p>
      <h2 className="text-2xl font-semibold mb-4">1. Account Registration</h2>
      <ul className="list-disc list-inside mb-6">
        <li>You must provide accurate and complete information during registration.</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">2. Use of the App</h2>
      <ul className="list-disc list-inside mb-6">
        <li>You may use the App only for lawful purposes.</li>
        <li>You agree not to engage in any activity that disrupts or interferes with the App&apos;s functionality.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">3. Payments and Subscriptions</h2>
      <ul className="list-disc list-inside mb-6">
        <li>Payments are processed securely via Stripe.</li>
        <li>Subscriptions renew automatically unless canceled.</li>
        <li><strong>No Refunds:</strong> All payments are final. However, you may cancel your subscription at any time via Stripe to avoid future charges.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
      <p className="mb-6">All content, features, and functionality of the App are owned by Simple Apps, LLC and protected by intellectual property laws.</p>
      <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
      <p className="mb-6">The App is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages resulting from your use of the App, to the fullest extent permitted by law.</p>
      <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
      <ul className="list-disc list-inside mb-6">
        <li>We may suspend or terminate your account if you violate these Terms.</li>
        <li>You may cancel your account at any time through the App or by contacting support.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">7. Changes to These Terms</h2>
      <p className="mb-6">We may update these Terms from time to time. Changes will be posted on this page with an updated effective date.</p>
      <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
      <p className="mb-6">These Terms are governed by the laws of the State of Wyoming, without regard to its conflict of laws principles.</p>
      <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
      <p>
        If you have questions or concerns about these Terms, please contact us at:
      </p>
      <ul className="list-disc list-inside mt-4">
        <li>Email: support@firstserveseattle.com</li>
        <li>Address: Simple Apps, LLC, 1309 Coffeen Avenue STE 1200, Sheridan, Wyoming 82801</li>
      </ul>
    </div>
  );
};

export default TermsOfService;
