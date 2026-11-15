/**
 * Senior Dashboard - Elderly-Friendly Sanctuary Dashboard
 * Based on Stitch design: elderly_sanctuary_dashboard
 * Large touch targets, high contrast, voice interaction, simple navigation
 */

import { navigate } from '../router.js';
import { auth, profiles, medications, dashboard, ai, voice, notifications } from '../api.js';

/**
 * Render senior dashboard
 */
export async function renderSenior(container, params) {
  const authState = auth.getState();
  // Senior can access via profile code in URL or direct login
  let profileCode = params.profileCode;

  if (!authState.isAuthenticated && !profileCode) {
    navigate('/login');
    return;
  }

  container.innerHTML = getSeniorHTML();
  await attachSeniorListeners(profileCode);
}

/**
 * Generate senior dashboard HTML
 */
function getSeniorHTML() {
  return `
    <header class="w-full bg-warm-surface/90 backdrop-blur-md border-b border-warm-border sticky top-0 z-40" role="banner">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-terracotta-soft flex items-center justify-center text-terracotta border border-warm-border" aria-hidden="true">
            <span class="material-symbols-outlined text-[24px]">favorite</span>
          </div>
          <div>
            <span class="font-display font-bold text-2xl tracking-tight text-espresso leading-none">Ayush</span>
            <p class="text-xs text-espresso-light font-medium tracking-wide">Daily Care Companion</p>
          </div>
        </div>
        <div class="flex items-center gap-4 sm:gap-6">
          <div aria-label="Text Size Switcher" class="flex items-center bg-warm-surface-dim rounded-full p-1 border border-warm-border" role="group" aria-label="Text size">
            <button class="px-3 py-1 rounded-full text-sm font-semibold text-espresso-light hover:text-espresso transition-colors touch-target" id="fontNormalBtn" title="Standard text size" type="button" aria-pressed="true">A</button>
            <button class="px-3.5 py-1 rounded-full text-base font-bold bg-warm-surface text-terracotta shadow-sm border border-warm-border/60 transition-all touch-target" id="fontLargeBtn" title="Large accessible text" type="button" aria-pressed="false">A+</button>
          </div>
          <div class="flex items-center gap-1.5 text-sm font-medium bg-warm-surface-dim px-3 py-1.5 rounded-full border border-warm-border" role="group" aria-label="Language selection">
            <span class="material-symbols-outlined text-[18px] text-terracotta mr-0.5" aria-hidden="true">translate</span>
            <button class="font-bold text-terracotta hover:underline px-1 touch-target" type="button" data-lang="en" aria-pressed="true">English</button>
            <span class="text-warm-border" aria-hidden="true">•</span>
            <button class="text-espresso-light hover:text-espresso px-1 touch-target" type="button" data-lang="kn" aria-pressed="false">ಕನ್ನಡ</button>
            <span class="text-warm-border" aria-hidden="true">•</span>
            <button class="text-espresso-light hover:text-espresso px-1 touch-target" type="button" data-lang="hi" aria-pressed="false">हिन्दी</button>
          </div>
          <div class="flex items-center gap-2 pl-2 border-l border-warm-border">
            <img alt="Grandpa Rao" class="w-10 h-10 rounded-full object-cover border-2 border-terracotta/30 shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6UA7H4K1ONVH4raqxoWThYcIsZiAD8PsZbaY3OPntwcV27JGTyCM0JhssQd-k0Ko9B7Mdo0cZBSsHtOPcl6eA2KhK5oUeuY3r_7ZQOrdDbtrZNipx7YFHJI3N8PWad7X4hDfF0HGVOZLjJBlo7n8PC-ZkfVId7efW7xQFsocNEN6YC3HqjZEoAdV_Ve1E-Nzr2KtYkYqHCJYYFAZB5R8TmUu785MUBwjiqoSWK1M" id="senior-avatar" />
          </div>
        </div>
      </div>
    </header>

    <main class="w-full max-w-6xl mx-auto px-6 py-8 md:py-10 flex-1 flex flex-col gap-8 md:gap-10" role="main" id="senior-main">
      <!-- Greeting Section -->
      <section class="bg-warm-surface border border-warm-border rounded-3xl p-8 md:p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" aria-labelledby="greeting-title">
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 rounded-2xl bg-caramel-soft border border-warm-border flex items-center justify-center shrink-0" aria-hidden="true">
            <span class="material-symbols-outlined text-caramel text-[36px]" style="font-variation-settings: 'FILL' 1;">wb_sunny</span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs uppercase tracking-widest font-bold text-caramel" id="time-greeting">Peaceful Morning</span>
              <span class="w-1.5 h-1.5 rounded-full bg-caramel/60" aria-hidden="true"></span>
              <span class="text-xs tracking-wider font-medium text-espresso-light" id="location-status">At Home</span>
            </div>
            <h1 id="greeting-title" class="font-display text-3xl sm:text-4xl text-espresso font-bold tracking-tight">Good Morning, Grandpa</h1>
            <p class="text-base sm:text-lg text-espresso-light mt-1 flex items-center gap-2 font-normal">
              <span class="material-symbols-outlined text-[20px] text-terracotta" aria-hidden="true">calendar_month</span>
              <span id="current-date">Wednesday, October 24</span>
              <span class="text-warm-border" aria-hidden="true">•</span>
              <span id="current-weather">Warm & Pleasant, 24°C</span>
            </p>
          </div>
        </div>
        <div class="self-start md:self-auto bg-warm-surface-dim px-5 py-3 rounded-2xl border border-warm-border text-espresso flex items-center gap-3 touch-target" role="status" aria-live="polite">
          <span class="w-3 h-3 rounded-full bg-caramel animate-pulse" aria-hidden="true"></span>
          <span class="text-sm sm:text-base font-semibold" id="next-medicine-status">Breakfast time medicine is ready</span>
        </div>
      </section>

      <!-- Giant Hero Card: Current Medicine -->
      <section class="bg-warm-surface border border-warm-border rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden" aria-labelledby="medicine-title">
        <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-warm-border">
          <div class="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-terracotta-soft text-terracotta border border-warm-border touch-target">
            <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">alarm</span>
            <span class="text-base sm:text-lg font-bold" id="medicine-time">8:00 AM • Morning Dose</span>
          </div>
          <div class="text-espresso-light text-base font-medium flex items-center gap-1.5 touch-target">
            <span class="material-symbols-outlined text-[20px] text-caramel" aria-hidden="true">restaurant</span>
            <span id="medicine-instruction">Take right after breakfast</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8">
          <div class="lg:col-span-4 flex justify-center">
            <div class="w-full max-w-xs aspect-square rounded-3xl bg-warm-surface-dim border border-warm-border flex flex-col items-center justify-center p-6 text-center touch-target">
              <div class="w-28 h-28 rounded-full bg-warm-surface border border-warm-border flex items-center justify-center shadow-inner" aria-hidden="true">
                <span class="material-symbols-outlined text-[56px] text-terracotta" style="font-variation-settings: 'FILL' 1;">medication</span>
              </div>
              <div class="mt-4">
                <span class="inline-block px-4 py-1.5 rounded-full bg-warm-surface border border-warm-border text-sm font-bold text-espresso" id="medicine-dosage-display">1 Small White Tablet • 5mg</span>
                <p class="text-xs text-espresso-light mt-2" id="medicine-how-to-take">Take with warm water</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-8 flex flex-col gap-5">
            <div>
              <span class="text-sm font-bold uppercase tracking-wider text-caramel" id="medicine-condition">Heart & Blood Pressure</span>
              <h2 id="medicine-title" class="font-display text-3xl sm:text-4xl font-bold text-espresso mt-1">Amlodipine 5mg</h2>
            </div>
            <div class="p-6 rounded-2xl bg-warm-surface-dim border border-warm-border flex items-start gap-4 touch-target">
              <div class="w-12 h-12 rounded-xl bg-warm-surface border border-warm-border flex items-center justify-center text-terracotta shrink-0" aria-hidden="true">
                <span class="material-symbols-outlined text-[28px]">water_drop</span>
              </div>
              <div>
                <p class="text-lg font-bold text-espresso">Simple Instructions:</p>
                <p class="text-base sm:text-lg text-espresso-light mt-1 leading-relaxed" id="medicine-full-instructions">
                  Take <strong>1 tablet</strong> with a full glass of warm water right after finishing your morning idli or toast.
                </p>
              </div>
            </div>
            <div class="p-5 rounded-2xl bg-caramel-soft/40 border border-warm-border flex items-center gap-3 touch-target">
              <span class="material-symbols-outlined text-[24px] text-caramel shrink-0" aria-hidden="true">sentiment_satisfied</span>
              <p class="text-base text-espresso-light italic" id="doctor-note">"Grandpa, this little pill gently relaxes your blood vessels to keep your head clear and heart calm all day."</p>
            </div>
          </div>
        </div>

        <!-- Giant Tactile Action Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          <button class="h-18 py-4 px-8 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white font-bold text-lg sm:text-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer touch-target btn-senior" id="confirmBtn" type="button" aria-label="Mark medicine as taken">
            <span class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center" aria-hidden="true">
              <span class="material-symbols-outlined text-[26px]">check</span>
            </span>
            <span id="confirmLabel">Mark as Taken</span>
          </button>
          <button class="h-18 py-4 px-8 rounded-2xl bg-caramel hover:bg-caramel-dark text-white font-bold text-lg sm:text-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer touch-target btn-senior" id="audioBtn" type="button" aria-label="Play audio instructions">
            <span class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center" aria-hidden="true">
              <span class="material-symbols-outlined text-[26px]">volume_up</span>
            </span>
            <span>Play Audio Instructions</span>
          </button>
        </div>
      </section>

      <!-- Voice Check-in Bar -->
      <section class="bg-warm-surface border border-warm-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" aria-labelledby="voice-title">
        <div class="flex items-center gap-5">
          <button class="w-16 h-16 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white flex items-center justify-center shadow-sm shrink-0 transition-transform active:scale-95 touch-target btn-senior" id="micBtn" title="Tap to speak" type="button" aria-label="Tap to speak with family or confirm your medicine">
            <span class="material-symbols-outlined text-[32px]" aria-hidden="true">mic</span>
          </button>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2.5 h-2.5 rounded-full bg-caramel animate-pulse" aria-hidden="true"></span>
              <span class="text-xs uppercase tracking-wider font-bold text-terracotta">Voice Assistant</span>
            </div>
            <h3 id="voice-title" class="font-display text-xl sm:text-2xl font-bold text-espresso">Tap to speak with family or confirm your medicine</h3>
            <p class="text-sm sm:text-base text-espresso-light mt-0.5">Simply say "I took my morning pill" or "Call Priya"</p>
          </div>
        </div>
        <div class="flex items-center gap-2 self-start md:self-auto">
          <button class="px-4 py-2 rounded-full bg-warm-surface-dim hover:bg-terracotta-soft text-espresso hover:text-terracotta text-sm font-semibold border border-warm-border transition-colors touch-target" type="button" id="quick-taken" aria-label="Quick action: I took my medicine">"I took my medicine"</button>
          <button class="px-4 py-2 rounded-full bg-warm-surface-dim hover:bg-caramel-soft text-espresso hover:text-caramel text-sm font-semibold border border-warm-border transition-colors touch-target" type="button" id="quick-afternoon" aria-label="Quick action: What's for afternoon?">"What's for afternoon?"</button>
        </div>
      </section>

      <!-- 3 Bottom Cards -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6" aria-labelledby="progress-title">
        <h2 id="progress-title" class="sr-only">Daily Progress</h2>

        <!-- Card 1: Daily Progress -->
        <article class="bg-warm-surface border border-warm-border rounded-3xl p-8 flex flex-col justify-between shadow-sm" aria-labelledby="progress-card-title">
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs uppercase font-bold tracking-wider text-caramel">Today's Rhythm</span>
              <span class="px-3 py-1 rounded-full bg-caramel-soft border border-warm-border text-caramel text-xs font-bold" id="progress-count">2 of 3 Done</span>
            </div>
            <h4 id="progress-card-title" class="font-display text-xl sm:text-2xl font-bold text-espresso">Daily Health Routine</h4>
            <p class="text-sm text-espresso-light mt-1" id="progress-detail">Morning walking & hydration completed with ease.</p>
          </div>
          <div class="py-6 flex flex-col items-center justify-center">
            <div class="relative w-32 h-32 flex items-center justify-center" aria-hidden="true">
              <svg class="w-full h-full transform -rotate-90" viewbox="0 0 100 100" aria-hidden="true">
                <circle class="text-warm-surface-dim" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" stroke-width="10"></circle>
                <circle class="text-terracotta" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" stroke-dasharray="251.2" stroke-dashoffset="62.8" stroke-linecap="round" stroke-width="10" id="progress-circle"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-display font-bold text-2xl text-espresso" id="progress-percent">75%</span>
                <span class="text-[11px] text-espresso-light font-medium">Completed</span>
              </div>
            </div>
            <p class="text-xs text-espresso-light mt-3" id="next-task">Next: Afternoon dose at 2:00 PM</p>
          </div>
          <div class="bg-warm-surface-dim rounded-2xl p-3.5 border border-warm-border text-center text-sm font-medium text-espresso touch-target" id="completed-task">✓ Gentle morning walk finished</div>
        </article>

        <!-- Card 2: Upcoming Doctor Visit -->
        <article class="bg-warm-surface border border-warm-border rounded-3xl p-8 flex flex-col justify-between shadow-sm" aria-labelledby="visit-card-title">
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs uppercase font-bold tracking-wider text-terracotta">Next Visit</span>
              <span class="px-3 py-1 rounded-full bg-terracotta-soft border border-warm-border text-terracotta text-xs font-bold" id="visit-when">This Friday</span>
            </div>
            <h4 id="visit-card-title" class="font-display text-xl sm:text-2xl font-bold text-espresso" id="visit-doctor">Dr. Meera</h4>
            <p class="text-sm text-espresso-light mt-1" id="visit-specialty">Cardiologist • Regular Health Check</p>
          </div>
          <div class="my-6 p-5 rounded-2xl bg-warm-surface-dim border border-warm-border flex flex-col gap-2.5">
            <div class="flex items-center gap-3 text-espresso font-bold text-base touch-target">
              <span class="material-symbols-outlined text-[22px] text-terracotta" aria-hidden="true">event</span>
              <span id="visit-date-time">Friday at 10:30 AM</span>
            </div>
            <div class="flex items-center gap-3 text-espresso-light text-sm touch-target">
              <span class="material-symbols-outlined text-[20px] text-caramel" aria-hidden="true">location_on</span>
              <span id="visit-location">Care Health Clinic, Indiranagar</span>
            </div>
          </div>
          <div class="bg-caramel-soft border border-warm-border rounded-2xl p-4 flex items-center gap-3 touch-target">
            <span class="material-symbols-outlined text-[24px] text-caramel shrink-0" aria-hidden="true">directions_car</span>
            <p class="text-xs sm:text-sm text-espresso" id="visit-ride"><strong>Daughter Priya is driving:</strong> She will pick you up at 10:00 AM sharp.</p>
          </div>
        </article>

        <!-- Card 3: Quick Family Call -->
        <article class="bg-warm-surface border border-warm-border rounded-3xl p-8 flex flex-col justify-between shadow-sm" aria-labelledby="call-card-title">
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs uppercase font-bold tracking-wider text-terracotta">Always Here</span>
              <span class="px-3 py-1 rounded-full bg-caramel-soft border border-warm-border text-caramel text-xs font-bold" id="family-status">Available Now</span>
            </div>
            <h4 id="call-card-title" class="font-display text-xl sm:text-2xl font-bold text-espresso" id="family-name">Daughter Priya</h4>
            <p class="text-sm text-espresso-light mt-1" id="family-subtitle">One tap away whenever you need anything.</p>
          </div>
          <div class="my-6 flex items-center gap-4 bg-warm-surface-dim p-4 rounded-2xl border border-warm-border touch-target">
            <img alt="Priya Rao" class="w-14 h-14 rounded-full object-cover border-2 border-warm-border shadow-sm shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCGytj7m7R7xMpwHRcQlzM-LKPVKGf58PzFnnhWETHauM0PhR6kt1BHr3WPaH55g-E85MMhp5medQ81_j_FzmUzTPZb5PJ55HYam5vV3snd_8FZ-tL68lgOo2Pi_I6g7-pyI0dPr-WyUpkDvDOTka8wsApcNECnGh3416cMJ-WfJH6Rt0_Uxu6PexKLFai_GvUBXDueyqBQzrKYdXX8I9J082tnbRfUghhMIl4rVg" id="family-avatar" />
            <div>
              <p class="font-bold text-espresso text-base" id="family-name-display">Priya Rao</p>
              <p class="text-xs text-caramel font-semibold flex items-center gap-1.5 mt-0.5" id="family-presence">
                <span class="w-2 h-2 rounded-full bg-caramel" aria-hidden="true"></span>
                At Home • Ready to talk
              </p>
            </div>
          </div>
          <a class="h-16 rounded-2xl bg-terracotta hover:bg-terracotta-dark text-white font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-3 text-center cursor-pointer touch-target btn-senior" href="tel:5550192834" id="call-family" aria-label="Call Daughter Priya">
            <span class="material-symbols-outlined text-[26px]" aria-hidden="true">call</span>
            <span>Call Daughter Priya</span>
          </a>
        </article>
      </section>

      <!-- Soothing Reassurance Note -->
      <div class="py-4 text-center text-espresso-light text-sm flex items-center justify-center gap-2" role="status" aria-live="polite">
        <span class="material-symbols-outlined text-[20px] text-terracotta" aria-hidden="true">check_circle</span>
        <span id="reassurance-text">Everything is up to date and your family is connected.</span>
      </div>
    </main>

    <footer class="w-full bg-warm-surface border-t border-warm-border py-6 mt-6" role="contentinfo">
      <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-espresso-light">
        <div class="flex items-center gap-2">
          <span class="font-display font-bold text-espresso text-base">Ayush</span>
          <span>— Thoughtful family care companion</span>
        </div>
        <div class="flex items-center gap-6">
          <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-terracotta" aria-hidden="true">lock</span> Private & Secure</span>
          <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-caramel" aria-hidden="true">support_agent</span> Help Available</span>
        </div>
      </div>
    </footer>

    <!-- Confirmation Toast -->
    <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden" role="alert" aria-live="assertive"></div>
  `;
}

