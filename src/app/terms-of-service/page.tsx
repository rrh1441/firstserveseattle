import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4"><strong>Effective Date:</strong> February 15, 2025</p>
      <p className="mb-6">
        These Terms of Service ("Terms") govern your use of the First Serve Seattle app ("the App"),
        owned and operated by Simple Apps, LLC ("we," "our," or "us"). By accessing or using the App,
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
      <p className="mb-6">The App is provided "as is" without warranties of any kind. We are not liable for any damages resulting from your use of the App, to the fullest extent permitted by law.</p>
      
      <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
      <ul className="list-disc list-inside mb-6">
        <li>We may suspend or terminate your account if you violate these Terms.</li>
        <li>You may cancel your account at any time through the App or by contacting support.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mb-4">7. Changes to These Terms</h2>
      <p className="mb-6">We may update these Terms from time to time. Changes will be posted on this page with an updated effective date.</p>
      
      <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
      <p className="mb-6">These Terms are governed by the laws of the State of Wyoming, without regard to its conflict of laws principles.</p>
      
      <h2 className="text-2xl font-semibold mb-4">9. Ball Machine Rentals</h2>
      <p className="mb-6">By renting the Proton Tennis Ball Machine (“Equipment”) from Seattle Tennis Ball Machine Rental, you (“Renter”) agree to the following terms and conditions:</p>
      <ul className="list-disc list-inside mb-6">
        <li>The rental period begins at the time of pick-up/delivery and ends upon return.</li>
        <li>Late returns are subject to additional charges of $150 per hour.</li>
        <li>The Renter agrees to pay the rental fee specified at booking.</li>
        <li>The Equipment will be inspected before and after rental; damages or losses will be charged at full retail value.</li>
        <li>The Equipment must only be used for tennis practice in a safe and responsible manner.</li>
        <li>The Renter assumes all risks associated with use, including injury or property damage.</li>
        <li>Seattle Tennis Ball Machine Rental is not liable for any damages or injuries incurred during use.</li>
        <li>The Renter agrees to indemnify and hold harmless Seattle Tennis Ball Machine Rental and its affiliates.</li>
        <li>Any lost tennis balls will be charged at $1.50 per ball.</li>
        <li>Seattle Tennis Ball Machine Rental reserves the right to terminate the rental agreement if the Renter violates these terms.</li>
        <li>This agreement is governed by the laws of the state of Washington.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
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
