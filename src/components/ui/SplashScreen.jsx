import { Show, createSignal, onCleanup, onMount } from 'solid-js';
import { ArrowRight, Bike, MapPin, ShieldCheck, Store } from 'lucide-solid';
import { ASSET_IMAGES } from '../../constants/config.js';
import { IndiaFlagIcon } from './FestiveVisuals.jsx';

export function SplashScreen(props) {
  const [exiting, setExiting] = createSignal(false);
  const [progress, setProgress] = createSignal(18);

  const dismiss = () => {
    if (exiting()) return;
    setExiting(true);
    window.setTimeout(() => {
      props.onFinish?.();
    }, 280);
  };

  onMount(() => {
    const p1 = window.setTimeout(() => setProgress(62), 350);
    const p2 = window.setTimeout(() => setProgress(100), 1400);
    const autoDone = window.setTimeout(() => dismiss(), 2600);

    onCleanup(() => {
      window.clearTimeout(p1);
      window.clearTimeout(p2);
      window.clearTimeout(autoDone);
    });
  });

  return (
    <div
      class={`fixed inset-0 z-[100] bg-gradient-to-b from-[#0052E0] via-[#0066FF] to-[#003EB3] text-white flex flex-col justify-between overflow-y-auto transition-opacity duration-300 ${
        exiting() ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Safe Spacing & Brand Mark */}
      <div class="w-full max-w-xl mx-auto px-6 pt-10 sm:pt-14 flex items-center justify-between">
        <div class="inline-flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-xs flex items-center justify-center shadow-sm">
            <Bike class="w-5 h-5 text-[#67E8F9]" />
          </div>
          <span class="font-display text-lg font-extrabold tracking-tight">
            Ride <span class="text-[#22E4FF]">Hub</span>
          </span>
        </div>

        <button
          type="button"
          onClick={dismiss}
          class="min-h-[40px] px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Central Hero Showcase */}
      <div class="w-full max-w-xl mx-auto px-6 py-8 flex flex-col items-center text-center">
        {/* Framed Hero Visual */}
        <div class="w-full max-w-sm sm:max-w-md aspect-[16/10] rounded-3xl overflow-hidden border-2 border-white/25 shadow-[0_20px_50px_rgba(0,22,74,0.38)] bg-[#0B1E4A] relative">
          <img
            src={ASSET_IMAGES.hero}
            alt="Ride Hub express multi-vendor delivery"
            referrerPolicy="no-referrer"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[#061844]/80 via-[#061844]/20 to-transparent" />
          <div class="absolute bottom-3.5 inset-x-4 flex items-center justify-between text-left">
            <div>
              <p class="text-xs font-semibold text-[#67E8F9]">Local Express Network</p>
              <p class="text-sm font-bold text-white">Stores · Groceries · Rides</p>
            </div>
            <div class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <MapPin class="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Display Brand Headline */}
        <h1 class="mt-7 font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-balance">
          Ride <span class="text-[#22E4FF]">Hub</span>
        </h1>
        <p class="mt-2.5 text-sm sm:text-base text-white/90 max-w-sm leading-relaxed">
          Everything from your trusted neighborhood stores, delivered to your doorstep in minutes.
        </p>

        {/* Clean Unboxed Feature Highlights */}
        <div class="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-white/85">
          <span class="inline-flex items-center gap-1.5">
            <Store class="w-3.5 h-3.5 text-[#67E8F9]" />
            Local Partners
          </span>
          <span aria-hidden="true" class="text-white/40">
            ·
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Bike class="w-3.5 h-3.5 text-[#67E8F9]" />
            Fast Dispatch
          </span>
          <span aria-hidden="true" class="text-white/40">
            ·
          </span>
          <span class="inline-flex items-center gap-1.5">
            <ShieldCheck class="w-3.5 h-3.5 text-[#67E8F9]" />
            Live Tracking
          </span>
        </div>

        {/* Loading Progress Bar */}
        <div class="mt-7 w-full max-w-xs h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            class="h-full rounded-full bg-[#22E4FF] transition-all duration-700 ease-out"
            style={{ width: `${progress()}%` }}
          />
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={dismiss}
          class="mt-6 w-full max-w-xs min-h-[48px] px-6 rounded-2xl bg-white hover:bg-[#F0F7FF] text-[#0052CC] font-display text-sm sm:text-base font-extrabold shadow-[0_10px_28px_rgba(0,22,74,0.28)] inline-flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
        >
          <span>Get Started</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Footer */}
      <div class="w-full max-w-xl mx-auto px-6 pb-8 pt-2 flex flex-col items-center gap-2">
        <Show when={true}>
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-white/85">
            <IndiaFlagIcon class="w-5 h-3.5 rounded-[2px]" />
            <span>PROUDLY MADE IN INDIA</span>
          </div>
        </Show>
      </div>
    </div>
  );
}
