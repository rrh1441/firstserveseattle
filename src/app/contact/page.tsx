export const metadata = {
    title: 'Contact | First Serve Seattle',
    description: 'How to reach First Serve Seattle support.',
  }
  
  export default function ContactPage() {
    return (
      <section className="mx-auto max-w-xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Contact Us</h1>
  
        <p className="mb-6 text-gray-700">
          We welcome feedback, bug reports, and partnership inquiries. You can
          reach us via the following channels:
        </p>
  
        <ul className="space-y-4 text-gray-700">
          <li>
            <span className="font-semibold">Email:</span>{' '}
            <a
              href="mailto:support@firstserveseattle.com"
              className="underline"
            >
              support@firstserveseattle.com
            </a>
          </li>
          <li>
            <span className="font-semibold">Phone:</span>{' '}
            <a href="tel:2064573039" className="underline">
              (206) 457-3039
            </a>{' '}
            (voicemail—responses in 2–3 business days)
          </li>
        </ul>
      </section>
    )
  }
  