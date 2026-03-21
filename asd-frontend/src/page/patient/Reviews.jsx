import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const existingReviews = [
  { id: 1, doctor: "Dr. Emily Johnson", hospital: "City General", date: "Oct 2026", rating: 5, comment: "Incredibly empathetic and thorough. She explained everything clearly and made my daughter feel comfortable.", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Emily&backgroundColor=dbeafe" },
  { id: 2, doctor: "Dr. Sofia Rostova", hospital: "Mercy Medical Hub", date: "Sep 2026", rating: 4, comment: "Very professional. The therapy sessions she recommended have been transformative.", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Sofia&backgroundColor=fce7f3" },
];

function StarRating({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110">
          <Star size={size} className={`${(hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'} transition-colors`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [hospitalRating, setHospitalRating] = useState(0);
  const [drRating, setDrRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!hospitalRating || !drRating || !comment) return;
    setSubmitted(true);
  };

  return (
    <div className="p-5 lg:p-8 pb-24 md:pb-8 bg-gray-50 dark:bg-gray-950 min-h-full">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-1">Reviews</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Rate your experience and help others make informed decisions</p>
        </div>

        {/* Write Review */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
          <h2 className="font-headline font-bold text-gray-900 dark:text-white mb-5">Leave a Review</h2>

          {submitted ? (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">Thank you for your review!</p>
              <p className="text-gray-400 text-sm mt-1">Your feedback helps other families find the right care.</p>
              <button onClick={() => { setSubmitted(false); setHospitalRating(0); setDrRating(0); setComment(""); }} className="mt-4 text-sm text-blue-600 font-semibold hover:underline">
                Write Another Review
              </button>
            </motion.div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Rate the Hospital</label>
                <StarRating value={hospitalRating} onChange={setHospitalRating} size={28} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Rate the Doctor</label>
                <StarRating value={drRating} onChange={setDrRating} size={28} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Your Experience</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience to help other families..."
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white dark:placeholder-gray-500 transition-all"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!hospitalRating || !drRating || !comment}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm transition active:scale-95"
              >
                <Send size={15} /> Submit Review
              </button>
            </div>
          )}
        </div>

        {/* Past Reviews */}
        <h2 className="font-headline font-bold text-gray-900 dark:text-white mb-4">Your Past Reviews</h2>
        <div className="space-y-4">
          {existingReviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
            >
              <div className="flex items-start gap-4 mb-3">
                <img src={r.img} alt={r.doctor} className="w-12 h-12 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{r.doctor}</p>
                      <p className="text-xs text-gray-400">{r.hospital} · {r.date}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} className={`${r.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">"{r.comment}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
