/**
 * Caretaker Dashboard - Family Caregiver Command Center
 * Based on Stitch design: caretaker_command_center
 */

import { navigate } from '../router.js';
import { auth, profiles, medications, appointments, dashboard, ai, voice } from '../api.js';

/**
 * Render caretaker dashboard
 */
export async function renderCaretaker(container) {
  const authState = auth.getState();
  if (!authState.isAuthenticated) {
    navigate('/login');
    return;
  }

  container.innerHTML = getCaretakerHTML();
  await attachCaretakerListeners();
}

/**
 * Generate caretaker dashboard HTML
 */
function getCaretakerHTML() {
  return `
    <header class="fixed top-0 left-0 w-full z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-card-border/60" role="banner">
      <div class="h-20 w-full px-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm" aria-hidden="true">
            <span class="material-symbols-outlined text-[22px]">favorite</span>
          </div>
          <div class="flex flex-col">
            <span class="font-headline text-[22px] font-semibold text-charcoal tracking-tight leading-none">Ayush</span>
            <span class="text-[12px] text-charcoal-taupe font-medium mt-1">Warm Family Care</span>
          </div>
        </div>
        <nav class="hidden md:flex items-center gap-2 p-1.5 rounded-full bg-sand" aria-label="Main navigation">
          <a class="px-5 py-2 rounded-full text-[14px] text-charcoal-taupe hover:text-charcoal transition-colors font-medium" data-path="senior" href="#" aria-label="Go to senior dashboard">Family Sanctuary</a>
          <a aria-current="page" class="px-6 py-2 rounded-full text-[14px] font-semibold bg-terracotta text-white shadow-sm transition-all" href="#" aria-label="Current page: Care Companion">Care Companion</a>
          <a class="px-5 py-2 rounded-full text-[14px] text-charcoal-taupe hover:text-charcoal transition-colors font-medium" href="#" aria-label="View reminders">Reminders</a>
        </nav>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-caramel-light border border-caramel-border text-caramel" role="status" aria-live="polite">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">favorite</span>
            <span class="text-[13px] font-semibold" id="senior-status">Loading...</span>
          </div>
          <div class="w-10 h-10 rounded-full object-cover ring-2 ring-terracotta/20 bg-surface-container-high" aria-hidden="true" id="caregiver-avatar"></div>
        </div>
      </div>
    </header>

    <aside class="fixed left-0 top-20 bottom-0 w-72 bg-[#FAF7F2] border-r border-card-border/60 z-40 flex flex-col justify-between p-6" role="navigation" aria-label="Care routine navigation">
      <div class="flex flex-col gap-8">
        <div class="px-3 pt-2">
          <span class="text-[12px] uppercase tracking-wider text-charcoal-taupe font-bold">Daily Care Routine</span>
        </div>
        <nav class="flex flex-col gap-2" aria-label="Care sections">
          <a aria-current="page" class="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-terracotta text-white font-semibold shadow-sm transition-all touch-target" href="#" data-section="overview" aria-label="Daily Overview - current page">
            <span class="material-symbols-outlined text-[22px]" aria-hidden="true">home</span>
            <span class="text-[15px]">Daily Overview</span>
          </a>
          <a class="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-charcoal-taupe hover:bg-sand hover:text-charcoal transition-all font-medium touch-target" href="#" data-section="medicines" aria-label="Medicines & Schedule">
            <span class="material-symbols-outlined text-[22px]" aria-hidden="true">medication</span>
            <span class="text-[15px]">Medicines & Schedule</span>
          </a>
          <a class="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-charcoal-taupe hover:bg-sand hover:text-charcoal transition-all font-medium touch-target" href="#" data-section="appointments" aria-label="Doctor Visits">
            <span class="material-symbols-outlined text-[22px]" aria-hidden="true">calendar_month</span>
            <span class="text-[15px]">Doctor Visits</span>
          </a>
          <a class="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-charcoal-taupe hover:bg-sand hover:text-charcoal transition-all font-medium touch-target" href="#" data-section="voice-notes" aria-label="Voice Notes">
            <span class="material-symbols-outlined text-[22px]" aria-hidden="true">record_voice_over</span>
            <span class="text-[15px]">Voice Notes</span>
          </a>
        </nav>
      </div>
      <div class="p-5 rounded-2xl bg-white border border-card-border shadow-sm flex flex-col gap-2" role="region" aria-label="Senior summary">
        <div class="flex items-center justify-between">
          <span class="text-[12px] font-bold text-caramel uppercase tracking-wide">In Your Care</span>
          <span class="w-2.5 h-2.5 rounded-full bg-caramel" aria-hidden="true"></span>
        </div>
        <p class="font-headline text-[18px] text-charcoal font-semibold leading-tight mt-0.5" id="senior-name">Loading...</p>
        <span class="text-[13px] text-charcoal-taupe" id="senior-details">Loading...</span>
      </div>
    </aside>

    <div class="pl-72">
      <main class="relative pt-20 w-full min-h-screen px-10 py-10" role="main">
        <div class="w-full max-w-7xl mx-auto flex flex-col gap-10 pb-16" id="main-content">
          <!-- Content will be loaded dynamically based on section -->
        </div>
      </main>
    </div>

    <!-- Section templates (hidden, used for dynamic loading) -->
    <template id="template-overview">
      <section class="rounded-3xl bg-white border border-card-border p-8 lg:p-10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8" aria-labelledby="overview-title">
        <div class="flex items-center gap-6">
          <div class="relative">
            <img class="w-24 h-24 rounded-full object-cover shadow-sm ring-4 ring-sand" alt="" id="senior-avatar-large" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTFX9LipdSng7E8IafANJU-drliSFactCkASOW0BpaztDBrbleGVQpJqFG3rGDUlwCsHCajjptqhHH3dHyg5kUuQF0RbL01v0wjxSjPROZc0KNa-AUGYne30CYt9tdtNSY66HqZQRzf-PKzuvdipMkQDy2-kD4UsSa7tSHt43lXiD4TfZxp2iGaYTpyTk-d4acOuSCy_q4sF4z9QAjRnYxz3quqycLTEEFEwdUnk0" />
            <span class="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-terracotta text-white flex items-center justify-center shadow-sm" title="Everything looking wonderful" aria-label="Status: Everything looking wonderful">
              <span class="material-symbols-outlined text-[14px]">check</span>
            </span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 id="overview-title" class="font-headline text-[32px] text-charcoal font-bold tracking-tight">Loading...</h1>
              <span class="px-3.5 py-1 rounded-full bg-sand text-charcoal text-[13px] font-semibold" id="senior-age">Age --</span>
              <span class="px-3.5 py-1 rounded-full bg-caramel-light border border-caramel-border text-caramel text-[13px] font-semibold" id="senior-mood">--</span>
            </div>
            <p class="text-[15px] text-charcoal-taupe mt-2" id="caregiver-info">Loading...</p>
          </div>
        </div>
        <div class="flex items-center gap-4 bg-sand-light border border-sand px-6 py-4 rounded-2xl self-start lg:self-center" role="status" aria-live="polite">
          <div class="w-3.5 h-3.5 rounded-full bg-caramel animate-pulse" aria-hidden="true"></div>
          <div class="flex flex-col">
            <span class="text-[15px] font-bold text-charcoal" id="routine-status">Loading...</span>
            <span class="text-[13px] text-charcoal-taupe" id="routine-detail">Loading...</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="highlights-title" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <h2 id="highlights-title" class="sr-only">Care Highlights</h2>

        <article class="rounded-3xl bg-white border border-card-border p-8 shadow-sm flex flex-col justify-between" aria-labelledby="adherence-title">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <span class="text-[12px] uppercase tracking-wider text-charcoal-taupe font-bold">This Week's Routine</span>
              <h3 id="adherence-title" class="font-headline text-[22px] text-charcoal font-bold mt-1">Loading...</h3>
            </div>
            <span class="px-3 py-1 rounded-full bg-caramel-light border border-caramel-border text-caramel text-[12px] font-semibold" id="adherence-pace">Gentle Pace</span>
          </div>
          <div class="my-6 flex items-center gap-6">
            <div class="relative w-24 h-24 flex items-center justify-center shrink-0" aria-hidden="true">
              <svg class="w-full h-full -rotate-90" viewbox="0 0 100 100" aria-hidden="true">
                <circle class="text-sand" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" stroke-width="10"></circle>
                <circle class="text-terracotta" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" stroke-dasharray="251" stroke-dashoffset="12" stroke-linecap="round" stroke-width="10" id="adherence-circle"></circle>
              </svg>
              <span class="absolute font-headline text-[22px] font-bold text-terracotta" id="adherence-percent">--%</span>
            </div>
            <div class="flex flex-col gap-2" id="adherence-breakdown">
              <!-- Populated dynamically -->
            </div>
          </div>
          <p class="text-[13px] text-charcoal-taupe border-t border-card-border/60 pt-4 mt-2" id="dispenser-status">Loading...</p>
        </article>

        <article class="rounded-3xl bg-white border border-card-border p-8 shadow-sm flex flex-col justify-between" aria-labelledby="appointment-title">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <span class="text-[12px] uppercase tracking-wider text-charcoal-taupe font-bold">Upcoming Consultation</span>
              <h3 id="appointment-title" class="font-headline text-[22px] text-charcoal font-bold mt-1">Loading...</h3>
            </div>
            <span class="px-3 py-1 rounded-full bg-sand text-charcoal text-[12px] font-semibold" id="appointment-type">--</span>
          </div>
          <div class="my-5 flex flex-col" id="appointment-details">
            <!-- Populated dynamically -->
          </div>
          <div class="border-t border-card-border/60 pt-4 mt-2 flex items-center justify-between text-[13px] text-charcoal-taupe" id="appointment-reminder">
            <!-- Populated dynamically -->
          </div>
        </article>

        <article class="rounded-3xl bg-white border border-card-border p-8 shadow-sm flex flex-col justify-between" aria-labelledby="support-title">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <span class="text-[12px] uppercase tracking-wider text-charcoal-taupe font-bold">Caretaker Heartbeat</span>
              <h3 id="support-title" class="font-headline text-[22px] text-charcoal font-bold mt-1">Loading...</h3>
            </div>
            <span class="px-3 py-1 rounded-full bg-sand text-charcoal text-[12px] font-semibold flex items-center gap-1" id="support-status">
              <span class="material-symbols-outlined text-[14px] text-terracotta" aria-hidden="true">check_circle</span> Active
            </span>
          </div>
          <div class="my-5 p-4 rounded-2xl bg-caramel-light border border-caramel-border flex flex-col gap-2" id="support-features">
            <!-- Populated dynamically -->
          </div>
          <div class="border-t border-card-border/60 pt-4 mt-2 flex items-center justify-between text-[13px] text-charcoal-taupe" id="alert-phone">
            <!-- Populated dynamically -->
          </div>
        </article>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start" aria-labelledby="schedule-title">
        <div class="lg:col-span-7 flex flex-col gap-8">
          <article class="rounded-3xl bg-white border border-card-border p-8 lg:p-10 shadow-sm flex flex-col gap-8" aria-labelledby="medicines-title">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex flex-col">
                <span class="text-[12px] uppercase tracking-wider text-charcoal-taupe font-bold">Today's Medicines</span>
                <h2 id="medicines-title" class="font-headline text-[26px] text-charcoal font-bold tracking-tight">Daily Schedule</h2>
              </div>
              <button class="flex items-center gap-2 px-6 py-3 rounded-full bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-[14px] transition-all shadow-sm self-start sm:self-auto touch-target" type="button" id="add-medicine-btn" aria-label="Add new medicine">
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                <span>Add Medicine</span>
              </button>
            </div>

            <div class="relative group cursor-pointer rounded-2xl bg-sand-light hover:bg-sand border-2 border-dashed border-card-border p-6 transition-all" id="prescription-upload" role="region" aria-label="Prescription upload">
              <input accept="image/*,.pdf" class="absolute inset-0 opacity-0 cursor-pointer" type="file" id="prescription-file" aria-label="Upload prescription image or PDF" />
              <div class="flex items-center gap-5">
                <div class="w-12 h-12 rounded-2xl bg-white border border-card-border flex items-center justify-center text-terracotta shadow-xs shrink-0" aria-hidden="true">
                  <span class="material-symbols-outlined text-[24px]">upload_file</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-bold text-charcoal">Upload Doctor's Note / Prescription Slip</span>
                  <p class="text-[13px] text-charcoal-taupe mt-0.5">Snap a photo of the slip to automatically read dosages and times.</p>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-4" id="medicines-list" role="list" aria-label="Today's medications">
              <!-- Populated dynamically -->
            </div>
          </article>
        </div>

        <aside class="lg:col-span-5 flex flex-col gap-8">
          <article class="rounded-3xl bg-white border border-card-border p-8 shadow-sm flex flex-col gap-5" aria-labelledby="safety-title">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-sand flex items-center justify-center text-terracotta" aria-hidden="true">
                  <span class="material-symbols-outlined text-[22px]">health_and_safety</span>
                </div>
                <h3 id="safety-title" class="font-headline text-[20px] text-charcoal font-bold">Friendly Safety Check</h3>
              </div>
              <span class="px-3 py-1 rounded-full bg-sand text-charcoal text-[12px] font-semibold" id="safety-status">Verified</span>
            </div>
            <div class="p-5 rounded-2xl bg-caramel-light border border-caramel-border flex items-start gap-4" id="safety-message">
              <!-- Populated dynamically -->
            </div>
          </article>

          <article class="p-5 rounded-2xl bg-sand-light border border-sand flex flex-col gap-3" aria-labelledby="voice-note-title">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-terracotta" aria-hidden="true">record_voice_over</span>
                <span class="text-[14px] font-bold text-charcoal" id="voice-note-title">Senior's Morning Note</span>
              </div>
              <span class="text-[12px] text-charcoal-taupe" id="voice-note-time">Today</span>
            </div>
            <div class="p-3.5 rounded-xl bg-white border border-sand flex items-center gap-3">
              <button class="w-10 h-10 rounded-full bg-terracotta hover:bg-terracotta-hover text-white flex items-center justify-center shrink-0 transition-all shadow-xs touch-target" type="button" id="play-voice-note" aria-label="Play voice note">
                <span class="material-symbols-outlined text-[20px]" aria-hidden="true">play_arrow</span>
              </button>
              <div class="flex-1 flex items-center gap-1 h-7 px-1" aria-hidden="true" id="waveform-display">
                <!-- Waveform bars -->
              </div>
              <span class="text-[12px] font-semibold text-charcoal-taupe" id="voice-note-duration">0:00</span>
            </div>
            <p class="text-[13px] text-charcoal-taupe italic px-1" id="voice-note-transcript">Loading...</p>
          </article>

          <article class="rounded-3xl bg-white border border-card-border p-8 shadow-sm flex flex-col gap-6" aria-labelledby="visit-form-title">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[22px] text-terracotta" aria-hidden="true">calendar_today</span>
                <h3 id="visit-form-title" class="font-headline text-[20px] text-charcoal font-bold">Doctor Visit Plan</h3>
              </div>
              <span class="w-2.5 h-2.5 rounded-full bg-caramel" aria-hidden="true" aria-label="Upcoming visit"></span>
            </div>
            <form id="appointment-form" class="flex flex-col gap-5" novalidate>
              <div class="flex flex-col gap-1.5">
                <label for="doctor-name" class="text-[13px] font-bold text-charcoal">Doctor's Name</label>
                <input id="doctor-name" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="text" placeholder="Dr. Meera Sen (Cardiologist)" required />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label for="visit-date" class="text-[13px] font-bold text-charcoal">Day</label>
                  <input id="visit-date" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="date" required />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="visit-time" class="text-[13px] font-bold text-charcoal">Time</label>
                  <input id="visit-time" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="time" required />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="visit-clinic" class="text-[13px] font-bold text-charcoal">Clinic / Location</label>
                <input id="visit-clinic" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="text" placeholder="Fortis Pavilion, Room 302" required />
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="visit-notes" class="text-[13px] font-bold text-charcoal">Topics to discuss</label>
                <textarea id="visit-notes" class="w-full p-3.5 rounded-xl bg-sand-light border border-card-border text-charcoal text-[13px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta resize-none leading-relaxed touch-target" rows="3" placeholder="Blood pressure review, medication adjustments..."></textarea>
              </div>
              <div class="p-4 rounded-2xl bg-sand-light border border-sand flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-[14px] font-bold text-charcoal">SMS Reminder to Caregiver</span>
                  <span class="text-[12px] text-charcoal-taupe">Send a reminder 1 day before the visit</span>
                </div>
                <input checked class="w-5 h-5 accent-terracotta rounded cursor-pointer touch-target" type="checkbox" id="visit-reminder" />
              </div>
              <button type="submit" class="w-full h-13 py-3.5 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-[15px] transition-all flex items-center justify-center gap-2 shadow-sm mt-1 touch-target">
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">done</span>
                <span>Save Visit Details</span>
              </button>
            </form>
          </article>
        </aside>
      </section>
    </template>

    <!-- Medicines section template -->
    <template id="template-medicines">
      <section class="rounded-3xl bg-white border border-card-border p-8 lg:p-10 shadow-sm flex flex-col gap-8" aria-labelledby="medicines-full-title">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex flex-col">
            <span class="text-[12px] uppercase tracking-wider text-charcoal-taupe font-bold">All Medicines</span>
            <h2 id="medicines-full-title" class="font-headline text-[26px] text-charcoal font-bold tracking-tight">Medicine Management</h2>
          </div>
          <button class="flex items-center gap-2 px-6 py-3 rounded-full bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-[14px] transition-all shadow-sm self-start sm:self-auto touch-target" type="button" id="add-medicine-btn-full" aria-label="Add new medicine">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            <span>Add Medicine</span>
          </button>
        </div>
        <div class="relative group cursor-pointer rounded-2xl bg-sand-light hover:bg-sand border-2 border-dashed border-card-border p-6 transition-all" id="prescription-upload-full">
          <input accept="image/*,.pdf" class="absolute inset-0 opacity-0 cursor-pointer" type="file" id="prescription-file-full" aria-label="Upload prescription image or PDF" />
          <div class="flex items-center gap-5">
            <div class="w-12 h-12 rounded-2xl bg-white border border-card-border flex items-center justify-center text-terracotta shadow-xs shrink-0" aria-hidden="true">
              <span class="material-symbols-outlined text-[24px]">upload_file</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[15px] font-bold text-charcoal">Upload Doctor's Note / Prescription Slip</span>
              <p class="text-[13px] text-charcoal-taupe mt-0.5">Snap a photo of the slip to automatically read dosages and times.</p>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-4" id="medicines-list-full" role="list" aria-label="All medications">
          <!-- Populated dynamically -->
        </div>
      </section>
    </template>

    <!-- Appointments section template -->
    <template id="template-appointments">
      <section class="rounded-3xl bg-white border border-card-border p-8 lg:p-10 shadow-sm flex flex-col gap-8" aria-labelledby="appointments-full-title">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex flex-col">
            <span class="text-[12px] uppercase tracking-wider text-charcoal-taupe font-bold">Doctor Visits</span>
            <h2 id="appointments-full-title" class="font-headline text-[26px] text-charcoal font-bold tracking-tight">Upcoming Appointments</h2>
          </div>
          <button class="flex items-center gap-2 px-6 py-3 rounded-full bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-[14px] transition-all shadow-sm self-start sm:self-auto touch-target" type="button" id="add-appointment-btn" aria-label="Schedule new appointment">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            <span>Schedule Visit</span>
          </button>
        </div>
        <div class="flex flex-col gap-4" id="appointments-list" role="list" aria-label="All appointments">
          <!-- Populated dynamically -->
        </div>
      </section>
    </template>

    <!-- Voice notes section template -->
    <template id="template-voice-notes">
      <section class="rounded-3xl bg-white border border-card-border p-8 lg:p-10 shadow-sm flex flex-col gap-8" aria-labelledby="voice-notes-full-title">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex flex-col">
            <span class="text-[12px] uppercase tracking-wider text-charcoal-taupe font-bold">Voice Notes</span>
            <h2 id="voice-notes-full-title" class="font-headline text-[26px] text-charcoal font-bold tracking-tight">Family Voice Messages</h2>
          </div>
        </div>
        <div class="flex flex-col gap-4" id="voice-notes-list" role="list" aria-label="Voice notes">
          <!-- Populated dynamically -->
        </div>
      </section>
    </template>

    <!-- Add Medicine Modal -->
    <dialog id="medicine-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="medicine-modal-title">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" role="document">
        <header class="flex items-center justify-between mb-6">
          <h2 id="medicine-modal-title" class="font-headline text-headline-md text-charcoal">Add Medicine</h2>
          <button class="w-10 h-10 rounded-full bg-sand-light hover:bg-sand text-charcoal flex items-center justify-center touch-target" type="button" id="close-medicine-modal" aria-label="Close dialog">
            <span class="material-symbols-outlined text-[24px]">close</span>
          </button>
        </header>
        <form id="medicine-form" class="space-y-5" novalidate>
          <input type="hidden" name="id" id="medicine-id" />
          <div class="flex flex-col gap-1.5">
            <label for="medicine-name" class="text-[13px] font-bold text-charcoal">Medicine Name</label>
            <input id="medicine-name" name="name" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="text" placeholder="Amlodipine" required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label for="medicine-dosage" class="text-[13px] font-bold text-charcoal">Dosage</label>
              <input id="medicine-dosage" name="dosage" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="text" placeholder="5 mg" required />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="medicine-frequency" class="text-[13px] font-bold text-charcoal">Frequency</label>
              <select id="medicine-frequency" name="frequency" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" required>
                <option value="">Select</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="as_needed">As Needed</option>
              </select>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="medicine-times" class="text-[13px] font-bold text-charcoal">Times (one per line, HH:MM)</label>
            <textarea id="medicine-times" name="times" class="w-full p-3.5 rounded-xl bg-sand-light border border-card-border text-charcoal text-[13px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta resize-none leading-relaxed touch-target" rows="3" placeholder="08:00&#10;20:00" required></textarea>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="medicine-instructions" class="text-[13px] font-bold text-charcoal">Instructions</label>
            <textarea id="medicine-instructions" name="instructions" class="w-full p-3.5 rounded-xl bg-sand-light border border-card-border text-charcoal text-[13px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta resize-none leading-relaxed touch-target" rows="2" placeholder="Take with food, after breakfast"></textarea>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="medicine-photo" class="text-[13px] font-bold text-charcoal">Photo (optional)</label>
            <input id="medicine-photo" name="photo" type="file" accept="image/*" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[13px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" />
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" class="flex-1 h-12 px-4 rounded-xl bg-sand hover:bg-sand-dark text-charcoal font-semibold text-[14px] transition-colors touch-target" id="cancel-medicine-modal">Cancel</button>
            <button type="submit" class="flex-1 h-12 px-4 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-[14px] transition-colors touch-target">Save Medicine</button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Add Appointment Modal -->
    <dialog id="appointment-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" role="document">
        <header class="flex items-center justify-between mb-6">
          <h2 id="appointment-modal-title" class="font-headline text-headline-md text-charcoal">Schedule Visit</h2>
          <button class="w-10 h-10 rounded-full bg-sand-light hover:bg-sand text-charcoal flex items-center justify-center touch-target" type="button" id="close-appointment-modal" aria-label="Close dialog">
            <span class="material-symbols-outlined text-[24px]">close</span>
          </button>
        </header>
        <form id="appointment-modal-form" class="space-y-5" novalidate>
          <input type="hidden" name="id" id="appointment-id" />
          <div class="flex flex-col gap-1.5">
            <label for="modal-doctor-name" class="text-[13px] font-bold text-charcoal">Doctor's Name</label>
            <input id="modal-doctor-name" name="doctor_name" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="text" placeholder="Dr. Meera Sen" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="modal-clinic" class="text-[13px] font-bold text-charcoal">Clinic / Location</label>
            <input id="modal-clinic" name="clinic" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="text" placeholder="Fortis Pavilion, Room 302" required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label for="modal-date" class="text-[13px] font-bold text-charcoal">Date</label>
              <input id="modal-date" name="date" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="date" required />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="modal-time" class="text-[13px] font-bold text-charcoal">Time</label>
              <input id="modal-time" name="time" class="w-full h-12 px-4 rounded-xl bg-sand-light border border-card-border text-charcoal text-[14px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta touch-target" type="time" required />
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="modal-notes" class="text-[13px] font-bold text-charcoal">Notes</label>
            <textarea id="modal-notes" name="notes" class="w-full p-3.5 rounded-xl bg-sand-light border border-card-border text-charcoal text-[13px] focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta resize-none leading-relaxed touch-target" rows="3" placeholder="Topics to discuss..."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <label class="flex items-center gap-2 cursor-pointer touch-target">
              <input name="reminder_24h" type="checkbox" class="w-5 h-5 accent-terracotta rounded border-card-border focus:ring-2 focus:ring-terracotta/20" checked />
              <span class="text-[13px] text-charcoal">24h reminder</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer touch-target">
              <input name="reminder_2h" type="checkbox" class="w-5 h-5 accent-terracotta rounded border-card-border focus:ring-2 focus:ring-terracotta/20" checked />
              <span class="text-[13px] text-charcoal">2h reminder</span>
            </label>
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" class="flex-1 h-12 px-4 rounded-xl bg-sand hover:bg-sand-dark text-charcoal font-semibold text-[14px] transition-colors touch-target" id="cancel-appointment-modal">Cancel</button>
            <button type="submit" class="flex-1 h-12 px-4 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-[14px] transition-colors touch-target">Save Appointment</button>
          </div>
        </form>
      </div>
    </dialog>
  `;
}

