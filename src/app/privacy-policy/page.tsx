import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const PrivacyPolicy = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
                <p className="text-slate-500">
                  <strong>Effective Date:</strong> March 1, 2025
                </p>
                <Separator className="my-4" />
              </div>

              <div className="text-slate-700">
                <p className="leading-relaxed">
                  Simple Apps, LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
                  privacy. This Privacy Policy outlines how we collect, use, and safeguard your information when you use
                  the First Serve Seattle app (&quot;the App&quot;). By using the App, you agree to the terms of this
                  Privacy Policy.
                </p>
              </div>

              <Section title="1. Information We Collect">
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>
                    <strong>Personal Information:</strong> Name, email address, and payment information (processed
                    securely through Stripe).
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Information about how you interact with the App, such as court
                    preferences and search history.
                  </li>
                  <li>
                    <strong>Device Information:</strong> Information about the device you use to access the App,
                    including device type, operating system, and IP address.
                  </li>
                </ul>
              </Section>

              <Section title="2. How We Use Your Information">
                <p className="mb-3">We use the information collected to:</p>
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>Provide and improve the App&apos;s functionality.</li>
                  <li>Facilitate bookings and manage your account.</li>
                  <li>Communicate with you about updates, promotions, or support inquiries.</li>
                  <li>Analyze usage trends to improve the user experience.</li>
                </ul>
              </Section>

              <Section title="3. Data Sharing">
                <p className="mb-3">
                  We do not sell, rent, or share your personal information with third parties for their marketing
                  purposes. However, we may share data with:
                </p>
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>
                    <strong>Service Providers:</strong> For payment processing (e.g., Stripe) or analytics.
                  </li>
                  <li>
                    <strong>Legal Authorities:</strong> When required by law or to protect our legal rights.
                  </li>
                </ul>
              </Section>

              <Section title="4. Data Security">
                <p className="leading-relaxed">
                  We implement reasonable measures to protect your information from unauthorized access, disclosure, or
                  destruction. However, no security measures are completely secure, and we cannot guarantee absolute
                  security.
                </p>
              </Section>

              <Section title="5. Your Rights">
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>Access, update, or delete your personal information by contacting us.</li>
                  <li>Opt out of promotional communications.</li>
                </ul>
              </Section>

              <Section title="6. Third-Party Links">
                <p className="leading-relaxed">
                  The App may contain links to third-party websites or services. We are not responsible for the privacy
                  practices of these external sites.
                </p>
              </Section>

              <Section title="7. Changes to This Privacy Policy">
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. Changes will be posted on this page with an
                  updated effective date.
                </p>
              </Section>

              <Section title="8. Contact Us">
                <p className="mb-3">
                  If you have questions or concerns about this Privacy Policy, please contact us at:
                </p>
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>
                    Email:{" "}
                    <a href="mailto:support@firstserveseattle.com" className="text-blue-600 hover:underline">
                      support@firstserveseattle.com
                    </a>
                  </li>
                  <li>Address: Simple Apps, LLC, 1309 Coffeen Avenue STE 1200, Sheridan, Wyoming 82801</li>
                </ul>
              </Section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper component for sections
const Section = ({ title, children }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
      <div className="text-slate-700">{children}</div>
    </div>
  )
}

export default PrivacyPolicy

