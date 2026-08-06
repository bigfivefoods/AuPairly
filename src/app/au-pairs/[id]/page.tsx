import { auPairs } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return auPairs.map((ap) => ({ id: ap.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ap = auPairs.find((a) => a.id === id);
  if (!ap) return {};
  return {
    title: `${ap.name} – AuPairly`,
    description: ap.bio,
  };
}

export default async function AuPairProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ap = auPairs.find((a) => a.id === id);
  if (!ap) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/au-pairs" className="text-indigo-600 text-sm hover:underline mb-6 block">
        ← Back to Au Pairs
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white flex flex-col sm:flex-row items-center gap-6">
          <Image
            src={ap.photo}
            alt={ap.name}
            width={112}
            height={112}
            className="rounded-full object-cover border-4 border-white/30 w-28 h-28"
          />
          <div>
            <h1 className="text-3xl font-extrabold">{ap.name}</h1>
            <p className="text-indigo-200 mt-1">
              {ap.nationality} · Age {ap.age} · {ap.location}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-yellow-300 font-medium">
                ★ {ap.rating} ({ap.reviewCount} reviews)
              </span>
              <span className="bg-green-400/20 border border-green-300/40 text-green-200 text-xs px-3 py-1 rounded-full">
                {ap.availability}
              </span>
            </div>
          </div>
          <div className="sm:ml-auto">
            <Link
              href="/sign-up"
              className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 transition-colors block text-center"
            >
              Contact {ap.name.split(" ")[0]}
            </Link>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 grid md:grid-cols-3 gap-8">
          {/* Main */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About Me</h2>
              <p className="text-gray-600 leading-relaxed">{ap.bio}</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Skills & Certifications</h2>
              <div className="flex flex-wrap gap-2">
                {ap.skills.map((s) => (
                  <span
                    key={s}
                    className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {ap.languages.map((l) => (
                  <span
                    key={l}
                    className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">Quick Facts</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-medium text-gray-900">{ap.experience} years</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Nationality</span>
                  <span className="font-medium text-gray-900">{ap.nationality}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Age</span>
                  <span className="font-medium text-gray-900">{ap.age}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900">{ap.location}</span>
                </li>
              </ul>
            </div>

            <div className="bg-indigo-600 rounded-xl p-5 text-white text-center">
              <p className="text-sm mb-3">Interested in {ap.name.split(" ")[0]}?</p>
              <Link
                href="/sign-up"
                className="bg-white text-indigo-600 font-bold px-5 py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors block"
              >
                Send a Message
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
