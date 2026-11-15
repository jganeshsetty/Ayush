/**
 * Terms of Service Page - Ayush
 * Legal page describing terms of use
 */

import { navigate } from '../router.js';
import { auth } from '../api.js';

/**
 * Render terms of service page
 */
export async function renderTerms(container) {
  container.innerHTML = getTermsHTML();
  attachTermsListeners();
}

/**
 * Generate terms of service HTML
 */
function getTermsHTML() {
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
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">description</span>
              <span>Terms of Service</span>
            </div>
            <h1 class="font-headline text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
              Terms of Service
            </h1>
            <p class="font-body text-body-lg text-on-surface-variant">
              Last updated: November 15, 2025
            </p>
          </header>

          <div class="space-y-12 font-body text-body-md text-on-surface-variant leading-relaxed">
            <section aria-labelledby="acceptance-heading">
              <h2 id="acceptance-heading" class="font-headline text-headline-md text-on-surface mb-4">Acceptance of Terms</h2>
              <p>
                By accessing and using Ayush ("the Platform"), you agree to be bound by these Terms of Service ("Terms").
                If you do not agree to these Terms, please do not use the Platform.
              </p>
            </section>

            <section aria-labelledby="description-heading">
              <h2 id="description-heading" class="font-headline text-headline-md text-on-surface mb-4">Platform Description</h2>
              <p>
                Ayush is an elderly care management platform that helps families coordinate medication schedules,
                track adherence, manage appointments, and stay connected with care recipients. The Platform includes
                features for medication reminders, voice guidance, AI-powered prescription parsing, medication safety
                checks, and family notifications.
              </p>
            </section>

            <section aria-labelledby="accounts-heading">
              <h2 id="accounts-heading" class="font-headline text-headline-md text-on-surface mb-4">Accounts and Registration</h2>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li><strong>Eligibility:</strong> You must be at least 18 years old to create an account. Accounts for elderly users are managed by their designated caretakers.</li>
                <li><strong>Accurate Information:</strong> You must provide accurate, current, and complete information during registration and keep it updated.</li>
                <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</li>
                <li><strong>PIN for Elderly Users:</strong> Elderly users may use a 4-digit PIN instead of a password. This is a convenience feature; caretakers are responsible for ensuring the security of the elderly user's account.</li>
                <li><strong>Account Deletion:</strong> You may delete your account at any time via the account settings. This performs a soft-delete preserving referential integrity for 30 days before permanent removal.</li>
              </ul>
            </section>

            <section aria-labelledby="medical-heading">
              <h2 id="medical-heading" class="font-headline text-headline-md text-on-surface mb-4">Medical Disclaimer</h2>
              <p class="font-semibold text-on-surface mb-4">IMPORTANT: READ CAREFULLY</p>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li><strong>Not Medical Advice:</strong> Ayush is a medication management and reminder tool. It does not provide medical advice, diagnosis, or treatment.</li>
                <li><strong>Consult Professionals:</strong> Always consult with qualified healthcare professionals regarding medications, dosages, schedules, and any health concerns.</li>
                <li><strong>AI Features Are Assistive:</strong> Our AI-powered prescription parsing, safety checks, and voice check-in processing are assistive tools only. They may contain errors. Always verify AI-generated information with a healthcare professional.</li>
                <li><strong>Emergency Situations:</strong> In case of medical emergency, contact emergency services immediately. Do not rely on the Platform for urgent medical needs.</li>
                <li><strong>No Liability:</strong> We are not liable for any harm resulting from reliance on the Platform's reminders, AI suggestions, or any other feature.</li>
              </ul>
            </section>

            <section aria-labelledby="ai-heading">
              <h2 id="ai-heading" class="font-headline text-headline-md text-on-surface mb-4">AI-Powered Features</h2>
              <p>The Platform uses third-party AI providers (Google Gemini, Groq, NVIDIA) for certain features:</p>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li><strong>Prescription Parsing:</strong> Images are sent to AI providers for text extraction and structured data parsing. Images are not stored.</li>
                <li><strong>Safety Checks:</strong> Medication lists are sent to AI providers for interaction analysis. Results are informational only.</li>
                <li><strong>Voice Check-ins:</strong> Transcribed text is processed by AI to detect medication adherence and symptoms.</li>
                <li><strong>Data Handling:</strong> Data sent to AI providers is subject to their privacy policies. We do not use your data to train AI models.</li>
                <li><strong>Fallbacks:</strong> If all AI providers are unavailable, local fallback logic provides basic functionality.</li>
              </ul>
            </section>

            <section aria-labelledby="usage-heading">
              <h2 id="usage-heading" class="font-headline text-headline-md text-on-surface mb-4">Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li>Use the Platform for any unlawful purpose or in violation of any applicable laws</li>
                <li>Attempt to gain unauthorized access to any part of the Platform or its systems</li>
                <li>Interfere with the proper functioning of the Platform</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Reverse engineer, decompile, or attempt to extract source code</li>
                <li>Use the Platform to store or transmit protected health information (PHI) in violation of HIPAA or similar regulations unless you have a valid Business Associate Agreement with us</li>
                <li>Abuse rate limits or attempt to circumvent security controls</li>
              </ul>
            </section>

            <section aria-labelledby="intellectual-heading">
              <h2 id="intellectual-heading" class="font-headline text-headline-md text-on-surface mb-4">Intellectual Property</h2>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li>The Platform, its original content, features, and functionality are owned by Ayush Care Systems and are protected by international copyright, trademark, and patent laws.</li>
                <li>You retain ownership of your data (medication info, appointments, notes, etc.).</li>
                <li>By using the Platform, you grant us a license to use, store, and process your data solely to provide the service.</li>
                <li>Our name, logo, and branding are trademarks and may not be used without permission.</li>
              </ul>
            </section>

            <section aria-labelledby="termination-heading">
              <h2 id="termination-heading" class="font-headline text-headline-md text-on-surface mb-4">Termination</h2>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li>We may terminate or suspend your account immediately, without prior notice, for violation of these Terms.</li>
                <li>Upon termination, your right to use the Platform ceases immediately.</li>
                <li>Provisions that should survive termination (medical disclaimer, intellectual property, limitation of liability) shall survive.</li>
              </ul>
            </section>

            <section aria-labelledby="limitation-heading">
              <h2 id="limitation-heading" class="font-headline text-headline-md text-on-surface mb-4">Limitation of Liability</h2>
              <p>To the maximum extent permitted by law:</p>
              <ul class="list-disc list-inside space-y-3 ml-4">
                <li>Ayush Care Systems shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
                <li>Our total liability shall not exceed the amount you paid for the service in the 12 months preceding the claim (or $100 if no payment was made).</li>
                <li>We are not liable for any errors, omissions, or interruptions in the service.</li>
                <li>We are not liable for any third-party AI provider failures or inaccuracies.</li>
              </ul>
            </section>

            <section aria-labelledby="indemnification-heading">
              <h2 id="indemnification-heading" class="font-headline text-headline-md text-on-surface mb-4">Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Ayush Care Systems and its officers, directors, employees,
                and agents from any claims, damages, losses, liabilities, and expenses (including attorneys' fees)
                arising from your use of the Platform, violation of these Terms, or violation of any rights of another.
              </p>
            </section>

            <section aria-labelledby="changes-heading">
              <h2 id="changes-heading" class="font-headline text-headline-md text-on-surface mb-4">Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. Material changes will be communicated via email or through the Platform.
                Your continued use after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section aria-labelledby="governing-heading">
              <h2 id="governing-heading" class="font-headline text-headline-md text-on-surface mb-4">Governing Law</h2>
              <p>
                These Terms shall be governed by the laws of the jurisdiction where Ayush Care Systems is incorporated,
                without regard to conflict of law principles.
              </p>
            </section>

            <section aria-labelledby="contact-heading">
              <h2 id="contact-heading" class="font-headline text-headline-md text-on-surface mb-4">Contact Us</h2>
              <p>If you have questions about these Terms, please contact us:</p>
              <address class="not-italic mt-4 font-body text-body-md text-on-surface-variant">
                <p>Ayush Care Systems</p>
                <p>Email: legal@ayush.care</p>
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
 * Attach event listeners for terms page
 */
function attachTermsListeners() {
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