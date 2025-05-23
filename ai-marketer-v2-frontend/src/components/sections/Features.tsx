const features = [
  {
    title: "AI Caption Generator",
    description:
      "Upload product photos and get engaging captions that match your business vibe and target customers.",
    icon: "🤖",
  },
  {
    title: "Smart Promotion Suggestions",
    description:
      "AI analyzes your sales data to suggest effective promotions for your best and worst-selling products.",
    icon: "📊",
  },
  {
    title: "Multi-Platform Publishing",
    description:
      "Schedule and publish content across Instagram and Facebook with Square POS integration.",
    icon: "📱",
  },
];

export default function Features() {
  return (
    <section className="py-16 bg-gradient-to-r from-indigo-50 to-indigo-200 text-black">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-indigo-900 mb-10">
          {`Everything You Need to Grow Your Business's Social Presence`}
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-10 h-64 flex flex-col justify-between bg-white rounded-3xl shadow-lg hover:scale-105 transition-transform"
            >
              <div className="text-6xl">{feature.icon}</div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-700 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
