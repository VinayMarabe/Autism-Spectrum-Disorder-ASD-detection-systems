import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Filter, Phone, CalendarCheck, X } from "lucide-react";

const hospitals = [
  {
    id: 1, name: "City General Hospital", specialty: "Neurology & Psychiatry",
    rating: 4.8, reviews: 312, distance: "2.1 km", doctors: 18, wait: "~15 min", status: "Open",
    img: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=220&fit=crop",
    doctorList: [
      { id: "d1", name: "Dr. Emily Johnson", title: "Pediatric Neurologist", rating: 4.9, exp: "12 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Emily&backgroundColor=dbeafe" },
      { id: "d2", name: "Dr. James Park", title: "Behavioral Specialist", rating: 4.6, exp: "8 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=James&backgroundColor=fef9c3" },
    ],
  },
  {
    id: 2, name: "Apollo Neuro Center", specialty: "Pediatric Neurology",
    rating: 4.9, reviews: 516, distance: "3.5 km", doctors: 24, wait: "~30 min", status: "Open",
    img: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=220&fit=crop",
    doctorList: [
      { id: "d3", name: "Dr. Michael Chen", title: "Developmental Specialist", rating: 4.7, exp: "10 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Michael&backgroundColor=dcfce7" },
      { id: "d4", name: "Dr. Aisha Patel", title: "Child Neurologist", rating: 4.8, exp: "9 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Aisha&backgroundColor=e0f2fe" },
    ],
  },
  {
    id: 3, name: "Mercy Medical Hub", specialty: "Child Psychiatry",
    rating: 4.7, reviews: 198, distance: "5.2 km", doctors: 11, wait: "~10 min", status: "Open",
    img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=220&fit=crop",
    doctorList: [
      { id: "d5", name: "Dr. Sofia Rostova", title: "Child Psychiatrist", rating: 4.8, exp: "14 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Sofia&backgroundColor=fce7f3" },
    ],
  },
  {
    id: 4, name: "St. Luke's Health Center", specialty: "Developmental Medicine",
    rating: 4.6, reviews: 145, distance: "7.8 km", doctors: 9, wait: "~45 min", status: "Busy",
    img: "https://images.unsplash.com/photo-1587351021759-3e566b3db4f1?w=400&h=220&fit=crop",
    doctorList: [
      { id: "d6", name: "Dr. Priya Nair", title: "Developmental Pediatrician", rating: 4.7, exp: "11 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Priya&backgroundColor=ede9fe" },
    ],
  },
  {
    id: 5, name: "Pacific Neuroscience Institute", specialty: "Behavioral Health",
    rating: 4.7, reviews: 271, distance: "9.4 km", doctors: 15, wait: "~20 min", status: "Open",
    img: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=400&h=220&fit=crop",
    doctorList: [
      { id: "d7", name: "Dr. Raj Mehta", title: "Behavioral Neurologist", rating: 4.6, exp: "7 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Raj&backgroundColor=d1fae5" },
      { id: "d8", name: "Dr. Leila Hassan", title: "ASD Specialist", rating: 4.9, exp: "16 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Leila&backgroundColor=ffe4e6" },
    ],
  },
  {
    id: 6, name: "Children's ASD Clinic", specialty: "Autism Spectrum Disorders",
    rating: 5.0, reviews: 420, distance: "11.0 km", doctors: 30, wait: "~5 min", status: "Open",
    img: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=220&fit=crop",
    doctorList: [
      { id: "d9", name: "Dr. Maya Singh", title: "Autism Specialist", rating: 5.0, exp: "18 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Maya&backgroundColor=fef3c7" },
      { id: "d10", name: "Dr. Carlos Rivera", title: "Pediatric Psychiatrist", rating: 4.8, exp: "13 yrs", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Carlos&backgroundColor=cffafe" },
    ],
  },
];

const specialties = ["All", "Neurology", "Pediatrics", "Psychiatry", "Developmental", "Behavioral"];

export default function FindHospitals() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [sortBy, setSortBy] = useState("Distance");
  const [savedIds, setSavedIds] = useState([6]);

  const filtered = hospitals
    .filter(h => h.name.toLowerCase().includes(query.toLowerCase()) || h.specialty.toLowerCase().includes(query.toLowerCase()))
    .filter(h => specialty === "All" || h.specialty.toLowerCase().includes(specialty.toLowerCase()))
    .sort((a, b) => sortBy === "Rating" ? b.rating - a.rating : parseFloat(a.distance) - parseFloat(b.distance));

  const handleBook = (hospital) => {
    navigate("/patient/book", { state: { hospital } });
  };

  return (
    <div className="p-5 lg:p-6 pb-24 md:pb-6 bg-gray-50 dark:bg-gray-950 min-h-full">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white mb-1">Find Hospitals</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Discover top-rated ASD specialists near you</p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 mb-5 space-y-3">
        <div className="relative">
          <MapPin size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search hospitals or specialties..."
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white dark:placeholder-gray-400 font-medium"
          />
          {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Filter size={13} className="text-gray-400 shrink-0" />
          {specialties.map(s => (
            <button key={s} onClick={() => setSpecialty(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${specialty === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>{s}</button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            Sort:
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none">
              <option>Distance</option><option>Rating</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3 font-medium">{filtered.length} hospitals found</p>

      {/* Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((h, i) => (
          <motion.div key={h.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -4 }}
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group"
          >
            {/* Image */}
            <div className="relative overflow-hidden h-44">
              <img src={h.img} alt={h.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent" />
              <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${h.status === "Open" ? "bg-emerald-500/90 text-white" : "bg-orange-500/90 text-white"}`}>{h.status}</span>
              <button onClick={() => setSavedIds(prev => prev.includes(h.id) ? prev.filter(id => id !== h.id) : [...prev, h.id])}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition ${savedIds.includes(h.id) ? "bg-rose-500 text-white" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"}`}>
                <Star size={14} className={savedIds.includes(h.id) ? "fill-white" : ""} />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, j) => <Star key={j} size={11} className={`fill-current ${j < Math.floor(h.rating) ? "" : "opacity-30"}`} />)}
                <span className="ml-1 text-white font-bold text-xs">{h.rating} <span className="text-white/70">({h.reviews})</span></span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-headline font-bold text-gray-900 dark:text-white mb-0.5">{h.name}</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-3">{h.specialty}</p>
              <div className="flex gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><MapPin size={11} />{h.distance}</span>
                <span>Wait: {h.wait}</span>
                <span>{h.doctors} doctors</span>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <Phone size={16} />
                </button>
                <button onClick={() => handleBook(h)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95">
                  <CalendarCheck size={16} /> Book Appointment
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
