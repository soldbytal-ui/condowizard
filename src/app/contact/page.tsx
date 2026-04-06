import type { Metadata } from 'next';
import InquiryForm from '@/components/projects/InquiryForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch — we connect you with licensed local agents who specialize in Toronto pre-construction.',
};

export default function ContactPage() {
  return (
    <div className="container-main pt-24 pb-10 max-w-2xl">
      <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">Contact Us</h1>
      <p className="text-gray-500 mb-8">
        Interested in a specific project? Have questions about pre-construction in Toronto?
        Fill out the form below and a licensed local agent will get back to you within 24 hours.
      </p>

      <InquiryForm source="contact" />

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-navy mb-2">Location</h3>
          <p className="text-gray-500 text-sm">Toronto, Ontario</p>
        </div>
        <div className="card p-6">
          <h3 className="font-display font-semibold text-navy mb-2">Response Time</h3>
          <p className="text-gray-500 text-sm">Within 24 hours</p>
        </div>
      </div>
    </div>
  );
}
