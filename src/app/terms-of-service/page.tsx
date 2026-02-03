import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const TermsOfService = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-slate-900">Terms of Service</h1>
                <p className="text-slate-500">
                  <strong>Effective Date:</strong> February 3, 2026
                </p>
                <Separator className="my-4" />
              </div>

              <div className="text-slate-700">
                <p className="leading-relaxed">
                  These Terms of Service (&quot;Terms&quot;) govern your use of the First Serve Seattle app (&quot;the
                  App&quot;), owned and operated by Simple Apps, LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
                  By accessing or using the App, you agree to these Terms. If you do not agree, please refrain from using
                  the App.
                </p>
              </div>

              <Section title="1. Eligibility">
                <p className="leading-relaxed">
                  You must be at least 18 years of age to use the App. By using the App, you represent and warrant that
                  you are at least 18 years old and have the legal capacity to enter into these Terms.
                </p>
              </Section>

              <Section title="2. Account Registration">
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>You must provide accurate and complete information during registration.</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                  <li>You are responsible for all activities that occur under your account.</li>
                </ul>
              </Section>

              <Section title="3. Use of the App">
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>You may use the App only for lawful purposes.</li>
                  <li>
                    You agree not to engage in any activity that disrupts or interferes with the App&apos;s functionality.
                  </li>
                  <li>You agree not to attempt to gain unauthorized access to any part of the App or its systems.</li>
                  <li>You agree not to use automated systems or bots to access the App without our permission.</li>
                </ul>
              </Section>

              <Section title="4. Payments and Subscriptions">
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>Payments are processed securely via Stripe.</li>
                  <li>Subscriptions renew automatically unless canceled.</li>
                  <li>
                    <strong>No Refunds:</strong> All payments are final. However, you may cancel your subscription at any
                    time via Stripe to avoid future charges.
                  </li>
                  <li>We reserve the right to change pricing with reasonable notice to subscribers.</li>
                </ul>
              </Section>

              <Section title="5. Intellectual Property">
                <p className="leading-relaxed">
                  All content, features, and functionality of the App are owned by Simple Apps, LLC and protected by
                  intellectual property laws. You may not copy, modify, distribute, or create derivative works without our
                  express written permission.
                </p>
              </Section>

              <Section title="6. Indemnification">
                <p className="leading-relaxed">
                  You agree to indemnify, defend, and hold harmless Simple Apps, LLC, its officers, directors, employees,
                  and agents from any claims, damages, losses, liabilities, and expenses (including reasonable
                  attorneys&apos; fees) arising out of or related to your use of the App, violation of these Terms, or
                  infringement of any third-party rights.
                </p>
              </Section>

              <Section title="7. Limitation of Liability">
                <p className="leading-relaxed">
                  The App is provided &quot;as is&quot; without warranties of any kind, express or implied. We are not
                  liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from
                  your use of the App, to the fullest extent permitted by law.
                </p>
              </Section>

              <Section title="8. Termination">
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>We may suspend or terminate your account if you violate these Terms.</li>
                  <li>You may cancel your account at any time through the App or by contacting support.</li>
                  <li>
                    Upon termination, your right to use the App will immediately cease, but provisions that by their
                    nature should survive will remain in effect.
                  </li>
                </ul>
              </Section>

              <Section title="9. Dispute Resolution">
                <p className="mb-3">
                  Any disputes arising out of or relating to these Terms or your use of the App shall be resolved as
                  follows:
                </p>
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>
                    <strong>Informal Resolution:</strong> Before filing any formal claim, you agree to contact us at
                    support@firstserveseattle.com to attempt to resolve the dispute informally.
                  </li>
                  <li>
                    <strong>Arbitration:</strong> If informal resolution is unsuccessful, any dispute shall be resolved by
                    binding arbitration in accordance with the rules of the American Arbitration Association. The
                    arbitration shall take place in Wyoming.
                  </li>
                  <li>
                    <strong>Class Action Waiver:</strong> You agree to resolve disputes with us on an individual basis and
                    waive any right to participate in a class action lawsuit or class-wide arbitration.
                  </li>
                </ul>
              </Section>

              <Section title="10. Ball Machine Rentals">
                <p className="mb-3">
                  By renting the Proton Tennis Ball Machine (&quot;Equipment&quot;) from Seattle Tennis Ball Machine
                  Rental, you (&quot;Renter&quot;) agree to the following terms and conditions:
                </p>
                <ul className="list-disc list-outside ml-6 space-y-2">
                  <li>The rental period begins at the time of pick-up/delivery and ends upon return.</li>
                  <li>Late returns are subject to additional charges of $150 per hour.</li>
                  <li>The Renter agrees to pay the rental fee specified at booking.</li>
                  <li>
                    The Equipment will be inspected before and after rental; damages or losses will be charged at full
                    retail value.
                  </li>
                  <li>The Equipment must only be used for tennis practice in a safe and responsible manner.</li>
                  <li>The Renter assumes all risks associated with use, including injury or property damage.</li>
                  <li>
                    Seattle Tennis Ball Machine Rental is not liable for any damages or injuries incurred during use.
                  </li>
                  <li>
                    The Renter agrees to indemnify and hold harmless Seattle Tennis Ball Machine Rental and its
                    affiliates.
                  </li>
                  <li>Any lost tennis balls will be charged at $1.50 per ball.</li>
                  <li>
                    Seattle Tennis Ball Machine Rental reserves the right to terminate the rental agreement if the Renter
                    violates these terms.
                  </li>
                  <li>This agreement is governed by the laws of the state of Washington.</li>
                </ul>
              </Section>

              <Section title="11. Changes to These Terms">
                <p className="leading-relaxed">
                  We may update these Terms from time to time. Changes will be posted on this page with an updated
                  effective date. Your continued use of the App after changes are posted constitutes acceptance of the
                  modified Terms.
                </p>
              </Section>

              <Section title="12. Severability">
                <p className="leading-relaxed">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited
                  or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force
                  and effect.
                </p>
              </Section>

              <Section title="13. Entire Agreement">
                <p className="leading-relaxed">
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and Simple
                  Apps, LLC regarding your use of the App and supersede any prior agreements.
                </p>
              </Section>

              <Section title="14. Governing Law">
                <p className="leading-relaxed">
                  These Terms are governed by the laws of the State of Wyoming, without regard to its conflict of laws
                  principles.
                </p>
              </Section>

              <Section title="15. Contact Us">
                <p className="mb-3">If you have questions or concerns about these Terms, please contact us at:</p>
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
  );
};

// Helper component for sections
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
      <div className="text-slate-700">{children}</div>
    </div>
  );
};

export default TermsOfService;