/**
 * Attach event listeners for senior dashboard
 */
async function attachSeniorListeners(profileCodeFromUrl) {
  const authState = auth.getState();
  let profileData = null;
  let medicationsData = [];
  let profileId = null;

  // Load data
  try {
    if (authState.isAuthenticated) {
      profileData = await profiles.getMe();
      const senior = profileData?.linked_profiles?.[0] || profileData?.profile;
      if (senior) {
        profileId = senior._id;
        medicationsData = await medications.list(profileId);
      }
    } else if (profileCodeFromUrl) {
      // Public profile lookup
      profileData = await profiles.getByCode(profileCodeFromUrl);
      if (profileData) {
        profileId = profileData._id;
        medicationsData = await medications.list(profileId);
      }
    }
  } catch (error) {
    console.error('Failed to load senior data:', error);
  }

  // Render senior-specific data
  renderSeniorData(profileData, medicationsData);

  // Set up font scaling
  setupFontScaling();

  // Set up language selection
  setupLanguageSelection();

  // Set up medicine interactions
  setupMedicineActions(profileId, medicationsData);

  // Set up voice features
  setupVoiceFeatures();

  // Set up quick action buttons
  setupQuickActions(profileId);

  // Update time-based greeting
  updateGreeting();
  setInterval(updateGreeting, 60000);

  // Keyboard navigation for all buttons
  document.querySelectorAll('button, [role="button"]').forEach(btn => {
    if (!btn.hasAttribute('type') && btn.tagName === 'BUTTON') btn.setAttribute('type', 'button');
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

/**
 * Render senior-specific data
 */
function renderSeniorData(profileData, medicationsData) {
  const senior = profileData?.linked_profiles?.[0] || profileData?.profile || profileData;

  if (!senior) return;

  // Name and greeting
  const name = senior.name || 'Grandpa';
  document.getElementById('greeting-title').textContent = `Good Morning, ${name}`;
  document.getElementById('family-name').textContent = name;
  document.getElementById('family-name-display').textContent = senior.caregiver_name || 'Daughter Priya';

  // Current medicine (first active medication)
  const currentMed = medicationsData.find(m => m.active !== false);
  if (currentMed) {
    document.getElementById('medicine-title').textContent = currentMed.name;
    document.getElementById('medicine-dosage-display').textContent = `${getMedicineDescription(currentMed)} • ${currentMed.dosage}`;
    document.getElementById('medicine-condition').textContent = currentMed.condition || 'Health Care';
    document.getElementById('medicine-time').textContent = `${formatTime(currentMed.times?.[0])} • ${getTimeLabel(currentMed.times?.[0])} Dose`;
    document.getElementById('medicine-instruction').textContent = currentMed.instructions || 'Take as directed';
    document.getElementById('medicine-how-to-take').textContent = currentMed.how_to_take || 'Take with water';
    document.getElementById('medicine-full-instructions').innerHTML = currentMed.full_instructions || `Take <strong>1 tablet</strong> with a full glass of warm water right after finishing your morning meal.`;
    document.getElementById('doctor-note').textContent = currentMed.doctor_note || `"${name}, this medicine helps keep you feeling well all day."`;

    // Store medication ID for actions
    document.getElementById('confirmBtn').dataset.medicationId = currentMed._id;
    document.getElementById('audioBtn').dataset.medicationId = currentMed._id;
    document.getElementById('quick-taken').dataset.medicationId = currentMed._id;
  }

  // Progress calculation
  const todayMeds = medicationsData.filter(m => m.active !== false);
  const takenCount = todayMeds.filter(m => m.last_taken_today).length;
  const totalCount = todayMeds.length;
  const progressPct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  document.getElementById('progress-count').textContent = `${takenCount} of ${totalCount} Done`;
  document.getElementById('progress-percent').textContent = `${progressPct}%`;
  const dashOffset = 251.2 - (progressPct / 100) * 251.2;
  document.getElementById('progress-circle').style.strokeDashoffset = dashOffset;

  // Next task
  const nextMed = todayMeds.find(m => !m.last_taken_today);
  if (nextMed) {
    document.getElementById('next-task').textContent = `Next: ${nextMed.name} at ${formatTime(nextMed.times?.[0])}`;
  } else {
    document.getElementById('next-task').textContent = 'All done for today! 🎉';
  }

  // Completed task
  const takenMed = todayMeds.find(m => m.last_taken_today);
  if (takenMed) {
    document.getElementById('completed-task').textContent = `✓ ${takenMed.name} taken at ${formatTime(takenMed.taken_at || takenMed.times?.[0])}`;
  }

  // Next medicine status
  if (nextMed) {
    document.getElementById('next-medicine-status').textContent = `${nextMed.name} ready at ${formatTime(nextMed.times?.[0])}`;
  } else {
    document.getElementById('next-medicine-status').textContent = 'All medicines taken for now';
  }

  // Appointment data
  if (senior.next_appointment) {
    document.getElementById('visit-doctor').textContent = senior.next_appointment.doctor || 'Dr. Meera';
    document.getElementById('visit-specialty').textContent = senior.next_appointment.specialty || 'Cardiologist • Regular Health Check';
    document.getElementById('visit-when').textContent = senior.next_appointment.when || 'This Friday';
    document.getElementById('visit-date-time').textContent = senior.next_appointment.datetime || 'Friday at 10:30 AM';
    document.getElementById('visit-location').textContent = senior.next_appointment.location || 'Care Health Clinic, Indiranagar';
    document.getElementById('visit-ride').innerHTML = senior.next_appointment.ride || '<strong>Daughter Priya is driving:</strong> She will pick you up at 10:00 AM sharp.';
  }

  // Family status
  document.getElementById('family-status').textContent = senior.caregiver_status || 'Available Now';
  document.getElementById('family-presence').innerHTML = `<span class="w-2 h-2 rounded-full bg-caramel" aria-hidden="true"></span> ${senior.caregiver_presence || 'At Home • Ready to talk'}`;
}

/**
 * Set up font scaling buttons
 */
function setupFontScaling() {
  const normalBtn = document.getElementById('fontNormalBtn');
  const largeBtn = document.getElementById('fontLargeBtn');
  const body = document.body;

  // Load saved preference
  const saved = localStorage.getItem('ayush_ui_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.fontScale === 'large') {
        body.classList.add('font-scale-large');
        normalBtn.setAttribute('aria-pressed', 'false');
        largeBtn.setAttribute('aria-pressed', 'true');
        normalBtn.classList.remove('bg-warm-surface', 'text-terracotta', 'shadow-sm', 'border', 'border-warm-border/60');
        normalBtn.classList.add('text-espresso-light');
        largeBtn.classList.add('bg-warm-surface', 'text-terracotta', 'shadow-sm', 'border', 'border-warm-border/60');
        largeBtn.classList.remove('text-espresso-light');
      }
    } catch {}
  }

  normalBtn.addEventListener('click', () => {
    body.classList.remove('font-scale-large');
    body.classList.add('font-scale-normal');
    normalBtn.setAttribute('aria-pressed', 'true');
    largeBtn.setAttribute('aria-pressed', 'false');
    normalBtn.classList.add('bg-warm-surface', 'text-terracotta', 'shadow-sm', 'border', 'border-warm-border/60');
    normalBtn.classList.remove('text-espresso-light');
    largeBtn.classList.remove('bg-warm-surface', 'text-terracotta', 'shadow-sm', 'border', 'border-warm-border/60');
    largeBtn.classList.add('text-espresso-light');
    saveUIState({ fontScale: 'normal' });
  });

  largeBtn.addEventListener('click', () => {
    body.classList.remove('font-scale-normal');
    body.classList.add('font-scale-large');
    normalBtn.setAttribute('aria-pressed', 'false');
    largeBtn.setAttribute('aria-pressed', 'true');
    normalBtn.classList.remove('bg-warm-surface', 'text-terracotta', 'shadow-sm', 'border', 'border-warm-border/60');
    normalBtn.classList.add('text-espresso-light');
    largeBtn.classList.add('bg-warm-surface', 'text-terracotta', 'shadow-sm', 'border', 'border-warm-border/60');
    largeBtn.classList.remove('text-espresso-light');
    saveUIState({ fontScale: 'large' });
  });
}

/**
 * Set up language selection
 */
function setupLanguageSelection() {
  const langButtons = document.querySelectorAll('[data-lang]');
  const body = document.body;

  // Load saved preference
  const saved = localStorage.getItem('ayush_ui_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.language) {
        setLanguage(parsed.language);
      }
    } catch {}
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);
      saveUIState({ language: lang });
    });
  });
}