/**
 * Attach event listeners for caretaker dashboard
 */
async function attachCaretakerListeners() {
  const authState = auth.getState();
  const user = authState.user;

  // Load profile data
  let profileData = null;
  let medicationsData = [];
  let appointmentsData = [];

  try {
    profileData = await profiles.getMe();
    if (profileData?.linked_profiles?.[0]) {
      const profileId = profileData.linked_profiles[0]._id;
      medicationsData = await medications.list(profileId);
      appointmentsData = await appointments.list(profileId);
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }

  // Render senior info in sidebar and header
  renderSeniorInfo(profileData);

  // Set up navigation
  setupNavigation();

  // Load initial section (overview)
  await loadSection('overview', profileData, medicationsData, appointmentsData);

  // Set up prescription upload
  setupPrescriptionUpload();

  // Set up modals
  setupModals();

  // Set up appointment form
  setupAppointmentForm();
}

/**
 * Render senior info in sidebar and header
 */
function renderSeniorInfo(profileData) {
  const senior = profileData?.linked_profiles?.[0];
  const caregiver = profileData?.user;

  if (senior) {
    document.getElementById('senior-name').textContent = senior.name || 'Grandpa';
    document.getElementById('senior-age').textContent = senior.age ? `Age ${senior.age}` : 'Age --';
    document.getElementById('senior-mood').textContent = senior.mood || 'Sunny & Comforted';
    document.getElementById('senior-details').textContent = `${senior.location || 'Home Suite'} • ${senior.status || 'Rested & Active'}`;
    document.getElementById('senior-status').textContent = `${senior.name || 'Grandpa'} is feeling good today`;
    document.getElementById('senior-avatar-large').src = senior.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTFX9LipdSng7E8IafANJU-drliSFactCkASOW0BpaztDBrbleGVQpJqFG3rGDUlwCsHCajjptqhHH3dHyg5kUuQF0RbL01v0wjxSjPROZc0KNa-AUGYne30CYt9tdtNSY66HqZQRzf-PKzuvdipMkQDy2-kD4UsSa7tSHt43lXiD4TfZxp2iGaYTpyTk-d4acOuSCy_q4sF4z9QAjRnYxz3quqycLTEEFEwdUnk0';
    document.getElementById('senior-avatar-large').alt = `Photo of ${senior.name || 'Grandpa'}`;

    // Header avatar
    document.getElementById('caregiver-avatar').style.backgroundImage = `url(${caregiver?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6UA7H4K1ONVH4raqxoWThYcIsZiAD8PsZbaY3OPntwcV27JGTyCM0JhssQd-k0Ko9B7Mdo0cZBSsHtOPcl6eA2KhK5oUeuY3r_7ZQOrdDbtrZNipx7YFHJI3N8PWad7X4hDfF0HGVOZLjJBlo7n8PC-ZkfVId7efW7xQFsocNEN6YC3HqjZEoAdV_Ve1E-Nzr2KtYkYqHCJYYFAZB5R8TmUu785MUBwjiqoSWK1M'})`;
  }
  if (caregiver) {
    document.getElementById('caregiver-info').textContent = `Primary Caregiver: ${caregiver.display_name || caregiver.name || 'Family'} (${caregiver.relation || 'Daughter'}) • Synced to Family Circle`;
  }
}

/**
 * Set up sidebar navigation
 */
function setupNavigation() {
  const navLinks = document.querySelectorAll('aside nav a[data-section]');
  navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      // Update active state
      navLinks.forEach(l => {
        l.classList.remove('bg-terracotta', 'text-white', 'shadow-sm');
        l.classList.add('text-charcoal-taupe', 'hover:bg-sand', 'hover:text-charcoal');
        l.removeAttribute('aria-current');
      });
      link.classList.add('bg-terracotta', 'text-white', 'shadow-sm');
      link.classList.remove('text-charcoal-taupe', 'hover:bg-sand', 'hover:text-charcoal');
      link.setAttribute('aria-current', 'page');

      // Load section
      const profileData = await profiles.getMe().catch(() => null);
      const senior = profileData?.linked_profiles?.[0];
      let medicationsData = [], appointmentsData = [];
      if (senior) {
        medicationsData = await medications.list(senior._id).catch(() => []);
        appointmentsData = await appointments.list(senior._id).catch(() => []);
      }
      await loadSection(section, profileData, medicationsData, appointmentsData);
    });
  });
}

