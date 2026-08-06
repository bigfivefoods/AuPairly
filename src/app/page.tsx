import Link from "next/link";
import Image from "next/image";
import { auPairs } from "@/lib/data";

const features = [
  {
    icon: "🔍",
    title: "Smart Matching",
    description:
      "Our algorithm matches families with the ideal au pair based on location, language, experience, and lifestyle preferences.",
  },
  {
    icon: "✅",
    title: "Verified Profiles",
    description:
      "Every au pair undergoes identity verification, background checks, and reference validation before joining AuPairly.",
  },
  {
    icon: "💬",
    title: "Direct Messaging",
    description:
      "Chat securely with candidates before committing. Video calls, document sharing, and more — all in one place.",
  },
  {
    icon: "🌍",
    title: "Global Network",
    description:
      "Connect with au pairs from over 60 countries, bringing cultural exchange and language learning to your home.",
  },
  {
    icon: "🛡️",
    title: "Safe & Secure",
    description:
      "We take safety seriously. Every placement comes with support, insurance guidance, and 24/7 assistance.",
  },
  {
    icon: "💳",
    title: "Affordable Plans",
    description:
      "Flexible subscription plans for families of all sizes. No hidden fees — transparent pricing from day one.",
  },
];

const steps = [
  { step: "1", title: "Create a Profile", description: "Families post their listing; au pairs share their story, skills, and availability." },
  { step: "2", title: "Browse & Connect", description: "Search verified profiles, favourite your top picks, and send introduction messages." },
  { step: "3", title: "Interview & Decide", description: "Schedule video calls, ask questions, and choose the right match with confidence." },
  { step: "4", title: "Begin the Journey", description: "Finalise the arrangement, complete paperwork, and welcome your au pair to the family." },
];

const stats = [
  { value: "15,000+", label: "Verified Au Pairs" },
  { value: "8,000+", label: "Happy Families" },
  { value: "60+", label: "Countries" },
  { value: "4.9 ★", label: "Average Rating" },
];

export default function Home() {
  const featuredAuPairs = auPairs.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-24 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              Trusted by 8,000+ families worldwide
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
              Find Your Perfect <br />
              <span className="text-yellow-300">Au Pair</span> Today
            </h1>
            <p className="text-lg text-indigo-100 mb-8 max-w-lg">
              AuPairly connects families with caring, qualified au pairs from around the world.
              Affordable childcare, cultural exchange, and lifelong friendships — all in one platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/au-pairs"
                className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 transition-colors"
              >
                Browse Au Pairs
              </Link>
              <Link
                href="/how-it-works"
                className="bg-white/10 border border-white/30 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                How It Works
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              {featuredAuPairs.map((ap) => (
                <div
                  key={ap.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-sm"
                >
                  <Image
                    src={ap.photo}
                    alt={ap.name}
                    width={56}
                    height={56}
                    className="rounded-full mb-3 object-cover"
                  />
                  <p className="font-semibold">{ap.name}</p>
                  <p className="text-indigo-200 text-xs">{ap.nationality} · {ap.experience}y exp</p>
                  <p className="mt-1 text-yellow-300 text-xs">★ {ap.rating}</p>
                </div>
              ))}
              <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-yellow-300">15K+</span>
                <span className="text-xs text-indigo-200 mt-1">Au Pairs Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-indigo-600">{s.value}</p>
              <p className="text-gray-500 mt-1 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">Why Families Choose AuPairly</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Everything you need to find trustworthy childcare, in one beautifully simple platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900">How AuPairly Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Finding your ideal au pair is simple. Here's what to expect.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/how-it-works"
              className="text-indigo-600 font-medium hover:underline"
            >
              Learn more about the process →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured au pairs */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Featured Au Pairs</h2>
              <p className="text-gray-500 mt-1">Top-rated candidates available now</p>
            </div>
            <Link
              href="/au-pairs"
              className="text-indigo-600 font-medium hover:underline hidden sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAuPairs.map((ap) => (
              <Link
                key={ap.id}
                href={`/au-pairs/${ap.id}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Image
                      src={ap.photo}
                      alt={ap.name}
                      width={56}
                      height={56}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {ap.name}
                      </h3>
                      <p className="text-gray-500 text-sm">{ap.nationality} · Age {ap.age}</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">{ap.bio}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ap.languages.slice(0, 3).map((l) => (
                      <span key={l} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-500 font-medium">★ {ap.rating} ({ap.reviewCount})</span>
                    <span className="text-green-600 font-medium text-xs">{ap.availability}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link href="/au-pairs" className="text-indigo-600 font-medium hover:underline">
              View all au pairs →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-indigo-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">Ready to Find Your Match?</h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Join thousands of families and au pairs who have found their perfect match on AuPairly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition-colors"
            >
              I'm a Family
            </Link>
            <Link
              href="/sign-up"
              className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              I'm an Au Pair
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
