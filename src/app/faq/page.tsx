export const metadata = {
    title: 'FAQ | First Serve Seattle',
    description: 'Frequently asked questions about First Serve Seattle.',
  }
  
  export default function FAQPage() {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Frequently Asked Questions</h1>
  
        <dl className="space-y-8">
          {/* Q1 */}
          <div>
            <dt className="font-semibold">
              1. What is First Serve Seattle?
            </dt>
            <dd className="mt-1 text-gray-700">
              A private website that reads and displays Seattle&nbsp;Parks&nbsp;&amp;&nbsp;Recreation’s
              public tennis-court reservation feed so players can plan court time
              without using the City’s midnight lock-out interface.
            </dd>
          </div>
  
          {/* Q2 */}
          <div>
            <dt className="font-semibold">
              2. Are you affiliated with Seattle Parks&nbsp;&amp;&nbsp;Recreation?
            </dt>
            <dd className="mt-1 text-gray-700">
              <strong>No.</strong> First Serve Seattle has no sponsorship, endorsement,
              or contractual relationship with SPR. All permits and on-court rule
              enforcement remain 100&nbsp;percent with the City.
            </dd>
          </div>
  
          {/* Q3 */}
          <div>
            <dt className="font-semibold">
              3. How is the service priced?
            </dt>
            <dd className="mt-1 text-gray-700 space-y-1">
              <p>&bull; Each visitor gets <strong>three free open-court views</strong>.</p>
              <p>&bull; After that you may start a discounted subscription<strong>(50% off)</strong> for unlimited views.</p>
              <p>&bull; Continued unlimited access is <strong>$8&nbsp;/&nbsp;month</strong> (cancel any time).</p>
            </dd>
          </div>
  
          {/* Q4 */}
          <div>
            <dt className="font-semibold">
              4. How do I verify that someone’s reservation is valid?
            </dt>
            <dd className="mt-1 text-gray-700">
              Only SPR can confirm permits. Call&nbsp;
              <a href="tel:2066844060" className="underline">
                (206)&nbsp;684-4060
              </a>
              . If no permit exists, courts are first-come, first-served under SPR rules.
            </dd>
          </div>
  
          {/* Q5 */}
          <div>
            <dt className="font-semibold">
              5. Who enforces court etiquette (pickleball on tennis lines, large groups, etc.)?
            </dt>
            <dd className="mt-1 text-gray-700">
              SPR rangers or on-site staff. First Serve Seattle only displays data
              and has no authority to intervene.
            </dd>
          </div>
  
          {/* Q6 */}
          <div>
            <dt className="font-semibold">
              6. Do you store or sell my personal data?
            </dt>
            <dd className="mt-1 text-gray-700">
              Viewing the calendar anonymously requires no account. If you start a
              trial or subscription, Stripe processes payment; we retain only minimal
              billing records for bookkeeping and never sell user data.
            </dd>
          </div>
  
          {/* Q7 */}
          <div>
            <dt className="font-semibold">
              7. How quickly will you reply to support inquiries?
            </dt>
            <dd className="mt-1 text-gray-700">
              We respond within <strong>2–3 business days</strong> to email or voicemail at
              (206)&nbsp;457-3039.
            </dd>
          </div>
  
          {/* Q8 */}
          <div>
            <dt className="font-semibold">
              8. I found a bug or feature idea. Where do I send it?
            </dt>
            <dd className="mt-1 text-gray-700">
              Email&nbsp;
              <a
                href="mailto:support@firstserveseattle.com"
                className="underline"
              >
                support@firstserveseattle.com
              </a>{' '}
              with the court, date, time, and a screenshot if possible.
            </dd>
          </div>
  
          {/* Q9 */}
          <div>
            <dt className="font-semibold">
              9. Who owns and operates First Serve Seattle?
            </dt>
            <dd className="mt-1 text-gray-700 space-y-1">
              <p>
                First Serve Seattle is a registered DBA of <strong>Simple&nbsp;Apps&nbsp;LLC</strong> (Wyoming).
              </p>
              <p>&bull; Foreign-entity registration filed in Washington.</p>
              <p>&bull; Seattle General Business License&nbsp;#&nbsp;605888557 issued 2&nbsp;May&nbsp;2025.</p>
            </dd>
          </div>
  
          {/* Q10 */}
          <div>
            <dt className="font-semibold">
              10. How do I cancel my subscription?
            </dt>
            <dd className="mt-1 text-gray-700">
              Use the “Manage Subscription” link in your account settings or email
              support—cancellations are processed the same business day.
            </dd>
          </div>
        </dl>
      </section>
    )
  }
  