/**
 * Load a dashboard section
 */
async function loadSection(section, profileData, medicationsData, appointmentsData) {
  const mainContent = document.getElementById('main-content');
  const template = document.getElementById(`template-${section}`);

  if (!template || !mainContent) return;

  const senior = profileData?.linked_profiles?.[0];
  const profileId = senior?._id;

  // Clone template content
  const content = template.content.cloneNode(true);
  mainContent.innerHTML = '';
  mainContent.appendChild(content);

  // Populate based on section
  switch (section) {
    case 'overview':
      populateOverview(senior, medicationsData, appointmentsData);
      break;
    case 'medicines':
      populateMedicinesList(medicationsData, profileId, true);
      setupAddMedicineButton('add-medicine-btn-full', profileId);
      setupPrescriptionUpload('prescription-file-full');
      break;
    case 'appointments':
      populateAppointmentsList(appointmentsData, profileId, true);
      setupAddAppointmentButton();
      break;
    case 'voice-notes':
      populateVoiceNotes(profileId);
      break;
  }

  // Re-attach common listeners
  attachCommonListeners(profileId);
}

/**
 * Populate overview section
 */
function populateOverview(senior, medicationsData, appointmentsData) {
  if (!senior) return;

  // Adherence calculation
  const todayMeds = medicationsData.filter(m => m.active !== false);
  const takenToday = todayMeds.filter(m => m.last_taken_today).length;
  const totalToday = todayMeds.length;
  const adherencePct = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 100;

  // Update adherence card
  document.getElementById('adherence-percent').textContent = `${adherencePct}%`;
  const dashOffset = 251 - (adherencePct / 100) * 251;
  document.getElementById('adherence-circle').style.strokeDashoffset = dashOffset;

  // Adherence breakdown
  const breakdown = document.getElementById('adherence-breakdown');
  breakdown.innerHTML = `
    <div class="flex items-center gap-2.5">
      <span class="w-2.5 h-2.5 rounded-full bg-terracotta" aria-hidden="true"></span>
      <span class="text-[14px] text-charcoal font-medium">${takenToday} Doses taken</span>
    </div>
    <div class="flex items-center gap-2.5">
      <span class="w-2.5 h-2.5 rounded-full bg-caramel" aria-hidden="true"></span>
      <span class="text-[14px] text-charcoal-taupe">${totalToday - takenToday} Remaining</span>
    </div>
    <div class="flex items-center gap-2.5">
      <span class="w-2.5 h-2.5 rounded-full bg-sand-dark" aria-hidden="true"></span>
      <span class="text-[14px] text-charcoal-taupe">0 Missed</span>
    </div>
  `;

  // Dispenser status
  document.getElementById('dispenser-status').textContent = 'Automatic pill dispenser box is full and ready.';

  // Next appointment
  const upcoming = appointmentsData
    .filter(a => new Date(a.date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (upcoming) {
    const daysUntil = Math.ceil((new Date(upcoming.date) - new Date()) / (1000 * 60 * 60 * 24));
    document.getElementById('appointment-title').textContent = upcoming.doctor_name || 'Dr. Meera Sen';
    document.getElementById('appointment-type').textContent = upcoming.specialty || 'Heart Health';

    const details = document.getElementById('appointment-details');
    details.innerHTML = `
      <div class="flex items-baseline gap-2">
        <span class="font-headline text-[38px] text-terracotta font-bold">${daysUntil}</span>
        <span class="text-[16px] text-charcoal-taupe font-medium">Days away</span>
      </div>
      <div class="mt-3 p-3.5 rounded-2xl bg-sand-light border border-sand flex items-center gap-3">
        <span class="material-symbols-outlined text-[20px] text-caramel" aria-hidden="true">location_on</span>
        <div class="flex flex-col">
          <span class="text-[14px] font-semibold text-charcoal">${upcoming.clinic || 'Clinic'}</span>
          <span class="text-[12px] text-charcoal-taupe">${formatDate(upcoming.date)} at ${upcoming.time || '10:30 AM'}</span>
        </div>
      </div>
    `;

    document.getElementById('appointment-reminder').innerHTML = `
      <span>Reminder sent to ${profileData?.user?.display_name || 'Caregiver'}</span>
      <span class="material-symbols-outlined text-caramel text-[18px]" aria-hidden="true">done_all</span>
    `;
  } else {
    document.getElementById('appointment-title').textContent = 'No upcoming visits';
    document.getElementById('appointment-type').textContent = '--';
    document.getElementById('appointment-details').innerHTML = '<p class="text-charcoal-taupe">No appointments scheduled</p>';
    document.getElementById('appointment-reminder').innerHTML = '';
  }

  // Support card
  document.getElementById('support-title').textContent = 'Peace of Mind';
  document.getElementById('support-features').innerHTML = `
    <div class="flex items-center gap-2 text-caramel font-semibold text-[14px]">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">sentiment_satisfied</span>
      <span>Warm Reminders Enabled</span>
    </div>
    <p class="text-[13px] text-charcoal-taupe leading-relaxed">
      If ${senior.name || 'Grandpa'} ever forgets an afternoon dose, a pleasant musical chime plays in his room, followed by a quick note to you.
    </p>
  `;
  document.getElementById('alert-phone').innerHTML = `
    <span>Alert phone:</span>
    <strong class="text-charcoal font-semibold">${profileData?.user?.phone || '+1 (555) 349-8210'}</strong>
  `;

  // Routine status
  document.getElementById('routine-status').textContent = takenToday === totalToday ? 'Morning Routine All Set' : 'Morning Routine In Progress';
  document.getElementById('routine-detail').textContent = takenToday === totalToday ? 'Medicines taken on time with breakfast' : `${takenToday} of ${totalToday} medicines taken`;
}

/**
 * Populate medicines list
 */
function populateMedicinesList(medicationsData, profileId, isFullView = false) {
  const containerId = isFullView ? 'medicines-list-full' : 'medicines-list';
  const container = document.getElementById(containerId);
  if (!container) return;

  const todayMeds = medicationsData.filter(m => m.active !== false).sort((a, b) => {
    const timeA = a.times?.[0] || '23:59';
    const timeB = b.times?.[0] || '23:59';
    return timeA.localeCompare(timeB);
  });

  if (todayMeds.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-charcoal-taupe">
        <span class="material-symbols-outlined text-[48px] text-sand block mb-4" aria-hidden="true">medication</span>
        <p class="font-body text-body-lg">No medicines scheduled today</p>
        <p class="font-body text-body-sm mt-2">Tap "Add Medicine" to get started</p>
      </div>
    `;
    return;
  }

  container.innerHTML = todayMeds.map((med, index) => {
    const isTaken = med.last_taken_today;
    const nextTime = med.times?.[0] || '--:--';
    const icon = getMedicineIcon(med.name);
    const iconBg = getMedicineIconBg(med.name);

    return `
      <article class="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl ${isTaken ? 'bg-sand-light/60 border border-sand' : 'bg-white border border-card-border'} hover:border-card-border transition-all gap-4" role="listitem" data-medicine-id="${med._id}">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center ${iconBg.includes('terracotta') ? 'text-terracotta' : iconBg.includes('caramel') ? 'text-caramel' : 'text-charcoal-taupe'} shrink-0" aria-hidden="true">
            <span class="material-symbols-outlined text-[24px]">${icon}</span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-3">
              <span class="font-headline text-[18px] text-charcoal font-bold">${med.name}</span>
              <span class="px-2.5 py-0.5 rounded-full bg-sand text-charcoal-taupe text-[12px] font-semibold">${med.dosage}</span>
            </div>
            <span class="text-[13px] text-charcoal-taupe mt-1">${formatTime(nextTime)} • ${med.instructions || 'As directed'}</span>
          </div>
        </div>
        <div class="flex items-center gap-3 self-end sm:self-center">
          ${isTaken ? `
            <span class="px-4 py-1.5 rounded-full bg-sand text-charcoal text-[13px] font-semibold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-terracotta" aria-hidden="true">check</span>
              <span>Taken at ${formatTime(med.taken_at || nextTime)}</span>
            </span>
          ` : `
            <button class="btn-senior bg-terracotta hover:bg-terracotta-hover text-white flex items-center justify-center gap-2 touch-target" type="button" data-action="take" data-medicine-id="${med._id}" aria-label="Mark ${med.name} as taken">
              <span class="material-symbols-outlined text-[22px]" aria-hidden="true">check</span>
              <span>Mark Taken</span>
            </button>
            <button class="btn-senior bg-sand hover:bg-sand-dark text-charcoal flex items-center justify-center gap-2 touch-target" type="button" data-action="skip" data-medicine-id="${med._id}" aria-label="Skip ${med.name}">
              <span class="material-symbols-outlined text-[22px]" aria-hidden="true">skip_next</span>
              <span>Skip</span>
            </button>
          `}
        </div>
      </article>
    `;
  }).join('');

  // Attach medicine action listeners
  container.querySelectorAll('[data-action="take"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const medId = btn.dataset.medicineId;
      await handleMedicineAction(medId, 'take', profileId);
    });
  });
  container.querySelectorAll('[data-action="skip"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const medId = btn.dataset.medicineId;
      await handleMedicineAction(medId, 'skip', profileId);
    });
  });
}

/**
 * Handle medicine take/skip action
 */
async function handleMedicineAction(medId, action, profileId) {
  try {
    if (action === 'take') {
      await medications.take(medId);
    } else {
      await medications.skip(medId);
    }
    // Reload current section
    const profileData = await profiles.getMe();
    const senior = profileData?.linked_profiles?.[0];
    const medsData = await medications.list(senior._id);
    const appsData = await appointments.list(senior._id);
    await loadSection('overview', profileData, medsData, appsData);
    if (document.querySelector('aside nav a[aria-current="page"]')?.dataset.section === 'medicines') {
      populateMedicinesList(medsData, senior._id, true);
    }
  } catch (error) {
    alert(`Failed to ${action} medicine: ${error.message}`);
  }
}

/**
 * Populate appointments list
 */
function populateAppointmentsList(appointmentsData, profileId, isFullView = false) {
  const container = document.getElementById('appointments-list');
  if (!container) return;

  const sorted = [...appointmentsData].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-charcoal-taupe">
        <span class="material-symbols-outlined text-[48px] text-sand block mb-4" aria-hidden="true">calendar_month</span>
        <p class="font-body text-body-lg">No appointments scheduled</p>
        <p class="font-body text-body-sm mt-2">Tap "Schedule Visit" to add one</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sorted.map(appt => `
    <article class="p-6 rounded-2xl bg-white border border-card-border hover:shadow-xs transition-all" role="listitem" data-appointment-id="${appt._id}">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-caramel-light border border-caramel-border flex items-center justify-center text-caramel shrink-0" aria-hidden="true">
            <span class="material-symbols-outlined text-[24px]">local_hospital</span>
          </div>
          <div class="flex flex-col">
            <span class="font-headline text-[18px] text-charcoal font-bold">${appt.doctor_name}</span>
            <span class="text-[13px] text-charcoal-taupe">${appt.specialty || 'General'}</span>
          </div>
        </div>
        <div class="flex items-center gap-3 self-end sm:self-center">
          <div class="p-3.5 rounded-2xl bg-sand-light border border-sand flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px] text-caramel" aria-hidden="true">location_on</span>
            <div class="flex flex-col">
              <span class="text-[14px] font-semibold text-charcoal">${appt.clinic}</span>
              <span class="text-[12px] text-charcoal-taupe">${formatDate(appt.date)} at ${appt.time}</span>
            </div>
          </div>
          <button class="w-10 h-10 rounded-xl bg-sand-light hover:bg-sand text-charcoal flex items-center justify-center touch-target" type="button" data-action="delete-appointment" data-appointment-id="${appt._id}" aria-label="Delete appointment">
            <span class="material-symbols-outlined text-[22px]">delete</span>
          </button>
        </div>
      </div>
      ${appt.notes ? `<p class="text-[13px] text-charcoal-taupe mt-4 pt-4 border-t border-card-border/60">${appt.notes}</p>` : ''}
    </article>
  `).join('');

  // Attach delete listeners
  container.querySelectorAll('[data-action="delete-appointment"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Delete this appointment?')) {
        await appointments.delete(btn.dataset.appointmentId);
        const profileData = await profiles.getMe();
        const senior = profileData?.linked_profiles?.[0];
        const appsData = await appointments.list(senior._id);
        populateAppointmentsList(appsData, senior._id, true);
        // Also refresh overview
        const medsData = await medications.list(senior._id);
        await loadSection('overview', profileData, medsData, appsData);
      }
    });
  });
}

/**
 * Populate voice notes (placeholder)
 */
function populateVoiceNotes(profileId) {
  const container = document.getElementById('voice-notes-list');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-12 text-charcoal-taupe">
      <span class="material-symbols-outlined text-[48px] text-sand block mb-4" aria-hidden="true">record_voice_over</span>
      <p class="font-body text-body-lg">No voice notes yet</p>
      <p class="font-body text-body-sm mt-2">Voice messages from family will appear here</p>
    </div>
  `;
}

/**
 * Set up Add Medicine button
 */
function setupAddMedicineButton(buttonId, profileId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener('click', () => {
    openMedicineModal(profileId);
  });
}

/**
 * Set up Add Appointment button
 */
function setupAddAppointmentButton() {
  const btn = document.getElementById('add-appointment-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    openAppointmentModal();
  });
}

/**
 * Open medicine modal
 */
function openMedicineModal(profileId, med = null) {
  const dialog = document.getElementById('medicine-modal');
  const form = document.getElementById('medicine-form');

  // Reset form
  form.reset();
  document.getElementById('medicine-id').value = '';

  if (med) {
    document.getElementById('medicine-modal-title').textContent = 'Edit Medicine';
    document.getElementById('medicine-id').value = med._id;
    document.getElementById('medicine-name').value = med.name;
    document.getElementById('medicine-dosage').value = med.dosage;
    document.getElementById('medicine-frequency').value = med.frequency;
    document.getElementById('medicine-times').value = med.times?.join('\n') || '';
    document.getElementById('medicine-instructions').value = med.instructions || '';
  } else {
    document.getElementById('medicine-modal-title').textContent = 'Add Medicine';
  }

  dialog.showModal();

  // Focus first input
  setTimeout(() => document.getElementById('medicine-name').focus(), 100);
}

/**
 * Open appointment modal
 */
function openAppointmentModal(appt = null) {
  const dialog = document.getElementById('appointment-modal');
  const form = document.getElementById('appointment-modal-form');

  form.reset();
  document.getElementById('appointment-id').value = '';

  if (appt) {
    document.getElementById('appointment-modal-title').textContent = 'Edit Appointment';
    document.getElementById('appointment-id').value = appt._id;
    document.getElementById('modal-doctor-name').value = appt.doctor_name;
    document.getElementById('modal-clinic').value = appt.clinic;
    document.getElementById('modal-date').value = appt.date;
    document.getElementById('modal-time').value = appt.time;
    document.getElementById('modal-notes').value = appt.notes || '';
    document.querySelector('input[name="reminder_24h"]').checked = appt.reminder_24h;
    document.querySelector('input[name="reminder_2h"]').checked = appt.reminder_2h;
  } else {
    document.getElementById('appointment-modal-title').textContent = 'Schedule Visit';
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('modal-date').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('modal-time').value = '10:30';
  }

  dialog.showModal();

  setTimeout(() => document.getElementById('modal-doctor-name').focus(), 100);
}

/**
 * Set up modal event listeners
 */
function setupModals() {
  // Medicine modal
  const medDialog = document.getElementById('medicine-modal');
  const medForm = document.getElementById('medicine-form');
  const closeMedBtn = document.getElementById('close-medicine-modal');
  const cancelMedBtn = document.getElementById('cancel-medicine-modal');

  [closeMedBtn, cancelMedBtn].forEach(btn => {
    btn?.addEventListener('click', () => medDialog.close());
  });

  medDialog?.addEventListener('click', (e) => {
    if (e.target === medDialog) medDialog.close();
  });

  medForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(medForm);
    const data = {
      name: formData.get('name'),
      dosage: formData.get('dosage'),
      frequency: formData.get('frequency'),
      times: formData.get('times').split('\n').map(t => t.trim()).filter(Boolean),
      instructions: formData.get('instructions'),
      profile_id: formData.get('profile_id') || (await profiles.getMe()).linked_profiles[0]?._id,
    };

    const medId = formData.get('id');
    try {
      if (medId) {
        await medications.update(medId, data);
      } else {
        await medications.create(data);
      }
      medDialog.close();
      // Refresh
      const profileData = await profiles.getMe();
      const senior = profileData?.linked_profiles?.[0];
      const medsData = await medications.list(senior._id);
      populateMedicinesList(medsData, senior._id, true);
      const appsData = await appointments.list(senior._id);
      await loadSection('overview', profileData, medsData, appsData);
    } catch (error) {
      alert(`Failed to save medicine: ${error.message}`);
    }
  });

  // Appointment modal
  const apptDialog = document.getElementById('appointment-modal');
  const apptForm = document.getElementById('appointment-modal-form');
  const closeApptBtn = document.getElementById('close-appointment-modal');
  const cancelApptBtn = document.getElementById('cancel-appointment-modal');

  [closeApptBtn, cancelApptBtn].forEach(btn => {
    btn?.addEventListener('click', () => apptDialog.close());
  });

  apptDialog?.addEventListener('click', (e) => {
    if (e.target === apptDialog) apptDialog.close();
  });

  apptForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(apptForm);
    const data = {
      doctor_name: formData.get('doctor_name'),
      clinic: formData.get('clinic'),
      date: formData.get('date'),
      time: formData.get('time'),
      notes: formData.get('notes'),
      reminder_24h: formData.get('reminder_24h') === 'on',
      reminder_2h: formData.get('reminder_2h') === 'on',
      profile_id: (await profiles.getMe()).linked_profiles[0]?._id,
    };

    const apptId = formData.get('id');
    try {
      if (apptId) {
        await appointments.update(apptId, data);
      } else {
        await appointments.create(data);
      }
      apptDialog.close();
      // Refresh
      const profileData = await profiles.getMe();
      const senior = profileData?.linked_profiles?.[0];
      const appsData = await appointments.list(senior._id);
      populateAppointmentsList(appsData, senior._id, true);
      const medsData = await medications.list(senior._id);
      await loadSection('overview', profileData, medsData, appsData);
    } catch (error) {
      alert(`Failed to save appointment: ${error.message}`);
    }
  });
}

