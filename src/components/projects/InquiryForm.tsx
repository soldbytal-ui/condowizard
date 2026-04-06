'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

type FormData = { name: string; email: string; phone: string; message: string };

export default function InquiryForm({
  projectId,
  neighborhoodId,
  source = 'inquiry',
  projectName,
}: {
  projectId?: string;
  neighborhoodId?: string;
  source?: string;
  projectName?: string;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, projectId, neighborhoodId, source }),
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
      <div className="bg-accent-green/10 border border-accent-green/20 rounded-2xl p-6 text-center">
        <h3 className="text-accent-green font-semibold text-lg mb-2">Thank you!</h3>
        <p className="text-text-muted text-sm">We&apos;ve received your inquiry and will be in touch shortly.</p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-sm text-accent-blue underline">Send another inquiry</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <h3 className="text-xl font-semibold text-text-primary">
        {projectName ? `Inquire About ${projectName}` : 'Get More Information'}
      </h3>
      <p className="text-sm text-text-muted">Fill out the form below and we&apos;ll get back to you within 24 hours.</p>
      <p className="text-[10px] text-text-muted">Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage</p>

      <div>
        <input
          {...register('name', { required: 'Name is required' })}
          placeholder="Full Name *"
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
        />
        {errors.name && <p className="text-accent-orange text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <input
          {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
          type="email"
          placeholder="Email Address *"
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
        />
        {errors.email && <p className="text-accent-orange text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <input {...register('phone')} type="tel" placeholder="Phone Number"
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors" />
      </div>
      <div>
        <textarea {...register('message')} placeholder="Message (optional)" rows={3}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors resize-none" />
      </div>
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full disabled:opacity-50">
        {status === 'loading' ? 'Sending...' : 'Send Inquiry'}
      </button>
      {status === 'error' && <p className="text-accent-orange text-sm text-center">Something went wrong. Please try again.</p>}
    </form>
  );
}
