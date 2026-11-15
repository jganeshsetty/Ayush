/**
 * Landing Page - Ayush Marketing Page
 * Based on Stitch design: ayush_peaceful_care_medication_landing
 */

import { navigate } from '../router.js';
import { auth } from '../api.js';

/**
 * Render landing page
 */
export async function renderLanding(container) {
  container.innerHTML = getLandingHTML();
  attachLandingListeners();
}

/**
 * Generate landing page HTML
 */
function getLandingHTML() {
  return `
    <header class="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(36,27,24,0.04)]" role="banner">
      <div class="h-20 max-w-[1200px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin flex items-center justify-between gap-space-md">
        <div class="flex flex-col">
          <a class="flex flex-col group" href="#" data-path="home" aria-label="Ayush Home">
            <span class="font-headline text-headline-sm text-primary tracking-tight">Ayush</span>
            <span class="font-label text-label-sm text-secondary font-medium -mt-1">Gentle Care for Seniors</span>
          </a>
        </div>
        <nav class="hidden lg:flex items-center gap-space-lg" aria-label="Main navigation" data-active-classes="text-primary font-bold border-b-2 border-primary pb-1">
          <a aria-current="page" class="transition-colors py-1 text-primary font-bold border-b-2 border-primary pb-1" data-path="home" href="#">Home</a>
          <a class="font-label text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-1" data-path="senior-care" href="#">Senior Care</a>
          <a class="font-label text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-1" data-path="family-circle" href="#">Family Circle</a>
          <a class="font-label text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-1" data-path="how-it-works" href="#">How It Works</a>
        </nav>
        <div class="flex items-center gap-space-md">
          <div class="hidden sm:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded-full text-on-surface-variant font-label text-label-sm" role="group" aria-label="Text size">
            <span class="font-medium text-on-surface">Text:</span>
            <button class="hover:text-primary transition-colors font-semibold" type="button" data-font-scale="normal" aria-label="Normal text size">Normal</button>
            <span class="opacity-40" aria-hidden="true">/</span>
            <button class="hover:text-primary transition-colors" type="button" data-font-scale="large" aria-label="Large text size">Large</button>
          </div>
          <a class="h-12 px-space-lg bg-primary hover:bg-tertiary-container text-on-primary font-label text-label-md rounded-lg flex items-center justify-center transition-colors shadow-[0_2px_8px_rgba(111,51,26,0.18)] touch-target" data-path="sign-in" href="#" aria-label="Sign in to Ayush">
            Sign In
          </a>
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center" aria-hidden="true">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>

    <main class="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]" role="main">
      <div class="flex flex-col w-full">
        <!-- Atmospheric Warm Ambient Glows -->
        <div class="relative w-full overflow-hidden bg-surface">
          <div class="absolute -top-40 right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none" aria-hidden="true"></div>
          <div class="absolute top-[35%] left-[-15%] w-[550px] h-[550px] rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none" aria-hidden="true"></div>
          <div class="absolute bottom-10 right-[-5%] w-[450px] h-[450px] rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" aria-hidden="true"></div>

          <!-- HERO SECTION -->
          <section class="relative z-10 max-w-[1200px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin pt-12 md:pt-20 pb-16 md:pb-24" aria-labelledby="hero-title">
            <div class="flex flex-col items-center text-center max-w-4xl mx-auto">
              <!-- Quiet reassurance badge -->
              <div class="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-high text-primary mb-space-lg shadow-sm" role="status" aria-live="polite">
                <span class="w-2.5 h-2.5 rounded-full bg-secondary-container shrink-0" aria-hidden="true"></span>
                <span class="font-label text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Gentle Daily Care Companion</span>
              </div>
              <h1 id="hero-title" class="font-display text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight mb-space-md max-w-3xl">
                Medicine made simple. Peace of mind for the whole family.
              </h1>
              <p class="font-body text-body-lg md:text-body-xl text-on-surface-variant max-w-2xl mb-space-xl leading-relaxed">
                Seniors receive large, friendly reminders that feel just like a handwritten note. Families stay warmly connected throughout the day—without worry or daily stress.
              </p>
              <!-- CTAs -->
              <div class="flex flex-col sm:flex-row items-center justify-center gap-space-md w-full sm:w-auto">
                <a class="w-full sm:w-auto h-14 px-8 bg-primary hover:bg-tertiary-container text-on-primary font-label text-label-lg rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(111,51,26,0.18)] transition-all hover:scale-[1.01] active:scale-[0.99] touch-target" data-path="senior-care" href="#" aria-label="Try the senior-friendly dashboard view">
                  <span>Try Senior View</span>
                  <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                </a>
                <a class="w-full sm:w-auto h-14 px-8 bg-surface-container-low hover:bg-surface-container text-on-surface font-label text-label-lg rounded-xl flex items-center justify-center transition-all hover:scale-[1.01] touch-target" data-path="family-circle" href="#" aria-label="View family caretaker dashboard">
                  <span>Family Overview</span>
                </a>
              </div>
              <!-- Trust Note -->
              <div class="mt-space-lg flex items-center gap-6 text-on-surface-variant font-label text-label-sm" role="list" aria-label="Trust indicators">
                <span class="flex items-center gap-1.5" role="listitem">
                  <span class="material-symbols-outlined text-secondary text-[18px]" aria-hidden="true">verified</span>
                  No confusing tech
                </span>
                <span class="w-1 h-1 rounded-full bg-outline-variant" aria-hidden="true"></span>
                <span class="flex items-center gap-1.5" role="listitem">
                  <span class="material-symbols-outlined text-secondary text-[18px]" aria-hidden="true">volume_up</span>
                  Spoken voice guidance
                </span>
                <span class="w-1 h-1 rounded-full bg-outline-variant" aria-hidden="true"></span>
                <span class="flex items-center gap-1.5" role="listitem">
                  <span class="material-symbols-outlined text-secondary text-[18px]" aria-hidden="true">favorite</span>
                  Family connected
                </span>
              </div>
            </div>

            <!-- VISUAL SHOWCASE CARD: Senior Morning Pill Routine -->
            <div class="mt-14 md:mt-20 max-w-4xl mx-auto">
              <div class="bg-surface-container-lowest rounded-2xl p-6 sm:p-10 md:p-12 shadow-[0_16px_40px_-8px_rgba(36,27,24,0.08)] relative overflow-hidden" role="region" aria-label="Morning medicine routine example">
                <!-- Card Decorative Top Bar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 gap-4 bg-surface-container-low p-6 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-primary font-headline">
                      <span class="material-symbols-outlined text-[26px]" aria-hidden="true">wb_sunny</span>
                    </div>
                    <div>
                      <span class="font-label text-label-sm text-secondary uppercase font-semibold">Morning Routine</span>
                      <h3 class="font-headline text-headline-sm text-on-surface">Good Morning, Eleanor</h3>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg self-start sm:self-auto">
                    <span class="material-symbols-outlined text-secondary-container text-[20px]" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">schedule</span>
                    <span class="font-label text-label-md text-on-surface font-semibold">8:00 AM Today</span>
                  </div>
                </div>

                <!-- The Medicine Presentation -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <!-- Pill visual photography -->
                  <div class="md:col-span-5 relative group">
                    <div class="relative w-full h-64 md:h-72 rounded-xl overflow-hidden bg-surface-container-high shadow-inner">
                      <img class="w-full h-full object-cover" alt="A warm, sunlit ceramic dish holding two morning medicine tablets beside a comforting glass of fresh water on a rustic honey-colored wood breakfast table. Morning golden daylight, soft linen napkin, peaceful domestic morning setting, zero clinical clutter, gentle warm tones and cozy feeling." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYXfUuv27k9vON34LGRKvS23pOjx17T-C7gfjqgpUVzLw0AlZ1UgbOZC0hEteSfbl6iRcp2o3YwVAudF8mpHzYG8nD14Woo39JmkwOnhV_CFJ6Tx8LFeoQI0L7nAi5BSSHiE08VN1nWVuzNqBwcpoe6db-jOpu06YB1PZalmYyxN63z76NV2xiRMIrc6SmuMdWrtj8xplI-3r5UR7BHLU0AS772I6y74L3G2v9lGE"/>
                      <div class="absolute bottom-3 left-3 bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                        <span class="w-2.5 h-2.5 rounded-full bg-secondary-container" aria-hidden="true"></span>
                        <span class="font-label text-label-sm text-on-surface font-medium">Take with a glass of water</span>
                      </div>
                    </div>
                  </div>

                  <!-- Routine Details & Big Buttons -->
                  <div class="md:col-span-7 flex flex-col justify-between h-full">
                    <div>
                      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary-fixed/50 text-on-secondary-container mb-3 font-label text-label-sm">
                        <span>Step 1 of 2</span>
                      </div>
                      <h2 class="font-headline text-headline-md text-on-surface mb-2">
                        Blood Pressure & Heart Care
                      </h2>
                      <p class="font-body text-body-lg text-on-surface-variant mb-6">
                        Two small round tablets. Best taken right after your morning warm oatmeal or toast.
                      </p>
                      <!-- Voice Playback Button for Seniors -->
                      <div class="p-3.5 bg-surface-container-low rounded-xl flex items-center justify-between mb-8">
                        <div class="flex items-center gap-3">
                          <button aria-label="Listen to spoken instructions for morning medicine" class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm hover:bg-tertiary-container transition-colors touch-target" type="button" id="demo-voice-btn">
                            <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;" aria-hidden="true">volume_up</span>
                          </button>
                          <div>
                            <p class="font-label text-label-md text-on-surface font-semibold">Listen to Voice Note</p>
                            <p class="font-label text-label-sm text-on-surface-variant">Daughter Sarah recorded a reminder</p>
                          </div>
                        </div>
                        <span class="font-label text-label-sm text-secondary font-medium px-2 py-1 bg-surface-container-lowest rounded">0:14</span>
                      </div>
                    </div>
                    <!-- Main Senior Confirmation Action -->
                    <div class="flex flex-col sm:flex-row gap-3">
                      <button class="flex-1 h-16 bg-primary hover:bg-tertiary-container text-on-primary rounded-xl font-label text-label-lg flex items-center justify-center gap-3 shadow-[0_4px_16px_rgba(111,51,26,0.2)] transition-all touch-target" type="button" id="demo-taken-btn" aria-label="Mark morning medicine as taken">
                        <span class="material-symbols-outlined text-[24px]" aria-hidden="true">check_circle</span>
                        <span>I Took My Morning Medicine</span>
                      </button>
                      <button class="h-16 px-6 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-label text-label-md flex items-center justify-center gap-2 transition-colors touch-target" type="button" id="demo-call-btn" aria-label="Call daughter Sarah">
                        <span class="material-symbols-outlined text-secondary text-[22px]" aria-hidden="true">phone_in_talk</span>
                        <span class="hidden sm:inline">Call Sarah</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Bottom subtle note -->
                <div class="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-on-surface-variant font-label text-label-sm bg-surface-container-low/60 p-4 rounded-xl">
                  <span class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary-container text-[18px]" aria-hidden="true">favorite</span>
                    Sarah and David will receive a quiet notification as soon as you confirm.
                  </span>
                  <span class="text-secondary font-semibold mt-2 sm:mt-0">Everything on track today • 100% serene</span>
                </div>
              </div>
            </div>
          </section>

          <!-- SECTION: 3 AIRY VALUE COLUMNS -->
          <section class="max-w-[1200px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin py-16 md:py-24" aria-labelledby="values-title">
            <div class="text-center max-w-2xl mx-auto mb-16">
              <span class="font-label text-label-sm uppercase tracking-wider text-secondary font-bold">Thoughtful Simplicity</span>
              <h2 id="values-title" class="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface mt-2 mb-4">
                Designed for quiet clarity, not complicated screens.
              </h2>
              <p class="font-body text-body-lg text-on-surface-variant">
                Every screen removes doubt and hesitation. Seniors feel independent, and loved ones rest easy.
              </p>
            </div>
            <!-- 3 Columns with generous gap -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-10" role="list">
              <!-- Column 1 -->
              <article class="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(36,27,24,0.04)] hover:shadow-[0_8px_32px_rgba(36,27,24,0.07)] transition-all" role="listitem">
                <div>
                  <div class="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary mb-6 shadow-sm" aria-hidden="true">
                    <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">alarm_on</span>
                  </div>
                  <h3 class="font-headline text-headline-sm text-on-surface mb-3">
                    Gentle, Large Reminders
                  </h3>
                  <p class="font-body text-body-md text-on-surface-variant leading-relaxed mb-6">
                    Big text, soothing chimes, and clear color tablet photos so seniors never guess or squint. Reminders appear gently when it is time, without frantic alarms.
                  </p>
                </div>
                <div class="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
                  <span class="material-symbols-outlined text-secondary text-[22px]" aria-hidden="true">text_fields</span>
                  <span class="font-label text-label-sm text-on-surface font-medium">Extra large readable typography</span>
                </div>
              </article>
              <!-- Column 2 -->
              <article class="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(36,27,24,0.04)] hover:shadow-[0_8px_32px_rgba(36,27,24,0.07)] transition-all" role="listitem">
                <div>
                  <div class="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary mb-6 shadow-sm" aria-hidden="true">
                    <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">family_restroom</span>
                  </div>
                  <h3 class="font-headline text-headline-sm text-on-surface mb-3">
                    Always in the Family Loop
                  </h3>
                  <p class="font-body text-body-md text-on-surface-variant leading-relaxed mb-6">
                    Instant gentle notifications when parents take their morning medicine. Family members can leave loving notes and see daily routines quietly unfold.
                  </p>
                </div>
                <div class="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
                  <span class="material-symbols-outlined text-secondary text-[22px]" aria-hidden="true">mark_email_read</span>
                  <span class="font-label text-label-sm text-on-surface font-medium">Reassuring family status updates</span>
                </div>
              </article>
              <!-- Column 3 -->
              <article class="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(36,27,24,0.04)] hover:shadow-[0_8px_32px_rgba(36,27,24,0.07)] transition-all" role="listitem">
                <div>
                  <div class="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary mb-6 shadow-sm" aria-hidden="true">
                    <span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">medical_information</span>
                  </div>
                  <h3 class="font-headline text-headline-sm text-on-surface mb-3">
                    Doctor & Prescription Peace
                  </h3>
                  <p class="font-body text-body-md text-on-surface-variant leading-relaxed mb-6">
                    Keep physician contact notes, upcoming visit times, and pharmacy refill numbers organized in one warm, uncomplicated corner.
                  </p>
                </div>
                <div class="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
                  <span class="material-symbols-outlined text-secondary text-[22px]" aria-hidden="true">calendar_month</span>
                  <span class="font-label text-label-sm text-on-surface font-medium">One-touch doctor contact list</span>
                </div>
              </article>
            </div>
          </section>

          <!-- SECTION: BUILT WITH LOVE FOR ELDERS (FEATURE SPOTLIGHT) -->
          <section class="max-w-[1200px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin py-16 md:py-24" aria-labelledby="spotlight-title">
            <div class="bg-surface-container-low rounded-3xl p-8 md:p-16 shadow-[0_8px_32px_rgba(36,27,24,0.04)]">
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <!-- Left Spotlight Content -->
                <div class="lg:col-span-6">
                  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary-fixed/50 text-secondary font-label text-label-sm font-semibold mb-4">
                    <span class="material-symbols-outlined text-[16px]" aria-hidden="true">volunteer_activism</span>
                    <span>Human-Centered Care</span>
                  </div>
                  <h2 id="spotlight-title" class="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface mb-6">
                    Built with love for elders. Crafted with care for dignity.
                  </h2>
                  <p class="font-body text-body-lg text-on-surface-variant mb-8 leading-relaxed">
                    We asked grandparents, aging parents, and home caregivers what made modern apps painful. We removed tiny buttons, hidden menus, confusing icons, and sterile blue screens—leaving only warmth, clarity, and comfort.
                  </p>
                  <!-- 4 Essential Warm Pillars -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
                    <article class="bg-surface-container-lowest p-5 rounded-xl shadow-sm" role="listitem">
                      <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-3" aria-hidden="true">
                        <span class="material-symbols-outlined text-[22px]">contrast</span>
                      </div>
                      <h4 class="font-label text-label-md text-on-surface font-semibold mb-1">High Contrast</h4>
                      <p class="font-body text-body-md text-on-surface-variant">Deep espresso text against warm milk backgrounds for effortless sight.</p>
                    </article>
                    <article class="bg-surface-container-lowest p-5 rounded-xl shadow-sm" role="listitem">
                      <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-3" aria-hidden="true">
                        <span class="material-symbols-outlined text-[22px]">touch_app</span>
                      </div>
                      <h4 class="font-label text-label-md text-on-surface font-semibold mb-1">Large Touch Targets</h4>
                      <p class="font-body text-body-md text-on-surface-variant">All buttons are at least 56 pixels tall, forgiving to unsteady hands.</p>
                    </article>
                    <article class="bg-surface-container-lowest p-5 rounded-xl shadow-sm" role="listitem">
                      <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-3" aria-hidden="true">
                        <span class="material-symbols-outlined text-[22px]">record_voice_over</span>
                      </div>
                      <h4 class="font-label text-label-md text-on-surface font-semibold mb-1">Audio Voice Guidance</h4>
                      <p class="font-body text-body-md text-on-surface-variant">Listen to spoken directions and family messages anytime with one press.</p>
                    </article>
                    <article class="bg-surface-container-lowest p-5 rounded-xl shadow-sm" role="listitem">
                      <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-3" aria-hidden="true">
                        <span class="material-symbols-outlined text-[22px]">call</span>
                      </div>
                      <h4 class="font-label text-label-md text-on-surface font-semibold mb-1">Direct Family Dial</h4>
                      <p class="font-body text-body-md text-on-surface-variant">One touch to call children, grandchildren, or the primary physician.</p>
                    </article>
                  </div>
                </div>
                <!-- Right Spotlight Visual Narrative -->
                <div class="lg:col-span-6 flex flex-col gap-6">
                  <div class="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden shadow-[0_12px_28px_rgba(36,27,24,0.06)]">
                    <img class="w-full h-full object-cover" alt="An elderly grandmother with a gentle warm smile sitting comfortably in a sunlit cozy armchair reading a clean tablet display with large legible text. Beside her on an oak end-table is a warm cup of herbal tea and a small ceramic pill organizer. Soft morning sunlight filtering through sheer linen curtains, warm terracotta and honey tones, pure peace and tranquility." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRLWD07JZhwVaGWhKoUhNADtmY9sPqwd8SNVDB5JrGovj05jqblD7lh-235czH7Mjj8qnuSoch1fIsl1F4vp5WbALbVmUQntFiO1r0HjXz1Y6CwI5hqRpSkPQccWw2DvEsrRkoVVYOORUeIwgZJbLKperhIzJzBazDGgpE0H0bEBJjuG3N8XWkiQvgx9QvBFlE6uLNUVjp1v9EgQ1lY0hPvPaBEBHFTuFAcTjvHbQ"/>
                    <!-- Floating Family Reassurance Bubble -->
                    <div class="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/95 backdrop-blur-md p-4 rounded-xl shadow-md flex items-center gap-4" role="status" aria-live="polite">
                      <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0" aria-hidden="true">
                        <span class="material-symbols-outlined text-[24px]">favorite</span>
                      </div>
                      <div>
                        <p class="font-label text-label-md text-on-surface font-semibold">"Mom confirmed her 8:00 AM vitamins."</p>
                        <p class="font-label text-label-sm text-on-surface-variant">Sent automatically to daughter Sarah and son Michael</p>
                      </div>
                    </div>
                  </div>
                  <!-- Ambient Quote Card -->
                  <div class="p-6 bg-surface-container-lowest rounded-2xl shadow-sm">
                    <p class="font-headline text-headline-sm text-on-surface italic mb-2">
                      "Ayush removed the tension between me and my daughter. She stops calling to check on my pills and now calls just to chat."
                    </p>
                    <span class="font-label text-label-sm text-secondary font-semibold">Eleanor H., 78 • Oregon</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- SECTION: WARM CALL TO ACTION BANNER -->
          <section class="max-w-[1200px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin pb-20 md:pb-32" aria-labelledby="cta-title">
            <div class="bg-primary text-on-primary rounded-3xl p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-[0_16px_40px_rgba(111,51,26,0.22)]">
              <!-- Ambient Warm Shape inside CTA -->
              <div class="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-tertiary-container/40 blur-2xl pointer-events-none" aria-hidden="true"></div>
              <div class="absolute top-0 right-1/3 w-64 h-64 rounded-full bg-secondary/20 blur-xl pointer-events-none" aria-hidden="true"></div>
              <div class="relative z-10 max-w-2xl">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-on-primary/10 text-primary-fixed mb-6 font-label text-label-sm" aria-hidden="true">
                  <span class="material-symbols-outlined text-[18px]">wb_twilight</span>
                  <span>Serenity Every Day</span>
                </div>
                <h2 id="cta-title" class="font-headline text-headline-lg-mobile md:text-headline-lg text-on-primary mb-4 leading-tight">
                  Bring calm to your family's daily care routine.
                </h2>
                <p class="font-body text-body-lg md:text-body-xl text-primary-fixed mb-8 leading-relaxed">
                  Begin today with a gentle, dignified routine for your parents. No long setup, no complex technology, and no anxious phone calls.
                </p>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a class="h-16 px-8 bg-surface-container-lowest hover:bg-surface text-primary font-label text-label-lg rounded-xl flex items-center justify-center gap-3 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] touch-target" data-path="sign-in" href="#" aria-label="Get started with Ayush free trial">
                    <span>Get Started with Ayush</span>
                    <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                  </a>
                  <span class="text-primary-fixed font-label text-label-sm text-center sm:text-left sm:pl-2">
                    Simple 2-minute setup • Free trial for families
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <footer class="w-full bg-surface-container-low text-on-surface py-space-xl" role="contentinfo">
      <div class="max-w-[1200px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin flex flex-col gap-space-lg">
        <div class="p-space-lg bg-surface-bright rounded-xl shadow-[0_1px_8px_rgba(36,27,24,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div class="flex items-start gap-space-sm">
            <div class="w-3 h-3 rounded-full bg-secondary-container mt-1.5 shrink-0" aria-hidden="true"></div>
            <div>
              <h4 class="font-headline text-headline-sm text-on-surface">Family Care Reassurance</h4>
              <p class="font-body text-body-md text-on-surface-variant mt-1">Need immediate family or care coordinator support? Call your family network line anytime at <span class="font-label text-label-md text-primary font-semibold">1-800-VITAL-CARE</span>.</p>
            </div>
          </div>
          <a class="px-space-md py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-label text-label-md rounded-lg transition-colors shrink-0 touch-target" data-path="family-circle" href="#">Family Circle Portal</a>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-between gap-space-md text-center md:text-left pt-space-xs">
          <div class="flex flex-col gap-1">
            <span class="font-headline text-headline-sm text-primary">Ayush</span>
            <p class="font-body text-body-md text-on-surface-variant max-w-md">Dedicated to serene medication routines, dignified independence, and thoughtful tranquility for seniors and the families who love them.</p>
          </div>
          <nav class="flex flex-wrap items-center justify-center gap-space-lg" aria-label="Footer navigation">
            <a class="font-label text-label-md text-on-surface-variant hover:text-primary transition-colors" data-path="senior-care" href="#">Senior Care</a>
            <a class="font-label text-label-md text-on-surface-variant hover:text-primary transition-colors" data-path="family-circle" href="#">Family Circle</a>
            <a class="font-label text-label-md text-on-surface-variant hover:text-primary transition-colors" data-path="how-it-works" href="#">How It Works</a>
            <a class="font-label text-label-md text-on-surface-variant hover:text-primary transition-colors" data-path="sign-in" href="#">Sign In</a>
          </nav>
        </div>
        <div class="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-label text-label-sm">
          <p>© 2025 Ayush Care Systems. Quiet dignity, peaceful everyday routine.</p>
          <p class="text-secondary font-medium">Soft Comfort • High Legibility • Uncluttered Harmony</p>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Attach event listeners for landing page
 */
function attachLandingListeners() {
  // Font scale buttons
  document.querySelectorAll('[data-font-scale]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const scale = btn.dataset.fontScale;
      window.setUIState({ fontScale: scale });
      // Update active state
      document.querySelectorAll('[data-font-scale]').forEach(b => {
        b.classList.toggle('font-semibold', b.dataset.fontScale === scale);
        b.classList.toggle('opacity-40', b.dataset.fontScale !== scale);
      });
    });
  });

  // Demo voice button
  const voiceBtn = document.getElementById('demo-voice-btn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      alert("🔊 Speaking: 'Grandpa Rao, please take your one white tablet of Amlodipine with a glass of warm water right now.'");
    });
  }

  // Demo taken button
  const takenBtn = document.getElementById('demo-taken-btn');
  if (takenBtn) {
    takenBtn.addEventListener('click', () => {
      const span = takenBtn.querySelector('span:last-child');
      const isTaken = takenBtn.classList.toggle('confirm-taken');
      if (isTaken) {
        takenBtn.classList.remove('bg-primary', 'hover:bg-tertiary-container');
        takenBtn.classList.add('bg-caramel', 'hover:bg-caramel-dark');
        span.textContent = '✓ Taken with Breakfast';
      } else {
        takenBtn.classList.remove('bg-caramel', 'hover:bg-caramel-dark');
        takenBtn.classList.add('bg-primary', 'hover:bg-tertiary-container');
        span.textContent = 'I Took My Morning Medicine';
      }
    });
  }

  // Demo call button
  const callBtn = document.getElementById('demo-call-btn');
  if (callBtn) {
    callBtn.addEventListener('click', () => {
      alert('📞 Calling Sarah... (demo)');
    });
  }

  // CTA buttons that navigate to senior view
  document.querySelectorAll('[data-path="senior-care"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/senior');
    });
  });

  // Sign in buttons
  document.querySelectorAll('[data-path="sign-in"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate('/login');
    });
  });

  // Keyboard navigation for buttons
  document.querySelectorAll('button[role="button"], button:not([role])').forEach(btn => {
    if (!btn.hasAttribute('type')) btn.setAttribute('type', 'button');
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}