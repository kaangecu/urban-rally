import { describe, expect, it } from 'vitest';
import type { Task } from '../../types/schema';
import { markerIcon } from './markerIcon';

const task = { id: 'r', title: 'Café <Ost> & "West"', type: 'GPS', points: 80, isActive: true } as Task;

describe('markerIcon', () => {
  it('puts the escaped accessible name inside the icon so it updates with the icon', () => {
    const html = markerIcon(task, 'in-range', false).options.html as string;
    expect(html).toContain('<span class="sr-only">Café &lt;Ost&gt; &amp; &quot;West&quot;, check-in, in range</span>');
  });

  it('reuses the same icon while the look is unchanged, so Leaflet keeps the element and focus', () => {
    expect(markerIcon(task, 'open', false)).toBe(markerIcon({ ...task }, 'open', false));
    expect(markerIcon(task, 'open', false)).not.toBe(markerIcon(task, 'in-range', false));
    expect(markerIcon(task, 'open', false)).not.toBe(markerIcon(task, 'open', true));
  });
});
