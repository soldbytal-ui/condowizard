'use client';

import dynamic from 'next/dynamic';
import MapSkeleton from './MapSkeleton';

const TorontoMap = dynamic(() => import('./TorontoMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default TorontoMap;
