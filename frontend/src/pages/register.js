/**
 * Register Page - Ayush Account Creation
 * Accessible registration with role selection
 */

import { navigate } from '../router.js';
import { auth } from '../api.js';

/**
 * Render register page
 */
export async function renderRegister(container) {
  container.innerHTML = getRegisterHTML();
  attachRegisterListeners();
}

/**
 * Generate register page HTML
 */
function getRegisterHTML() {
  return `
    <div class="min-h-screen bg-surface flex items-center justify-center px-4 py-20" role="main">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-10">
          <a href="#" data-path="home" class="inline-flex flex-col items-center" aria-label="Ayush Home">
            <div class="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-sm mb-4" aria-hidden="true">
              <span class="material-symbols-outlined text-on-primary text-[32px]">favorite</span>
            </div>
            <span class="font-headline text-headline-lg text-primary tracking-tight">Ayush</span>
            <span class="font-label text-label-md text-secondary font-medium -mt-1">Gentle Care for Seniors</span>
          </a>
        </div>

        <!-- Register Card -->
        <article class="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_16px_40px_-8px_rgba(36,27,24,0.08)] border border-outline-variant/50">
          <header class="text-center mb-8">
            <h1 class="font-headline text-headline-md text-on-surface mb-2">Create Your Account</h1>
            <p class="font-body text-body-md text-on-surface-variant">Join families staying connected through gentle care</p>
          </header>

          <form id="register-form" class="space-y-6" novalidate>
            <div>
              <label for="display_name" class="block font-label text-label-md text-on-surface mb-2">Display Name</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                autocomplete="name"
                required
                minlength="2"
                maxlength="50"
                class="w-full h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                placeholder="Priya Rao"
                aria-describedby="name-hint"
              />
              <p id="name-hint" class="font-label text-label-sm text-on-surface-variant mt-1 hidden">How you'll appear to family</p>
            </div>

            <div>
              <label for="email" class="block font-label text-label-md text-on-surface mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                autocomplete="email"
                required
                class="w-full h-14 px-4 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                placeholder="you@example.com"
                aria-describedby="email-hint"
              />
              <p id="email-hint" class="font-label text-label-sm text-on-surface-variant mt-1 hidden">We'll never share your email</p>
            </div>

            <div>
              <label for="password" class="block font-label text-label-md text-on-surface mb-2">Password</label>
              <div class="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  class="w-full h-14 px-4 pr-14 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="••••••••"
                  aria-describedby="password-hint"
                />
                <button
                  type="button"
                  id="toggle-password"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors touch-target"
                  aria-label="Show password"
                  aria-pressed="false"
                >
                  <span class="material-symbols-outlined text-[24px]" id="password-icon">visibility_off</span>
                </button>
              </div>
              <p id="password-hint" class="font-label text-label-sm text-on-surface-variant mt-1">At least 8 characters</p>
              <div id="password-strength" class="mt-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Password strength">
                <div class="h-full bg-primary transition-all duration-300" style="width: 0%"></div>
              </div>
            </div>

            <div>
              <label for="confirm_password" class="block font-label text-label-md text-on-surface mb-2">Confirm Password</label>
              <div class="relative">
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  autocomplete="new-password"
                  required
                  class="w-full h-14 px-4 pr-14 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="••••••••"
                  aria-describedby="confirm-hint"
                />
                <button
                  type="button"
                  id="toggle-confirm"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors touch-target"
                  aria-label="Show password"
                  aria-pressed="false"
                >
                  <span class="material-symbols-outlined text-[24px]" id="confirm-icon">visibility_off</span>
                </button>
              </div>
              <p id="confirm-hint" class="font-label text-label-sm text-on-surface-variant mt-1 hidden" role="alert" aria-live="polite"></p>
            </div>

            <fieldset class="space-y-4">
              <legend class="font-label text-label-md text-on-surface mb-2">I am registering as:</legend>
              <div class="grid grid-cols-2 gap-4" role="radiogroup" aria-label="Account type">
                <label class="relative cursor-pointer touch-target">
                  <input
                    type="radio"
                    name="role"
                    value="caretaker"
                    class="sr-only"
                    checked
                    aria-label="Family Caregiver"
                  />
                  <div class="p-6 rounded-2xl bg-surface-container-low border-2 border-outline-variant text-center transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary" aria-hidden="true">
                      <span class="material-symbols-outlined text-[28px]">family_restroom</span>
                    </div>
                    <div class="font-label text-label-md text-on-surface font-semibold">Family Caregiver</div>
                    <div class="font-body text-body-sm text-on-surface-variant mt-1">Manage medications, appointments, and family notifications</div>
                  </div>
                </label>
                <label class="relative cursor-pointer touch-target">
                  <input
                    type="radio"
                    name="role"
                    value="elderly"
                    class="sr-only"
                    aria-label="Senior / Elderly"
                  />
                  <div class="p-6 rounded-2xl bg-surface-container-low border-2 border-outline-variant text-center transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-3 text-secondary" aria-hidden="true">
                      <span class="material-symbols-outlined text-[28px]">elderly</span>
                    </div>
                    <div class="font-label text-label-md text-on-surface font-semibold">Senior / Elderly</div>
                    <div class="font-body text-body-sm text-on-surface-variant mt-1">Receive gentle reminders, voice notes, and easy family connection</div>
                  </div>
                </label>
              </div>
            </fieldset>

            <div class="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                required
                class="w-5 h-5 mt-1 accent-primary rounded border-outline-variant focus:ring-2 focus:ring-primary/20"
              />
              <label for="terms" class="font-body text-body-sm text-on-surface-variant cursor-pointer">
                I agree to the <a href="#" class="text-primary hover:underline">Terms of Service</a> and <a href="#" class="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              id="register-submit"
              class="w-full h-16 bg-primary hover:bg-tertiary-container text-on-primary font-label text-label-lg rounded-xl flex items-center justify-center gap-3 shadow-[0_4px_16px_rgba(111,51,26,0.18)] transition-all touch-target"
              disabled
            >
              <span>Create Account</span>
              <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
            </button>

            <p id="register-error" class="text-center font-label text-label-md text-error hidden" role="alert" aria-live="assertive"></p>
          </form>

          <footer class="mt-8 text-center">
            <p class="font-body text-body-md text-on-surface-variant">
              Already have an account?
              <a href="#" data-path="login" class="font-semibold text-primary hover:underline ml-1">Sign in</a>
            </p>
          </footer>
        </article>

        <!-- Accessibility notice -->
        <div class="mt-6 text-center">
          <p class="font-label text-label-sm text-on-surface-variant max-w-sm mx-auto">
            Questions? Call <a href="tel:1800VITALCARE" class="text-primary font-semibold hover:underline">1-800-VITAL-CARE</a> for assistance.
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach event listeners for register page
 */
function attachRegisterListeners() {
  const form = document.getElementById('register-form');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm_password');
  const togglePassword = document.getElementById('toggle-password');
  const toggleConfirm = document.getElementById('toggle-confirm');
  const passwordIcon = document.getElementById('password-icon');
  const confirmIcon = document.getElementById('confirm-icon');
  const submitBtn = document.getElementById('register-submit');
  const errorEl = document.getElementById('register-error');
  const confirmHint = document.getElementById('confirm-hint');
  const strengthBar = document.querySelector('#password-strength div');
  const strengthContainer = document.getElementById('password-strength');

  // Toggle password visibility
  togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.setAttribute('aria-pressed', isPassword);
    togglePassword.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    passwordIcon.textContent = isPassword ? 'visibility' : 'visibility_off';
  });

  toggleConfirm.addEventListener('click', () => {
    const isPassword = confirmInput.type === 'password';
    confirmInput.type = isPassword ? 'text' : 'password';
    toggleConfirm.setAttribute('aria-pressed', isPassword);
    toggleConfirm.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    confirmIcon.textContent = isPassword ? 'visibility' : 'visibility_off';
  });

  // Password strength meter
  function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    return Math.min(100, score);
  }

  passwordInput.addEventListener('input', () => {
    const strength = checkPasswordStrength(passwordInput.value);
    strengthBar.style.width = `${strength}%`;
    strengthContainer.setAttribute('aria-valuenow', strength);

    // Color based on strength
    strengthBar.classList.remove('bg-error', 'bg-caramel', 'bg-primary');
    if (strength < 40) strengthBar.classList.add('bg-error');
    else if (strength < 70) strengthBar.classList.add('bg-caramel');
    else strengthBar.classList.add('bg-primary');
  });

  // Validate form on input
  function validateForm() {
    const name = document.getElementById('display_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const terms = document.getElementById('terms').checked;

    const passwordsMatch = password === confirm;
    confirmHint.textContent = passwordsMatch || !confirm ? '' : 'Passwords do not match';
    confirmHint.classList.toggle('hidden', passwordsMatch || !confirm);
    confirmHint.classList.toggle('text-error', !passwordsMatch && confirm);
    confirmHint.classList.toggle('text-secondary', passwordsMatch && confirm);
    confirmInput.classList.toggle('border-error', !passwordsMatch && confirm);
    confirmInput.classList.toggle('border-primary', passwordsMatch && confirm);

    const isValid = name.length >= 2 &&
                    email.includes('@') &&
                    password.length >= 8 &&
                    passwordsMatch &&
                    terms;

    submitBtn.disabled = !isValid;
    submitBtn.classList.toggle('opacity-50', !isValid);
    submitBtn.classList.toggle('cursor-not-allowed', !isValid);
  }

  document.getElementById('display_name').addEventListener('input', validateForm);
  document.getElementById('email').addEventListener('input', validateForm);
  passwordInput.addEventListener('input', validateForm);
  confirmInput.addEventListener('input', validateForm);
  document.getElementById('terms').addEventListener('change', validateForm);

  // Role selection visual feedback
  document.querySelectorAll('input[name="role"]').forEach(radio => {
    radio.addEventListener('change', () => {
      // Force re-render of labels for :has() pseudo-class
      radio.closest('label').classList.toggle('ring-2', radio.checked);
      radio.closest('label').classList.toggle('ring-primary', radio.checked);
    });
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const display_name = document.getElementById('display_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    const role = document.querySelector('input[name="role"]:checked').value;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="flex items-center gap-2">
        <span class="w-6 h-6 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
        <span>Creating account...</span>
      </span>
    `;
    errorEl.classList.add('hidden');
    errorEl.textContent = '';

    try {
      const result = await auth.register({ email, password, role, display_name });
      // Success - redirect based on role
      if (role === 'elderly') {
        navigate('/senior');
      } else {
        navigate('/caretaker');
      }
    } catch (error) {
      errorEl.textContent = error.message || 'Registration failed. Please try again.';
      errorEl.classList.remove('hidden');

      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Create Account</span>
        <span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
      `;
      validateForm();
    }
  });

  // Login link
  document.querySelector('[data-path="login"]').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/login');
  });

  // Terms links (demo)
  document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Terms/Privacy policy would open here. (Demo)');
    });
  });

  // Keyboard navigation for all buttons
  document.querySelectorAll('button').forEach(btn => {
    if (!btn.hasAttribute('type')) btn.setAttribute('type', 'button');
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Focus name on load
  document.getElementById('display_name').focus();
}