/**
 * Set up prescription upload
 */
function setupPrescriptionUpload(inputId = 'prescription-file') {
  const input = document.getElementById(inputId);
  const dropzone = input?.closest('[id^="prescription-upload"]');

  if (!input || !dropzone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('bg-sand', 'border-terracotta'));
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('bg-sand', 'border-terracotta'));
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handlePrescriptionFile(file);
  });

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handlePrescriptionFile(file);
  });
}

/**
 * Handle prescription file upload
 */
async function handlePrescriptionFile(file) {
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    alert('Please upload an image or PDF file');
    return;
  }

  try {
    const result = await ai.parsePrescription(file);
    if (result?.medication_name) {
      // Pre-fill medicine modal with parsed data
      const profileData = await profiles.getMe();
      const senior = profileData?.linked_profiles?.[0];
      openMedicineModal(senior._id, {
        _id: '',
        name: result.medication_name,
        dosage: result.dosage,
        frequency: result.frequency,
        times: result.times || [],
        instructions: result.instructions,
      });
    } else {
      alert('Could not parse prescription. Please enter details manually.');
    }
  } catch (error) {
    alert(`Failed to parse prescription: ${error.message}`);
  }
}

/**
 * Set up appointment form in sidebar
 */
function setupAppointmentForm() {
  const form = document.getElementById('appointment-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const profileData = await profiles.getMe();
    const senior = profileData?.linked_profiles?.[0];

    const data = {
      profile_id: senior._id,
      doctor_name: formData.get('doctor_name') || document.getElementById('doctor-name').value,
      clinic: document.getElementById('visit-clinic').value,
      date: document.getElementById('visit-date').value,
      time: document.getElementById('visit-time').value,
      notes: document.getElementById('visit-notes').value,
      reminder_24h: document.getElementById('visit-reminder').checked,
      reminder_2h: true,
    };

    try {
      await appointments.create(data);
      alert('Appointment saved successfully!');
      form.reset();
      // Refresh
      const appsData = await appointments.list(senior._id);
      populateAppointmentsList(appsData, senior._id, true);
      const medsData = await medications.list(senior._id);
      await loadSection('overview', profileData, medsData, appsData);
    } catch (error) {
      alert(`Failed to save appointment: ${error.message}`);
    }
  });
}

