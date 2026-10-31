import React, { createContext, useContext, useState } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Top Bar & Navigation
    'app.title': 'Mudae Tools',
    'app.subtitle': 'Utilidades y Solucionadores',
    'nav.colorPicker': 'Color Picker',
    'nav.ouroChest': '$oc Solver',
    'nav.listSplitter': 'Divisor de Listas',
    'nav.imageCropper': 'Recortador de Imágenes',
    'comingSoon': 'Próximamente disponible',
    'footer.designedFor': 'Diseñado para la comunidad de Discord y Mudae',

    // Placeholders
    'splitter.desc': 'Herramienta para dividir listas largas de personajes de Mudae en bloques compatibles con el límite de 2000 caracteres de Discord.',
    'cropper.desc': 'Herramienta para recortar y optimizar imágenes con las dimensiones exactas recomendadas para el bot Mudae.',

    // Color Picker Tool
    'cp.headerTitle': 'Selector de Color para Embeds de Mudae',
    'cp.headerDesc': 'Obtén los códigos hexadecimales ideales para personalizar el color del marco de tus personajes en Discord.',
    'cp.step1': 'Ejecuta en Discord el comando',
    'cp.step1Copy': 'Clic para copiar',
    'cp.step2': 'Copia el texto que devuelve Mudae y pégalo en el recuadro.',
    'cp.step3': 'Haz clic en "Extraer Colores" y personaliza cada embed con un solo clic.',
    'cp.pasteLabel': 'Pega el texto de Mudae aquí:',
    'cp.btnExtract': 'Extraer Colores',
    'cp.btnExtracting': 'Procesando imágenes...',
    'cp.btnClear': 'Limpiar',
    'cp.charactersFound': 'personajes procesados',
    'cp.copyAll': 'Copiar todos los comandos',
    'cp.allCopied': '¡Todos copiados!',
    'cp.embedCommand': 'Comando de color',
    'cp.copied': '¡Copiado!',
    'cp.copy': 'Copiar',
    'cp.palette': 'Paleta extraída:',
    'cp.customColor': 'Color personalizado:',

    // $oc Solver
    'oc.title': '$oc Solver • Ouro Chest',
    'oc.attempts': 'intentos',
    'oc.resetBoard': 'Reiniciar Tablero',
    'oc.leftClick': 'Clic Izquierdo:',
    'oc.rightClick': 'Clic Derecho:',
    'oc.reverseOrder': 'Orden inverso',
    'oc.phase1': 'Fase 1: Encontrar Esfera Roja',
    'oc.phase2': 'Fase 2: Maximizar Puntos',
    'oc.lookingPoints': 'Buscando Naranja/Amarilla ({count} tiros rest.)',
    'oc.noCompatible': 'Sin celdas compatibles',
    'oc.possibleReds': '{count} posibles celdas rojas',
    'oc.invalidDistribution': 'Distribución imposible',
    'oc.invalidTitle': 'Distribución Inválida según las reglas de Mudae',
    'oc.invalidDesc': 'Esta configuración es imposible según las limitaciones del juego (por ejemplo, una esfera amarilla no puede estar en la misma fila/columna ortogonal que la roja, o las pistas se contradicen entre sí). Por favor corrige las casillas ingresadas.',
    'oc.optimal': 'Óptimo',
    'oc.pointsBadge': '★ Puntos',
    'oc.probe': 'Sondeo',
    'oc.center': 'Centro\n(X)',
    'oc.centerTooltip': 'Centro: nunca es roja',
    'oc.lockedTooltip': 'Límite alcanzado (5/5 intentos usados). Haz clic en una celda revelada para cambiarla o reinicia.',
    'oc.clickToCycle': 'Clic para cambiar',
    'oc.advicePhase1': 'La celda resaltada en verde/teal es la recomendación óptima para encontrar la esfera roja en el menor número de intentos.',
    'oc.advicePhase2': '¡Esfera roja asegurada! El solver ahora prioriza las casillas con mayor probabilidad de contener Naranja (2 esferas adyacentes) y Amarilla (3 esferas diagonales) para maximizar tu puntuación.',

    // $oc Solver Sidebar
    'oc.recTitle': 'Recomendación',
    'oc.recModePhase2': 'Modo: Maximizar Puntos',
    'oc.recPossibleCount': 'Ubicaciones rojas posibles: {count}/24',
    'oc.bestMove': 'Mejor Movimiento:',
    'oc.rowCol': 'Fila {r}, Columna {c}',
    'oc.orHighlighted': '(o cualquier celda resaltada en el tablero)',
    'oc.evScore': 'EV ESPERADO:',
    'oc.redProb': 'PROB ROJA:',
    'oc.ev': 'EV:',
    'oc.noMoves': 'No hay movimientos disponibles',
    'oc.boardInconsistent': '⚠ Tablero inconsistente: corrige las celdas en conflicto',
    'oc.likelyRedsTitle': 'Ubicaciones Probables de la Roja',
    'oc.candidatesCount': '{count} candidatas',
    'oc.redFoundAt': '✓ Roja localizada en Fila {r}, Columna {c}',

    // Sphere Hierarchy
    'oc.hierarchyTitle': 'Jerarquía de Valor (Puntuación)',
    'oc.hierarchyOrder': 'Menor → Mayor',

    // Sphere Names & Descriptions
    'sphere.red': 'Roja (Objetivo)',
    'sphere.orange': 'Naranja',
    'sphere.yellow': 'Amarilla',
    'sphere.green': 'Verde',
    'sphere.teal': 'Turquesa',
    'sphere.blue': 'Azul',
    'sphere.hidden': 'Oculta',

    // How to Use
    'oc.howToUseTitle': 'Cómo usar el Solucionador $oc',
    'oc.step1Title': 'Clic para alternar colores',
    'oc.step1Desc': 'Haz clic en una casilla para alternar entre los colores disponibles. El clic derecho los cicla en orden inverso.',
    'oc.step2Title': 'Probabilidades en vivo',
    'oc.step2Desc': 'Cada casilla vacía muestra su probabilidad exacta de contener la esfera ROJA; las casillas imposibles se atenúan al 0%.',
    'oc.step3Title': 'Recomendaciones de Valor Esperado',
    'oc.step3Desc': 'La casilla resaltada es la jugada con mejor valor esperado o sondeo estratégico. Consulta el panel lateral para más detalles.',
    'oc.step4Title': 'Reinicia en cualquier momento',
    'oc.step4Desc': 'Para reiniciar el tablero y empezar una nueva partida, haz clic en "Reiniciar Tablero" en la parte superior.',

    // Image Cropper
    'cropper.title': 'Recortador & Optimizador de Imágenes Mudae',
    'cropper.subtitle': 'Recorta, optimiza y previsualiza tus imágenes para $im y $aim con las proporciones ideales de Discord.',
    'cropper.tabUrl': 'Pegar Enlace / URL',
    'cropper.tabUpload': 'Subir Archivo Local',
    'cropper.pasteUrlPlaceholder': 'Pega aquí el enlace de la imagen (Discord, Mudae, Imgur, etc.)...',
    'cropper.sampleTitle': 'O prueba con una imagen de ejemplo:',
    'cropper.loadFromUrlBtn': 'Cargar desde Enlace',
    'cropper.changeFromUrl': 'Cargar Enlace',
    'cropper.changeFromFile': 'Subir Archivo',
    'cropper.urlHelper': 'Soporta enlaces de Discord, Mudae, Imgur, Pinterest, etc. Si pegas texto como "Nombre - Serie URL", se completarán automáticamente.',
    'cropper.dropzoneTitle': 'Arrastra y suelta tu imagen aquí',
    'cropper.dropzoneSub': 'o haz clic para seleccionar un archivo (PNG, JPG, WebP, GIF)',
    'cropper.pasteHint': 'También puedes pegar directamente con Ctrl + V',
    'cropper.orUrl': 'O pega un enlace de imagen directo:',
    'cropper.urlPlaceholder': 'https://ejemplo.com/imagen.png',
    'cropper.loadBtn': 'Cargar URL',
    'cropper.changeImage': 'Cambiar Imagen',
    'cropper.aspectRatio': 'Relación de Aspecto',
    'cropper.aspectMudae': 'Mudae Roll (9:14)',
    'cropper.aspectPortrait': 'Retrato (2:3)',
    'cropper.aspectAnime': 'Pantalla Completa (9:16)',
    'cropper.aspectClassic': 'Clásico (3:4)',
    'cropper.aspectSquare': 'Cuadrado (1:1)',
    'cropper.aspectFree': 'Libre',
    'cropper.zoom': 'Zoom',
    'cropper.rotate': 'Rotar',
    'cropper.flipH': 'Espejo H',
    'cropper.flipV': 'Espejo V',
    'cropper.reset': 'Restablecer',
    'cropper.resolutionPreset': 'Resolución de Salida',
    'cropper.resMudaeStandard': 'Mudae Estándar (225 × 350 px)',
    'cropper.resMudaeHD': 'Mudae HD (450 × 700 px)',
    'cropper.resOriginal': 'Resolución Nativa del Recorte',
    'cropper.format': 'Formato de Salida',
    'cropper.quality': 'Calidad de Imagen',
    'cropper.copyImage': 'Copiar Imagen al Portapapeles',
    'cropper.copyImageSuccess': '¡Imagen copiada! Pégala en Discord con Ctrl+V',
    'cropper.downloadImage': 'Descargar Imagen',
    'cropper.previewTitle': 'Vista Previa en Discord Embed',
    'cropper.previewDesc': 'Así se verá exactamente tu imagen dentro del embed de Mudae.',
    'cropper.charName': 'Nombre del Personaje',
    'cropper.charSeries': 'Serie / Anime',
    'cropper.embedBorder': 'Color del Marco (Hex)',
    'cropper.commandHelper': 'Comandos de Mudae',
    'cropper.commandAim': 'Añadir imagen a personaje ($aim)',
    'cropper.commandIm': 'Establecer imagen principal ($im)',
    'cropper.copied': '¡Copiado!',
    'cropper.fileSize': 'Peso estimado:',
    'cropper.outputDimensions': 'Dimensiones de salida:',
  },
  en: {
    // Top Bar & Navigation
    'app.title': 'Mudae Tools',
    'app.subtitle': 'Utilities & Solvers',
    'nav.colorPicker': 'Color Picker',
    'nav.ouroChest': '$oc Solver',
    'nav.listSplitter': 'List Splitter',
    'nav.imageCropper': 'Image Cropper',
    'comingSoon': 'Coming Soon',
    'footer.designedFor': 'Designed for the Discord & Mudae Community',

    // Placeholders
    'splitter.desc': 'Tool to split long lists of Mudae characters into chunks compliant with Discord 2000-character limit.',
    'cropper.desc': 'Tool to crop and optimize character images to the exact dimensions recommended for the Mudae bot.',

    // Color Picker Tool
    'cp.headerTitle': 'Mudae Discord Embed Color Picker',
    'cp.headerDesc': 'Get optimal hex color codes from character images to customize your embed borders on Discord.',
    'cp.step1': 'Run this command in Discord:',
    'cp.step1Copy': 'Click to copy',
    'cp.step2': 'Copy the text returned by Mudae and paste it in the box below.',
    'cp.step3': 'Click "Extract Colors" and customize each character with one click.',
    'cp.pasteLabel': 'Paste Mudae text here:',
    'cp.btnExtract': 'Extract Colors',
    'cp.btnExtracting': 'Processing images...',
    'cp.btnClear': 'Clear',
    'cp.charactersFound': 'characters processed',
    'cp.copyAll': 'Copy All Commands',
    'cp.allCopied': 'All copied!',
    'cp.embedCommand': 'Embed command',
    'cp.copied': 'Copied!',
    'cp.copy': 'Copy',
    'cp.palette': 'Extracted palette:',
    'cp.customColor': 'Custom color:',

    // $oc Solver
    'oc.title': '$oc Solver • Ouro Chest',
    'oc.attempts': 'attempts',
    'oc.resetBoard': 'Reset Board',
    'oc.leftClick': 'Left Click:',
    'oc.rightClick': 'Right Click:',
    'oc.reverseOrder': 'Reverse order',
    'oc.phase1': 'Phase 1: Find Red Sphere',
    'oc.phase2': 'Phase 2: Maximize Points',
    'oc.lookingPoints': 'Searching Orange/Yellow ({count} shots left)',
    'oc.noCompatible': 'No compatible cells',
    'oc.possibleReds': '{count} possible red cells',
    'oc.invalidDistribution': 'Impossible layout',
    'oc.invalidTitle': 'Invalid layout according to Mudae rules',
    'oc.invalidDesc': 'This configuration is impossible under the game rules (e.g. a yellow sphere cannot be on the same orthogonal row/col as the red sphere, or clues contradict each other). Please adjust the cells.',
    'oc.optimal': 'Optimal',
    'oc.pointsBadge': '★ Points',
    'oc.probe': 'Probe',
    'oc.center': 'Center\n(X)',
    'oc.centerTooltip': 'Center: never contains Red',
    'oc.lockedTooltip': 'Limit reached (5/5 attempts used). Click an existing revealed cell to change it or reset.',
    'oc.clickToCycle': 'Click to change',
    'oc.advicePhase1': 'The highlighted teal cell is the optimal recommendation to discover the red sphere in the minimum number of attempts.',
    'oc.advicePhase2': 'Red sphere confirmed! The solver now prioritizes cells with highest probability of Orange (2 adjacent) and Yellow (3 diagonal) to maximize your score.',

    // $oc Solver Sidebar
    'oc.recTitle': 'Recommendation',
    'oc.recModePhase2': 'Mode: Maximize Points',
    'oc.recPossibleCount': 'Possible Red Locations: {count}/24',
    'oc.bestMove': 'Best Move:',
    'oc.rowCol': 'Row {r}, Col {c}',
    'oc.orHighlighted': '(or any highlighted cell on the board)',
    'oc.evScore': 'EV ESPERADO:',
    'oc.redProb': 'RED PROB:',
    'oc.ev': 'EV:',
    'oc.noMoves': 'No moves available',
    'oc.boardInconsistent': '⚠ Board conflict: please adjust conflicting cells',
    'oc.likelyRedsTitle': 'Likely Red Locations',
    'oc.candidatesCount': '{count} candidates',
    'oc.redFoundAt': '✓ Red located at Row {r}, Col {c}',

    // Sphere Hierarchy
    'oc.hierarchyTitle': 'Value Hierarchy (Points)',
    'oc.hierarchyOrder': 'Low → High',

    // Sphere Names & Descriptions
    'sphere.red': 'Red (Target)',
    'sphere.orange': 'Orange',
    'sphere.yellow': 'Yellow',
    'sphere.green': 'Green',
    'sphere.teal': 'Teal',
    'sphere.blue': 'Blue',
    'sphere.hidden': 'Hidden',

    // How to Use
    'oc.howToUseTitle': 'How to use $oc Solver',
    'oc.step1Title': 'Click to cycle colors',
    'oc.step1Desc': 'Click on a cell to cycle through available colors. Right-click cycles the colors in reverse.',
    'oc.step2Title': 'Live probability updates',
    'oc.step2Desc': 'Each empty cell shows its live probability of hiding the RED sphere; impossible cells are dimmed at 0%.',
    'oc.step3Title': 'Expected-value recommendations',
    'oc.step3Desc': 'The highlighted cell is the expected-value best move (or strategic bisection probe). Check the sidebar for details.',
    'oc.step4Title': 'Reset anytime',
    'oc.step4Desc': 'To clear the board and start a new game press "Reset Board" at the top.',

    // Image Cropper
    'cropper.title': 'Mudae Image Cropper & Optimizer',
    'cropper.subtitle': 'Crop, optimize, and preview your character images for $im and $aim with ideal Discord embed proportions.',
    'cropper.tabUrl': 'Paste Link / URL',
    'cropper.tabUpload': 'Upload Local File',
    'cropper.pasteUrlPlaceholder': 'Paste image link or Mudae text here (Discord, Mudae, Imgur, etc.)...',
    'cropper.sampleTitle': 'Or try a sample character:',
    'cropper.loadFromUrlBtn': 'Load from Link',
    'cropper.changeFromUrl': 'Load Link',
    'cropper.changeFromFile': 'Upload File',
    'cropper.urlHelper': 'Supports Discord, Mudae, Imgur, Pinterest, etc. links. If you paste "Name - Series URL", it will auto-populate.',
    'cropper.dropzoneTitle': 'Drag and drop your image here',
    'cropper.dropzoneSub': 'or click to browse a file (PNG, JPG, WebP, GIF)',
    'cropper.pasteHint': 'You can also paste directly with Ctrl + V',
    'cropper.orUrl': 'Or paste a direct image URL:',
    'cropper.urlPlaceholder': 'https://example.com/image.png',
    'cropper.loadBtn': 'Load URL',
    'cropper.changeImage': 'Change Image',
    'cropper.aspectRatio': 'Aspect Ratio',
    'cropper.aspectMudae': 'Mudae Roll (9:14)',
    'cropper.aspectPortrait': 'Portrait (2:3)',
    'cropper.aspectAnime': 'Full Portrait (9:16)',
    'cropper.aspectClassic': 'Classic (3:4)',
    'cropper.aspectSquare': 'Square (1:1)',
    'cropper.aspectFree': 'Free',
    'cropper.zoom': 'Zoom',
    'cropper.rotate': 'Rotate',
    'cropper.flipH': 'Flip H',
    'cropper.flipV': 'Flip V',
    'cropper.reset': 'Reset',
    'cropper.resolutionPreset': 'Output Resolution',
    'cropper.resMudaeStandard': 'Mudae Standard (225 × 350 px)',
    'cropper.resMudaeHD': 'Mudae HD (450 × 700 px)',
    'cropper.resOriginal': 'Original Crop Resolution',
    'cropper.format': 'Output Format',
    'cropper.quality': 'Image Quality',
    'cropper.copyImage': 'Copy Image to Clipboard',
    'cropper.copyImageSuccess': 'Image copied! Paste in Discord with Ctrl+V',
    'cropper.downloadImage': 'Download Image',
    'cropper.previewTitle': 'Discord Embed Live Preview',
    'cropper.previewDesc': 'Exactly how your image will look inside a Mudae embed.',
    'cropper.charName': 'Character Name',
    'cropper.charSeries': 'Series / Anime',
    'cropper.embedBorder': 'Embed Border Color (Hex)',
    'cropper.commandHelper': 'Mudae Commands',
    'cropper.commandAim': 'Add image to character ($aim)',
    'cropper.commandIm': 'Set main character image ($im)',
    'cropper.copied': 'Copied!',
    'cropper.fileSize': 'Estimated size:',
    'cropper.outputDimensions': 'Output dimensions:',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  t: (key: string, params?: Record<string, string | number>) => {
    let str = key;
    if (params) {
      Object.entries(params).forEach(([k, val]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
      });
    }
    return str;
  },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mudae_tools_lang');
    return saved === 'en' ? 'en' : 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mudae_tools_lang', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations['es']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, val]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
