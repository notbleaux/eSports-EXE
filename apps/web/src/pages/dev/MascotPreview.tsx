/**
 * Mascot Preview Tool - Recommendation #3
 * 
 * [Ver001.000]
 * 
 * Development page for previewing all mascot variants
 */

import React, { useState } from 'react';
import { MascotAssetEnhanced, MascotType, AssetFormat } from '@/components/mascots/MascotAssetEnhanced';

const MASCOTS: MascotType[] = ['fox', 'owl', 'wolf', 'hawk'];
const SIZES = [32, 64, 128, 256] as const;
const FORMATS: AssetFormat[] = ['svg', 'png', 'css', 'auto'];
const ANIMATIONS = ['idle', 'wave', 'celebrate'] as const;

export const MascotPreview: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<AssetFormat>('auto');
  const [animate, setAnimate] = useState(true);
  const [animation, setAnimation] = useState<typeof ANIMATIONS[number]>('idle');
  const [darkMode, setDarkMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mascot Preview Tool</h1>
          <p className="text-lg opacity-70">
            Development tool for testing mascot assets across all formats and sizes
          </p>
        </div>

        {/* Controls */}
        <div className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Format Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as AssetFormat)}
                className="w-full rounded border px-3 py-2 bg-inherit"
              >
                {FORMATS.map(f => (
                  <option key={f} value={f}>{f.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Animation Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Animation</label>
              <select
                value={animation}
                onChange={(e) => setAnimation(e.target.value as typeof ANIMATIONS[number])}
                className="w-full rounded border px-3 py-2 bg-inherit"
              >
                {ANIMATIONS.map(a => (
                  <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={animate}
                  onChange={(e) => setAnimate(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Animate</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Dark Mode</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Show Grid</span>
              </label>
            </div>

            {/* Stats */}
            <div className="text-sm opacity-70">
              <div>Mascots: {MASCOTS.length}</div>
              <div>Sizes: {SIZES.length}</div>
              <div>Total variants: {MASCOTS.length * SIZES.length}</div>
            </div>
          </div>
        </div>

        {/* Size Comparison */}
        <section className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-6">Size Comparison ({selectedFormat.toUpperCase()})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {MASCOTS.map(mascot => (
              <div key={mascot} className="text-center">
                <h3 className="text-lg font-medium mb-4 capitalize">{mascot}</h3>
                <div className="inline-flex flex-col items-center p-4">
                  <MascotAssetEnhanced
                    mascot={mascot}
                    size={128}
                    format={selectedFormat}
                    animate={animate}
                    animation={animation}
                  />
                </div>
                <p className="text-sm mt-2 opacity-60">128×128px</p>
              </div>
            ))}
          </div>
        </section>

        {/* All Sizes */}
        <section className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-6">All Sizes</h2>
          
          {MASCOTS.map(mascot => (
            <div key={mascot} className="mb-8">
              <h3 className="text-lg font-medium mb-4 capitalize">{mascot}</h3>
              <div className="flex flex-wrap items-end gap-8">
                {SIZES.map(size => (
                  <div key={size} className="text-center">
                    <div className="inline-flex items-center justify-center">
                      <MascotAssetEnhanced
                        mascot={mascot}
                        size={size}
                        format={selectedFormat}
                        animate={animate}
                        animation={animation}
                      />
                    </div>
                    <p className="text-sm mt-2 opacity-60">{size}×{size}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Format Comparison */}
        <section className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-6">Format Comparison (Fox @ 64px)</h2>
          
          <div className="flex flex-wrap gap-8">
            {FORMATS.map(format => (
              <div key={format} className="text-center">
                <div className={`inline-flex items-center justify-center p-4 rounded border-2 ${selectedFormat === format ? 'border-blue-500' : 'border-transparent'}`}>
                  <MascotAssetEnhanced
                    mascot="fox"
                    size={64}
                    format={format}
                    animate={animate}
                    animation={animation}
                  />
                </div>
                <p className="text-sm mt-2 font-medium">{format.toUpperCase()}</p>
                <button
                  onClick={() => setSelectedFormat(format)}
                  className="text-xs mt-1 text-blue-500 hover:underline"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Animation Showcase */}
        <section className={`rounded-lg p-6 mb-8 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-6">Animation Showcase</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ANIMATIONS.map(anim => (
              <div key={anim} className="text-center">
                <h3 className="text-lg font-medium mb-4 capitalize">{anim}</h3>
                <div className="flex justify-center gap-4">
                  {MASCOTS.slice(0, 2).map(mascot => (
                    <MascotAssetEnhanced
                      key={mascot}
                      mascot={mascot}
                      size={96}
                      format={selectedFormat}
                      animate={true}
                      animation={anim}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Info */}
        <section className={`rounded-lg p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm opacity-70">
            <div>
              <h4 className="font-medium mb-2">Usage</h4>
              <code className="block bg-black/10 p-2 rounded">
                {`<MascotAssetEnhanced mascot="fox" size={128} format="${selectedFormat}" />`}
              </code>
            </div>
            <div>
              <h4 className="font-medium mb-2">Format Info</h4>
              <ul className="space-y-1">
                <li><strong>SVG</strong>: Scalable, crisp at any size</li>
                <li><strong>PNG</strong>: Pixel-perfect raster</li>
                <li><strong>CSS</strong>: Zero dependencies, pure CSS</li>
                <li><strong>Auto</strong>: Selects best format for size</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MascotPreview;