/**
 * Attach common listeners (voice play, safety check, etc.)
 */
function attachCommonListeners(profileId) {
  // Play voice note
  const playBtn = document.getElementById('play-voice-note');
  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      try {
        const audioUrl = await voice.createAudioUrl('Grandpa, this is your morning reminder. Please take your Amlodipine tablet with warm water after breakfast.', 'en');
        const audio = new Audio(audioUrl);
        audio.play();
        // Animate waveform
        animateWaveform(true);
        audio.onended = () => animateWaveform(false);
      } catch (error) {
        alert('Failed to play audio: ' + error.message);
      }
    });
  }

  // Safety check refresh
  const safetyBtn = document.getElementById('refresh-safety');
  if (safetyBtn) {
    safetyBtn.addEventListener('click', async () => {
      try {
        const result = await ai.safetyCheck(profileId);
        updateSafetyDisplay(result);
      } catch (error) {
        console.error('Safety check failed:', error);
      }
    });
  }

  // Run initial safety check
  if (profileId) {
    ai.safetyCheck(profileId).then(updateSafetyDisplay).catch(console.error);
  }
}

/**
 * Update safety check display
 */
function updateSafetyDisplay(result) {
  const statusEl = document.getElementById('safety-status');
  const messageEl = document.getElementById('safety-message');

  if (!statusEl || !messageEl) return;

  if (result?.safe) {
    statusEl.textContent = 'Verified';
    statusEl.className = 'px-3 py-1 rounded-full bg-sand text-charcoal text-[12px] font-semibold';
    messageEl.innerHTML = `
      <span class="material-symbols-outlined text-[24px] text-caramel shrink-0 mt-0.5" aria-hidden="true">sentiment_satisfied_alt</span>
      <div class="flex flex-col">
        <span class="text-[15px] font-bold text-charcoal">All medicines safe to take together</span>
        <p class="text-[13px] text-charcoal-taupe mt-1.5 leading-relaxed">No conflicts between medications. Everything is balanced and gentle.</p>
      </div>
    `;
  } else {
    statusEl.textContent = 'Review Needed';
    statusEl.className = 'px-3 py-1 rounded-full bg-terracotta text-white text-[12px] font-semibold';
    const interactions = result?.interactions || [];
    messageEl.innerHTML = `
      <span class="material-symbols-outlined text-[24px] text-terracotta shrink-0 mt-0.5" aria-hidden="true">warning</span>
      <div class="flex flex-col">
        <span class="text-[15px] font-bold text-charcoal">Potential interactions found</span>
        <p class="text-[13px] text-charcoal-taupe mt-1.5 leading-relaxed">${interactions.map(i => i.message).join('; ')}</p>
      </div>
    `;
  }
}