/**
 * Apply language
 */
function setLanguage(lang) {
  const body = document.body;
  const langButtons = document.querySelectorAll('[data-lang]');

  body.classList.remove('lang-en', 'lang-kn', 'lang-hi');
  body.classList.add(`lang-${lang}`);

  langButtons.forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.setAttribute('aria-pressed', isActive);
    if (isActive) {
      btn.classList.add('font-bold', 'text-terracotta');
      btn.classList.remove('text-espresso-light');
    } else {
      btn.classList.remove('font-bold', 'text-terracotta');
      btn.classList.add('text-espresso-light');
    }
  });

  // Update text content based on language
  updateTextForLanguage(lang);
}

/**
 * Update text content for language
 */
function updateTextForLanguage(lang) {
  const texts = {
    en: {
      greeting: 'Good Morning',
      timeLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' },
      taken: 'Mark as Taken',
      takenDone: '✓ Taken',
      audio: 'Play Audio Instructions',
      voiceTitle: 'Tap to speak with family or confirm your medicine',
      voiceHint: 'Simply say "I took my morning pill" or "Call Priya"',
      quickTaken: '"I took my medicine"',
      quickAfternoon: '"What\'s for afternoon?"',
      rhythm: 'Today\'s Rhythm',
      routine: 'Daily Health Routine',
      completed: 'Completed',
      next: 'Next:',
      visit: 'Next Visit',
      doctor: 'Doctor',
      ride: 'Daughter Priya is driving: She will pick you up at 10:00 AM sharp.',
      alwaysHere: 'Always Here',
      family: 'Daughter Priya',
      call: 'Call Daughter Priya',
      reassurance: 'Everything is up to date and your family is connected.',
    },
    kn: {
      greeting: 'ಶುಭೋದಯ',
      timeLabels: { morning: 'ಮುಂಜಾನೆ', afternoon: 'ಮಧ್ಯಾಹ್ನ', evening: 'ಸಂಜೆ', night: 'ರಾತ್ರಿ' },
      taken: 'ಹೆಚ್ಚ eingesota',
      takenDone: '✓ ಹಾದಿಸμένο',
      audio: 'ಆಡಿಯೋ ಸೂಚನೆಗಳನ್ನು ಆಡಿಸಿ',
      voiceTitle: 'ಕುಟುಂಬದೊಂದಿಗೆ ಮಾತನಾಡಲು ಅಥವಾ�ಷಧಿ ದೃಢೀಕರಿಸಲು ಥ Católica',
      voiceHint: '"ನಾನು wykonಿ ಔಷಧಿ ತೆಗೆದದ್ದು" ಅಥವಾ "ಪ್ರಿಯ್ಯನ್ನು ಕರೆದು" ಎಂದು ಹೇಳಿ',
      quickTaken: '"ನಾನು ಔಷಧಿ ತೆಗೆದೇನೆ"',
      quickAfternoon: '"ಮಧ್ಯಾಹ್ನ ಏನು?"',
      rhythm: 'ಇಂದು ರಿದಮ್',
      routine: 'ದೈನಂದಿನ ಆರೋಗ್ಯ ಕ్రమ',
      completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
      next: 'ಮುಂದಿನ:',
      visit: 'ಮುಂದಿನ ಭೇಟಿ',
      doctor: 'ಡಾಕ್ಟರ್',
      ride: 'ಮಗಳು ಪ್ರಿಯಾ চলಿಸುತ್ತಾಳೆ: ಅವಳು 10:00 ಗಂಟೆಗೆ тебя ಎತ್ತಿಕೊಂಡುಹೋಗ Ljublжаю.',
      alwaysHere: 'ಎಲ್ಲಾದರೂ ಇдесь',
      family: 'ಮಗಳು ಪ್ರಿಯಾ',
      call: 'ಮಗಳು ಪ್ರಿಯ್ಯಕ್ಕೆ ಕರೆ ಮಾಡಿ',
      reassurance: 'ಎಲ್ಲವೂ ಅಪ್‌ಟು ಡೇಟ್ ಮತ್ತು ನಿಮ್ಮ ಕುಟುಂಬ与此 ಸಂಪರ್ಕದಲ್ಲಿದೆ.',
    },
    hi: {
      greeting: 'शुभ प्रभात',
      timeLabels: { morning: 'सुबह', afternoon: 'दोपहर', evening: 'शाम', night: 'रात' },
      taken: 'दवा ली',
      takenDone: '✓ ली गई',
      audio: 'ऑडियो निर्देश चलाएं',
      voiceTitle: 'परिवार से बात करने या दवा की पुष्टि करने के लिए टैप करें',
      voiceHint: '"मैंने सुबह की दवा ली" या "प्रिया को कॉल करो" कहें',
      quickTaken: '"मैंने दवा ले ली"',
      quickAfternoon: '"दोपहर के लिए क्या है?"',
      rhythm: 'आज की लय',
      routine: 'दैनिक स्वास्थ्य दिनचर्या',
      completed: 'पूर्ण',
      next: 'अगला:',
      visit: 'अगली मुलाकात',
      doctor: 'डॉक्टर',
      ride: 'बेटी प्रिया गाड़ी चला रही है: वह आपको 10:00 बजे लेने आएगी।',
      alwaysHere: 'हमेशा यहाँ',
      family: 'बेटी प्रिया',
      call: 'बेटी प्रिया को कॉल करें',
      reassurance: 'सब कुछ अप टू डेट है और आपका परिवार जुड़ा हुआ है।',
    },
  };

  const t = texts[lang] || texts.en;

  // Update elements
  const greetingEl = document.getElementById('greeting-title');
  if (greetingEl) {
    const name = greetingEl.textContent.replace('Good Morning, ', '').replace('शुभ प्रभात, ', '').replace('शुभ प्रभात, ', '');
    greetingEl.textContent = `${t.greeting}, ${name}`;
  }

  const confirmLabel = document.getElementById('confirmLabel');
  if (confirmLabel) confirmLabel.textContent = t.taken;

  const audioBtn = document.getElementById('audioBtn');
  if (audioBtn) {
    const span = audioBtn.querySelector('span:last-child');
    if (span) span.textContent = t.audio;
  }

  const voiceTitle = document.getElementById('voice-title');
  if (voiceTitle) voiceTitle.textContent = t.voiceTitle;

  const voiceHint = document.querySelector('#voice-title + p');
  if (voiceHint) voiceHint.textContent = t.voiceHint;

  const quickTaken = document.getElementById('quick-taken');
  if (quickTaken) quickTaken.textContent = t.quickTaken;

  const quickAfternoon = document.getElementById('quick-afternoon');
  if (quickAfternoon) quickAfternoon.textContent = t.quickAfternoon;

  // Time label
  const hour = new Date().getHours();
  let timeLabel = t.timeLabels.morning;
  if (hour >= 12 && hour < 17) timeLabel = t.timeLabels.afternoon;
  else if (hour >= 17 && hour < 21) timeLabel = t.timeLabels.evening;
  else if (hour >= 21 || hour < 5) timeLabel = t.timeLabels.night;

  const rhythmEl = document.querySelector('.text-caramel');
  if (rhythmEl) rhythmEl.textContent = t.rhythm;

  const routineEl = document.querySelector('.font-display.text-xl');
  if (routineEl) routineEl.textContent = t.routine;

  const completedEl = document.querySelector('#progress-circle + div span:last-child');
  if (completedEl) completedEl.textContent = t.completed;

  const nextTask = document.getElementById('next-task');
  if (nextTask) nextTask.textContent = `${t.next} Afternoon dose at 2:00 PM`;

  const visitLabel = document.querySelector('.text-terracotta.uppercase');
  if (visitLabel) visitLabel.textContent = t.visit;

  const visitCardTitle = document.getElementById('visit-card-title');
  if (visitCardTitle) visitCardTitle.textContent = t.doctor;

  const visitRide = document.querySelector('#visit-ride');
  if (visitRide) visitRide.innerHTML = t.ride;

  const alwaysHere = document.querySelector('.text-terracotta.uppercase + .font-bold');
  if (alwaysHere) alwaysHere.textContent = t.alwaysHere;

  const callCardTitle = document.getElementById('call-card-title');
  if (callCardTitle) callCardTitle.textContent = t.family;

  const callFamily = document.getElementById('call-family');
  if (callFamily) {
    const span = callFamily.querySelector('span:last-child');
    if (span) span.textContent = t.call;
  }

  const reassurance = document.getElementById('reassurance-text');
  if (reassurance) reassurance.textContent = t.reassurance;
}

