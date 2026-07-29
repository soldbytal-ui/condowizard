'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

// Uses the existing /api/leads endpoint. No new external service, no new DB table.
// Extra staging-specific fields are composed into the lead `message` payload
// so the existing Supabase `leads` schema is untouched.

type FormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyType: string;
  occupancy: string;
  sqft: string;
  listDate: string;
  existingRealtor: string;
  inquiryType: string;
  message: string;
};

const INQUIRY_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'listing', label: 'Listing with CondoWizard' },
  { id: 'standalone', label: 'Standalone staging inquiry' },
  { id: 'unsure', label: 'Not sure yet' },
];

export default function ConsultationForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { inquiryType: 'unsure' },
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function onSubmit(data: FormValues) {
    setStatus('loading');
    setErrMsg('');
    const composed = [
      `Inquiry type: ${INQUIRY_OPTIONS.find((o) => o.id === data.inquiryType)?.label || data.inquiryType}`,
      data.address ? `Address: ${data.address}` : null,
      data.propertyType ? `Property type: ${data.propertyType}` : null,
      data.occupancy ? `Occupancy: ${data.occupancy}` : null,
      data.sqft ? `Approx sqft: ${data.sqft}` : null,
      data.listDate ? `Target list date: ${data.listDate}` : null,
      data.existingRealtor ? `Existing realtor: ${data.existingRealtor}` : null,
      data.message ? `\nMessage: ${data.message}` : null,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: composed,
          source: 'staging',
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('success');
      reset();
    } catch (err: any) {
      setStatus('error');
      setErrMsg('Something went wrong. Please try again, or call Tal directly at 647-890-4082.');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-text-primary/8 mx-auto flex items-center justify-center mb-4" aria-hidden>
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-serif text-2xl text-text-primary">Thanks — we&rsquo;ll be in touch</p>
        <p className="text-sm text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
          Tal reviews every seller consultation request and will respond, typically within one business day, to confirm next steps.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm font-medium text-text-primary hover:underline"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-border p-6 md:p-8"
      noValidate
    >
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Seller consultation</p>
        <p className="font-serif text-2xl md:text-3xl font-bold text-text-primary leading-tight">
          Tell us about the property
        </p>
        <p className="text-sm text-text-muted mt-2 leading-relaxed">
          Every field beyond name, email and phone is optional. Share what you have — the rest is reviewed on the call.
        </p>
      </div>

      <fieldset className="mb-5">
        <legend className="block text-xs font-semibold text-text-primary mb-2">This inquiry is</legend>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Inquiry type">
          {INQUIRY_OPTIONS.map((o) => (
            <label
              key={o.id}
              className="inline-flex items-center gap-2 border border-border rounded-full px-3 py-1.5 text-xs font-medium text-text-primary cursor-pointer has-[input:checked]:bg-text-primary has-[input:checked]:text-white has-[input:checked]:border-text-primary transition-colors"
            >
              <input type="radio" value={o.id} {...register('inquiryType')} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name *" error={errors.name?.message}>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Jane Doe"
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
              autoComplete="name"
            />
          </Field>
          <Field label="Phone *" error={errors.phone?.message}>
            <input
              {...register('phone', { required: 'Phone is required' })}
              type="tel"
              placeholder="(647) 555-1234"
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
              autoComplete="tel"
            />
          </Field>
        </div>

        <Field label="Email *" error={errors.email?.message}>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email' },
            })}
            type="email"
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
            autoComplete="email"
          />
        </Field>

        <Field label="Property address">
          <input
            {...register('address')}
            placeholder="123 King St W, Toronto"
            className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
            autoComplete="street-address"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Property type">
            <select
              {...register('propertyType')}
              defaultValue=""
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
            >
              <option value="" disabled>Select…</option>
              <option>Condo</option>
              <option>Detached home</option>
              <option>Semi-detached</option>
              <option>Townhome</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Occupied or vacant">
            <select
              {...register('occupancy')}
              defaultValue=""
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
            >
              <option value="" disabled>Select…</option>
              <option>Occupied</option>
              <option>Vacant</option>
              <option>Vacant at listing date</option>
              <option>Not sure</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Approximate square footage">
            <input
              {...register('sqft')}
              placeholder="e.g. 850"
              inputMode="numeric"
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
            />
          </Field>
          <Field label="Target listing date">
            <input
              {...register('listDate')}
              type="date"
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
            />
          </Field>
        </div>

        <Field label="Existing realtor status">
          <select
            {...register('existingRealtor')}
            defaultValue=""
            className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40"
          >
            <option value="" disabled>Select…</option>
            <option>Not currently working with a realtor</option>
            <option>Working with a realtor but exploring options</option>
            <option>Currently under contract with a realtor</option>
          </select>
        </Field>

        <Field label="Message">
          <textarea
            {...register('message')}
            rows={4}
            placeholder="Anything specific about the property, timeline or scope of preparation."
            className="w-full px-3.5 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-text-primary/40 resize-none"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-6 w-full bg-text-primary text-white font-semibold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Request a Seller Consultation'}
      </button>

      {status === 'error' && (
        <p role="alert" className="text-xs text-red-600 mt-3 text-center">{errMsg}</p>
      )}

      <p className="mt-4 text-[11px] text-text-muted leading-relaxed text-center">
        Not currently under contract with another brokerage — you may be. This form does not solicit sellers already represented.
      </p>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-text-primary mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}
