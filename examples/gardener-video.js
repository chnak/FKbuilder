import { VideoBuilder, SVGElement, CircleElement } from '../src/index.js';
import path from 'path';

// --- Assets (SVG String) ---
// Vector art, flat design, cheerful female gardener, sun hat, overalls, geometric shapes, pastel colors
const GARDENER_SVG = `
<svg viewBox="0 0 500 600" xmlns="http://www.w3.org/2000/svg">
  <!-- Hat (Yellow/Straw) -->
  <g id="hat">
    <ellipse cx="250" cy="180" rx="120" ry="30" fill="#F4D35E" /> <!-- Brim -->
    <path d="M180 180 Q250 80 320 180" fill="#E6C229" /> <!-- Top -->
  </g>

  <!-- Body Group -->
  <g id="body">
    <!-- Shirt (Pastel Pink) -->
    <rect x="200" y="250" width="100" height="150" rx="20" fill="#FFB7B2" />
    
    <!-- Overalls (Pastel Blue) -->
    <path d="M210 300 L210 500 L245 500 L245 400 L255 400 L255 500 L290 500 L290 300 Z" fill="#AEC6CF" />
    <rect x="210" y="280" width="15" height="80" fill="#AEC6CF" rx="5" /> <!-- Strap L -->
    <rect x="275" y="280" width="15" height="80" fill="#AEC6CF" rx="5" /> <!-- Strap R -->
    <rect x="220" y="320" width="60" height="40" rx="5" fill="#9ACEEB" /> <!-- Pocket -->
  </g>

  <!-- Head (Peach) -->
  <circle cx="250" cy="220" r="50" fill="#FFDAC1" />
  
  <!-- Face Details -->
  <circle cx="235" cy="215" r="4" fill="#555" /> <!-- Eye L -->
  <circle cx="265" cy="215" r="4" fill="#555" /> <!-- Eye R -->
  <path d="M235 235 Q250 245 265 235" stroke="#555" stroke-width="2" fill="none" /> <!-- Smile -->
  <circle cx="230" cy="225" r="5" fill="#FFB7B2" opacity="0.5" /> <!-- Blush L -->
  <circle cx="270" cy="225" r="5" fill="#FFB7B2" opacity="0.5" /> <!-- Blush R -->

  <!-- Arms -->
  <path d="M200 280 Q160 350 140 320" stroke="#FFDAC1" stroke-width="18" stroke-linecap="round" fill="none" /> <!-- Right Arm -->
  <path d="M300 280 Q340 350 360 320" stroke="#FFDAC1" stroke-width="18" stroke-linecap="round" fill="none" /> <!-- Left Arm -->

  <!-- Watering Can (Pastel Green) -->
  <g transform="translate(100, 300) rotate(-15)">
    <rect x="0" y="20" width="60" height="50" rx="5" fill="#77DD77" /> <!-- Body -->
    <path d="M60 30 L90 10" stroke="#77DD77" stroke-width="8" stroke-linecap="round" /> <!-- Spout -->
    <circle cx="90" cy="10" r="5" fill="#56BD56" /> <!-- Nozzle -->
    <path d="M10 20 Q-15 0 20 20" stroke="#56BD56" stroke-width="5" fill="none" /> <!-- Handle -->
  </g>
</svg>
`;

async function createGardenerVideo() {
    const builder = new VideoBuilder({
        width: 1080,
        height: 1080, // Square video for "art" style
        fps: 30,
    });

    const track = builder.createTrack();
    const duration = 5;
    const scene = track.createScene({
        duration: duration,
        name: 'GardenerScene',
    });

    // 1. White Background
    scene.addBackground({ color: '#FFFFFF' });

    // 2. Gardener Character
    const gardener = new SVGElement({
        svgString: GARDENER_SVG,
        width: 600,
        height: 720,
        x: '50%',
        y: '55%',
        anchor: [0.5, 0.5],
        startTime: 0,
        duration: duration,
        // Simple breathing animation
        animations: [
            {
                type: 'custom',
                update: (p, el) => {
                    // Subtle scale up/down for breathing
                    const scale = 1 + Math.sin(p * Math.PI * 4) * 0.02;
                    el.scaleX = scale;
                    el.scaleY = scale;
                }
            }
        ]
    });
    scene.addElement(gardener);

    // 3. Water Droplets Animation
    // Spout position relative to screen is tricky to calculate exactly without rigid hierarchy,
    // but we can approximate based on the SVG transform and position.
    // Gardener is at 50%, 55% (540, 594). SVG viewbox 500x600.
    // Watering can spout is around (190, 310) in SVG coord.
    // Approx pixel pos: 
    // SVG (190, 310) -> relative to center (250, 300) is (-60, 10)
    // Scaled by 1.2 (600/500) -> (-72, 12)
    // Screen Pos: 540-72 = 468, 594+12 = 606.
    
    const spoutX = 420; // Adjusted guess
    const spoutY = 600;

    for (let i = 0; i < 20; i++) {
        const startTime = i * 0.2;
        if (startTime < duration) {
            const droplet = new CircleElement({
                radius: 4,
                bgcolor: '#AEC6CF', // Pastel blue water
                x: spoutX,
                y: spoutY,
                anchor: [0.5, 0.5],
                startTime: startTime,
                duration: 1.0,
                animations: [
                    {
                        type: 'custom',
                        update: (p, el) => {
                            // Parabolic arc
                            el.x = spoutX - (p * 100); // Move left
                            el.y = spoutY + (p * 200) + (Math.sin(p * Math.PI) * -50); // Drop down with initial arc
                            el.alpha = 1 - p; // Fade out
                        }
                    }
                ]
            });
            scene.addElement(droplet);
        }
    }

    // Render
    const outputDir = path.resolve('output');
    const outputPath = path.join(outputDir, 'gardener-video.mp4');
    await builder.render(outputPath);
}

createGardenerVideo().catch(console.error);