/**
 * Save UI state to localStorage
 */
function saveUIState(updates) {
  const saved = localStorage.getItem('ayush_ui_state');
  let state = { fontScale: 'normal', language: 'en', highContrast: false };
  if (saved) {
    try { state = JSON.parse(saved); } catch {}
  }
  state = { ...state, ...updates };
  localStorage.setItem('ayush_ui_state', JSON.stringify(state));
}

/**
 * Set up medicine action buttons
 */
function setupMedicineActions(profileId, medicationsData) {
  const confirmBtn = document.getElementById('confirmBtn');
  const confirmLabel = document.getElementById('confirmLabel');
  let taken = false;

  // Check if already taken
  const currentMed = medicationsData.find(m => m.active !== false);
  if (currentMed?.last_taken_today) {
    taken = true;
    confirmBtn.classList.remove('bg-terracotta', 'hover:bg-terracotta-dark');
    confirmBtn.classList.add('bg-caramel', 'hover:bg-caramel-dark');
    confirmLabel.textContent = '✓ Taken with Breakfast';
  }

  confirmBtn.addEventListener('click', async () => {
    const medId = confirmBtn.dataset.medicationId;
    if (!medId) return;

    taken = !taken;
    if (taken) {
      confirmBtn.classList.remove('bg-terracotta', 'hover:bg-terracotta-dark');
      confirmBtn.classList.add('bg-caramel', 'hover:bg-caramel-dark');
      confirmLabel.textContent = '✓ Taken with Breakfast';

      // Call API
      if (profileId) {
        try {
          await medications.take(medId);
          showToast('Medicine marked as taken! 💊');
          // Refresh progress
          refreshProgress(profileId);
        } catch (error) {
          showToast('Failed to mark as taken');
          taken = false;
          confirmBtn.classList.remove('bg-caramel', 'hover:bg-caramel-dark');
          confirmBtn.classList.add('bg-terracotta', 'hover:bg-terracotta-dark');
          confirmLabel.textContent = 'Mark as Taken';
        }
      }
    } else {
      confirmBtn.classList.remove('bg-caramel', 'hover:bg-caramel-dark');
      confirmBtn.classList.add('bg-terracotta', 'hover:bg-terracotta-dark');
      confirmLabel.textContent = 'Mark as Taken';
    }
  });

  // Audio button
  const audioBtn = document.getElementById('audioBtn');
  audioBtn.addEventListener('click', async () => {
    const medId = audioBtn.dataset.medicationId;
    const med = medicationsData.find(m => m._id === medId);

    try {
      const text = med?.full_instructions || `Please take your ${med?.name} ${med?.dosage} with a glass of warm water right after your meal.`;
      const audioUrl = await voice.createAudioUrl(text, getCurrentLanguage());
      const audio = new Audio(audioUrl);
      audio.play();
      showToast('Playing instructions... 🔊');
    } catch (error) {
      showToast('Failed to play audio');
    }
  });
}

