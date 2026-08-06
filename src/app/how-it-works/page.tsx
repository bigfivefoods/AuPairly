import Link from "next/link";

export const metadata = {
  title: "How It Works – AuPairly",
  description: "Learn how AuPairly connects families with au pairs in four simple steps.",
};

const familySteps = [
  {
    step: "01",
    title: "Create Your Family Profile",
    description:
      "Tell us about your family, your children, your home, and what you're looking for in an au pair. The more detail you provide, the better your matches will be.",
  },
  {
    step: "02",
    title: "Browse & Favourite Au Pairs",
    description:
      "Search our database of verified au pairs and filter by nationality, language, experience, and availability. Save your favourites to revisit later.",
  },
  {
    step: "03",
    title: "Connect & Interview",
    description:
      "Send messages to au pairs you like. Schedule video calls to get to know each other, ask questions, and share documents securely.",
  },
  {
    step: "04",
    title: "Confirm & Welcome",
    description:
      "Once you've found your match, our team helps with contracts, visa guidance, and any paperwork. Then welcome your au pair to your home!",
  },
];

const auPairSteps = [
  {
    step: "01",
    title: "Create Your Au Pair Profile",
    description:
      "Showcase your skills, experience, languages, and personality. Upload photos and references, and let families know when you're available.",
  },
  {
    step: "02",
    title: "Get Verified",
    description:
      "Complete our quick identity and reference checks. Verified profiles appear higher in search results and inspire more trust.",
  },
  {
    step: "03",
    title: "Browse & Apply to Families",
    description:
      "Discover host families who match your interests and requirements. Send personal messages to introduce yourself.",
  },
  {
    step: "04",
    title: "Pack Your Bags",
    description:
      "Once you've agreed with a family, we help you prepare for the journey — visa tips, travel checklists, and ongoing support.",
  },
];

const faqs = [
  {
    q: "How much does AuPairly cost?",
    a: "Families pay a small monthly subscription to access full profiles and messaging. Au pairs can create profiles and apply for free.",
  },
  {
    q: "Are the au pairs background-checked?",
    a: "Yes. All au pairs must complete identity verification and submit references before their profile goes live.",
  },
  {
    q: "What countries does AuPairly support?",
    a: "We support families and au pairs in over 60 countries, with legal guidance tailored to each country's au pair visa regulations.",
  },
  {
    q: "What if things don't work out?",
    a: "Our support team is available 24/7. We can help mediate issues and, if necessary, help you find a new match quickly.",
  },
  {
    q: "How long does the process take?",
    a: "Most families find their ideal au pair within 2–6 weeks. Urgent placements can often be arranged more quickly.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">How AuPairly Works</h1>
          <p className="text-indigo-100 text-lg">
            Whether you're a family looking for childcare or an au pair seeking an adventure,
            we make the process simple, safe, and successful.
          </p>
        </div>
      </section>

      {/* For Families */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
              For Families
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-3">Find Your Perfect Au Pair</h2>
          </div>
          <div className="space-y-8">
            {familySteps.map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/au-pairs"
              className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
            >
              Start Browsing Au Pairs
            </Link>
          </div>
        </div>
      </section>

      {/* For Au Pairs */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1 rounded-full">
              For Au Pairs
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-3">Start Your Au Pair Journey</h2>
          </div>
          <div className="space-y-8">
            {auPairSteps.map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/sign-up"
              className="bg-purple-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-purple-700 transition-colors inline-block"
            >
              Create Your Profile
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
