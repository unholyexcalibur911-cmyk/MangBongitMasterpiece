import React, { useState } from "react";
import styles from "./Contact.module.css";
import appStyles from "./App.module.css";
import emailjs from "@emailjs/browser";

const Contact: React.FC = () => {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [formError, setFormError] = useState<string | null>(null);

  // Access environment variables
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!serviceId || !templateId || !publicKey) {
      setFormError("Email service is not configured. Please contact support.");
      setStatus("error");
      return;
    }

    setStatus("sending");

    try {
      await emailjs.sendForm(serviceId, templateId, e.currentTarget, publicKey);
      setStatus("success");
    } catch (err) {
      console.error("EmailJS Error:", err);
      setFormError("Failed to send message. Please try again later.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <main className={`${appStyles.main} ${styles.contactPage}`}>
        <div className={styles.contactSuccess}>
          <h2>Thank you!</h2>
          <p>Your message has been sent. We’ll be in touch soon.</p>
          <button
            onClick={() => {
              setStatus("idle");
              setFormError(null);
            }}
            className={styles.submitBtn}
          >
            Send Another Message
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`${appStyles.main} ${styles.contactPage}`}>
      <h1 className={styles.contactTitle}>Contact us</h1>
      <p className={styles.contactLead}>
        If you have any questions, queries or suggestions please do not hesitate
        to contact us through the form below.
      </p>
      <section className={styles.contactGrid}>
        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                𝒊 Name <span className={styles.required}>*</span>
              </label>
              <div className={styles.nameFields}>
                <input
                  name="from_firstname"
                  type="text"
                  placeholder="First"
                  required
                  className={styles.input}
                />
                <input
                  name="from_lastname"
                  type="text"
                  placeholder="Last"
                  required
                  className={styles.input}
                />
              </div>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>
              ✉︎ Email <span className={styles.required}>*</span>
            </label>
            <input
              name="from_email"
              type="email"
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              ⌨ Comment <span className={styles.required}>*</span>
            </label>
            <textarea
              name="message"
              required
              rows={5}
              className={styles.input}
            />
          </div>
          {formError && <div className={styles.formError}>{formError}</div>}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={status === "sending"}
          >
            {status === "sending" ? "SENDING..." : "SUBMIT"}
          </button>
          <div className={styles.formNote}>
            Please DO NOT fill in the above form with regards to exchanges.
            Instead click on the
            <a href="#" className={styles.link}>
              {" "}
              "SUBMIT A SIZING EXCHANGE"{" "}
            </a>
            button on the right for a faster response
          </div>
        </form>
        <div className={styles.contactInfo}>
          <div className={styles.infoBlock}>
            <h2 className={styles.infoTitle}>Want a quick answer?</h2>
            <p>
              The chances are we have already answered your questions under our
              FAQ or Frequently Asked Questions which can be viewed at the link
              below.
            </p>
            <button className={styles.infoBtn}>
              FREQUENTLY ASKED QUESTIONS
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