/**
 * Animate waveform
 */
function animateWaveform(playing) {
  const container = document.getElementById('waveform-display');
  if (!container) return;

  if (playing) {
    container.innerHTML = `
      <span class="w-1 bg-terracotta rounded-full h-3 waveform-bar"></span>
      <span class="w-1 bg-terracotta rounded-full h-5 waveform-bar"></span>
      <span class="w-1 bg-terracotta rounded-full h-7 waveform-bar"></span>
      <span class="w-1 bg-caramel rounded-full h-4 waveform-bar"></span>
      <span class="w-1 bg-caramel rounded-full h-6 waveform-bar"></span>
      <span class="w-1 bg-caramel rounded-full h-8 waveform-bar"></span>
      <span class="w-1 bg-sand-dark rounded-full h-4 waveform-bar"></span>
      <span class="w-1 bg-sand-dark rounded-full h-5 waveform-bar"></span>
      <span class="w-1 bg-sand-dark rounded-full h-3 waveform-bar"></span>
      <span class="w-1 bg-sand-dark rounded-full h-2 waveform-bar"></span>
    `;
  } else {
    container.innerHTML = `
      <span class="w-1 bg-terracotta rounded-full h-3"></span>
      <span class="w-1 bg-terracotta rounded-full h-5"></span>
      <span class="w-1 bg-terracotta rounded-full h-7"></span>
      <span class="w-1 bg-caramel rounded-full h-4"></span>
      <span class="w-1 bg-caramel rounded-full h-6"></span>
      <span class="w-1 bg-caramel rounded-full h-8"></span>
      <span class="w-1 bg-sand-dark rounded-full h-4"></span>
      <span class="w-1 bg-sand-dark rounded-full h-5"></span>
      <span class="w-1 bg-sand-dark rounded-full h-3"></span>
      <span class="w-1 bg-sand-dark rounded-full h-2"></span>
    `;
  }
}

