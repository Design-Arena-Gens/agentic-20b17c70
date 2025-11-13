"use client";

import { useMemo, useRef, useState, useEffect, type ChangeEvent } from "react";
import Image from "next/image";
import { Calendar, CheckCircle2, FileImage, Loader2, Stethoscope } from "lucide-react";

type TestId = "cbc" | "lipid" | "glucose" | "thyroid";

const popularTests: Record<
  TestId,
  {
    name: string;
    description: string;
    price: number;
    prep: string;
    turnaround: string;
  }
> = {
  cbc: {
    name: "CBC (Complete Blood Count)",
    description:
      "A quick snapshot of your overall health by measuring red and white blood cells, hemoglobin, and platelets.",
    price: 800,
    prep: "No fasting required",
    turnaround: "6 hours",
  },
  lipid: {
    name: "Lipid Profile",
    description:
      "Evaluates cholesterol, triglycerides, and HDL/LDL ratios to assess heart disease risk.",
    price: 1500,
    prep: "10-12 hour fast suggested",
    turnaround: "12 hours",
  },
  glucose: {
    name: "Fasting Glucose",
    description:
      "Measures blood sugar after fasting to screen for diabetes or prediabetes.",
    price: 500,
    prep: "Overnight fast required",
    turnaround: "4 hours",
  },
  thyroid: {
    name: "Thyroid Panel",
    description:
      "TSH, T3, and T4 levels to investigate metabolism, energy, and thyroid health.",
    price: 1800,
    prep: "Take medication after sample if prescribed",
    turnaround: "18 hours",
  },
};

type AuthStage = "login" | "otp" | "dashboard";

const KARACHI_TOWNS = [
  "DHA Phase VIII",
  "Clifton Block 5",
  "Gulshan-e-Iqbal",
  "PECHS",
  "North Nazimabad",
  "Bahadurabad",
];

