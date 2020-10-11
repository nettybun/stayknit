import { h, svg } from 'haptic';
import { css } from 'styletakeout.macro';

import type { Signal } from 'haptic/s';

const HeartIcon = ({ size }: { size: Signal<string|number> }) => {
  const path = 'M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 01.176-.17C12.72-3.042 23.333 4.867 8 15z';
  return svg(() =>
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fillRule="evenodd" d={path} clip-rule="evenodd"/>
    </svg>
  );
};

const SvelteIcon = ({ size }: { size: Signal<string|number> }) => {
  const innerPath = 'M45.41,108.86A21.81,21.81,0,0,1,22,100.18,20.2,20.2,0,0,1,18.53,84.9a19,19,0,0,1,.65-2.57l.52-1.58,1.41,1a35.32,35.32,0,0,0,10.75,5.37l1,.31-.1,1a6.2,6.2,0,0,0,1.11,4.08A6.57,6.57,0,0,0,41,95.19a6,6,0,0,0,1.68-.74L70.11,76.94a5.76,5.76,0,0,0,2.59-3.83,6.09,6.09,0,0,0-1-4.6,6.58,6.58,0,0,0-7.06-2.62,6.21,6.21,0,0,0-1.69.74L52.43,73.31a19.88,19.88,0,0,1-5.58,2.45,21.82,21.82,0,0,1-23.43-8.68A20.2,20.2,0,0,1,20,51.8a19,19,0,0,1,8.56-12.7L56,21.59a19.88,19.88,0,0,1,5.58-2.45A21.81,21.81,0,0,1,85,27.82,20.2,20.2,0,0,1,88.47,43.1a19,19,0,0,1-.65,2.57l-.52,1.58-1.41-1a35.32,35.32,0,0,0-10.75-5.37l-1-.31.1-1a6.2,6.2,0,0,0-1.11-4.08,6.57,6.57,0,0,0-7.06-2.62,6,6,0,0,0-1.68.74L36.89,51.06a5.71,5.71,0,0,0-2.58,3.83,6,6,0,0,0,1,4.6,6.58,6.58,0,0,0,7.06,2.62,6.21,6.21,0,0,0,1.69-.74l10.48-6.68a19.88,19.88,0,0,1,5.58-2.45,21.82,21.82,0,0,1,23.43,8.68A20.2,20.2,0,0,1,87,76.2a19,19,0,0,1-8.56,12.7L51,106.41a19.88,19.88,0,0,1-5.58,2.45';
  const outerPath = 'M65,34 L37,52 A1 1 0 0 0 44 60 L70.5,44.5 A1 1 0 0 0 65,34Z M64,67 L36,85 A1 1 0 0 0 42 94 L68,77.5 A1 1 0 0 0 64,67Z';

  const svelteRed = '#ff3e00';
  const pathStyle = css`
    fill: white;
    opacity: 1;
  `;
  return svg(() =>
    <svg
      width={size}
      height={size}
      viewBox="0 0 103 124"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g out-fade="{{duration: 200}}" opacity={0.2}>
        <path
          in-expand="{{duration: 400, delay: 1000, easing: quintOut}}"
          class={pathStyle}
          style={`stroke: ${svelteRed}; fill: ${svelteRed}; stroke-width: 50;`}
          d={outerPath}
        />
        <path
          in-draw="{{duration: 1000}}"
          class={pathStyle}
          style={`stroke: ${svelteRed}; stroke-width: 1.5`}
          d={innerPath}
        />
      </g>
    </svg>
  );
};

export { HeartIcon, SvelteIcon };