/**
 * Helper: Get medicine icon
 */
function getMedicineIcon(name) {
  const lower = name.toLowerCase();
  if (lower.includes('pressure') || lower.includes('heart') || lower.includes('amlodipine') || lower.includes('lisinopril')) return 'favorite';
  if (lower.includes('metformin') || lower.includes('diabetes') || lower.includes('sugar')) return 'restaurant';
  if (lower.includes('statin') || lower.includes('cholesterol') || lower.includes('atorvastatin')) return 'bedtime';
  if (lower.includes('vitamin') || lower.includes('d3') || lower.includes('supplement')) return 'sunny';
  return 'pill';
}

/**
 * Helper: Get medicine icon background
 */
function getMedicineIconBg(name) {
  const lower = name.toLowerCase();
  if (lower.includes('pressure') || lower.includes('heart') || lower.includes('amlodipine')) return 'bg-sand';
  if (lower.includes('metformin') || lower.includes('diabetes')) return 'bg-caramel-light border border-caramel-border';
  if (lower.includes('statin') || lower.includes('cholesterol')) return 'bg-sand';
  if (lower.includes('vitamin') || lower.includes('d3')) return 'bg-sand';
  return 'bg-sand';
}

/**
 * Helper: Format time
 */
function formatTime(timeStr) {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

/**
 * Helper: Format date
 */
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}