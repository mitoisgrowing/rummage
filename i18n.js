// Rummage UI translations.
// The interface is written in English; this layer translates what is on screen (text, titles,
// placeholders) as it appears, so templates stay plain. User content (file, folder, plugin
// names, paths, tags) is never touched. Each row: English, Español, Français, Deutsch, Português, Italiano.
(() => {
const LANGS = { en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português', it: 'Italiano' };
const ORDER = ['es', 'fr', 'de', 'pt', 'it'];
const ROWS = [
  // navigation
  ['All', 'Todo', 'Tout', 'Alle', 'Tudo', 'Tutto'],
  ['Plugins', 'Plugins', 'Plugins', 'Plugins', 'Plugins', 'Plugin'],
  ['Presets', 'Presets', 'Presets', 'Presets', 'Presets', 'Preset'],
  ['Projects', 'Proyectos', 'Projets', 'Projekte', 'Projetos', 'Progetti'],
  ['Favorites', 'Favoritos', 'Favoris', 'Favoriten', 'Favoritos', 'Preferiti'],
  ['Recent', 'Recientes', 'Récents', 'Neu', 'Recentes', 'Recenti'],
  ['Library', 'Biblioteca', 'Bibliothèque', 'Bibliothek', 'Biblioteca', 'Libreria'],
  ['Folders', 'Carpetas', 'Dossiers', 'Ordner', 'Pastas', 'Cartelle'],
  ['Crates', 'Cajas', 'Bacs', 'Kisten', 'Caixas', 'Casse'],
  ['Searches', 'Búsquedas', 'Recherches', 'Suchen', 'Pesquisas', 'Ricerche'],
  ['New', 'Nueva', 'Nouveau', 'Neu', 'Nova', 'Nuova'],
  ['Dock', 'Acoplar', 'Ancrer', 'Andocken', 'Acoplar', 'Aggancia'],
  ['Settings', 'Ajustes', 'Réglages', 'Einstellungen', 'Ajustes', 'Impostazioni'],
  ['Samples', 'Samples', 'Samples', 'Samples', 'Samples', 'Campioni'],
  ['By type', 'Por tipo', 'Par type', 'Nach Typ', 'Por tipo', 'Per tipo'],
  ['List', 'Lista', 'Liste', 'Liste', 'Lista', 'Elenco'],
  ['Every sample sorted by type', 'Todos los samples ordenados por tipo', 'Tous les samples triés par type', 'Alle Samples nach Typ sortiert', 'Todos os samples ordenados por tipo', 'Tutti i campioni ordinati per tipo'],
  ['Show/hide sidebar', 'Mostrar u ocultar la barra lateral', 'Afficher ou masquer la barre latérale', 'Seitenleiste ein-/ausblenden', 'Mostrar ou ocultar a barra lateral', 'Mostra o nascondi la barra laterale'],
  ['Search samples, folders and plugins', 'Busca samples, carpetas y plugins', 'Chercher samples, dossiers et plugins', 'Samples, Ordner und Plugins suchen', 'Procure samples, pastas e plugins', 'Cerca campioni, cartelle e plugin'],
  ['Search…', 'Buscar…', 'Rechercher…', 'Suchen…', 'Procurar…', 'Cerca…'],
  ['save this search', 'guardar esta búsqueda', 'enregistrer cette recherche', 'diese Suche speichern', 'guardar esta pesquisa', 'salva questa ricerca'],
  ['Volume', 'Volumen', 'Volume', 'Lautstärke', 'Volume', 'Volume'],
  // list
  ['Change sort order', 'Cambiar el orden', "Changer l'ordre", 'Sortierung ändern', 'Mudar a ordem', "Cambia l'ordine"],
  ['Name ▾', 'Nombre ▾', 'Nom ▾', 'Name ▾', 'Nome ▾', 'Nome ▾'],
  ['Newest first ▾', 'Más nuevos ▾', 'Plus récents ▾', 'Neueste zuerst ▾', 'Mais recentes ▾', 'Più recenti ▾'],
  ['Tags', 'Etiquetas', 'Tags', 'Tags', 'Etiquetas', 'Tag'],
  ['Files', 'Archivos', 'Fichiers', 'Dateien', 'Ficheiros', 'File'],
  ['Hidden', 'Ocultos', 'Masqués', 'Ausgeblendet', 'Ocultos', 'Nascosti'],
  ['Loops', 'Loops', 'Boucles', 'Loops', 'Loops', 'Loop'],
  ['One-shots', 'One-shots', 'One-shots', 'One-Shots', 'One-shots', 'One-shot'],
  ['Kicks', 'Bombos', 'Kicks', 'Kicks', 'Bombos', 'Cassa'],
  ['Snares', 'Cajas', 'Caisses claires', 'Snares', 'Caixas', 'Rullante'],
  ['Claps', 'Palmas', 'Claps', 'Claps', 'Palmas', 'Clap'],
  ['Hi-hats', 'Charles', 'Charleys', 'Hi-Hats', 'Pratos de choque', 'Charleston'],
  ['Cymbals', 'Platillos', 'Cymbales', 'Becken', 'Pratos', 'Piatti'],
  ['Percussion', 'Percusión', 'Percussions', 'Percussion', 'Percussão', 'Percussioni'],
  ['Drums', 'Batería', 'Batterie', 'Drums', 'Bateria', 'Batteria'],
  ['Vocals', 'Voces', 'Voix', 'Vocals', 'Vozes', 'Voci'],
  ['Keys & Piano', 'Teclas y piano', 'Claviers et piano', 'Keys & Piano', 'Teclas e piano', 'Tastiere e piano'],
  ['Pads', 'Pads', 'Nappes', 'Pads', 'Pads', 'Pad'],
  ['Synths & Leads', 'Sintes y leads', 'Synthés et leads', 'Synths & Leads', 'Sintetizadores e leads', 'Synth e lead'],
  ['Guitars', 'Guitarras', 'Guitares', 'Gitarren', 'Guitarras', 'Chitarre'],
  ['Strings & Brass', 'Cuerdas y vientos', 'Cordes et cuivres', 'Streicher & Bläser', 'Cordas e metais', 'Archi e ottoni'],
  ['808s & Bass', '808 y bajos', '808 et basses', '808s & Bass', '808 e baixos', '808 e bassi'],
  ['Other', 'Otros', 'Autres', 'Sonstiges', 'Outros', 'Altro'],
  ['Nothing here. Try another search or add folders (⚙).', 'Aquí no hay nada. Prueba otra búsqueda o añade carpetas (⚙).', 'Rien ici. Essayez une autre recherche ou ajoutez des dossiers (⚙).', 'Hier ist nichts. Andere Suche probieren oder Ordner hinzufügen (⚙).', 'Nada aqui. Tente outra pesquisa ou adicione pastas (⚙).', 'Qui non c’è niente. Prova un’altra ricerca o aggiungi cartelle (⚙).'],
  ['Scanning plugins and samples...', 'Buscando plugins y samples…', 'Analyse des plugins et samples…', 'Plugins und Samples werden gescannt…', 'A procurar plugins e samples…', 'Scansione di plugin e campioni…'],
  // detail
  ['Select something to preview it', 'Elige algo para escucharlo', 'Choisissez un élément pour l’écouter', 'Etwas auswählen, um es anzuhören', 'Escolha algo para ouvir', 'Scegli qualcosa per ascoltarlo'],
  ['Add a tag, then Enter', 'Añade una etiqueta y pulsa Intro', 'Ajoutez un tag puis Entrée', 'Tag eingeben, dann Enter', 'Adicione uma etiqueta e prima Enter', 'Aggiungi un tag e premi Invio'],
  ['Add to Favorites', 'Añadir a favoritos', 'Ajouter aux favoris', 'Zu Favoriten hinzufügen', 'Adicionar aos favoritos', 'Aggiungi ai preferiti'],
  ['Remove from Favorites', 'Quitar de favoritos', 'Retirer des favoris', 'Aus Favoriten entfernen', 'Remover dos favoritos', 'Rimuovi dai preferiti'],
  ['Photograph this plugin\'s window now (open it in your DAW first)', 'Fotografiar ahora la ventana del plugin (ábrelo antes en tu DAW)', 'Photographier la fenêtre du plugin maintenant (ouvrez-le d’abord dans votre DAW)', 'Plugin-Fenster jetzt fotografieren (zuerst in der DAW öffnen)', 'Fotografar agora a janela do plugin (abra-o primeiro no DAW)', 'Fotografa ora la finestra del plugin (aprilo prima nella DAW)'],
  ['use an image file', 'usar una imagen', 'utiliser une image', 'Bilddatei verwenden', 'usar uma imagem', 'usa un’immagine'],
  ['Pitch: changes the key, not the speed', 'Tono: cambia la nota, no la velocidad', 'Hauteur : change la note, pas la vitesse', 'Tonhöhe: ändert die Tonart, nicht das Tempo', 'Tom: muda a nota, não a velocidade', 'Intonazione: cambia la nota, non la velocità'],
  ['Tempo: changes the speed, not the key · double-click = original', 'Tempo: cambia la velocidad, no la nota · doble clic = original', 'Tempo : change la vitesse, pas la note · double-clic = original', 'Tempo: ändert das Tempo, nicht die Tonart · Doppelklick = Original', 'Tempo: muda a velocidade, não a nota · duplo clique = original', 'Tempo: cambia la velocità, non la nota · doppio clic = originale'],
  ['Gain (dB) · double-click = 0', 'Ganancia (dB) · doble clic = 0', 'Gain (dB) · double-clic = 0', 'Gain (dB) · Doppelklick = 0', 'Ganho (dB) · duplo clique = 0', 'Guadagno (dB) · doppio clic = 0'],
  ['fine (cents)', 'fino (cents)', 'fin (cents)', 'fein (Cent)', 'fino (cents)', 'fine (centesimi)'],
  ['FL has no preset for this plugin: scan it once in FL', 'FL no tiene preset de este plugin: escanéalo una vez en FL', 'FL n’a pas de preset pour ce plugin : scannez-le une fois dans FL', 'FL hat kein Preset für dieses Plugin: einmal in FL scannen', 'O FL não tem preset deste plugin: analise-o uma vez no FL', 'FL non ha un preset per questo plugin: scansionalo una volta in FL'],
  // gallery
  ['All plugins', 'Todos los plugins', 'Tous les plugins', 'Alle Plugins', 'Todos os plugins', 'Tutti i plugin'],
  ['CATEGORY', 'CATEGORÍA', 'CATÉGORIE', 'KATEGORIE', 'CATEGORIA', 'CATEGORIA'],
  ['MAKER', 'FABRICANTE', 'FABRICANT', 'HERSTELLER', 'FABRICANTE', 'PRODUTTORE'],
  ['Show less', 'Ver menos', 'Voir moins', 'Weniger', 'Ver menos', 'Mostra meno'],
  ['Sort', 'Ordenar', 'Trier', 'Sortieren', 'Ordenar', 'Ordina'],
  ['Name', 'Nombre', 'Nom', 'Name', 'Nome', 'Nome'],
  ['Maker', 'Fabricante', 'Fabricant', 'Hersteller', 'Fabricante', 'Produttore'],
  ['Most used', 'Más usados', 'Plus utilisés', 'Meistgenutzt', 'Mais usados', 'Più usati'],
  ['Newest', 'Más nuevos', 'Plus récents', 'Neueste', 'Mais recentes', 'Più recenti'],
  ['Format', 'Formato', 'Format', 'Format', 'Formato', 'Formato'],
  ['Pictures', 'Fotos', 'Photos', 'Bilder', 'Fotos', 'Foto'],
  ['Take pictures of these plugins', 'Hacer fotos de estos plugins', 'Photographier ces plugins', 'Diese Plugins fotografieren', 'Fotografar estes plugins', 'Fotografa questi plugin'],
  ['No plugins here', 'No hay plugins aquí', 'Aucun plugin ici', 'Keine Plugins hier', 'Nenhum plugin aqui', 'Nessun plugin qui'],
  ['This filter is empty.', 'Este filtro está vacío.', 'Ce filtre est vide.', 'Dieser Filter ist leer.', 'Este filtro está vazio.', 'Questo filtro è vuoto.'],
  ['compressors', 'compresores', 'compresseurs', 'Kompressoren', 'compressores', 'compressori'],
  ['EQ / filters', 'EQ / filtros', 'EQ / filtres', 'EQ / Filter', 'EQ / filtros', 'EQ / filtri'],
  ['tuners', 'afinadores', 'accordeurs', 'Stimmgeräte', 'afinadores', 'accordatori'],
  ['reverb / delay', 'reverb / delay', 'réverb / délai', 'Hall / Delay', 'reverb / delay', 'riverbero / delay'],
  ['saturation', 'saturación', 'saturation', 'Sättigung', 'saturação', 'saturazione'],
  ['creative', 'creativos', 'créatifs', 'Kreativ', 'criativos', 'creativi'],
  ['utilities', 'utilidades', 'utilitaires', 'Werkzeuge', 'utilitários', 'utility'],
  ['synths', 'sintes', 'synthés', 'Synths', 'sintetizadores', 'synth'],
  ['other', 'otros', 'autres', 'Sonstiges', 'outros', 'altro'],
  ['Unknown', 'Desconocido', 'Inconnu', 'Unbekannt', 'Desconhecido', 'Sconosciuto'],
  ['Photographing your plugins', 'Fotografiando tus plugins', 'Photos de vos plugins en cours', 'Deine Plugins werden fotografiert', 'A fotografar os seus plugins', 'Sto fotografando i tuoi plugin'],
  ['All done', 'Listo', 'Terminé', 'Fertig', 'Concluído', 'Fatto'],
  ['Starting…', 'Empezando…', 'Démarrage…', 'Startet…', 'A iniciar…', 'Avvio…'],
  ['Stop', 'Parar', 'Arrêter', 'Stopp', 'Parar', 'Ferma'],
  ['Stopping…', 'Parando…', 'Arrêt…', 'Wird gestoppt…', 'A parar…', 'Arresto…'],
  ['Close', 'Cerrar', 'Fermer', 'Schließen', 'Fechar', 'Chiudi'],
  ['close', 'cerrar', 'fermer', 'schließen', 'fechar', 'chiudi'],
  ['Start', 'Empezar', 'Commencer', 'Starten', 'Começar', 'Inizia'],
  ['Capture plugin artwork', 'Fotografiar los plugins', 'Photographier les plugins', 'Plugins fotografieren', 'Fotografar os plugins', 'Fotografa i plugin'],
  ['Capture this plugin', 'Fotografiar este plugin', 'Photographier ce plugin', 'Dieses Plugin fotografieren', 'Fotografar este plugin', 'Fotografa questo plugin'],
  ['Rummage opens every VST3 plugin on its own, out of sight, and takes a picture of it. Your DAW and projects are not touched. About 2 seconds per plugin.', 'Rummage abre cada plugin VST3 por su cuenta, sin que se vea, y le hace una foto. Tu DAW y tus proyectos no se tocan. Unos 2 segundos por plugin.', 'Rummage ouvre chaque plugin VST3 seul, hors de vue, et le photographie. Votre DAW et vos projets ne sont pas touchés. Environ 2 secondes par plugin.', 'Rummage öffnet jedes VST3-Plugin unsichtbar für sich und fotografiert es. DAW und Projekte bleiben unberührt. Etwa 2 Sekunden pro Plugin.', 'O Rummage abre cada plugin VST3 sozinho, sem se ver, e fotografa-o. O seu DAW e projetos não são tocados. Cerca de 2 segundos por plugin.', 'Rummage apre ogni plugin VST3 da solo, senza mostrarlo, e lo fotografa. La DAW e i progetti non vengono toccati. Circa 2 secondi per plugin.'],
  ['only plugins without artwork', 'solo plugins sin foto', 'seulement les plugins sans photo', 'nur Plugins ohne Bild', 'só plugins sem foto', 'solo plugin senza foto'],
  ['I saved my project', 'He guardado mi proyecto', 'J’ai enregistré mon projet', 'Ich habe mein Projekt gespeichert', 'Guardei o meu projeto', 'Ho salvato il progetto'],
  ['keep the channels it opens (don\'t undo)', 'conservar los canales que abre (no deshacer)', 'garder les canaux ouverts (ne pas annuler)', 'geöffnete Kanäle behalten (nicht rückgängig machen)', 'manter os canais abertos (não desfazer)', 'tieni i canali aperti (non annullare)'],
  ['Every plugin that can be photographed already has a picture', 'Todos los plugins que se pueden fotografiar ya tienen foto', 'Tous les plugins photographiables ont déjà une photo', 'Alle fotografierbaren Plugins haben schon ein Bild', 'Todos os plugins que podem ser fotografados já têm foto', 'Tutti i plugin fotografabili hanno già una foto'],
  ['every VST3 plugin here already has a picture', 'todos los VST3 de aquí ya tienen foto', 'tous les VST3 ici ont déjà une photo', 'alle VST3-Plugins hier haben schon ein Bild', 'todos os VST3 aqui já têm foto', 'tutti i VST3 qui hanno già una foto'],
  ['No new plugin pictures', 'No hay fotos nuevas', 'Aucune nouvelle photo', 'Keine neuen Bilder', 'Sem fotos novas', 'Nessuna nuova foto'],
  // context menu
  ['add to crate', 'añadir a una caja', 'ajouter à un bac', 'zu einer Kiste hinzufügen', 'adicionar a uma caixa', 'aggiungi a una cassa'],
  ['add to crate...', 'añadir a una caja…', 'ajouter à un bac…', 'zu einer Kiste hinzufügen…', 'adicionar a uma caixa…', 'aggiungi a una cassa…'],
  ['save to My Library', 'guardar en Mi biblioteca', 'enregistrer dans Ma bibliothèque', 'in Meiner Bibliothek speichern', 'guardar na Minha biblioteca', 'salva nella Mia libreria'],
  ['show in Explorer', 'mostrar en el Explorador', 'afficher dans l’Explorateur', 'im Explorer zeigen', 'mostrar no Explorador', 'mostra in Esplora risorse'],
  ['hide from library', 'ocultar de la biblioteca', 'masquer de la bibliothèque', 'aus der Bibliothek ausblenden', 'ocultar da biblioteca', 'nascondi dalla libreria'],
  ['hide this folder', 'ocultar esta carpeta', 'masquer ce dossier', 'diesen Ordner ausblenden', 'ocultar esta pasta', 'nascondi questa cartella'],
  ['add to sidebar', 'añadir a la barra lateral', 'ajouter à la barre latérale', 'zur Seitenleiste hinzufügen', 'adicionar à barra lateral', 'aggiungi alla barra laterale'],
  ['remove from sidebar', 'quitar de la barra lateral', 'retirer de la barre latérale', 'aus der Seitenleiste entfernen', 'remover da barra lateral', 'rimuovi dalla barra laterale'],
  ['favourite this folder', 'añadir carpeta a favoritos', 'ajouter le dossier aux favoris', 'Ordner zu Favoriten', 'adicionar pasta aos favoritos', 'aggiungi cartella ai preferiti'],
  ['tag this folder...', 'etiquetar esta carpeta…', 'taguer ce dossier…', 'diesen Ordner taggen…', 'etiquetar esta pasta…', 'tagga questa cartella…'],
  ['scan waveforms', 'analizar ondas', 'analyser les formes d’onde', 'Wellenformen scannen', 'analisar formas de onda', 'analizza le forme d’onda'],
  ['auto icons from folder names', 'iconos según el nombre de la carpeta', 'icônes selon le nom du dossier', 'Symbole aus Ordnernamen', 'ícones pelo nome da pasta', 'icone dal nome della cartella'],
  ['plain folders here + inside', 'carpetas simples aquí y dentro', 'dossiers simples ici et dedans', 'einfache Ordner hier und darin', 'pastas simples aqui e dentro', 'cartelle semplici qui e dentro'],
  ['no icon', 'sin icono', 'sans icône', 'kein Symbol', 'sem ícone', 'nessuna icona'],
  ['use an image file…', 'usar una imagen…', 'utiliser une image…', 'Bilddatei verwenden…', 'usar uma imagem…', 'usa un’immagine…'],
  ['capture artwork', 'hacer foto', 'photographier', 'fotografieren', 'fotografar', 'fotografa'],
  ['remove artwork', 'quitar foto', 'retirer la photo', 'Bild entfernen', 'remover foto', 'rimuovi foto'],
  ['set maker…', 'cambiar fabricante…', 'changer le fabricant…', 'Hersteller festlegen…', 'definir fabricante…', 'imposta produttore…'],
  ['auto-detect from name', 'detectar por el nombre', 'détecter d’après le nom', 'aus dem Namen erkennen', 'detetar pelo nome', 'rileva dal nome'],
  ['delete crate', 'borrar caja', 'supprimer le bac', 'Kiste löschen', 'apagar caixa', 'elimina cassa'],
  ['delete search', 'borrar búsqueda', 'supprimer la recherche', 'Suche löschen', 'apagar pesquisa', 'elimina ricerca'],
  ['play', 'reproducir', 'lire', 'abspielen', 'reproduzir', 'riproduci'],
  ['divider above', 'separador encima', 'séparateur au-dessus', 'Trenner darüber', 'separador acima', 'separatore sopra'],
  ['mark as seen', 'marcar como visto', 'marquer comme vu', 'als gesehen markieren', 'marcar como visto', 'segna come visto'],
  ['no crates yet', 'aún no hay cajas', 'pas encore de bacs', 'noch keine Kisten', 'ainda sem caixas', 'ancora nessuna cassa'],
  ['name your crate', 'pon nombre a la caja', 'nommez votre bac', 'Kiste benennen', 'dê um nome à caixa', 'dai un nome alla cassa'],
  ['+ crate', '+ caja', '+ bac', '+ Kiste', '+ caixa', '+ cassa'],
  ['+ add folder', '+ añadir carpeta', '+ ajouter un dossier', '+ Ordner hinzufügen', '+ adicionar pasta', '+ aggiungi cartella'],
  ['Drop here to save it to My Library', 'Suelta aquí para guardarlo en Mi biblioteca', 'Déposez ici pour l’enregistrer dans Ma bibliothèque', 'Hier ablegen, um es in Meiner Bibliothek zu speichern', 'Largue aqui para guardar na Minha biblioteca', 'Rilascia qui per salvarlo nella Mia libreria'],
  // settings
  ['Look', 'Aspecto', 'Apparence', 'Aussehen', 'Aspeto', 'Aspetto'],
  ['Layout', 'Diseño', 'Disposition', 'Layout', 'Disposição', 'Layout'],
  ['About', 'Acerca de', 'À propos', 'Über', 'Sobre', 'Info'],
  ['LANGUAGE', 'IDIOMA', 'LANGUE', 'SPRACHE', 'IDIOMA', 'LINGUA'],
  ['THEME', 'TEMA', 'THÈME', 'DESIGN', 'TEMA', 'TEMA'],
  ['ACCENT', 'COLOR DE ACENTO', 'ACCENT', 'AKZENT', 'COR DE DESTAQUE', 'ACCENTO'],
  ['WAVEFORM COLORS', 'COLORES DE LA ONDA', 'COULEURS DES FORMES D’ONDE', 'WELLENFORM-FARBEN', 'CORES DA ONDA', 'COLORI DELLA FORMA D’ONDA'],
  ['by sound', 'según el sonido', 'selon le son', 'nach Klang', 'pelo som', 'in base al suono'],
  ['accent', 'acento', 'accent', 'Akzent', 'destaque', 'accento'],
  ['mono', 'mono', 'mono', 'einfarbig', 'mono', 'mono'],
  ['PLUGIN CARDS', 'TARJETAS DE PLUGINS', 'CARTES DES PLUGINS', 'PLUGIN-KARTEN', 'CARTÕES DE PLUGINS', 'SCHEDE DEI PLUGIN'],
  ['Small', 'Pequeñas', 'Petites', 'Klein', 'Pequenos', 'Piccole'],
  ['Medium', 'Medianas', 'Moyennes', 'Mittel', 'Médios', 'Medie'],
  ['Large', 'Grandes', 'Grandes', 'Groß', 'Grandes', 'Grandi'],
  ['SIZE', 'TAMAÑO', 'TAILLE', 'GRÖSSE', 'TAMANHO', 'DIMENSIONE'],
  ['interface', 'interfaz', 'interface', 'Oberfläche', 'interface', 'interfaccia'],
  ['rows', 'filas', 'lignes', 'Zeilen', 'linhas', 'righe'],
  ['Row height', 'Altura de las filas', 'Hauteur des lignes', 'Zeilenhöhe', 'Altura das linhas', 'Altezza delle righe'],
  ['BACKGROUND', 'FONDO', 'FOND', 'HINTERGRUND', 'FUNDO', 'SFONDO'],
  ['None', 'Ninguno', 'Aucun', 'Keiner', 'Nenhum', 'Nessuno'],
  ['Mesh', 'Degradado', 'Dégradé', 'Verlauf', 'Gradiente', 'Sfumatura'],
  ['Waves', 'Ondas', 'Vagues', 'Wellen', 'Ondas', 'Onde'],
  ['Dots', 'Puntos', 'Points', 'Punkte', 'Pontos', 'Punti'],
  ['Photo', 'Foto', 'Photo', 'Foto', 'Foto', 'Foto'],
  ['opacity', 'opacidad', 'opacité', 'Deckkraft', 'opacidade', 'opacità'],
  ['blur', 'desenfoque', 'flou', 'Unschärfe', 'desfoque', 'sfocatura'],
  ['darken', 'oscurecer', 'assombrir', 'abdunkeln', 'escurecer', 'scurisci'],
  ['custom image', 'imagen propia', 'image personnalisée', 'eigenes Bild', 'imagem própria', 'immagine personalizzata'],
  ['no image yet', 'sin imagen todavía', 'pas encore d’image', 'noch kein Bild', 'ainda sem imagem', 'ancora nessuna immagine'],
  ['choose…', 'elegir…', 'choisir…', 'auswählen…', 'escolher…', 'scegli…'],
  ['remove', 'quitar', 'retirer', 'entfernen', 'remover', 'rimuovi'],
  ['SIDEBAR', 'BARRA LATERAL', 'BARRE LATÉRALE', 'SEITENLEISTE', 'BARRA LATERAL', 'BARRA LATERALE'],
  ['BROWSER', 'NAVEGADOR', 'NAVIGATEUR', 'BROWSER', 'NAVEGADOR', 'BROWSER'],
  ['PLUGINS', 'PLUGINS', 'PLUGINS', 'PLUGINS', 'PLUGINS', 'PLUGIN'],
  ['waveform thumbnails', 'miniaturas de la onda', 'miniatures des formes d’onde', 'Wellenform-Vorschau', 'miniaturas da onda', 'miniature della forma d’onda'],
  ['tags column', 'columna de etiquetas', 'colonne des tags', 'Tag-Spalte', 'coluna de etiquetas', 'colonna dei tag'],
  ['files column', 'columna de archivos', 'colonne des fichiers', 'Datei-Spalte', 'coluna de ficheiros', 'colonna dei file'],
  ['column titles', 'títulos de las columnas', 'titres des colonnes', 'Spaltentitel', 'títulos das colunas', 'titoli delle colonne'],
  ['status bar', 'barra de estado', 'barre d’état', 'Statusleiste', 'barra de estado', 'barra di stato'],
  ['filter bar', 'barra de filtros', 'barre de filtres', 'Filterleiste', 'barra de filtros', 'barra dei filtri'],
  ['edit buttons', 'botones de edición', 'boutons d’édition', 'Bearbeiten-Tasten', 'botões de edição', 'pulsanti di modifica'],
  ['artwork cards', 'tarjetas con foto', 'cartes avec photo', 'Karten mit Bild', 'cartões com foto', 'schede con foto'],
  ['auto tags', 'etiquetas automáticas', 'tags automatiques', 'automatische Tags', 'etiquetas automáticas', 'tag automatici'],
  ['card size', 'tamaño de las tarjetas', 'taille des cartes', 'Kartengröße', 'tamanho dos cartões', 'dimensione delle schede'],
  ['folder icons from names', 'iconos de carpeta según el nombre', 'icônes de dossier selon le nom', 'Ordnersymbole aus Namen', 'ícones de pasta pelo nome', 'icone delle cartelle dal nome'],
  ['show plugins as a list instead of a grid', 'mostrar los plugins en lista en vez de cuadrícula', 'afficher les plugins en liste plutôt qu’en grille', 'Plugins als Liste statt Raster zeigen', 'mostrar plugins em lista em vez de grelha', 'mostra i plugin in elenco invece che in griglia'],
  ['HOST', 'DAW', 'DAW', 'DAW', 'DAW', 'DAW'],
  ['DAW LINK (loopMIDI)', 'ENLACE CON EL DAW (loopMIDI)', 'LIAISON AVEC LE DAW (loopMIDI)', 'DAW-VERBINDUNG (loopMIDI)', 'LIGAÇÃO AO DAW (loopMIDI)', 'COLLEGAMENTO DAW (loopMIDI)'],
  ['Create a loopMIDI port named “Rummage”', 'Crea un puerto de loopMIDI llamado “Rummage”', 'Créez un port loopMIDI nommé « Rummage »', 'Erstelle einen loopMIDI-Port namens „Rummage“', 'Crie uma porta loopMIDI chamada “Rummage”', 'Crea una porta loopMIDI chiamata “Rummage”'],
  ['Port found, waiting for the DAW script', 'Puerto encontrado, esperando al script del DAW', 'Port trouvé, en attente du script du DAW', 'Port gefunden, warte auf das DAW-Skript', 'Porta encontrada, à espera do script do DAW', 'Porta trovata, in attesa dello script DAW'],
  ['loops follow the project tempo', 'los loops siguen el tempo del proyecto', 'les boucles suivent le tempo du projet', 'Loops folgen dem Projekttempo', 'os loops seguem o tempo do projeto', 'i loop seguono il tempo del progetto'],
  ['SIDE OF THE SCREEN', 'LADO DE LA PANTALLA', 'CÔTÉ DE L’ÉCRAN', 'BILDSCHIRMSEITE', 'LADO DO ECRÃ', 'LATO DELLO SCHERMO'],
  ['Automatic', 'Automático', 'Automatique', 'Automatisch', 'Automático', 'Automatico'],
  ['Left', 'Izquierda', 'Gauche', 'Links', 'Esquerda', 'Sinistra'],
  ['Right', 'Derecha', 'Droite', 'Rechts', 'Direita', 'Destra'],
  ['dock next to the DAW automatically', 'acoplar junto al DAW automáticamente', 'ancrer à côté du DAW automatiquement', 'automatisch neben der DAW andocken', 'acoplar ao lado do DAW automaticamente', 'aggancia accanto alla DAW automaticamente'],
  ['play samples when selected', 'reproducir los samples al seleccionarlos', 'lire les samples à la sélection', 'Samples beim Auswählen abspielen', 'reproduzir samples ao selecionar', 'riproduci i campioni quando selezionati'],
  ['keep Rummage on top', 'mantener Rummage encima', 'garder Rummage au premier plan', 'Rummage im Vordergrund halten', 'manter o Rummage por cima', 'tieni Rummage in primo piano'],
  ['LIBRARY', 'BIBLIOTECA', 'BIBLIOTHÈQUE', 'BIBLIOTHEK', 'BIBLIOTECA', 'LIBRERIA'],
  ['LOCATIONS', 'UBICACIONES', 'EMPLACEMENTS', 'ORTE', 'LOCALIZAÇÕES', 'POSIZIONI'],
  ['click a path to change it', 'haz clic en una ruta para cambiarla', 'cliquez sur un chemin pour le changer', 'Pfad anklicken, um ihn zu ändern', 'clique num caminho para o mudar', 'fai clic su un percorso per cambiarlo'],
  ['VST3 plugins', 'Plugins VST3', 'Plugins VST3', 'VST3-Plugins', 'Plugins VST3', 'Plugin VST3'],
  ['VST2 plugins', 'Plugins VST2', 'Plugins VST2', 'VST2-Plugins', 'Plugins VST2', 'Plugin VST2'],
  ['CLAP plugins', 'Plugins CLAP', 'Plugins CLAP', 'CLAP-Plugins', 'Plugins CLAP', 'Plugin CLAP'],
  ['FL Studio data (plugin database, projects)', 'Datos de FL Studio (base de plugins, proyectos)', 'Données FL Studio (base de plugins, projets)', 'FL-Studio-Daten (Plugin-Datenbank, Projekte)', 'Dados do FL Studio (base de plugins, projetos)', 'Dati di FL Studio (database plugin, progetti)'],
  ['rescan', 'volver a escanear', 'réanalyser', 'neu scannen', 'analisar de novo', 'riscansiona'],
  ['reset to default', 'restablecer', 'réinitialiser', 'zurücksetzen', 'repor', 'ripristina'],
  ['RUMMAGE', 'RUMMAGE', 'RUMMAGE', 'RUMMAGE', 'RUMMAGE', 'RUMMAGE'],
  ['Quick tour', 'Visita rápida', 'Visite rapide', 'Kurze Tour', 'Visita rápida', 'Tour veloce'],
  ['Show again', 'Ver otra vez', 'Revoir', 'Erneut zeigen', 'Ver de novo', 'Rivedi'],
  ['Version 1.2.0 · MIT license', 'Versión 1.2.0 · licencia MIT', 'Version 1.2.0 · licence MIT', 'Version 1.2.0 · MIT-Lizenz', 'Versão 1.2.0 · licença MIT', 'Versione 1.2.0 · licenza MIT'],
  ['graphite', 'grafito', 'graphite', 'Graphit', 'grafite', 'grafite'],
  ['midnight', 'medianoche', 'minuit', 'Mitternacht', 'meia-noite', 'mezzanotte'],
  ['warm', 'cálido', 'chaud', 'warm', 'quente', 'caldo'],
  ['oled', 'oled', 'oled', 'OLED', 'oled', 'oled'],
  ['slate', 'pizarra', 'ardoise', 'Schiefer', 'ardósia', 'ardesia'],
  // tour
  ['Welcome to Rummage', 'Te damos la bienvenida a Rummage', 'Bienvenue dans Rummage', 'Willkommen bei Rummage', 'Bem-vindo ao Rummage', 'Benvenuto in Rummage'],
  ['Your samples, plugins and presets in one panel that sits beside your DAW. Here is the quick tour: it takes a minute.', 'Tus samples, plugins y presets en un panel junto a tu DAW. Aquí tienes la visita rápida: es un minuto.', 'Vos samples, plugins et presets dans un panneau à côté de votre DAW. Voici la visite rapide : une minute.', 'Deine Samples, Plugins und Presets in einem Panel neben deiner DAW. Hier die kurze Tour: dauert eine Minute.', 'Os seus samples, plugins e presets num painel ao lado do DAW. Aqui está a visita rápida: leva um minuto.', 'Campioni, plugin e preset in un pannello accanto alla tua DAW. Ecco il tour veloce: ci vuole un minuto.'],
  ['Which DAW do you use?', '¿Qué DAW usas?', 'Quel DAW utilisez-vous ?', 'Welche DAW nutzt du?', 'Que DAW usa?', 'Quale DAW usi?'],
  ['Rummage changes its buttons and loads things into the DAW you pick. You can change it later in Settings.', 'Rummage adapta sus botones y carga las cosas en el DAW que elijas. Puedes cambiarlo luego en Ajustes.', 'Rummage adapte ses boutons et charge tout dans le DAW choisi. Modifiable plus tard dans Réglages.', 'Rummage passt seine Tasten an und lädt alles in die gewählte DAW. Später in den Einstellungen änderbar.', 'O Rummage adapta os botões e carrega tudo no DAW escolhido. Pode mudar depois em Ajustes.', 'Rummage adatta i pulsanti e carica tutto nella DAW scelta. Puoi cambiarla dopo nelle Impostazioni.'],
  ['Left or right?', '¿Izquierda o derecha?', 'À gauche ou à droite ?', 'Links oder rechts?', 'Esquerda ou direita?', 'Sinistra o destra?'],
  ['Rummage docks on one edge of the screen and your DAW fills the rest. Automatic follows wherever you put the window.', 'Rummage se pega a un borde de la pantalla y tu DAW ocupa el resto. Automático sigue a la ventana allá donde la pongas.', 'Rummage s’ancre sur un bord de l’écran et le DAW occupe le reste. Automatique suit la fenêtre où que vous la placiez.', 'Rummage dockt an einer Bildschirmseite an, die DAW füllt den Rest. Automatisch folgt dem Fenster, wo immer es ist.', 'O Rummage encosta-se a um lado do ecrã e o DAW ocupa o resto. Automático segue a janela onde a puser.', 'Rummage si aggancia a un lato dello schermo e la DAW riempie il resto. Automatico segue la finestra ovunque la metti.'],
  ['Find a sound fast', 'Encuentra un sonido rápido', 'Trouvez un son vite', 'Schnell einen Sound finden', 'Encontre um som depressa', 'Trova un suono in fretta'],
  ['Type in the search bar, use ↑ ↓ to move and the sound plays as you go. Hold and drag any row straight into your DAW. Right-click for favourites, tags and crates.', 'Escribe en la búsqueda, muévete con ↑ ↓ y el sonido suena al pasar. Mantén y arrastra cualquier fila directa a tu DAW. Clic derecho para favoritos, etiquetas y cajas.', 'Tapez dans la recherche, ↑ ↓ pour vous déplacer, le son joue au passage. Maintenez et glissez une ligne dans le DAW. Clic droit pour favoris, tags et bacs.', 'Tippe in die Suche, bewege dich mit ↑ ↓, der Sound spielt sofort. Halte eine Zeile und zieh sie direkt in die DAW. Rechtsklick für Favoriten, Tags und Kisten.', 'Escreva na pesquisa, use ↑ ↓ e o som toca ao passar. Arraste qualquer linha direto para o DAW. Clique direito para favoritos, etiquetas e caixas.', 'Scrivi nella ricerca, usa ↑ ↓ e il suono parte al passaggio. Tieni premuto e trascina una riga nella DAW. Clic destro per preferiti, tag e casse.'],
  ['Pictures of your plugins', 'Fotos de tus plugins', 'Photos de vos plugins', 'Bilder deiner Plugins', 'Fotos dos seus plugins', 'Foto dei tuoi plugin'],
  ['Rummage can open each VST3 out of sight and photograph it, so the Plugins view shows every plugin as it really looks. Your DAW and projects are not touched.', 'Rummage puede abrir cada VST3 sin que se vea y fotografiarlo, para que en Plugins veas cada uno tal como es. Tu DAW y tus proyectos no se tocan.', 'Rummage peut ouvrir chaque VST3 hors de vue et le photographier : la vue Plugins montre chaque plugin tel qu’il est. DAW et projets intacts.', 'Rummage öffnet jedes VST3 unsichtbar und fotografiert es, damit die Plugin-Ansicht jedes Plugin echt zeigt. DAW und Projekte bleiben unberührt.', 'O Rummage abre cada VST3 sem se ver e fotografa-o, para a vista Plugins mostrar cada um como é. O DAW e projetos não são tocados.', 'Rummage apre ogni VST3 senza mostrarlo e lo fotografa, così la vista Plugin li mostra come sono. DAW e progetti non vengono toccati.'],
  ['Capture plugin pictures', 'Hacer fotos de los plugins', 'Photographier les plugins', 'Plugins fotografieren', 'Fotografar os plugins', 'Fotografa i plugin'],
  ['Link with your DAW', 'Conecta con tu DAW', 'Liez-vous à votre DAW', 'Mit deiner DAW verbinden', 'Ligue ao seu DAW', 'Collega la tua DAW'],
  ['With loopMIDI, Rummage reads your project tempo and loops follow it. Create a loopMIDI port called “Rummage”, then install the small DAW script.', 'Con loopMIDI, Rummage lee el tempo del proyecto y los loops lo siguen. Crea un puerto de loopMIDI llamado “Rummage” e instala el pequeño script del DAW.', 'Avec loopMIDI, Rummage lit le tempo du projet et les boucles le suivent. Créez un port loopMIDI « Rummage », puis installez le petit script du DAW.', 'Mit loopMIDI liest Rummage das Projekttempo und Loops folgen ihm. Erstelle einen loopMIDI-Port „Rummage“ und installiere das kleine DAW-Skript.', 'Com o loopMIDI, o Rummage lê o tempo do projeto e os loops seguem-no. Crie uma porta loopMIDI “Rummage” e instale o pequeno script do DAW.', 'Con loopMIDI, Rummage legge il tempo del progetto e i loop lo seguono. Crea una porta loopMIDI “Rummage” e installa il piccolo script DAW.'],
  ['Install the DAW script', 'Instalar el script del DAW', 'Installer le script du DAW', 'DAW-Skript installieren', 'Instalar o script do DAW', 'Installa lo script DAW'],
  ['Installed ✓', 'Instalado ✓', 'Installé ✓', 'Installiert ✓', 'Instalado ✓', 'Installato ✓'],
  ['Could not install it', 'No se pudo instalar', 'Installation impossible', 'Installation fehlgeschlagen', 'Não foi possível instalar', 'Installazione non riuscita'],
  ['You are set', 'Todo listo', 'C’est prêt', 'Alles bereit', 'Tudo pronto', 'Tutto pronto'],
  ['Make it yours in Settings: theme, accent, backgrounds, card sizes. You can see this tour again from Settings › About.', 'Hazlo tuyo en Ajustes: tema, acento, fondos, tamaño de tarjetas. Puedes ver esta visita otra vez en Ajustes › Acerca de.', 'Personnalisez-le dans Réglages : thème, accent, fonds, taille des cartes. Revoyez cette visite dans Réglages › À propos.', 'Pass es in den Einstellungen an: Design, Akzent, Hintergründe, Kartengröße. Die Tour gibt es wieder unter Einstellungen › Über.', 'Personalize em Ajustes: tema, destaque, fundos, tamanho dos cartões. Pode rever esta visita em Ajustes › Sobre.', 'Personalizzalo nelle Impostazioni: tema, accento, sfondi, dimensione schede. Rivedi il tour da Impostazioni › Info.'],
  ['Save your project first. The scan adds one channel per plugin and undoes it with Ctrl+Z after each picture. You can stop it at any time.', 'Guarda antes tu proyecto. El escaneo añade un canal por plugin y lo deshace con Ctrl+Z tras cada foto. Puedes pararlo cuando quieras.', 'Enregistrez d’abord votre projet. L’analyse ajoute un canal par plugin et l’annule avec Ctrl+Z après chaque photo. Vous pouvez l’arrêter à tout moment.', 'Speichere zuerst dein Projekt. Der Scan fügt pro Plugin einen Kanal hinzu und macht ihn nach jedem Bild mit Strg+Z rückgängig. Jederzeit abbrechbar.', 'Guarde primeiro o projeto. A análise adiciona um canal por plugin e desfaz com Ctrl+Z após cada foto. Pode parar quando quiser.', 'Salva prima il progetto. La scansione aggiunge un canale per plugin e lo annulla con Ctrl+Z dopo ogni foto. Puoi fermarla quando vuoi.'],
  ['favourite', 'favorito', 'favori', 'Favorit', 'favorito', 'preferito'],
  ['aurora', 'aurora', 'aurore', 'Polarlicht', 'aurora', 'aurora'],
  ['sunset', 'atardecer', 'coucher de soleil', 'Sonnenuntergang', 'pôr do sol', 'tramonto'],
  ['ocean', 'océano', 'océan', 'Ozean', 'oceano', 'oceano'],
  ['rose', 'rosa', 'rose', 'Rosé', 'rosa', 'rosa'],
  ['PRESET', 'PRESET', 'PRESET', 'PRESET', 'PRESET', 'PRESET'],
  ['record a 3-second preview of projects as you play them', 'grabar 3 segundos de cada proyecto al darle al play', 'enregistrer 3 secondes de chaque projet à la lecture', 'beim Abspielen 3 Sekunden jedes Projekts aufnehmen', 'gravar 3 segundos de cada projeto ao tocar', 'registra 3 secondi di ogni progetto quando lo suoni'],
  ['Play the project preview', 'Escuchar la vista previa del proyecto', 'Écouter l’aperçu du projet', 'Projektvorschau anhören', 'Ouvir a prévia do projeto', 'Ascolta l’anteprima del progetto'],
  ['With the free loopMIDI, Rummage knows your project tempo, loops follow it and your projects can get a sound preview.', 'Con loopMIDI, que es gratis, Rummage sabe el tempo del proyecto, los loops lo siguen y tus proyectos pueden tener una vista previa de sonido.', 'Avec loopMIDI (gratuit), Rummage connaît le tempo du projet, les boucles le suivent et vos projets peuvent avoir un aperçu sonore.', 'Mit dem kostenlosen loopMIDI kennt Rummage dein Projekttempo, Loops folgen ihm und Projekte bekommen eine Hörprobe.', 'Com o loopMIDI, que é grátis, o Rummage sabe o tempo do projeto, os loops seguem-no e os projetos podem ter uma prévia de som.', 'Con loopMIDI, gratuito, Rummage conosce il tempo del progetto, i loop lo seguono e i progetti possono avere un’anteprima audio.'],
  ['Download loopMIDI', 'Descarga loopMIDI', 'Téléchargez loopMIDI', 'Lade loopMIDI herunter', 'Descarregue o loopMIDI', 'Scarica loopMIDI'],
  ['and install it', 'e instálalo', 'et installez-le', 'und installiere es', 'e instale-o', 'e installalo'],
  ['Download', 'Descargar', 'Télécharger', 'Download', 'Descarregar', 'Scarica'],
  ['Open loopMIDI, type', 'Abre loopMIDI, escribe', 'Ouvrez loopMIDI, tapez', 'Öffne loopMIDI, gib', 'Abra o loopMIDI, escreva', 'Apri loopMIDI, scrivi'],
  ['as the port name and press', 'como nombre del puerto y pulsa', 'comme nom de port et appuyez sur', 'als Portnamen ein und drücke', 'como nome da porta e prima', 'come nome della porta e premi'],
  [', then turn it on in Live: Settings › Link, Tempo & MIDI, Control Surface Rummage', ' y actívalo en Live: Ajustes › Link, Tempo y MIDI, superficie de control Rummage', ', puis activez-le dans Live : Préférences › Link, Tempo & MIDI, surface de contrôle Rummage', ' und aktiviere es in Live: Einstellungen › Link, Tempo & MIDI, Control Surface Rummage', ' e ative-o no Live: Definições › Link, Tempo e MIDI, superfície de controlo Rummage', ' e attivalo in Live: Impostazioni › Link, Tempo e MIDI, superficie di controllo Rummage'],
  [', then turn it on in FL: Options › MIDI, input Rummage, controller type Rummage', ' y actívalo en FL: Options › MIDI, entrada Rummage, tipo de controlador Rummage', ', puis activez-le dans FL : Options › MIDI, entrée Rummage, type de contrôleur Rummage', ' und aktiviere es in FL: Options › MIDI, Eingang Rummage, Controller-Typ Rummage', ' e ative-o no FL: Options › MIDI, entrada Rummage, tipo de controlador Rummage', ' e attivalo in FL: Options › MIDI, ingresso Rummage, tipo di controller Rummage'],
  ['Install the script', 'Instala el script', 'Installez le script', 'Installiere das Skript', 'Instale o script', 'Installa lo script'],
  ['Install', 'Instalar', 'Installer', 'Installieren', 'Instalar', 'Installa'],
  ['Waiting for the Rummage port', 'Esperando al puerto Rummage', 'En attente du port Rummage', 'Warte auf den Rummage-Port', 'À espera da porta Rummage', 'In attesa della porta Rummage'],
  ['Next', 'Siguiente', 'Suivant', 'Weiter', 'Seguinte', 'Avanti'],
  ['Back', 'Atrás', 'Retour', 'Zurück', 'Voltar', 'Indietro'],
  ['Skip', 'Saltar', 'Passer', 'Überspringen', 'Saltar', 'Salta'],
];
// dynamic text: [pattern, ...one replacement per language in ORDER]
const PATS = [
  [/^(\d+) shown · (\d+) indexed$/, '$1 visibles · $2 indexados', '$1 affichés · $2 indexés', '$1 angezeigt · $2 indexiert', '$1 visíveis · $2 indexados', '$1 visibili · $2 indicizzati'],
  [/^(\d+) items indexed$/, '$1 elementos indexados', '$1 éléments indexés', '$1 Einträge indexiert', '$1 itens indexados', '$1 elementi indicizzati'],
  [/^(\d+) new items$/, '$1 nuevos', '$1 nouveaux', '$1 neue', '$1 novos', '$1 nuovi'],
  [/^(\d+) plugins · (\d+) with pictures$/, '$1 plugins · $2 con foto', '$1 plugins · $2 avec photo', '$1 Plugins · $2 mit Bild', '$1 plugins · $2 com foto', '$1 plugin · $2 con foto'],
  [/^(\d+) new plugin pictures$/, '$1 fotos nuevas', '$1 nouvelles photos', '$1 neue Bilder', '$1 fotos novas', '$1 nuove foto'],
  [/^Waiting for (.+)$/, 'Esperando a $1', 'En attente de $1', 'Warte auf $1', 'À espera do $1', 'In attesa di $1'],
  [/^Waiting for your DAW$/, 'Esperando a tu DAW', 'En attente du DAW', 'Warte auf die DAW', 'À espera do DAW', 'In attesa della DAW'],
  [/^(.+) connected$/, '$1 conectado', '$1 connecté', '$1 verbunden', '$1 ligado', '$1 collegato'],
  [/^(.+) connected · ([\d.]+) BPM$/, '$1 conectado · $2 BPM', '$1 connecté · $2 BPM', '$1 verbunden · $2 BPM', '$1 ligado · $2 BPM', '$1 collegato · $2 BPM'],
  [/^Linked · ([\d.]+) BPM$/, 'Conectado · $1 BPM', 'Lié · $1 BPM', 'Verbunden · $1 BPM', 'Ligado · $1 BPM', 'Collegato · $1 BPM'],
  [/^preview saved for (.+)$/, 'vista previa guardada: $1', 'aperçu enregistré : $1', 'Vorschau gespeichert: $1', 'prévia guardada: $1', 'anteprima salvata: $1'],
  [/^Load into (.+)$/, 'Cargar en $1', 'Charger dans $1', 'In $1 laden', 'Carregar no $1', 'Carica in $1'],
  [/^load into (.+)$/, 'cargar en $1', 'charger dans $1', 'in $1 laden', 'carregar no $1', 'carica in $1'],
  [/^Drag into (.+)$/, 'Arrastrar a $1', 'Glisser dans $1', 'In $1 ziehen', 'Arrastar para o $1', 'Trascina in $1'],
  [/^Install (.+) script$/, 'Instalar script de $1', 'Installer le script $1', '$1-Skript installieren', 'Instalar script do $1', 'Installa lo script di $1'],
  [/^Show all (\d+)$/, 'Ver los $1', 'Voir les $1', 'Alle $1 zeigen', 'Ver os $1', 'Mostra tutti i $1'],
  [/^Rummage on one edge, (.+) filling the rest$/, 'Rummage en un borde y $1 en el resto', 'Rummage sur un bord, $1 sur le reste', 'Rummage an einer Seite, $1 im Rest', 'Rummage num lado, $1 no resto', 'Rummage su un lato, $1 nel resto'],
  [/^Done · (\d+) of (\d+) photographed$/, 'Listo · $1 de $2 fotografiados', 'Terminé · $1 sur $2 photographiés', 'Fertig · $1 von $2 fotografiert', 'Concluído · $1 de $2 fotografados', 'Fatto · $1 di $2 fotografati'],
  [/^Done · (\d+) of (\d+) photographed · (\d+) could not be opened$/, 'Listo · $1 de $2 fotografiados · $3 no se pudieron abrir', 'Terminé · $1 sur $2 photographiés · $3 n’ont pas pu s’ouvrir', 'Fertig · $1 von $2 fotografiert · $3 ließen sich nicht öffnen', 'Concluído · $1 de $2 fotografados · $3 não abriram', 'Fatto · $1 di $2 fotografati · $3 non si sono aperti'],
];
// the capture card is assembled from these fragments
const FRAGS = [
  [' of ', ' de ', ' sur ', ' von ', ' de ', ' di '],
  [' new pictures', ' fotos nuevas', ' nouvelles photos', ' neue Bilder', ' fotos novas', ' nuove foto'],
  ['under a minute left', 'menos de un minuto', 'moins d’une minute', 'unter einer Minute', 'menos de um minuto', 'meno di un minuto'],
  ['min left', 'min restantes', 'min restantes', 'Min. übrig', 'min restantes', 'min rimanenti'],
  ['about ', 'unos ', 'environ ', 'etwa ', 'cerca de ', 'circa '],
];

const DICT = {}, RX = {}, FR = {};
ORDER.forEach((l, k) => {
  DICT[l] = new Map(ROWS.map(r => [r[0], r[k + 1]]));
  RX[l] = PATS.map(p => [p[0], p[k + 1]]);
  FR[l] = FRAGS.map(f => [f[0], f[k + 1]]);
});
let LANG = 'en';
// user content is left as it is
const SKIP = '.gs[data-mk] span,.bdg,.bd,.pinfo,.r .n,.gc .nm b,.gc .nm .mk,#ggrid .ph,#det .dh b,.meta,.ut,.tg,.pinfo b,#gcaps,.rb[data-dir] span,.rb[data-crate] span,.rb[data-srch] span,script,style,textarea';
function T(v) {
  if (LANG === 'en' || !v) return v;
  const k = v.trim(); if (!k) return v;
  const m = /^([^\p{L}\p{N}+(]+\s*)(.*)$/u.exec(k), pre = m ? m[1] : '', body = m ? m[2] : k;
  const d = DICT[LANG];
  let out = d.get(k) ?? (pre && d.has(body) ? pre + d.get(body) : null);
  if (out == null) for (const [re, to] of RX[LANG]) if (re.test(body)) { out = pre + body.replace(re, to); break; }
  return out == null ? v : v.replace(k, out);
}
// pieces glued together in code (the capture card)
function TF(v) { if (LANG === 'en') return v; for (const [a, b] of FR[LANG]) v = v.split(a).join(b); return v; }
function trText(n) {
  const p = n.parentElement; if (!p || p.closest(SKIP)) return;
  const src = n.__en != null && n.nodeValue === n.__tr ? n.__en : n.nodeValue;
  const out = T(src); if (out !== src) { n.__en = src; n.__tr = out; n.nodeValue = out; } else if (n.__en != null && src !== n.__en) n.__en = null;
}
function trAttr(e, a) {
  if (e.closest(SKIP)) return;
  const key = '__en_' + a, cur = e.getAttribute(a); if (!cur) return;
  const src = e[key] != null && cur === e[key + 'tr'] ? e[key] : cur, out = T(src);
  if (out !== src) { e[key] = src; e[key + 'tr'] = out; e.setAttribute(a, out); }
}
function trTree(root) {
  if (root.nodeType === 3) return trText(root);
  if (root.nodeType !== 1 || root.closest(SKIP)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) trText(n);
  for (const a of ['title', 'placeholder']) { if (root.hasAttribute(a)) trAttr(root, a); root.querySelectorAll('[' + a + ']').forEach(e => trAttr(e, a)); }
}
let busy = false;
const mo = new MutationObserver(ms => {
  if (LANG === 'en' || busy) return; busy = true;
  try { for (const m of ms) { if (m.type === 'characterData') trText(m.target); else if (m.type === 'attributes') trAttr(m.target, m.attributeName); else m.addedNodes.forEach(trTree); } }
  finally { mo.takeRecords(); busy = false; }
});
// put every translated node back to English, then translate again in the new language
function setLang(l) {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (n.__en != null && n.nodeValue === n.__tr) { n.nodeValue = n.__en; n.__en = null; }
  document.querySelectorAll('[title],[placeholder]').forEach(e => ['title', 'placeholder'].forEach(a => { if (e['__en_' + a] != null && e.getAttribute(a) === e['__en_' + a + 'tr']) { e.setAttribute(a, e['__en_' + a]); e['__en_' + a] = null; } }));
  LANG = LANGS[l] ? l : 'en';
  document.documentElement.lang = LANG;
  if (LANG !== 'en') { busy = true; trTree(document.body); mo.takeRecords(); busy = false; }
}
const sysLang = () => { const l = (navigator.language || 'en').slice(0, 2).toLowerCase(); return LANGS[l] ? l : 'en'; };
const watch = () => mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder'] });
if (document.body) watch(); else addEventListener('DOMContentLoaded', watch);
// only these names are shared with the page script
Object.assign(window, { LANGS, setLang, sysLang, TF });
})();