/**
 * Set up voice features
 */
function setupVoiceFeatures() {
  const micBtn = document.getElementById('micBtn');

  micBtn.addEventListener('click', async () => {
    // Visual feedback
    micBtn.classList.add('bg-terracotta-dark');
    micBtn.innerHTML = '<span class="material-symbols-outlined text-[32px]" aria-hidden="true">mic_off</span>';

    // In a real app, this would use Web Speech API
    // For demo, simulate voice recognition
    setTimeout(() => {
      micBtn.classList.remove('bg-terracotta-dark');
      micBtn.innerHTML = '<span class="material-symbols-outlined text-[32px]" aria-hidden="true">mic</span>';
      showToast('🎙️ Listening... "I took my morning pill" recognized');
      // Simulate voice check-in API call
      handleVoiceCheckin('I took my morning pill');
    }, 1500);
  });
}

/**
 * Handle voice check-in
 */
async function handleVoiceCheckin(text) {
  try {
    const profileData = await profiles.getMe();
    const senior = profileData?.linked_profiles?.[0];
    if (!senior) return;

    const result = await ai.voiceCheckin(senior._id, text);
    if (result?.dose_marked_taken) {
      showToast('✓ Medicine confirmed via voice!');
      refreshProgress(senior._id);
    }
    if (result?.symptom_flagged) {
      showToast('⚠ Symptom noted: ' + (result.summary || 'Feeling unwell'));
    }
  } catch (error) {
    console.error('Voice check-in failed:', error);
  }
}

