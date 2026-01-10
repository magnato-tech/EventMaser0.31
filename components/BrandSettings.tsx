import React, { useState, useEffect } from 'react';
import { BrandSettings, AppState } from '../types';
import { applyBrandSettings, DEFAULT_BRAND_SETTINGS, hexToHsl, hslToHex } from '../utils/brandUtils';
import { Palette, RotateCcw, Save } from 'lucide-react';

interface Props {
  db: AppState;
  setDb: React.Dispatch<React.SetStateAction<AppState>>;
}

/**
 * Predefined color presets for common brand colors
 */
const COLOR_PRESETS = [
  { name: 'Indigo (Standard)', hue: 221.2, saturation: 83.2, lightness: 53.3, hex: '#4f46e5' },
  { name: 'Blå', hue: 217, saturation: 91, lightness: 60, hex: '#2563eb' },
  { name: 'Lilla', hue: 262, saturation: 83, lightness: 58, hex: '#8b5cf6' },
  { name: 'Grønn', hue: 142, saturation: 71, lightness: 45, hex: '#16a34a' },
  { name: 'Rød', hue: 0, saturation: 84, lightness: 60, hex: '#dc2626' },
  { name: 'Oransje', hue: 25, saturation: 95, lightness: 53, hex: '#ea580c' },
  { name: 'Teal', hue: 173, saturation: 80, lightness: 40, hex: '#0d9488' },
  { name: 'Rose', hue: 346, saturation: 77, lightness: 53, hex: '#e11d48' },
];

const BrandSettings: React.FC<Props> = ({ db, setDb }) => {
  const currentSettings = db.brandSettings || DEFAULT_BRAND_SETTINGS;
  
  const [hue, setHue] = useState(currentSettings.primaryColor.hue);
  const [saturation, setSaturation] = useState(currentSettings.primaryColor.saturation);
  const [lightness, setLightness] = useState(currentSettings.primaryColor.lightness);
  const [organizationName, setOrganizationName] = useState(currentSettings.organizationName || '');
  
  // Apply changes immediately to preview
  useEffect(() => {
    const tempSettings: BrandSettings = {
      primaryColor: { hue, saturation, lightness },
      organizationName: organizationName || undefined
    };
    applyBrandSettings(tempSettings);
  }, [hue, saturation, lightness, organizationName]);

  const handleSave = () => {
    const newSettings: BrandSettings = {
      primaryColor: { hue, saturation, lightness },
      organizationName: organizationName || undefined
    };
    
    setDb(prev => ({
      ...prev,
      brandSettings: newSettings
    }));
    
    // Persist to localStorage via App.tsx useEffect
    alert('Brand-innstillinger lagret!');
  };

  const handleReset = () => {
    setHue(DEFAULT_BRAND_SETTINGS.primaryColor.hue);
    setSaturation(DEFAULT_BRAND_SETTINGS.primaryColor.saturation);
    setLightness(DEFAULT_BRAND_SETTINGS.primaryColor.lightness);
    setOrganizationName(DEFAULT_BRAND_SETTINGS.organizationName || '');
    applyBrandSettings(DEFAULT_BRAND_SETTINGS);
    
    // Lagre reset-innstillinger til db
    setDb(prev => ({
      ...prev,
      brandSettings: DEFAULT_BRAND_SETTINGS
    }));
    
    alert('Brand-innstillinger tilbakestilt til standard (Indigo)!');
  };

  const handlePresetSelect = (preset: typeof COLOR_PRESETS[0]) => {
    setHue(preset.hue);
    setSaturation(preset.saturation);
    setLightness(preset.lightness);
  };

  const handleHexChange = (hex: string) => {
    if (hex.match(/^#[0-9A-Fa-f]{6}$/)) {
      const hsl = hexToHsl(hex);
      setHue(hsl.hue);
      setSaturation(hsl.saturation);
      setLightness(hsl.lightness);
    }
  };

  const currentHex = hslToHex(hue, saturation, lightness);
  const currentColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800">Brand & Farger</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tilpass appens farger til menighetens profil</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Organisasjonsnavn (valgfritt)
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="EventMaster LMK"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          {/* Color Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Forhåndsvisning
            </label>
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-lg border-2 border-slate-200 shadow-sm"
                style={{ backgroundColor: currentColor }}
              />
              <div className="flex-1">
                <div className="text-xs font-mono text-slate-600 mb-1">
                  HSL: {Math.round(hue)}, {Math.round(saturation)}%, {Math.round(lightness)}%
                </div>
                <div className="text-xs font-mono text-slate-600">
                  Hex: {currentHex.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-3">
              Fargepresets
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-200 hover:border-slate-400 transition-colors"
                  title={preset.name}
                >
                  <div 
                    className="w-full h-8 rounded"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">
                    {preset.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* HSL Sliders */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Hue (Fargetone): {Math.round(hue)}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Saturation (Metning): {Math.round(saturation)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Lightness (Lyshet): {Math.round(lightness)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={lightness}
                onChange={(e) => setLightness(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
              />
            </div>
          </div>

          {/* Hex Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Hex-kode (f.eks. #4f46e5)
            </label>
            <input
              type="text"
              value={currentHex}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#4f46e5"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Save size={16} />
              Lagre innstillinger
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={16} />
              Tilbakestill
            </button>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h4 className="text-xs font-bold text-slate-800 mb-3">Eksempler på bruk</h4>
        <div className="space-y-2 text-xs text-slate-600">
          <p>Fargene vil automatisk oppdateres i:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Aktive navigasjons-knapper og lenker</li>
            <li>Fokus-stater på input-felter</li>
            <li>Primære knapper og handlinger</li>
            <li>Høydepunkter og markeringer</li>
          </ul>
          <p className="mt-3 text-[10px] text-slate-500">
            Merk: Endringer lagres lokalt i nettleseren. Ved Supabase-integrasjon vil disse lagres i databasen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandSettings;

