/**
 * Privacy Policy Page - Ayush
 * Legal page describing data handling practices
 */

import { navigate } from '../router.js';
import { auth } from '../api.js';

/**
 * Render privacy policy page
 */
export async function renderPrivacy(container) {
  container.innerHTML = getPrivacyHTML();
  attachPrivacyListeners();
}

/**
 * Generate privacy policy HTML
 */
function getPrivacyHTML() {
  return `
    <header class="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(36,27,24,0.04)]" role="banner">
      <div class="h-20 max-w-[1200px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin flex items-center justify-between gap-space-md">
        <div class="flex flex-col">
          <a class="flex flex-col group" href="#" data-path="home" aria-label="Ayush Home">
            <span class="font-headline text-headline-sm text-primary tracking-tight">Ayush</span>
            <span class="font-label text-label-sm text-secondary font-medium -mt-1">Gentle Care for Seniors</span>
          </a>
        </div>
        <nav class="hidden lg:flex items-center gap-space-lg" aria-label="Main navigation">
          <a class="font-label text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-1" data-path="home" href="#">Home</a>
          <a class="font-label text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-1" data-path="senior-care" href="#">Senior Care</a>
          <a class="font-label text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-1" data-path="family-circle" href="#">Family Circle</a>
        </nav>
        <div class="flex items-center gap-space-md">
          <a class="h-12 px-space-lg bg-primary hover:bg-tertiary-container text-on-primary font-label text-label-md rounded-lg flex items-center justify-center transition-colors" data-path="sign-in" href="#">Sign In</a>
        </div>
      </div>
    </header>

    <main class="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]" role="main">
      <div class="max-w-[800px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin py-16 md:py-24">
        <article class="bg-surface-container-lowest rounded-2xl p-8 md:p-12 shadow-[0_4px_24px_rgba(36,27,24,0.04)]">
          <header class="mb-12 pb-8 border-b border-outline-variant">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary-fixed/50 text-secondary font-label text-label-sm font-semibold mb-4">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">policy</span>
              <span>Privacy Policy</span>
            </div>
            <h1 class="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
              Your Privacy Matters to Us
            </h1>
            <p class="font-body text-body-lg text-on-surface-variant">
              Last updated: November 15, 2025
            </p>
          </header>

          <div class="space-y-12 font-body text-body-md text-on-surface-variant leading-relaxed">
            <section aria-labelledby="intro-heading">
              <h2 id="intro-heading" class="font-headline text-headline-md text-on-surface mb-4">Introduction</h2>
              <p>
                Ayush ("we", "our", "us") is committed to protecting your personal information and your right to privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
                our elderly care management platform.
              </p>
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy,
                please do not access the platform.
              </p>
            </section>

            <section aria-labelledby="data-heading">
              <h2 id="data-heading" class="font-headline text-headline-md text-on-surface mb-4">Information We Collect</h2>
              <p>We collect information that you voluntarily provide to us when you register, create profiles, and use the platform:</p>

              <h3 class="font-headline text-headline-sm text-on-surface mt-6 mb-3">Account Information</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Email address (used for authentication and notifications)</li>
                <li>Display name</li>
                <li>Role (caretaker or elderly)</li>
                <li>Password/PIN (hashed using bcrypt, never stored in plaintext)</li>
              </ul>

              <h3 class="font-headline text-headline-sm text-on-surface mt-6 mb-3">Care Profile Information</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Profile name and age of the care recipient</li>
                <li>Medication details (names, dosages, schedules, instructions, photos)</li>
                <li>Appointment details (doctor names, clinics, dates, times, notes)</li>
                <li>Adherence records (taken/skipped/missed status with timestamps)</li>
                <li>Voice check-in transcriptions (processed for medication adherence and symptom detection)</li>
              </ul>

              <h3 class="font-headline text-headline-sm text-on-surface mt-6 mb-3">Technical Data</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>IP address (for rate limiting and security)</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Request timestamps and API usage metrics</li>
              </ul>
            </section>

            <section aria-labelledby="use-heading">
              <h2 id="use-heading" class="font-headline text-headline-md text-on-surface mb-4">How We Use Your Information</h2>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li><strong>Provide the service:</strong> Manage medication schedules, send reminders, track adherence, coordinate appointments</li>
                <li><strong>Family coordination:</strong> Send notifications to linked family members/caretakers about medication events</li>
                <li><strong>AI-powered features:</strong> Parse prescription images, check medication interactions, process voice check-ins (data sent to AI providers: Google Gemini, Groq, NVIDIA)</li>
                <li><strong>Voice synthesis:</strong> Convert text to speech for accessibility (processed locally via edge-tts)</li>
                <li><strong>Security and fraud prevention:</strong> Rate limiting, authentication, anomaly detection</li>
                <li><strong>Service improvement:</strong> Analytics on usage patterns (aggregated, non-personal)</li>
                <li><strong>Legal compliance:</strong> Respond to legal requests, enforce terms of service</li>
              </ul>
            </section>

            <section aria-labelledby="sharing-heading">
              <h2 id="sharing-heading" class="font-headline text-headline-md text-on-surface mb-4">Information Sharing</h2>
              <p>We do not sell your personal information. We share data only in these circumstances:</p>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li><strong>With your consent:</strong> Family members you explicitly link to a care profile receive relevant notifications</li>
                <li><strong>AI service providers:</strong> Prescription images and voice transcriptions are sent to Google (Gemini), Groq, and NVIDIA for processing. These providers have their own privacy policies and do not use your data for training.</li>
                <li><strong>Email service:</strong> Notification emails sent via SMTP provider (configured by the deployment)</li>
                <li><strong>Legal requirements:</strong> When required by law, court order, or to protect our rights and safety</li>
                <li><strong>Business transfers:</strong> In case of merger, acquisition, or sale of assets, with notice</li>
              </ul>
            </section>

            <section aria-labelledby="retention-heading">
              <h2 id="retention-heading" class="font-headline text-headline-md text-on-surface mb-4">Data Retention</h2>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li><strong>Account data:</strong> Retained while your account is active. Soft-deleted accounts are anonymized (email prefixed with "deleted_") and retained for 30 days before permanent deletion.</li>
                <li><strong>Medication and adherence records:</strong> Retained for 2 years for health tracking purposes, then anonymized.</li>
                <li><strong>Appointment records:</strong> Retained for 1 year after the appointment date.</li>
                <li><strong>Notification logs:</strong> Retained for 90 days.</li>
                <li><strong>Voice transcriptions:</strong> Not stored permanently; processed in real-time and discarded after AI response.</li>
                <li><strong>Prescription images:</strong> Not stored; processed in memory and discarded after parsing.</li>
                <li><strong>Technical logs:</strong> Retained for 30 days for security and debugging.</li>
              </ul>
            </section>

            <section aria-labelledby="rights-heading">
              <h2 id="rights-heading" class="font-headline text-headline-md text-on-surface mb-4">Your Rights</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request account deletion (available via Settings → Delete Account)</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Restriction:</strong> Limit processing of your data</li>
                <li><strong>Objection:</strong> Object to processing for direct marketing</li>
              </ul>
              <p class="mt-4">
                To exercise these rights, use the <a href="#" class="text-primary underline" data-path="sign-in">account settings</a>
                or contact us at privacy@ayush.care
              </p>
            </section>

            <section aria-labelledby="security-heading">
              <h2 id="security-heading" class="font-headline text-headline-md text-on-surface mb-4">Data Security</h2>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li>All data transmitted over HTTPS/TLS</li>
                <li>Passwords hashed with bcrypt (cost factor 12)</li>
                <li>JWT tokens with 30-day expiry, signed with HS256</li>
                <li>Rate limiting on authentication and AI endpoints</li>
                <li>CORS restricted to allow-listed origins</li>
                <li>Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy</li>
                <li>Database access restricted to application server</li>
                <li>Regular dependency vulnerability scanning</li>
              </ul>
            </section>

            <section aria-labelledby="children-heading">
              <h2 id="children-heading" class="font-headline text-headline-md text-on-surface mb-4">Children's Privacy</h2>
              <p>
                Our platform is designed for elderly care recipients and their adult caretakers. We do not knowingly
                collect personal information from children under 13. If you believe a child has provided us with personal
                information, please contact us immediately.
              </p>
            </section>

            <section aria-labelledby="changes-heading">
              <h2 id="changes-heading" class="font-headline text-headline-md text-on-surface mb-4">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by
                posting the new policy on this page and updating the "Last updated" date. We encourage you to review
                this policy periodically.
              </p>
            </section>

            <section aria-labelledby="contact-heading">
              <h2 id="contact-heading" class="font-headline text-headline-md text-on-surface mb-4">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <address class="not-italic mt-4 font-body text-body-md text-on-surface-variant">
                <p>Ayush Care Systems</p>
                <p>Email: privacy@ayush.care</p>
                <p>Security issues: security@ayush.care</p>
              </address>
            </section>
          </div>

          <footer class="mt-16 pt-8 border-t border-outline-variant text-center">
            <a class="text-primary underline hover:text-secondary font-label text-label-md" data-path="home" href="#">
              ← Back to Home
            </a>
          </footer>
        </article>
      </div>
    </main>

    <footer class="w-full bg-surface-container-low text-on-surface py-space-xl" role="contentinfo">
      <div class="max-w-[1200px] mx-auto px-margin-mobile md:px-space-lg lg:px-margin flex flex-col gap-space-lg">
        <div class="flex flex-col md:flex-row items-center justify-between gap-space-md text-center md:text-left pt-space-xs">
          <div class="flex flex-col gap-1">
            <span class="font-headline text-headline-sm text-primary">Ayush</span>
            <p class="font-body text-body-md text-on-surface-variant max-w-md">Dedicated to serene medication routines, dignified independence, and thoughtful tranquility for seniors and the families who love them.</p>
          </div>
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
 * Attach event listeners for privacy page
 */
function attachPrivacyListeners() {
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