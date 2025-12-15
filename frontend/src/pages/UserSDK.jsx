export default function UserSDK() {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-24 space-y-20">

      {/* HERO */}
      <section className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          UniPay Developer SDK & Integration Guide
        </h1>

        <p className="text-gray-600 max-w-3xl">
          UniPay is a unified payment gateway layer that lets you integrate
          multiple payment providers through a single project-based setup.
          This guide explains the full lifecycle — from creating a project
          to accepting and managing payments.
        </p>
      </section>

      {/* PROJECT CREATION */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">1. Creating a Project</h2>

        <p className="text-gray-700 max-w-4xl">
          Every payment flow in UniPay starts with a <strong>Project</strong>.
          A project represents one application, website, or product that will
          accept payments.
        </p>

        <div className="rounded-xl bg-gray-900 text-gray-100 p-5 text-sm">
          <code>
            Dashboard → Projects → Create Project
          </code>
        </div>

        <h3 className="text-lg font-semibold mt-6">Step 1: Project Information</h3>

        <ul className="list-disc ml-6 space-y-2 text-gray-700">
          <li><strong>Project Name</strong> — Internal identifier for your app</li>
          <li><strong>Description</strong> — Optional context</li>
          <li><strong>Success URL</strong> — Redirect after successful payment</li>
          <li><strong>Failure URL</strong> — Redirect after failed payment</li>
          <li><strong>Webhook URL</strong> — Server endpoint for payment callbacks</li>
        </ul>

        <p className="text-gray-700">
          These URLs are saved at the project level and automatically reused
          for test and live payments.
        </p>
      </section>

      {/* GATEWAY CONFIG */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">2. Gateway Selection & Configuration</h2>

        <p className="text-gray-700 max-w-4xl">
          In the next step, you choose which payment gateways your project
          will support. Each gateway must be enabled and configured
          individually.
        </p>

        <h3 className="text-lg font-semibold">Available Gateways</h3>

        <ul className="list-disc ml-6 space-y-2 text-gray-700">
          <li>PayU</li>
          <li>Cashfree</li>
          <li>Paytm</li>
          <li>Razorpay</li>
          <li>PayPal</li>
        </ul>

        <p className="text-gray-700">
          Enabling a gateway opens a configuration drawer where you must
          enter gateway-specific credentials.
        </p>

        <div className="rounded-xl bg-gray-900 text-gray-100 p-5 text-sm">
          <code>
            Example (Cashfree):<br />
            CASHFREE_APP_ID<br />
            CASHFREE_SECRET_KEY<br />
            CASHFREE_BASE_URL
          </code>
        </div>

        <p className="text-gray-700">
          A gateway is marked <strong>Configured</strong> only after all
          required fields are filled. Unconfigured gateways cannot be used.
        </p>
      </section>

      {/* GST FLOW */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">3. GST / Tax Invoice Setup</h2>

        <p className="text-gray-700 max-w-4xl">
          After gateway configuration, UniPay asks whether you want to
          generate GST-compliant invoices.
        </p>

        <h3 className="text-lg font-semibold">If you choose “No”</h3>
        <p className="text-gray-700">
          The project is created immediately and you are redirected to
          the Projects page.
        </p>

        <h3 className="text-lg font-semibold">If you choose “Yes”</h3>
        <p className="text-gray-700">
          You must provide GST details including address, GST number,
          state, city, pincode, and optional signature upload.
        </p>

        <p className="text-gray-700">
          These details are stored at the project level and used when
          generating invoices.
        </p>
      </section>

      {/* ACCEPT PAYMENTS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">4. Accepting Payments</h2>

        <p className="text-gray-700 max-w-4xl">
          Once a project is created, UniPay automatically provisions it
          with the selected gateways and callback configuration.
        </p>

        <p className="text-gray-700">
          Payments can be initiated via:
        </p>

        <ul className="list-disc ml-6 space-y-2 text-gray-700">
          <li>Project-specific test payments</li>
          <li>Your frontend using UniPay APIs</li>
        </ul>
      </section>

      {/* TEST PAYMENTS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">5. Test Payments</h2>

        <p className="text-gray-700 max-w-4xl">
          Each project includes a built-in test payment page to verify
          integrations before going live.
        </p>

        <div className="rounded-xl bg-gray-900 text-gray-100 p-5 text-sm">
          <code>
            /projects/:projectId/test-payment
          </code>
        </div>

        <ul className="list-disc ml-6 space-y-2 text-gray-700">
          <li>Only enabled gateways are shown</li>
          <li>Uses saved callback URLs</li>
          <li>Simulates real transaction flow</li>
        </ul>
      </section>

      {/* DASHBOARD */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">6. Project Dashboard</h2>

        <p className="text-gray-700 max-w-4xl">
          After payments occur, the Project Dashboard becomes the
          central control panel.
        </p>

        <ul className="list-disc ml-6 space-y-2 text-gray-700">
          <li><strong>Dashboard</strong> — Revenue, volume, success metrics</li>
          <li><strong>Transactions</strong> — All payment records</li>
          <li><strong>Refunds</strong> — Refundable transactions</li>
          <li><strong>Settings</strong> — Project & gateway management</li>
        </ul>
      </section>

      {/* SETTINGS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">7. Settings & Gateway Management</h2>

        <p className="text-gray-700 max-w-4xl">
          The Settings tab allows you to update project metadata and
          manage gateways after creation.
        </p>

        <ul className="list-disc ml-6 space-y-2 text-gray-700">
          <li>Edit callback URLs</li>
          <li>Enable or disable gateways</li>
          <li>Update gateway credentials</li>
          <li>Delete a project permanently</li>
        </ul>

        <div className="rounded-xl bg-gray-900 text-gray-100 p-5 text-sm">
          <code>
            Gateway changes apply only to future payments.
          </code>
        </div>
      </section>

      {/* FOOTER */}
      <section className="pt-12 border-t">
        <p className="text-gray-500 text-sm">
          UniPay — Unified Payments. Clean Architecture. No Guesswork.
        </p>
      </section>

    </div>
  );
}
