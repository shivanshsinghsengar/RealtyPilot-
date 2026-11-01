"use client";

import { useState } from "react";
import { BHOPAL_PROJECTS_LOCALITY, BhopalLandmark } from "@/lib/places/bhopal-data";
import {
  GraduationCap,
  HeartPulse,
  Train,
  ShoppingBag,
  MapPin,
  Clock,
  Car,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Navigation,
} from "lucide-react";

type CategoryFilter = "all" | "hospital" | "school" | "transit" | "shopping";

export function LocalityExplorer() {
  const [selectedProject, setSelectedProject] = useState<"narmada-greens" | "bhojpal-enclave">("narmada-greens");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentProject = BHOPAL_PROJECTS_LOCALITY[selectedProject];

  const filteredLandmarks = currentProject.landmarks.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const getCategoryIcon = (category: BhopalLandmark["category"]) => {
    switch (category) {
      case "hospital":
        return <HeartPulse className="h-4 w-4 text-rose-600" />;
      case "school":
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case "transit":
        return <Train className="h-4 w-4 text-amber-600" />;
      case "shopping":
        return <ShoppingBag className="h-4 w-4 text-emerald-600" />;
      default:
        return <MapPin className="h-4 w-4 text-purple-600" />;
    }
  };

  const getCategoryBadgeClass = (category: BhopalLandmark["category"]) => {
    switch (category) {
      case "hospital":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "school":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "transit":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "shopping":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const handleCopyPitch = async (landmark: BhopalLandmark) => {
    const text = `${currentProject.projectName} (${currentProject.locationArea}) se ${landmark.name} sirf ${landmark.distanceKm} km (${landmark.driveTimeMins} mins) door hai. ${landmark.highlights}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedId(landmark.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // Fallback or silently handle blocked clipboard
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header & Project Selector */}
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Locality & Connectivity Intelligence
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Verified distances and driving times from Google Places & Bhopal urban records
            </p>
          </div>

          {/* Project Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setSelectedProject("narmada-greens")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedProject === "narmada-greens"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Narmada Greens (Kolar)
            </button>
            <button
              onClick={() => setSelectedProject("bhojpal-enclave")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedProject === "bhojpal-enclave"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bhojpal Enclave (NH-46)
            </button>
          </div>
        </div>

        {/* Project Context Summary Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {currentProject.projectName} &bull; {currentProject.locationArea}
              </div>
              <div className="text-slate-500 mt-0.5">
                {currentProject.connectivitySummary}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              RERA Approved
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              <Car className="h-3.5 w-3.5" />
              Free Cab Pickup
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "All Landmarks" },
            { id: "hospital", label: "Healthcare & Hospitals" },
            { id: "school", label: "Schools & Colleges" },
            { id: "transit", label: "Transit & Stations" },
            { id: "shopping", label: "Shopping & Malls" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === tab.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Landmarks Grid */}
      <div className="p-6">
        {filteredLandmarks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700">No landmarks found</p>
            <p>No verified landmarks in this category for {currentProject.projectName}. Try selecting "All Landmarks".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLandmarks.map((item) => {
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-brand-200 hover:shadow-md transition-all bg-white flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border capitalize ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {getCategoryIcon(item.category)}
                        {item.category}
                      </span>

                      {/* Distance & Drive Time Pill */}
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{item.driveTimeMins} mins</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-brand-600">{item.distanceKm} km</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {item.address}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      {item.highlights}
                    </p>
                  </div>

                  {/* Sales Pitch Copy Action */}
                  <button
                    onClick={() => handleCopyPitch(item)}
                    className="w-full py-1.5 px-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 text-slate-700 hover:text-brand-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied Pitch Point!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-500" />
                        <span>Copy Pitch Point</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
