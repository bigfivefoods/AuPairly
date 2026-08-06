import Link from "next/link";
import Image from "next/image";
import { auPairs } from "@/lib/data";

export const metadata = {
  title: "Browse Au Pairs – AuPairly",
  description: "Search and filter verified au pairs from around the world.",
};

export default function AuPairsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Find an Au Pair</h1>
        <p className="text-gray-500 mt-2">
          Browse our {auPairs.length} verified au pairs and find your perfect match.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-10 flex flex-wrap gap-4">
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50">
          <option>All Nationalities</option>
          <option>German</option>
          <option>Swedish</option>
          <option>French</option>
          <option>Italian</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50">
          <option>Any Experience</option>
          <option>1+ years</option>
          <option>3+ years</option>
          <option>5+ years</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50">
          <option>All Languages</option>
          <option>English</option>
          <option>French</option>
          <option>Spanish</option>
          <option>German</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50">
          <option>Any Availability</option>
          <option>Available now</option>
          <option>Available soon</option>
        </select>
        <button className="ml-auto bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Search
        </button>
      </div>

      {/* Results */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {auPairs.map((ap) => (
          <Link
            key={ap.id}
            href={`/au-pairs/${ap.id}`}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={ap.photo}
                  alt={ap.name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover w-16 h-16"
                />
                <div>
                  <h2 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {ap.name}
                  </h2>
                  <p className="text-gray-500 text-sm">{ap.nationality} · Age {ap.age}</p>
                  <p className="text-gray-400 text-xs">{ap.location}</p>
                </div>
              </div>

              <p className="text-gray-500 text-sm line-clamp-3 mb-4">{ap.bio}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {ap.languages.map((l) => (
                  <span
                    key={l}
                    className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full"
                  >
                    {l}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {ap.skills.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                <span className="text-yellow-500 font-medium">
                  ★ {ap.rating}{" "}
                  <span className="text-gray-400 font-normal">({ap.reviewCount} reviews)</span>
                </span>
                <span className="text-green-600 font-medium text-xs">{ap.availability}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
