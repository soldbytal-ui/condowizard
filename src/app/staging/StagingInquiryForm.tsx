'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

type FormData = {
  name: string;
  email: string;
  phone: string;
  propertyType: string;
  address: string;
  message: string;
};

export default function StagingInquiryForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    try {
      const composedMessage = [
        data.propertyType ? `Property type: ${data.propertyType}` : null,
        data.address ? `Address: ${data.address}` : null,
        data.message ? `\nMessage: ${data.message}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: composedMessage,
          source: 'staging',
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-accent-green/10 mx-auto flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Thanks — we&apos;ll be in touch</h3>
        <p className="text-sm text-text-muted">
          Tal will reach out within 24 hours to schedule your free staging consultation.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm text-accent-blue font-medium hover:underline"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-border p-7 md:p-8 shadow-sm"
    >
      <h3 className="text-2xl font-bold text-text-primary">Book your free consultation</h3>
      <p className="text-sm text-text-muted mt-2 mb-6">
        Tell us about your property and we&apos;ll build a staging plan tailored to your sale.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Full name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Jane Doe"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
            />
            {errors.name && <p className="text-accent-orange text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Phone</label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="(647) 555-1234"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">Email *</label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
            })}
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
          />
          {errors.email && <p className="text-accent-orange text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Property type</label>
            <select
              {...register('propertyType')}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
              defaultValue=""
            >
              <option value="" disabled>
                Select...
              </option>
              <option value="Condo">Condo</option>
              <option value="Detached Home">Detached home</option>
              <option value="Semi / Townhome">Semi / Townhome</option>
              <option value="Vacant Property">Vacant property</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Property address</label>
            <input
              {...register('address')}
              placeholder="123 King St W, Toronto"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1.5">Message</label>
          <textarea
            {...register('message')}
            rows={3}
            placeholder="Tell us about your timeline or any specific questions..."
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-6 w-full bg-accent-blue text-white font-semibold py-4 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending...' : 'Request my free consultation'}
      </button>

      {status === 'error' && (
        <p className="text-accent-orange text-sm text-center mt-3">
          Something went wrong. Please try again or call 647-890-4082.
        </p>
      )}

      <div className="mt-6 pt-5 border-t border-border text-[11px] text-text-muted leading-relaxed">
        Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage
        <br />
        647-890-4082 | Contact@condowizard.ca
      </div>
    </form>
  );
}
