import React, { useState } from 'react';
import { Download, CheckCircle2, Share, PlusSquare, X, Smartphone, Globe, Github } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [showGithubGuide, setShowGithubGuide] = useState<boolean>(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      await install();
    } else {
      // If browser doesn't expose beforeinstallprompt (e.g. desktop Chrome already showing omnibox or non-supporting context)
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* PWA Install Button */}
        {isInstalled ? (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PWA Terpasang</span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            id="pwa-install-header-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition active:scale-95 border border-rose-400/40"
            title="Pasang aplikasi ke layar utama ponsel atau komputer (PWA)"
          >
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden sm:inline">Pasang PWA</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {/* GitHub Pages Deploy Guide Button */}
        <button
          onClick={() => setShowGithubGuide(true)}
          id="github-deploy-guide-btn"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
          title="Panduan Deploy ke GitHub Pages Publik"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Panduan GitHub Pages</span>
        </button>
      </div>

      {/* iOS / Manual Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Pasang Aplikasi VulkanoTrack
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aplikasi Web Progresif (PWA) Bebas Kuota
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                Aplikasi ini mendukung instalasi penuh ke layar utama perangkat Anda (Android, iPhone, iPad, Windows, & Mac) dan dapat bekerja secara offline:
              </p>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                <div className="font-bold text-slate-200">Untuk Pengguna iPhone / iPad (Safari):</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li className="flex items-center gap-2">
                    <span>1. Ketuk ikon Bagikan</span>
                    <Share className="w-3.5 h-3.5 text-sky-400 inline" />
                    <span>di bilah bawah Safari.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>2. Gulir dan pilih</span>
                    <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
                    <strong className="text-white">"Add to Home Screen"</strong>.
                  </li>
                  <li>3. Ketuk <strong>"Add"</strong> di pojok kanan atas.</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                <div className="font-bold text-slate-200">Untuk Pengguna Android & Chrome Desktop:</div>
                <p>
                  Ketuk menu tiga titik (⋮) di peramban Chrome / Edge, lalu pilih <strong>"Install app"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowIOSModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Pages Deployment Guide Modal */}
      {showGithubGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-800 text-slate-200 rounded-xl border border-slate-700">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Panduan Deploy ke GitHub Pages (Akses Publik Gratis)
                  </h3>
                  <p className="text-xs text-emerald-400">
                    Aplikasi siap di-build menjadi website statis PWA murni
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGithubGuide(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-4 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                Aplikasi telah dikonfigurasi dengan <strong>relative base path (<code className="bg-emerald-950 px-1 py-0.5 rounded">base: './'</code>)</strong> dan penanganan data offline. Ketika di-deploy ke GitHub Pages, seluruh visualisasi peta, grafik seismometer 60 FPS, sirene peringatan, dan pembaruan telemetri otomatis tetap berjalan lancar 100% tanpa memerlukan server backend berbayar!
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">Langkah 1: Export / Download Proyek</h4>
                <p className="text-slate-400">
                  Unduh kode sumber aplikasi ini melalui menu <strong>Settings &gt; Export to GitHub</strong> atau <strong>Download ZIP</strong> di pojok kanan atas AI Studio.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">Langkah 2: Buat Repositori di GitHub</h4>
                <p className="text-slate-400">
                  Buka <strong>github.com/new</strong> dan buat repositori baru (misal dengan nama <code className="bg-slate-800 text-rose-300 px-1.5 py-0.5 rounded">volcanotrack-indonesia</code>), pilih status <strong>Public</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">Langkah 3: Jalankan Build Statis</h4>
                <p className="text-slate-400 mb-2">
                  Di komputer lokal Anda, jalankan perintah:
                </p>
                <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-amber-300 border border-slate-800">
                  npm install<br />
                  npm run build
                </div>
                <p className="text-slate-400 mt-1">
                  Hasil kompilasi siap publikasi akan berada di dalam folder <code className="text-slate-200 font-mono">dist/</code> lengkap dengan Service Worker PWA dan manifest web.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">Langkah 4: Publikasikan ke GitHub Pages (Otomatis)</h4>
                <p className="text-slate-400 mb-2">
                  Anda dapat menggunakan package <code className="text-slate-200 font-mono">gh-pages</code> atau alur GitHub Actions workflow (.github/workflows/deploy.yml yang sudah kami sediakan di dalam proyek ini).
                </p>
                <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-sky-300 border border-slate-800">
                  # Opsi menggunakan gh-pages:<br />
                  npx gh-pages -d dist
                </div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="font-bold text-white block mb-1">Hasil Akhir:</span>
                <p className="text-slate-300">
                  Website Anda akan aktif di alamat: <br />
                  <span className="font-mono text-emerald-400 font-bold">https://&lt;username-anda&gt;.github.io/&lt;nama-repo&gt;/</span><br />
                  Siap diakses publik dari ponsel, tablet, atau komputer manapun di seluruh dunia!
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGithubGuide(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
