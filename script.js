// script.js — upgraded: form validation, quote fetch with retry+fallback, fade-in observer

/* ------------------------------
   Utility & DOM elements
-------------------------------*/
const contactForm = document.getElementById("contact-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");
const formMessage = document.getElementById("form-message");
const formSpinner = document.getElementById("form-spinner");

const quoteText = document.getElementById("quote-text");
const quoteAuthor = document.getElementById("quote-author");
const newQuoteBtn = document.getElementById("new-quote-btn");
const yearSpan = document.getElementById("year");

yearSpan.textContent = new Date().getFullYear();

/* ------------------------------
   Simple front-end form handling
   (no backend involved)
-------------------------------*/
function showFormMessage(text, type = "info") {
  // type: info | success | error
  formMessage.textContent = text;
  formMessage.style.color =
    type === "error" ? "#b00020" : type === "success" ? "#056608" : "#333";
}

function clearFormMessage() {
  formMessage.textContent = "";
}

function validateEmail(email) {
  // simple regex for email validation (sufficient for this assignment)
  return /^\S+@\S+\.\S+$/.test(email);
}

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearFormMessage();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const message = messageInput.value.trim();

  if (!name || !email || !message) {
    showFormMessage("Please fill in all fields before submitting.", "error");
    return;
  }

  if (!validateEmail(email)) {
    showFormMessage("Please provide a valid email address.", "error");
    return;
  }

  // show spinner / simulated sending
  submitBtn.disabled = true;
  formSpinner.style.display = "inline-block";
  showFormMessage("Sending message...");

  // Simulate a send delay (no backend). Replace with real API if available.
  setTimeout(() => {
    submitBtn.disabled = false;
    formSpinner.style.display = "none";
    showFormMessage(
      "Thank you! Your message has been recorded (demo).",
      "success"
    );

    // Clear form (optional)
    contactForm.reset();

    // Remove success after a while
    setTimeout(() => clearFormMessage(), 4000);
  }, 900);
});

/* ------------------------------
   Quote fetching (robust)
-------------------------------*/

const FALLBACK_QUOTES = [
  { content: "Keep going — small steps every day.", author: "Unknown" },
  { content: "Where there is hope, there is life.", author: "Unknown" },
  {
    content:
      "Strength grows in the moments when you think you can't go on but you keep going anyway.",
    author: "Unknown",
  },
  {
    content:
      "Hope is being able to see that there is light despite all of the darkness.",
    author: "Desmond Tutu",
  },
];

async function fetchQuoteOnce(signal) {
  const res = await fetch("https://api.quotable.io/random", { signal });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  return { content: data.content, author: data.author || "Unknown" };
}

async function getQuoteWithRetry(retries = 1) {
  // returns a {content, author}
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const q = await fetchQuoteOnce(controller.signal);
    clearTimeout(timeout);
    return q;
  } catch (err) {
    if (retries > 0) {
      // small backoff
      await new Promise((r) => setTimeout(r, 600));
      return getQuoteWithRetry(retries - 1);
    }
    // final fallback
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  }
}

async function renderQuote() {
  quoteText.textContent = "Loading...";
  quoteAuthor.textContent = "";
  newQuoteBtn.disabled = true;

  const q = await getQuoteWithRetry(1);
  quoteText.textContent = `"${q.content}"`;
  quoteAuthor.textContent = q.author ? `— ${q.author}` : "";
  newQuoteBtn.disabled = false;
}

// Button binding
newQuoteBtn.addEventListener("click", () => {
  renderQuote();
});

// Load on page load
window.addEventListener("DOMContentLoaded", () => {
  // small delay so page renders nicely
  setTimeout(renderQuote, 300);
});

/* ------------------------------
   Small scroll animations (IntersectionObserver)
-------------------------------*/
const observerOptions = {
  root: null,
  rootMargin: "0px 0px -10% 0px",
  threshold: 0.05,
};
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("fade-in");
      io.unobserve(entry.target);
    }
  });
}, observerOptions);

// pick elements that should animate: .hero-text, .form-container, .quote-box, headings
document
  .querySelectorAll(".hero-text, .form-container, .quote-box, h2")
  .forEach((el) => {
    // remove fade-in if present and reapply via observer for direction-sensitive effect
    el.classList.remove("fade-in");
    io.observe(el);
  });
