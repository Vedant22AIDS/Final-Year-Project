"use client";

import { useState } from "react";
import { Button } from "../components/ui/button.tsx";
import { Slider } from "../components/ui/slider.tsx";
import { Check, X, Star, ArrowRight, Shield, Globe, Award } from "lucide-react";

export default function Pricing() {
  const [useCase, setUseCase] = useState<"B2C" | "B2B">("B2C");
  const [billing, setBilling] = useState<"Monthly" | "Yearly">("Monthly");
  const [userCount, setUserCount] = useState([1000]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const userOptions = [500, 1000, 2500, 5000, 7500, 10000, 25000, 50000];

  const getSliderValue = () => {
    const index = userOptions.findIndex((val) => val >= userCount[0]);
    return index === -1 ? userOptions.length - 1 : index;
  };

  const handleSliderChange = (value: number) => {
    setUserCount([userOptions[value] || 50000]);
  };

  const getPrice = (basePrice: number, yearlyDiscount = 0.2) => {
    if (billing === "Yearly") {
      return Math.floor(basePrice * (1 - yearlyDiscount));
    }
    return basePrice;
  };

  const featureComparison = [
    {
      category: "Core Features",
      features: [
        {
          name: "Data Processing Volume",
          free: "10K records/month",
          essentials: "100K records/month",
          professional: "1M records/month",
          enterprise: "Unlimited",
        },
        {
          name: "API Calls",
          free: "1K/month",
          essentials: "10K/month",
          professional: "100K/month",
          enterprise: "Unlimited",
        },
        {
          name: "Data Sources",
          free: "3",
          essentials: "10",
          professional: "50",
          enterprise: "Unlimited",
        },
        {
          name: "Custom Transformations",
          free: false,
          essentials: true,
          professional: true,
          enterprise: true,
        },
        {
          name: "Real-time Processing",
          free: false,
          essentials: false,
          professional: true,
          enterprise: true,
        },
      ],
    },
    {
      category: "Security & Compliance",
      features: [
        {
          name: "Data Encryption",
          free: true,
          essentials: true,
          professional: true,
          enterprise: true,
        },
        {
          name: "SOC 2 Compliance",
          free: false,
          essentials: false,
          professional: true,
          enterprise: true,
        },
        {
          name: "GDPR Compliance",
          free: true,
          essentials: true,
          professional: true,
          enterprise: true,
        },
        {
          name: "Custom Security Policies",
          free: false,
          essentials: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "Audit Logs",
          free: false,
          essentials: true,
          professional: true,
          enterprise: true,
        },
      ],
    },
    {
      category: "Support & SLA",
      features: [
        {
          name: "Support Response",
          free: "Community",
          essentials: "48 hours",
          professional: "24 hours",
          enterprise: "1 hour",
        },
        {
          name: "Uptime SLA",
          free: "99%",
          essentials: "99.5%",
          professional: "99.9%",
          enterprise: "99.99%",
        },
        {
          name: "Dedicated Support",
          free: false,
          essentials: false,
          professional: false,
          enterprise: true,
        },
        {
          name: "Custom Onboarding",
          free: false,
          essentials: false,
          professional: true,
          enterprise: true,
        },
        {
          name: "Training Sessions",
          free: false,
          essentials: false,
          professional: true,
          enterprise: true,
        },
      ],
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO at DataFlow Inc",
      company: "DataFlow Inc",
      content:
        "This platform transformed our data preprocessing workflow. We reduced processing time by 80% and our data quality improved dramatically.",
      rating: 5,
      avatar:
        "https://www.thynkgroup.com.au/wp-content/uploads/2021/07/1D4A7349-Edit-2.jpg",
    },
    {
      name: "Michael Rodriguez",
      role: "Lead Engineer at TechCorp",
      company: "TechCorp",
      content:
        "The API is incredibly robust and the real-time processing capabilities are exactly what we needed for our ML pipeline.",
      rating: 5,
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZGjfILXb82wEUYdntNNYHSrzXlb1FXllA8Q&s",
    },
    {
      name: "Emily Watson",
      role: "Data Scientist at AI Labs",
      company: "AI Labs",
      content:
        "Best investment we made this year. The custom transformations and enterprise support are top-notch.",
      rating: 5,
      avatar:
        "https://media.licdn.com/dms/image/v2/C4D03AQElEbUvz06mAA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1623668175903?e=2147483647&v=beta&t=oDn8aNICsdycsMKbkg5t6ig1kyZX4SknoR5fFLmgGo8",
    },
  ];

  const faqs = [
    {
      question: "What counts as a monthly active user?",
      answer:
        "A monthly active user is any unique user whose data is processed through our platform within a calendar month. This includes both API calls and batch processing jobs.",
    },
    {
      question: "Can I change my plan at any time?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated accordingly. Downgrades take effect at the next billing cycle.",
    },
    {
      question: "What happens if I exceed my processing limits?",
      answer:
        "If you exceed your monthly processing limits, we'll notify you and provide options to upgrade your plan or purchase additional capacity. Your service won't be interrupted.",
    },
    {
      question: "Do you offer custom enterprise solutions?",
      answer:
        "Yes, our Enterprise plan includes custom solutions, dedicated infrastructure, tailored SLAs, and white-glove support to meet your specific requirements.",
    },
    {
      question: "Is there a free trial for paid plans?",
      answer:
        "Yes, all paid plans come with a 14-day free trial with full access to features. No credit card required to start your trial.",
    },
    {
      question: "How secure is my data?",
      answer:
        "We use enterprise-grade encryption, SOC 2 compliance, and follow industry best practices. Your data is encrypted in transit and at rest, and we never store your processed data longer than necessary.",
    },
  ];

  const companies = [
    { name: "TechCorp", logo: "/placeholder.svg?height=40&width=120" },
    { name: "DataFlow", logo: "/placeholder.svg?height=40&width=120" },
    { name: "AI Labs", logo: "/placeholder.svg?height=40&width=120" },
    { name: "CloudTech", logo: "/placeholder.svg?height=40&width=120" },
    { name: "InnovateCo", logo: "/placeholder.svg?height=40&width=120" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      <div className="container mx-auto px-12 py-12">
        {/* Header Section */}
        <div className="mb-12 mt-12">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-2">
                Flexible pricing for
              </h1>
              <h1 className="text-5xl font-bold leading-tight">
                <p className="flex items-center justify-center space-x-4 text-[3.75rem] font-extrabold leading-none">
                  <span className="bg-gradient-to-r from-purple-500 to-teal-300 bg-clip-text text-transparent">
                    developers
                  </span>
                  <span className="text-white">&amp;</span>
                  <span className="bg-gradient-to-r from-purple-500 to-amber-300 bg-clip-text text-transparent">
                    companies
                  </span>
                </p>
              </h1>
            </div>
            <div className="flex gap-3">
              <Button className="bg-gray-200 text-black hover:bg-gray-300 rounded-md px-6 py-2 text-sm font-medium text-base font-bold">
                Start building for free
              </Button>
              <Button
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800 rounded-md px-6 py-2 text-sm font-medium bg-transparent text-base font-bold"
              >
                Talk to our Sales team
              </Button>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Add data preprocessing to your application today
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex justify-between items-center mb-12">
          {/* Use Case Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-white text-base font-bold">
              What is your use case?
            </span>
            <div className="flex bg-transparent gap-2">
              <Button
                onClick={() => setUseCase("B2C")}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                  useCase === "B2C"
                    ? "bg-white text-black"
                    : "bg-transparent text-white border border-gray-600 hover:bg-gray-800"
                }`}
              >
                B2C
              </Button>
              <Button
                onClick={() => setUseCase("B2B")}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                  useCase === "B2B"
                    ? "bg-white text-black"
                    : "bg-transparent text-white border border-gray-600 hover:bg-gray-800"
                }`}
              >
                B2B
              </Button>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-white text-base font-bold">Billing</span>
            <div className="flex bg-transparent gap-2">
              <Button
                onClick={() => setBilling("Monthly")}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                  billing === "Monthly"
                    ? "bg-white text-black"
                    : "bg-transparent text-white border border-gray-600 hover:bg-gray-800"
                }`}
              >
                Monthly
              </Button>
              <Button
                onClick={() => setBilling("Yearly")}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors relative ${
                  billing === "Yearly"
                    ? "bg-white text-black"
                    : "bg-transparent text-white border border-gray-600 hover:bg-gray-800"
                }`}
              >
                Yearly
                <span className="absolute -top-4 -right-10 bg-green-500 text-black text-xs px-2 py-1 rounded-full">
                  Save 20%
                </span>
              </Button>
            </div>
          </div>

          {/* User Count Slider */}
          <div className="flex items-center gap-4">
            <span className="text-white text-base font-bold">
              How many monthly active users?
            </span>
            <span className="text-gray-400 text-xs">ⓘ</span>
            <div className="flex items-center gap-4 min-w-[400px]">
              <div className="flex-1 px-4">
                <Slider
                  value={getSliderValue()}
                  onChange={handleSliderChange}
                  max={userOptions.length - 1}
                  min={0}
                  step={1}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>500</span>
                  <span>1000</span>
                  <span>2500</span>
                  <span>5000</span>
                  <span>7500</span>
                  <span>10000</span>
                  <span>25000</span>
                  <span>50000+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-4 gap-6 mb-16">
          {/* Free Plan */}
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border border-blue-800 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Free</h3>
              <p className="text-gray-300 text-sm mb-4">
                No credit card needed to sign up.
              </p>
              <Button className="w-full bg-transparent border border-gray-600 text-white hover:bg-gray-800 rounded-md py-2 text-sm">
                Start building for free
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-white font-medium">
                Up to 10,000 monthly active users will have:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Basic data preprocessing</li>
                <li>• Use your own Custom Domain</li>
                <li>• Connections with APIs, e-mail, Webhook and CSV</li>
                <li>• Unlimited flows</li>
                <li>• Organizations (how we model your customers)</li>
                <li>• Data processing for all your customers using ML/AI</li>
                <li>
                  • Webhook and custom logic during data ingestion, cleanup,
                  etc. (Actions)
                </li>
                <li>• Basic Data Protection</li>
                <li>• Community Support</li>
              </ul>
              <p className="text-xs text-gray-400 italic">
                *Credit card and verification required for custom domains
              </p>
            </div>
          </div>

          {/* Essentials Plan */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Essentials</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl font-bold text-white">
                  ${getPrice(35)}
                </span>
                <span className="text-gray-400 text-sm ml-1">/month</span>
                {billing === "Yearly" && (
                  <span className="text-green-400 text-xs ml-2">20% off</span>
                )}
              </div>
              <p className="text-gray-300 text-sm mb-4">
                For projects with higher production demands.
              </p>
              <Button className="w-full bg-white text-black hover:bg-gray-200 rounded-md py-2 text-sm font-medium">
                Sign up
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-white font-medium">
                Up to 500 monthly active users will have:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Everything in Free, plus:</li>
                <li>• Higher API, Processing Limits, and Feature limits</li>
                <li>• Multi-Factor Authentication (With CSV Data)</li>
                <li>• Role-based Access Control For Organization</li>
                <li>• Organizations (how we model your customers)</li>
                <li>
                  • Stream, Audit, Audit Logs, Datadog, Splunk, AWS, Azure, etc.
                </li>
                <li>• Separate Production & Development Environments</li>
                <li>• Standard Support</li>
              </ul>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">
                Professional
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-3xl font-bold text-white">
                  ${getPrice(240)}
                </span>
                <span className="text-gray-400 text-sm ml-1">/month</span>
                {billing === "Yearly" && (
                  <span className="text-green-400 text-xs ml-2">20% off</span>
                )}
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Best for teams and projects that need added security.
              </p>
              <Button className="w-full bg-white text-black hover:bg-gray-200 rounded-md py-2 text-sm font-medium">
                Sign up
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-white font-medium">
                Up to 1,000 monthly active users will have:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Everything in Essentials, plus:</li>
                <li>• Use your existing User Database via SCIM</li>
                <li>
                  • Multi-Factor Authentication (With Phone, Email, Guardian
                  app)
                </li>
                <li>• Organizations (how we model your customers)</li>
                <li>• Advanced Data Protection</li>
              </ul>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-gray-300 text-sm mb-4">
                For the SLAs, advanced security, white-glove support and more.
              </p>
              <Button className="w-full bg-gray-700 text-white hover:bg-gray-600 rounded-md py-2 text-sm font-medium">
                Contact us
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-white font-medium">
                Enterprise users will have:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Everything in Professional</li>
                <li>• Custom User & Data Processing Tiers</li>
                <li>• Isolated SLA</li>
                <li>• Enterprise Processing Limits</li>
                <li>• Enterprise Administration & Support</li>
              </ul>
            </div>

            {/* Enterprise Features */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">
                  Advanced Security Features
                </span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                    <span className="text-xs text-white">✓</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">
                  Private Deployment
                </span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                    <span className="text-xs text-white">✓</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">M2M Tokens</span>
                <div className="bg-gray-700 px-2 py-1 rounded text-xs text-white">
                  UNLIMITED
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>

          {featureComparison.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">
                {category.category}
              </h3>
              <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-white">
                <div className="grid grid-cols-5 gap-4 p-4 border-b border-white bg-gray-800/50">
                  <div className="font-medium">Feature</div>
                  <div className="font-medium text-center">Free</div>
                  <div className="font-medium text-center">Essentials</div>
                  <div className="font-medium text-center">Professional</div>
                  <div className="font-medium text-center">Enterprise</div>
                </div>

                {category.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700/30 last:border-b-0"
                  >
                    <div className="text-gray-300">{feature.name}</div>
                    <div className="text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-300">
                          {feature.free}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof feature.essentials === "boolean" ? (
                        feature.essentials ? (
                          <Check className="h-5 w-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-300">
                          {feature.essentials}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof feature.professional === "boolean" ? (
                        feature.professional ? (
                          <Check className="h-5 w-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-300">
                          {feature.professional}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof feature.enterprise === "boolean" ? (
                        feature.enterprise ? (
                          <Check className="h-5 w-5 text-green-400 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-300">
                          {feature.enterprise}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mb-16 text-center">
          <h2 className="text-2xl font-bold mb-8">
            Trusted by 10,000+ companies worldwide
          </h2>
          <div className="flex justify-center items-center gap-12 opacity-60 mb-8">
            {companies.map((company, index) => (
              <div key={index} className="text-lg font-semibold text-gray-400">
                {company.name}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-gray-400">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">10M+</div>
              <div className="text-gray-400">Records Processed Daily</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">150+</div>
              <div className="text-gray-400">Countries Served</div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            What our customers say
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-900/50 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-900/30 rounded-lg border border-gray-700"
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                >
                  <span className="font-semibold text-white">
                    {faq.question}
                  </span>
                  <ArrowRight
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedFaq === index ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Enterprise-Grade Security
          </h2>
          <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">SOC 2 Compliant</h3>
              <p className="text-gray-400">
                Independently audited security controls and processes
              </p>
            </div>
            <div className="text-center">
              <Globe className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">GDPR Ready</h3>
              <p className="text-gray-400">
                Full compliance with European data protection regulations
              </p>
            </div>
            <div className="text-center">
              <Award className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">ISO 27001</h3>
              <p className="text-gray-400">
                International standard for information security management
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-12 border border-blue-500/20">
          <h2 className="text-4xl font-bold mb-4">
            Ready to transform your data processing?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and companies who trust our platform
            for their critical data preprocessing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            >
              Start your free trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent px-8 py-3 text-lg"
            >
              Schedule a demo
            </Button>
          </div>
          <p className="text-sm text-gray-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