/**
 * Set up quick action buttons
 */
function setupQuickActions(profileId) {
  document.getElementById('quick-taken')?.addEventListener('click', async () => {
    const medId = document.getElementById('quick-taken').dataset.medicationId;
    if (medId && profileId) {
      try {
        await medications.take(medId);
        showToast('Medicine marked as taken! 💊');
        refreshProgress(profileId);
        // Update confirm button
        const confirmBtn = document.getElementById('confirmBtn');
        const confirmLabel = document.getElementById('confirmLabel');
        confirmBtn.classList.remove('bg-terracotta', 'hover:bg-terracotta-dark');
        confirmBtn.classList.add('bg-caramel', 'hover:bg-caramel-dark');
        confirmLabel.textContent = '✓ Taken with Breakfast';
      } catch (error) {
        showToast('Failed to mark as taken');
      }
    }
  });

  document.getElementById('quick-afternoon')?.addEventListener('click', () => {
    showToast('Afternoon: Metformin 500mg at 1:00 PM with lunch 🍽️');
  });
}

/**
 * Refresh progress display
 */
async function refreshProgress(profileId) {
  try {
    const medsData = await medications.list(profileId);
    const todayMeds = medsData.filter(m => m.active !== false);
    const takenCount = todayMeds.filter(m => m.last_taken_today).length;
    const totalCount = todayMeds.length;
    const progressPct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

    document.getElementById('progress-count').textContent = `${takenCount} of ${totalCount} Done`;
    document.getElementById('progress-percent').textContent = `${progressPct}%`;
    const dashOffset = 251.2 - (progressPct / 100) * 251.2;
    document.getElementById('progress-circle').style.strokeDashoffset = dashOffset;

    const nextMed = todayMeds.find(m => !m.last_taken_today);
    if (nextMed) {
      document.getElementById('next-task').textContent = `Next: ${nextMed.name} at ${formatTime(nextMed.times?.[0])}`;
      document.getElementById('next-medicine-status').textContent = `${nextMed.name} ready at ${formatTime(nextMed.times?.[0])}`;
    } else {
      document.getElementById('next-task').textContent = 'All done for today! 🎉';
      document.getElementById('next-medicine-status').textContent = 'All medicines taken for now';
    }

    const takenMed = todayMeds.find(m => m.last_taken_today);
    if (takenMed) {
      document.getElementById('completed-task').textContent = `✓ ${takenMed.name} taken at ${formatTime(takenMed.taken_at || takenMed.times?.[0])}`;
    }
  } catch (error) {
    console.error('Failed to refresh progress:', error);
  }
}

