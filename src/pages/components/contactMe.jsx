import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const ContactMe = ({ isOpen, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleSubmit = (event) => {
        event.preventDefault();

        // Check if emailjs is available
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS is not loaded');
            setSubmitStatus('error');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        // Using the existing EmailJS configuration
        emailjs.sendForm('service_4345bru', 'template_ipi80jz', event.target)
            .then(() => {
                setSubmitStatus('success');
                setIsSubmitting(false);
                // Reset form
                event.target.reset();
                // Close modal after a short delay
                setTimeout(() => {
                    onClose();
                    setSubmitStatus(null);
                }, 2000);
            })
            .catch((error) => {
                setSubmitStatus('error');
                setIsSubmitting(false);
                console.error('Email send failed:', error);
            });
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="contact-overlay"
                    onClick={handleOverlayClick}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="contact-modal"
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <button
                            className="contact-close-btn"
                            onClick={onClose}
                            aria-label="Close contact form"
                        >
                            X
                        </button>

                        <div className="contact-header">
                            <h2>Get In Touch</h2>
                            <p>Send me a message and I'll get back to you!</p>
                        </div>

                        <form id="contact-form" onSubmit={handleSubmit} className="contact-form">
                            <div className="form-group">
                                <label htmlFor="from_name">Your Name</label>
                                <input
                                    type="text"
                                    id="from_name"
                                    name="from_name"
                                    placeholder="Enter your name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="from_email">Your Email</label>
                                <input
                                    type="email"
                                    id="from_email"
                                    name="from_email"
                                    placeholder="Enter your email"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    placeholder="Enter your message"
                                    rows="5"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <button
                                type="submit"
                                className="contact-submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>

                            {submitStatus === 'success' && (
                                <motion.div
                                    className="status-message success"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    ? Message sent successfully!
                                </motion.div>
                            )}

                            {submitStatus === 'error' && (
                                <motion.div
                                    className="status-message error"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    ? Failed to send message. Please try again.
                                </motion.div>
                            )}
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContactMe;
