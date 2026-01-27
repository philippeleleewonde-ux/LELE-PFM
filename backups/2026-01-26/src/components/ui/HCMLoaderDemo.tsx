import { HCMLoader } from './HCMLoader';

/**
 * Demo component to showcase the HCM Loader animation
 * This component can be imported to test the loader in isolation
 */
export function HCMLoaderDemo() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-12 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">HCM Loader Animation Demo</h1>
        <p className="text-muted-foreground">
          Animation de chargement basée sur le logo HCM
        </p>
      </div>

      {/* Default size with text */}
      <div className="border border-border rounded-lg p-8 bg-card">
        <h2 className="text-xl font-semibold mb-4 text-center">Taille par défaut (80px)</h2>
        <HCMLoader />
      </div>

      {/* Large size */}
      <div className="border border-border rounded-lg p-8 bg-card">
        <h2 className="text-xl font-semibold mb-4 text-center">Grande taille (120px)</h2>
        <HCMLoader
          size={120}
          text="Chargement en cours..."
        />
      </div>

      {/* Small size without text */}
      <div className="border border-border rounded-lg p-8 bg-card">
        <h2 className="text-xl font-semibold mb-4 text-center">Petite taille (60px) - Sans texte</h2>
        <HCMLoader
          size={60}
          text=""
        />
      </div>

      {/* Custom text */}
      <div className="border border-border rounded-lg p-8 bg-card">
        <h2 className="text-xl font-semibold mb-4 text-center">Taille moyenne (96px) - Texte personnalisé</h2>
        <HCMLoader
          size={96}
          text="Vérification des permissions..."
        />
      </div>

      {/* Implementation info */}
      <div className="max-w-2xl border border-border rounded-lg p-6 bg-card space-y-4">
        <h2 className="text-xl font-semibold">Caractéristiques de l'animation</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>Cercle divisé en deux arcs (haut et bas) qui tournent avec effet de pulsation</li>
          <li>Chevrons gauche et droite qui se déplacent horizontalement</li>
          <li>Ligne horizontale centrale représentant la division du logo</li>
          <li>Effet de lueur pulsante en arrière-plan</li>
          <li>Animation synchronisée avec plusieurs timings pour un effet fluide</li>
          <li>Respecte le thème clair/sombre de l'application</li>
          <li>Taille personnalisable (prop: size)</li>
          <li>Texte personnalisable (prop: text)</li>
        </ul>
      </div>
    </div>
  );
}

export default HCMLoaderDemo;
