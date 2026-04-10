export function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-[1280px] sm:flex sm:items-start sm:justify-between sm:gap-8">
        <div className="max-w-xl">
          <p className="text-sm text-gray-600">
            <strong>Data source:</strong> Snapchat Political Ads Library — bulk
            CSV download, 2018–2026. Spend figures are actual disclosed amounts
            (not estimates). Multi-currency data normalized to USD using
            approximate FX rates (NOK 10.7, SEK 10.4, DKK 6.9, EUR 0.92, GBP
            0.79, AUD 1.53, CAD 1.36, INR 83.5). Population figures from
            national statistics offices (2024).
          </p>
        </div>
        <div className="mt-4 shrink-0 sm:mt-0 sm:text-right">
          <p className="text-sm font-semibold text-gray-900">Ravineo</p>
          <p className="text-xs text-gray-600">Transparency in Digital Media</p>
          <p className="mt-1 text-xs text-gray-300">
            © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
