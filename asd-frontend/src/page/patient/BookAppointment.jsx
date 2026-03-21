import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Star, ChevronRight, ChevronLeft, CheckCircle2, Clock,
  Loader2, AlertCircle, CalendarDays, Building2
} from "lucide-react";
import { addAppointment } from "../../utils/appointmentStorage";
import { useActivePatient } from "../../context/ActivePatientContext";

const dates = ["Mon Oct 13", "Tue Oct 14", "Wed Oct 15", "Thu Oct 16", "Fri Oct 17", "Mon Oct 20", "Tue Oct 21"];
const times = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"];

const STEPS = ["Choose Doctor", "Patient Details", "Confirm"];

export default function BookAppointment() {
  const navigate = useNavigate();
  const { activePatient, addOrUpdatePatient } = useActivePatient();
  const { state } = useLocation();
  const hospital = state?.hospital;

  const doctors = hospital?.doctorList || [];

  const [step, setStep] = useState(0);
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", age: "", gender: "", phone: "", symptoms: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // Guard: if no hospital selected, redirect to find hospitals
  if (!hospital) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-950 text-center">
        <Building2 size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-headline font-bold text-gray-700 dark:text-gray-300 mb-2">No Hospital Selected</h2>
        <p className="text-gray-500 text-sm mb-5">Please choose a hospital first to book an appointment.</p>
        <button onClick={() => navigate("/patient/hospitals")} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition">
          Find a Hospital
        </button>
      </div>
    );
  }

  const canNext = () => {
    if (step === 0) return !!doctor && !!date && !!time;
    if (step === 1) return form.name && form.age && form.gender && form.symptoms && consent;
    return true;
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Ensure patient exists in backend
      if (activePatient) {
        await addOrUpdatePatient(activePatient);
      }

      const appt = await addAppointment({
        patient_id: activePatient ? activePatient.id : `P-${Date.now()}`,
        doctor_id: "admin", // Everything routes to active admin doctor
        doctor: doctor.name,
        specialty: doctor.title,
        hospital: hospital.name,
        doctorImg: doctor.img,
        date, time,
        patientName: form.name,
        patientAge: form.age,
        patientGender: form.gender,
        patientPhone: form.phone,
        symptoms: form.symptoms,
        notes: form.notes,
        type: "First Consultation",
      });
      setSubmitted({ ...appt, doctor: doctor.name, hospital: hospital.name, date, time });
      setDone(true);
    } catch(err) {
      console.error(err);
      alert("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-full flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-10 text-center shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={44} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-headline font-extrabold text-gray-900 dark:text-white mb-2">Request Sent!</h2>
        <p className="text-gray-500 text-sm mb-3">Your appointment request has been sent to <strong className="text-gray-800 dark:text-gray-200">{submitted?.doctor}</strong>.</p>
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold mb-6">
          <Clock size={14} /> Awaiting Doctor Approval
        </span>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-left space-y-2 mb-6">
          {[["Doctor", submitted?.doctor], ["Hospital", submitted?.hospital], ["Date", submitted?.date], ["Time", submitted?.time]].map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm">
              <span className="text-gray-500">{l}</span>
              <span className="font-semibold text-gray-800 dark:text-white">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/patient/appointments")} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition">
            View My Appointments
          </button>
          <button onClick={() => navigate("/patient/hospitals")} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm hover:bg-gray-200 transition">
            Back to Hospitals
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 lg:p-6 pb-24 md:pb-6 bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="max-w-3xl mx-auto">

        {/* Hospital badge */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-xl w-fit">
          <Building2 size={15} className="text-blue-500" />
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{hospital.name}</span>
        </div>

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white">Book Appointment</h1>
          <p className="text-gray-500 text-sm mt-0.5">Complete {STEPS.length} steps to request your appointment</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-blue-600' : i < step ? 'text-gray-400' : 'text-gray-300'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}
            className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-900/5 p-6 md:p-8"
          >

            {/* STEP 0: Choose Doctor + Date + Time */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-headline font-bold text-gray-900 dark:text-white mb-3">Choose a Doctor</h2>
                  <div className="space-y-3">
                    {doctors.map(d => (
                      <div key={d.id} onClick={() => setDoctor(d)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${doctor?.id === d.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <img src={d.img} alt={d.name} className="w-14 h-14 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white">{d.name}</p>
                          <p className="text-sm text-blue-600 font-semibold">{d.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Experience: {d.exp}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{d.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-headline font-bold text-gray-900 dark:text-white mb-3">Select Date</h2>
                  <div className="flex flex-wrap gap-2">
                    {dates.map(d => (
                      <button key={d} onClick={() => setDate(d)} className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${date === d ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-headline font-bold text-gray-900 dark:text-white mb-3">Select Time</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {times.map(t => (
                      <button key={t} onClick={() => setTime(t)} className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${time === t ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Patient Details */}
            {step === 1 && (
              <div>
                <h2 className="text-base font-headline font-bold text-gray-900 dark:text-white mb-4">Your Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                      <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Your full name" className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Age *</label>
                      <input type="number" value={form.age} onChange={e => setForm(f => ({...f, age: e.target.value}))} placeholder="e.g. 8" className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Gender *</label>
                      <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))} className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all">
                        <option value="">Select</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                      <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 9876543210" className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Symptoms / Main Concern *</label>
                    <textarea rows={3} value={form.symptoms} onChange={e => setForm(f => ({...f, symptoms: e.target.value}))} placeholder="Describe the main concern or symptoms..." className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Additional Notes</label>
                    <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Any extra information for the doctor..." className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all resize-none" />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="w-4 h-4 accent-blue-600 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">I consent to share my details with the doctor. My data is secure and handled per NeuroLens privacy policy.</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: Confirm */}
            {step === 2 && (
              <div>
                <h2 className="text-base font-headline font-bold text-gray-900 dark:text-white mb-4">Confirm Your Request</h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 space-y-3 mb-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <img src={doctor?.img} alt={doctor?.name} className="w-11 h-11 rounded-xl border-2 dark:border-gray-700" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{doctor?.name}</p>
                      <p className="text-xs text-blue-600">{doctor?.title}</p>
                    </div>
                  </div>
                  {[["Hospital", hospital.name], ["Date", date], ["Time", time], ["Patient", form.name], ["Age / Gender", `${form.age} yrs / ${form.gender}`], ["Concern", form.symptoms]].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-sm">
                      <span className="text-gray-500">{l}</span>
                      <span className="font-semibold text-gray-800 dark:text-white text-right max-w-[60%] break-words">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">Your request will appear as <strong>Pending</strong> until the doctor accepts or reschedules it.</p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          <button onClick={() => step === 0 ? navigate("/patient/hospitals") : setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm hover:bg-gray-50 transition">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition active:scale-95">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition active:scale-95">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><CheckCircle2 size={16} /> Send Request</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