/**
 * Show toast notification
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-espresso text-warm-cream px-6 py-3 rounded-2xl shadow-lg font-body text-body-md touch-target';
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

/**
 * Update time-based greeting
 */
function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Peaceful Morning';
  let timeLabel = 'Morning';

  if (hour >= 12 && hour < 17) {
    greeting = 'Peaceful Afternoon';
    timeLabel = 'Afternoon';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Peaceful Evening';
    timeLabel = 'Evening';
  } else if (hour >= 21 || hour < 5) {
    greeting = 'Peaceful Night';
    timeLabel = 'Night';
  }

  document.getElementById('time-greeting').textContent = greeting;
  document.getElementById('medicine-time').textContent = `${formatTimeForDisplay()} • ${timeLabel} Dose`;

  // Update date
  const today = new Date();
  document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}

/**
 * Get current time for display
 */
function formatTimeForDisplay() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Get current language
 */
function getCurrentLanguage() {
  const saved = localStorage.getItem('ayush_ui_state');
  if (saved) {
    try { return JSON.parse(saved).language || 'en'; } catch {}
  }
  return 'en';
}

/**
 * Helper: Get medicine description
 */
function getMedicineDescription(med) {
  const name = med.name.toLowerCase();
  if (name.includes('amlodipine')) return '1 Small White Tablet';
  if (name.includes('metformin')) return '1 White Round Tablet';
  if (name.includes('atorvastatin')) return '1 Small White Tablet';
  if (name.includes('vitamin')) return '1 Softgel Capsule';
  return '1 Tablet';
}

/**
 * Helper: Get time label
 */
function getTimeLabel(timeStr) {
  if (!timeStr) return 'Morning';
  const hour = parseInt(timeStr.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 21) return 'Evening';
  return 'Night';
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