import Link from "next/link";
import Image from "next/image";
import { families } from "@/lib/data";

export const metadata = {
  title: "For Families – AuPairly",
  description: "Post your family listing and find a trusted au pair for your children.",
};

export default function FamiliesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">For Host Families</h1>
          <p className="text-indigo-100 text-lg mb-8">
            Find a trusted, background-checked au pair who will become part of your family.
            Flexible, affordable childcare with a rich cultural exchange.
          </p>
          <Link
            href="/sign-up"
            className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition-colors"
          >
            Post a Family Listing
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-10 text-center">
            What Families Get with AuPairly
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "👶", title: "Flexible Childcare", desc: "More affordable than a nanny, more flexible than a daycare. Au pairs adapt to your schedule." },
              { icon: "🌐", title: "Cultural Exchange", desc: "Bring the world into your home. Your children will grow up with a global perspective and new language skills." },
              { icon: "🔒", title: "Verified & Safe", desc: "All au pairs are identity-checked, reference-verified, and background screened before listing." },
              { icon: "💬", title: "Direct Communication", desc: "Message, video call, and get to know candidates before making any commitment." },
              { icon: "📋", title: "Placement Support", desc: "Our team guides you through contracts, visa advice, and insurance requirements." },
              { icon: "⭐", title: "Rated by Families", desc: "Read real reviews from families who have hosted each au pair." },
            ].map((b) => (
              <div key={b.title} className="bg-gray-50 rounded-2xl p-6">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Family Profiles */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900">Families Looking for Au Pairs</h2>
            <p className="text-gray-500 mt-2">See what other families are posting on AuPairly</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((fam) => (
              <div
                key={fam.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src={fam.photo}
                    alt={fam.name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover w-14 h-14"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">{fam.name}</h3>
                    <p className="text-gray-500 text-sm">{fam.location}</p>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-3">{fam.bio}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {fam.needs.slice(0, 3).map((n) => (
                    <span key={n} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                      {n}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-500">
                  {fam.children} child{fam.children > 1 ? "ren" : ""} · Ages {fam.childrenAges}
                </div>
                <div className="text-yellow-500 text-sm mt-1">★ {fam.rating} ({fam.reviewCount} reviews)</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-indigo-600 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-3">Ready to Find Your Au Pair?</h2>
          <p className="text-indigo-100 mb-6">
            Create a free profile and start browsing thousands of qualified au pairs today.
          </p>
          <Link
            href="/au-pairs"
            className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors inline-block"
          >
            Browse Au Pairs
          </Link>
        </div>
      </section>
    </div>
  );
}
