export const metadata = {
  title: "Get Started – AuPairly",
  description: "Create your free AuPairly account as a family or au pair.",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Get Started with AuPairly</h1>
          <p className="text-gray-500 mt-2">Choose how you'd like to join our community.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Family card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">I'm a Family</h2>
            <p className="text-gray-500 text-sm mb-6">
              Post a listing and find verified, caring au pairs for your children.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Family name"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email address"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                Create Family Account
              </button>
            </div>
          </div>

          {/* Au pair card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center hover:shadow-md transition-shadow">
            <div className="text-5xl mb-4">🌍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">I'm an Au Pair</h2>
            <p className="text-gray-500 text-sm mb-6">
              Create a profile and connect with wonderful families around the world.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your full name"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="email"
                placeholder="Email address"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors">
                Create Au Pair Profile
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          By signing up, you agree to our{" "}
          <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and{" "}
          <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