const timeSlots = [
  "7:30 AM - 8:00 AM",
  "8:00 AM - 8:30 AM",
  "9:00 AM - 9:30 AM",
  "11:00 AM - 11:30 AM",
  "3:30 PM - 4:00 PM",
  "6:00 PM - 6:30 PM",
];

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function Home() {
  const [authStage, setAuthStage] = useState<AuthStage>("login");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [selectedTests, setSelectedTests] = useState<TestId[]>(["cbc"]);
  const [selectedAddress, setSelectedAddress] = useState(KARACHI_TOWNS[0]);
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [reportPreview, setReportPreview] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Assalam-o-Alaikum! I'm your Testify Health assistant. Ask me anything about your lab tests.",
    },
  ]);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const totalPKR = useMemo(
    () =>
      selectedTests.reduce((total, test) => {
        return total + popularTests[test].price;
      }, 0),
    [selectedTests],
  );

  const upcomingDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  }, []);

  const handleGoogleLogin = () => {
    setAuthStage("dashboard");
    setAuthMessage("Signed in with Google. Welcome back!");
  };

  const handleOtpStart = () => {
    setAuthStage("otp");
    setOtpDigits(["", "", "", "", "", ""]);
    setAuthMessage("We just sent a 6-digit code to your phone and email. It expires in 5 minutes.");
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const copy = [...otpDigits];
    copy[index] = value;
    setOtpDigits(copy);
  };

  const handleOtpSubmit = async () => {
    if (otpDigits.some((digit) => digit.trim() === "")) {
      setAuthMessage("Please enter the complete 6-digit OTP to continue.");
      return;
    }
    setIsSubmittingOtp(true);
    setAuthMessage(null);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmittingOtp(false);
    setAuthStage("dashboard");
    setAuthMessage("You're signed in! Manage bookings and reports anytime.");
  };

  const toggleTestSelection = (test: TestId) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((id) => id !== test) : [...prev, test],
    );
  };

  const handleBooking = () => {
    const selectedNames = selectedTests.map((id) => popularTests[id].name).join(", ");
    setBookingStatus(
      `✅ Collection booked for ${bookingDate} (${selectedSlot}) at ${selectedAddress}. Tests: ${selectedNames}.`,
    );
  };

  const handleReportUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAnalysisLoading(true);
    setAnalysisSummary(null);
    const previewUrl = URL.createObjectURL(file);
    setReportPreview(previewUrl);

    setTimeout(() => {
      const insights = [
        "Hemoglobin slightly below the preferred range. Consider increasing iron-rich foods.",
        "Lipid ratios look healthy. Triglycerides are in the optimal range.",
        "Fasting glucose on the higher end of normal. Re-test in 3 months if lifestyle changes are limited.",
        "Thyroid profile is balanced. Continue present medication schedule.",
      ];
      setAnalysisSummary(insights[Math.floor(Math.random() * insights.length)]);
      setAnalysisLoading(false);
    }, 1500);
  };

  const handleSendMessage = () => {
    const content = chatInput.trim();
    if (!content) return;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: content },
      {
        role: "assistant",
        text: generateAssistantResponse(content),
      },
    ]);
    setChatInput("");
  };

  const handleLogout = () => {
    setAuthStage("login");
    setSelectedTests(["cbc"]);
    setBookingStatus(null);
    setAuthMessage(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setIsSubmittingOtp(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35)_0%,_rgba(15,23,42,0.1)_55%,_rgba(15,23,42,0.9)_100%)]" />
        <header className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-20 pt-16 md:flex-row md:items-center md:justify-between md:pb-28">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-200">
              <Stethoscope className="size-4" />
              Home blood diagnostics in Karachi
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              Testify Health
            </h1>
            <p className="text-lg leading-relaxed text-slate-200 md:text-xl">
              Schedule trusted home sample collection, view fair PKR pricing, and understand your
              reports with instant Gemini-powered insights and a friendly health assistant.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.scrollTo({ top: 620, behavior: "smooth" })}
                className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/50 transition hover:bg-indigo-400"
              >
                Book a home visit
              </button>
              <button
                onClick={() => window.scrollTo({ top: 1200, behavior: "smooth" })}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Explore smart reports
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Karachi-wide coverage
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Reports within 24 hours
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Licensed phlebotomists
              </span>
            </div>
          </div>
          <div className="relative mx-auto max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:mx-0">
            <div className="absolute inset-x-16 -top-12 h-24 rounded-full bg-indigo-500/30 blur-3xl" />
            <AuthCard
              authStage={authStage}
              otpDigits={otpDigits}
              isSubmittingOtp={isSubmittingOtp}
              onGoogleLogin={handleGoogleLogin}
              onOtpStart={handleOtpStart}
              onOtpChange={handleOtpChange}
              onOtpSubmit={handleOtpSubmit}
              onLogout={handleLogout}
              message={authMessage}
            />
          </div>
        </header>
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24">
        <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-900/40 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Book home sample collection</h2>
              <span className="flex items-center gap-2 text-sm text-indigo-200">
                <Calendar className="size-4" />
                Available 7 days a week
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Choose your tests and preferred time. Our licensed phlebotomist will visit your home in
              Karachi with a cooled transport kit.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              {Object.entries(popularTests).map(([id, test]) => {
                const testId = id as TestId;
                const checked = selectedTests.includes(testId);
                return (
                  <button
                    key={testId}
                    onClick={() => toggleTestSelection(testId)}
                    className={`group rounded-2xl border bg-white/5 p-4 text-left shadow transition focus:outline-none ${
                      checked
                        ? "border-emerald-400/70 shadow-emerald-500/10"
                        : "border-white/10 hover:border-indigo-300/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                          checked ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-white/90"
                        }`}
                      >
                        PKR {test.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200/80">{test.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200/70">
                      <span className="rounded-full bg-white/5 px-3 py-1">{test.prep}</span>
                      <span className="rounded-full bg-white/5 px-3 py-1">
                        Turnaround: {test.turnaround}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                Preferred date
                <select
                  value={bookingDate}
                  onChange={(event) => setBookingDate(event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3 text-base text-white focus:border-indigo-300 focus:outline-none"
                >
                  {upcomingDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-PK", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                Time slot
                <select
                  value={selectedSlot}
                  onChange={(event) => setSelectedSlot(event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3 text-base text-white focus:border-indigo-300 focus:outline-none"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                Pickup area in Karachi
                <select
                  value={selectedAddress}
                  onChange={(event) => setSelectedAddress(event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3 text-base text-white focus:border-indigo-300 focus:outline-none"
                >
                  {KARACHI_TOWNS.map((town) => (
                    <option key={town} value={town}>
                      {town}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div>
                  <h4 className="text-sm uppercase tracking-wide text-slate-300">Estimated bill</h4>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    PKR {totalPKR.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-300/80">
                    Includes phlebotomist visit and sample transport with cold chain.
                  </p>
                </div>
                <button
                  onClick={handleBooking}
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Confirm home visit
                </button>
              </div>
            </div>
            {bookingStatus && (
              <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {bookingStatus}
              </p>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-indigo-950/40 backdrop-blur">
              <h3 className="text-lg font-semibold">How it works</h3>
              <ol className="mt-4 space-y-3 text-sm text-slate-200/80">
                <li>
                  <span className="font-semibold text-indigo-200">1.</span> Book a slot and share your
                  location in Karachi.
                </li>
                <li>
                  <span className="font-semibold text-indigo-200">2.</span> Our team arrives with sterile
                  kits &amp; QR-coded sample bags.
                </li>
                <li>
                  <span className="font-semibold text-indigo-200">3.</span> Secure reports available within
                  24 hours in your profile dashboard.
                </li>
              </ol>
              <div className="mt-6 rounded-2xl bg-indigo-500/20 p-4 text-xs leading-relaxed text-indigo-100">
                NABL certified partner lab, calibrated analyzers, cold-chain maintained up to 6 hours.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-lg font-semibold">Test preparation guide</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200/75">
                <li>• Fast for 10 hours before glucose and lipid tests.</li>
                <li>• Stay hydrated; 2 glasses of water ensure smoother draws.</li>
                <li>• Continue thyroid medication unless advised otherwise.</li>
                <li>• Inform our assistant about any anticoagulant medicines.</li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Smart report analysis</h2>
              <span className="text-sm text-indigo-200">Gemini-powered insights</span>
            </div>
            <p className="text-sm text-slate-300">
              Upload your lab report snapshot or PDF. We highlight key signals and provide clinically
              sound next steps to discuss with your physician.
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-indigo-300/40 bg-indigo-500/10 p-10 text-center text-sm text-indigo-100 transition hover:border-indigo-200/80 hover:bg-indigo-500/20">
              <FileImage className="size-12 text-indigo-200" />
              <div>
                <p className="font-semibold">Drop report image / PDF</p>
                <p className="text-xs text-indigo-100/80">Max 10 MB. Supported: JPG, PNG, PDF.</p>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleReportUpload} />
            </label>
            {reportPreview && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
                <Image
                  src={reportPreview}
                  alt="Uploaded report preview"
                  width={800}
                  height={600}
                  unoptimized
                  className="h-64 w-full object-cover"
                />
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6">
              {analysisLoading ? (
                <div className="flex items-center gap-3 text-sm text-indigo-200">
                  <Loader2 className="size-4 animate-spin" />
                  Analysing report with Gemini insights...
                </div>
              ) : analysisSummary ? (
                <div className="space-y-3 text-sm text-slate-200">
                  <p className="font-semibold text-indigo-100">Key takeaways</p>
                  <p>{analysisSummary}</p>
                  <p className="text-xs text-slate-400">
                    Disclaimer: AI summaries support — not replace — professional medical advice.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-300">
                  Your personalised summary appears here within seconds of upload.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
              <div className="border-b border-white/10 p-6">
                <h2 className="text-2xl font-semibold">Health assistant chat</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Ask about fasting guidelines, result interpretation, or next steps.
                </p>
              </div>
                <div className="flex flex-1 flex-col">
                <div
                  ref={chatContainerRef}
                  className="flex-1 space-y-4 overflow-y-auto p-6 text-sm text-slate-200"
                >
                  {chatMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "ml-auto bg-indigo-500/80 text-white"
                          : "bg-slate-950/60 text-slate-100"
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 p-4">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      rows={2}
                      placeholder="Write your question..."
                      className="h-full flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-indigo-300 focus:outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">Why Karachi trusts Testify</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200/80">
                <li>• Temperature-controlled bikes for sample transit.</li>
                <li>• AI-assisted flagging ensures no critical value is missed.</li>
                <li>• Urdu and English support across chats &amp; reports.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Testify Health. Karachi, Pakistan.</p>
          <div className="flex flex-wrap gap-4">
            <span>License #THL-247-KHI</span>
            <span>Support: hello@testify.pk</span>
            <span>WhatsApp: +92 300 123 4567</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

type AuthCardProps = {
  authStage: AuthStage;
  otpDigits: string[];
  isSubmittingOtp: boolean;
  onGoogleLogin: () => void;
  onOtpStart: () => void;
  onOtpChange: (index: number, value: string) => void;
  onOtpSubmit: () => void;
  onLogout: () => void;
  message: string | null;
};

function AuthCard({
  authStage,
  otpDigits,
  isSubmittingOtp,
  onGoogleLogin,
  onOtpStart,
  onOtpChange,
  onOtpSubmit,
  onLogout,
  message,
}: AuthCardProps) {
  return (
    <div
      className="space-y-6 rounded-2xl border border-white/10 bg-slate-950/60 p-6 text-slate-200 shadow-2xl shadow-indigo-950/40 transition-all duration-500"
      data-state={authStage}
    >
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Secure login</p>
        <h2 className="text-xl font-semibold text-white">Get started in 2 steps</h2>
        <p className="text-xs text-slate-300">
          Sign in to manage your bookings, download reports, and chat with your assistant.
        </p>
      </div>
      {message && (
        <p className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100">
          {message}
        </p>
      )}

      {authStage === "login" && (
        <div className="space-y-4">
          <button
            onClick={onGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            <Image src="/google.svg" alt="Google logo" width={20} height={20} />
            Continue with Google
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex-1 border-t border-white/10" />
            <span>or</span>
            <span className="flex-1 border-t border-white/10" />
          </div>
          <button
            onClick={onOtpStart}
            className="w-full rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40"
          >
            Send OTP to phone/email
          </button>
        </div>
      )}

      {authStage === "otp" && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-sm text-slate-200">
            Enter the 6-digit verification code sent to your phone / email.
          </p>
          <div className="flex justify-between gap-2">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                value={digit}
                onChange={(event) => onOtpChange(index, event.target.value)}
                maxLength={1}
                className="h-12 w-10 rounded-xl border border-white/20 bg-slate-950/80 text-center text-lg font-semibold text-white focus:border-indigo-300 focus:outline-none"
              />
            ))}
          </div>
          <button
            onClick={onOtpSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            {isSubmittingOtp && <Loader2 className="size-4 animate-spin" />}
            Verify &amp; continue
          </button>
          <p className="text-xs text-slate-400">Haven&apos;t received a code? Resend in 30s.</p>
        </div>
      )}

      {authStage === "dashboard" && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
            <h3 className="text-sm font-semibold text-white">Welcome back, Ayesha!</h3>
            <p className="mt-1 text-xs text-slate-300">Profile · ayesha.malik@gmail.com · Karachi</p>
          </div>
          <div className="space-y-3 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4 text-xs">
            <p className="font-semibold text-indigo-100">Test history</p>
            <ul className="space-y-2 text-indigo-50/90">
              <li>• CBC — Last done 12 Jan 2025 · Result: Normal</li>
              <li>• Thyroid Panel — Last done 28 Nov 2024 · Result: Monitor TSH</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
            <p className="font-semibold text-white">Saved reports</p>
            <p>• Lipid Profile · PDF · 1.2 MB</p>
            <p>• Fasting Glucose · JPEG · 560 KB</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function generateAssistantResponse(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("fast") || lower.includes("fasting")) {
    return "For fasting tests like glucose or lipid profile, fast 10-12 hours but drink water. Take thyroid meds after sampling unless your doctor says otherwise.";
  }
  if (lower.includes("glucose") || lower.includes("sugar")) {
    return "Fasting glucose between 100-125 mg/dL can indicate prediabetes. Pair the result with HbA1c for a fuller picture and discuss lifestyle adjustments.";
  }
  if (lower.includes("cbc") || lower.includes("blood count")) {
    return "CBC tracks hemoglobin, WBCs, and platelets. Low Hb? Consider iron-rich diet or supplementation as advised by your physician.";
  }
  if (lower.includes("visit") || lower.includes("home")) {
    return "Our phlebotomist will call you 20 minutes before arrival. Please keep your CNIC handy and ensure good lighting for the draw.";
  }
  return "I'll review your question and guide you with next steps. Meanwhile, make sure to share any medication history with us for accurate interpretation.";
}
