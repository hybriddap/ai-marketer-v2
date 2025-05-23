import { FaUpload, FaRobot, FaShareAlt } from "react-icons/fa";

export default function HowItWorks() {
  const steps = [
    {
      icon: FaUpload,
      title: "Upload Product Photos",
      description:
        "Take photos of your products, services, or business atmosphere.",
    },
    {
      icon: FaRobot,
      title: "AI Creates Perfect Caption",
      description:
        "Our AI analyzes your business info and creates engaging captions tailored to your brand.",
    },
    {
      icon: FaShareAlt,
      title: "Schedule & Publish",
      description:
        "Post instantly or schedule for optimal times across Instagram and Facebook.",
    },
  ];

  return (
    <section className="py-16 bg-gray-50 text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-10">How It Works</h2>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-5xl mx-auto px-6">
        <div className="relative flex flex-col items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;

            return (
              <div key={index} className="relative w-full mb-8 last:mb-0">
                <div
                  className={`flex items-center ${
                    isEven ? "justify-start" : "justify-end"
                  }`}
                >
                  <div className={`w-1/2 ${isEven ? "pr-8" : "pl-8"}`}>
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-md flex items-center space-x-4">
                      <Icon className="text-indigo-600 text-3xl flex-shrink-0" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="text-sm text-gray-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute -bottom-4 ${
                      isEven ? "left-1/2" : "right-1/2"
                    } 
                    ${
                      isEven
                        ? "transform -translate-x-1/2"
                        : "transform translate-x-1/2"
                    }`}
                  >
                    <div
                      className={`w-16 h-16 ${
                        isEven
                          ? "border-l-2 border-b-2"
                          : "border-r-2 border-b-2"
                      } 
                      border-indigo-400`}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden max-w-sm mx-auto px-6">
        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={index} className="relative">
                <div className="bg-white px-6 py-6 rounded-2xl shadow-md text-center">
                  <div className="mb-4">
                    <Icon className="text-indigo-600 text-4xl mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>

                {/* Step Number */}
                <div
                  className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 text-white 
                  rounded-full flex items-center justify-center text-sm font-bold"
                >
                  {index + 1}
                </div>

                {/* Connector Arrow */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="w-0.5 h-8 bg-indigo-400"></div>
                    <div className="absolute mt-6">
                      <svg
                        className="w-4 h-4 text-indigo-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
