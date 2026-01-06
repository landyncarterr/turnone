export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Service Description</h2>
            <p className="text-gray-700">
              TurnOne is a web-based service that generates professional racing performance reports based on session data provided by users. The service uses AI technology to analyze and format racing session information into structured reports.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Responsibility</h2>
            <p className="text-gray-700">
              Users are responsible for the accuracy of all data entered into the service. TurnOne is not responsible for errors in reports resulting from incorrect or incomplete input data. Users are responsible for maintaining the confidentiality of their account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Subscription & Billing</h2>
            <p className="text-gray-700">
              TurnOne offers subscription plans with different report generation limits. Subscriptions are billed monthly and automatically renew unless cancelled. Users can manage their subscription and billing through the customer portal. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Limitation of Liability</h2>
            <p className="text-gray-700">
              TurnOne provides the service "as is" without warranties of any kind. We are not liable for any damages arising from the use or inability to use the service. Reports generated are for informational purposes and should not be the sole basis for racing decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact</h2>
            <p className="text-gray-700">
              For questions about these terms, please contact: <a href="mailto:support@stratusracing.com" className="text-[#E10600] hover:underline">support@stratusracing.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

