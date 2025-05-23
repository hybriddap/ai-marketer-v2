import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-purple-400 to-indigo-500 text-white text-center">
      <h2 className="text-5xl font-extrabold">
        Ready to Transform Your Business Marketing?
      </h2>
      <p className="mt-6 text-xl text-gray-200">
        Join businesses already using AI to create engaging content and boost
        sales.
      </p>
      <div className="mt-10">
        <Link
          href="/login"
          className="px-12 py-5 bg-white text-indigo-700 font-bold text-xl rounded-full shadow-lg
                              hover:shadow-2xl hover:scale-110 transition-transform duration-200"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}
