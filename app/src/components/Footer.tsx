export function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-[1280px] sm:flex sm:items-start sm:justify-between sm:gap-8">
        <div className="max-w-xl">
          <p className="text-sm text-gray-600">
            <strong>Data disclaimer:</strong> Impression data is real
            (DSA-mandated disclosure from Snapchat's EU Ad Library). Spend
            estimates use published CPM benchmarks (€4–9 range) and are
            approximate. This report is a prototype — not a production
            analytics product.
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
