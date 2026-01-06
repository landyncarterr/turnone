export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-2">
              We collect the following information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Email address (for account authentication)</li>
              <li>Stripe customer ID (for billing purposes)</li>
              <li>Session data you provide when generating reports</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Information</h2>
            <p className="text-gray-700">
              We use your email address for authentication and account management. Your Stripe customer ID is used to manage subscriptions and billing. Session data you provide is used solely to generate reports and is not stored server-side unless explicitly specified.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Storage</h2>
            <p className="text-gray-700">
              Generated reports are not stored on our servers by default. Reports may be stored locally in your browser for your convenience. We use Stripe for payment processing and customer management. Your email and Stripe customer ID are stored securely.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
            <p className="text-gray-700">
              We use Google for authentication and Stripe for payment processing. These services have their own privacy policies governing how they handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact</h2>
            <p className="text-gray-700">
              For privacy-related questions, please contact: <a href="mailto:support@stratusracing.com" className="text-[#E10600] hover:underline">support@stratusracing.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

