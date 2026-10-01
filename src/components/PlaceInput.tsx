'use client';

import { useEffect, useRef, useState } from 'react';

interface PlaceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export default function PlaceInput({ value, onChange, placeholder }: PlaceInputProps) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = new google.maps.places.PlaceAutocompleteElement({
      placeholder,
      noInputIcon: true,
      noClearButton: true,
    });
    element.setAttribute('aria-label', placeholder);
    element.className = 'place-input';
    widget.current = element;
    container.current?.appendChild(element);
    let active = true;
    let revision = 0;

    const onInput = () => {
      revision++;
      setError('');
      onChange(element.value);
    };
    const onSelect = async (event: Event) => {
      const selectedRevision = ++revision;
      const place = (event as google.maps.places.PlacePredictionSelectEvent).placePrediction.toPlace();
      try {
        await place.fetchFields({ fields: ['formattedAddress', 'displayName'] });
        if (!active || selectedRevision !== revision) return;
        const address = place.formattedAddress || place.displayName || element.value;
        element.value = address;
        onChange(address);
        setError('');
      } catch {
        if (active && selectedRevision === revision) {
          setError('Could not load this place. Please try again.');
        }
      }
    };
    const onError = () => setError('Place search is unavailable. Check Google Maps billing and Places API (New).');
    element.addEventListener('input', onInput);
    element.addEventListener('gmp-select', onSelect);
    element.addEventListener('gmp-error', onError);
    return () => {
      active = false;
      element.removeEventListener('input', onInput);
      element.removeEventListener('gmp-select', onSelect);
      element.removeEventListener('gmp-error', onError);
      element.remove();
      widget.current = null;
    };
  }, [onChange, placeholder]);

  useEffect(() => {
    if (widget.current && widget.current.value !== value) widget.current.value = value;
  }, [value]);

  return (
    <>
      <div ref={container} />
      {error && <p role="alert" style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '6px' }}>{error}</p>}
    </>
  );
}
