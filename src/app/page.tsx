import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-8">
        {/* MoMA wordmark */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight">MoMA</h1>
          <p className="text-lg text-gray-500 font-light">Explorer</p>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">
          Your personal companion for the Museum of Modern Art.
          Explore galleries, discover hidden gems, and relive your visit.
        </p>

        <div className="space-y-3">
          <Link
            href="/map"
            className="block w-full bg-[var(--moma-black)] text-white py-3.5 px-6 rounded-xl font-semibold text-center hover:bg-gray-800 transition-colors"
          >
            Start Exploring
          </Link>
          <Link
            href="/wrapped"
            className="block w-full border-2 border-[var(--moma-black)] text-[var(--moma-black)] py-3.5 px-6 rounded-xl font-semibold text-center hover:bg-gray-50 transition-colors"
          >
            View My Wrapped
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <div className="text-2xl font-black">50+</div>
            <div className="text-xs text-gray-500">Artworks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black">3</div>
            <div className="text-xs text-gray-500">Floors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black">40+</div>
            <div className="text-xs text-gray-500">Galleries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
