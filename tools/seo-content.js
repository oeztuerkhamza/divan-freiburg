/* Content for the generated SEO pages (German + English). Facts here come from the restaurant's own site
   and from OpenStreetMap coordinates; nothing was invented. Distances: air line from Bertoldstraße 54,
   walking time = air line x 1.3 / 80 m per minute, rounded. Run `node tools/build-seo.js` after editing. */

const SITE = 'https://oeztuerkhamza.github.io/divan-freiburg'; /* change to the custom domain once it exists */
const TEL = '+497612927151';
const MENU_URL = 'https://breisgau-digital.de/m/divan/karte';
const LIEFERANDO = 'https://www.lieferando.de/speisekarte/divan-3';
const WOLT = 'https://wolt.com/en/deu/freiburg-im-breisgau/restaurant/divan-ocakba';
const ROUTE = 'https://www.google.com/maps/search/?api=1&query=Divan+Ocakba%C5%9F%C4%B1+Bertoldstra%C3%9Fe+54+79098+Freiburg';
const ROUTE_HBF = 'https://www.google.com/maps/dir/?api=1&origin=Freiburg+Hauptbahnhof&destination=Divan+Ocakba%C5%9F%C4%B1+Bertoldstra%C3%9Fe+54+79098+Freiburg&travelmode=walking';
const INSTAGRAM = 'https://www.instagram.com/divanfreiburg/';
const GOOGLE_MAPS = 'https://www.google.com/maps/place/?q=place_id:ChIJTZYB72EbkUcRHkw_vobgWvc';
const GEO = { lat: 47.9957348, lon: 7.8434039 };
const BUILT = '2026-11-17';

/* key -> [German name, English name, metres, minutes on foot] */
const DIST = {
  konzert: ['Konzerthaus Freiburg', 'Freiburg Concert Hall (Konzerthaus)', 70, 1],
  uni: ['Universitätsbibliothek (Platz der Universität)', 'University Library (Platz der Universität)', 210, 3],
  synagoge: ['Platz der Alten Synagoge', 'Platz der Alten Synagoge', 230, 4],
  hbf: ['Hauptbahnhof Freiburg', 'Freiburg main station (Hauptbahnhof)', 270, 4],
  colombi: ['Colombipark', 'Colombipark', 300, 5],
  bertold: ['Bertoldsbrunnen', 'Bertoldsbrunnen', 470, 8],
  martin: ['Martinstor', 'Martinstor (Martin’s Gate)', 470, 8],
  rathaus: ['Rathausplatz', 'Rathausplatz (City Hall Square)', 460, 8],
  muenster: ['Freiburger Münster', 'Freiburg Minster', 710, 12],
  augustiner: ['Augustinermuseum', 'Augustinermuseum', 760, 12],
  schwaben: ['Schwabentor', 'Schwabentor (Swabian Gate)', 860, 14],
  schlossberg: ['Talstation Schlossbergbahn', 'Schlossbergbahn valley station', 1050, 17]
};

/* UI strings */
const T = {
  de: {
    lang: 'de', locale: 'de_DE', dir: 'ltr', prefix: '', otherName: 'EN', otherHref: 'English version',
    skip: 'Zum Inhalt springen', home: 'Divan Ocakbaşı', navHome: 'Startseite', navLunch: 'Mittagstisch', navMenu: 'Speisekarte', navFaq: 'FAQ',
    reserve: 'Tisch reservieren', call: 'Anrufen: 0761 2927151', menuBtn: 'Speisekarte ansehen', routeBtn: 'Route planen',
    factsTitle: 'Auf einen Blick', address: 'Adresse', phone: 'Telefon & Reservierung', hours: 'Öffnungszeiten',
    hoursVal: 'Täglich 11:30 – 23:30 Uhr', lunch: 'Mittagsmenü', lunchVal: '11:30 – 16:00 Uhr · 10,90 € pro Gericht',
    distCaption: 'Entfernung ab Bertoldstraße 54: Luftlinie, Gehzeit geschätzt (ca.).', distCols: ['Ziel', 'Entfernung', 'Zu Fuß'], approx: 'ca.', min: 'Min.',
    faqTitle: 'Häufige Fragen', relatedTitle: 'Weiterlesen', ctaTitle: 'Tisch reservieren oder nach Hause bestellen',
    ctaText: 'Rufen Sie uns an – oder lassen Sie sich unsere Gerichte liefern (Liefergebiet in der jeweiligen App prüfen).',
    orderLead: 'Online bestellen:', footerHours: 'Täglich geöffnet von 11:30 bis 23:30 Uhr', made: 'Website & digitale Speisekarte von',
    more: 'Mehr Seiten', sub: 'Anatolische Küche vom Holzkohlegrill in Freiburg', figWord: 'Foto'
  },
  en: {
    lang: 'en', locale: 'en_GB', dir: 'ltr', prefix: 'en/', otherName: 'DE', otherHref: 'Deutsche Version',
    skip: 'Skip to content', home: 'Divan Ocakbaşı', navHome: 'Home', navLunch: 'Lunch', navMenu: 'Menu', navFaq: 'FAQ',
    reserve: 'Book a table', call: 'Call: 0761 2927151', menuBtn: 'View the menu', routeBtn: 'Get directions',
    factsTitle: 'At a glance', address: 'Address', phone: 'Phone & reservations', hours: 'Opening hours',
    hoursVal: 'Daily 11:30 am – 11:30 pm', lunch: 'Lunch menu', lunchVal: '11:30 am – 4 pm · €10.90 per dish',
    distCaption: 'Distance from Bertoldstraße 54: air line, walking time estimated (approx.).', distCols: ['Place', 'Distance', 'On foot'], approx: 'approx.', min: 'min',
    faqTitle: 'Frequently asked questions', relatedTitle: 'Keep reading', ctaTitle: 'Book a table or order to your door',
    ctaText: 'Give us a call – or have our dishes delivered (check the delivery area in the respective app).',
    orderLead: 'Order online:', footerHours: 'Open daily from 11:30 am to 11:30 pm', made: 'Website & digital menu by',
    more: 'More pages', sub: 'Anatolian cuisine from the charcoal grill in Freiburg', figWord: 'Photo'
  }
};

const pages = [
  /* ------------------------------------------------------------------ main landing page */
  {
    id: 'restaurant', slug: { de: 'restaurant-freiburg', en: 'restaurant-freiburg' },
    img: { src: 'hero.jpg', w: 1000, h: 668 },
    de: {
      title: 'Restaurant Freiburg Innenstadt: Türkisch & Grill | Divan Ocakbaşı',
      desc: 'Türkisches Restaurant in der Freiburger Innenstadt: Holzkohlegrill, Meze, Pide und Künefe. Bertoldstraße 54, täglich 11:30–23:30 Uhr, Mittagsmenü 10,90 €.',
      eyebrow: 'Restaurant in Freiburg', short: 'Türkische Grillküche in der Innenstadt – Überblick',
      h1: 'Restaurant in der Freiburger Innenstadt: <em>türkische Grillküche am Ocakbaşı</em>',
      lead: 'Das Divan Ocakbaşı liegt in der Bertoldstraße 54, mitten in der Freiburger Innenstadt und nur rund 4 Gehminuten vom Hauptbahnhof entfernt. Am offenen Holzkohlegrill, dem Ocak, entstehen Köfte, Adana und Lammkoteletts – dazu gibt es Meze zum Teilen, frische Pide, Aufläufe aus dem Steinofen und zum Abschluss ein Künefe. Wir haben täglich von 11:30 bis 23:30 Uhr geöffnet.',
      figAlt: 'Karışık Et Tabağı – gemischter Grillteller für zwei im Divan Ocakbaşı in Freiburg',
      body: `
<h2>Das erwartet Sie im Divan</h2>
<p>„Ocakbaşı“ heißt wörtlich „am Feuer sitzen“. In Anatolien ist das der Ort, an dem man zusammenkommt – rund um den Grill, auf dem das Fleisch über der Glut gart. Genau diese Tradition bringen wir in die Bertoldstraße: echte Glut, reiche Gewürze und Gastfreundschaft von Herzen.</p>
<p>Das Fleisch bei uns ist halal.</p>
<p>Unsere Speisekarte umfasst mehr als 200 Gerichte und Getränke – von Vorspeisen und Meze über Grillspezialitäten, Döner, Pide und Lahmacun, Saç-Pfanne, Börek und Poğaça bis zu Desserts, Rakı, Wein und Bier. Die komplette Karte gibt es digital in 15 Sprachen, am Tisch per QR-Code oder online.</p>
[[fig]]
<h2>Beliebte Gerichte</h2>
<ul>
<li><strong>Karışık Et Tabağı</strong> – der gemischte Grillteller: Lammspieß, Lammkoteletts, Dönerfleisch, Hackfleischbällchen und Putenspieß mit Reis, Knoblauch-Joghurt-Soße und Salat. Auf Wunsch als große Platte für zwei Personen.</li>
<li><strong>Peynirli Sarımsaklı Köfte</strong> – mit Schafskäse und Knoblauch gefüllte Hackfleischbällchen, dazu Reis.</li>
<li><strong>İskender Spezial</strong> – Dönerfleisch auf frischem Sesambrot mit Tomaten, Knoblauch-Joghurt-Soße und Tomatensoße.</li>
<li><strong>Karnıyarık</strong> – ofengebackene Auberginen mit würziger Hackfleischfüllung, Tomatensoße und Butterreis.</li>
<li><strong>Sebzeli Kiremit</strong> – Gemüseauflauf aus dem Steinofen.</li>
<li><strong>Künefe</strong> – Teigfäden mit geschmolzenem Käse in Sirup, mit Pistazien.</li>
</ul>
<p>Was sich hinter den Namen verbirgt, erklärt unser Ratgeber [[link:glossary|Türkische Gerichte erklärt]].</p>
<h2>Mittagstisch in der Innenstadt</h2>
<p>Täglich von 11:30 bis 16:00 Uhr bieten wir zwanzig Mittagsgerichte für je 10,90 € an, zum Beispiel Saç Döner, Ali Nazik oder Börek. Alle Details finden Sie unter [[link:lunch|Mittagstisch Freiburg]].</p>
<h2>Lage und Anfahrt</h2>
<p>Das Restaurant liegt in der Bertoldstraße 54, zwischen Hauptbahnhof und Altstadtzentrum. Zu Fuß sind es nur wenige Minuten zu Universität, Konzerthaus und Bertoldsbrunnen:</p>
[[dist:konzert,uni,hbf,bertold,muenster]]
<p>Reisen Sie mit der Bahn an? Dann lesen Sie [[link:station|Restaurant in der Nähe vom Hauptbahnhof Freiburg]]. Zu Besuch in der Stadt? Unsere [[link:visit|Tipps zum Essengehen in Freiburg]] zeigen Entfernungen zu den wichtigsten Sehenswürdigkeiten.</p>
[[facts]]
<h2>Reservieren und bestellen</h2>
<p>Tische reservieren Sie telefonisch unter <a href="tel:+497612927151">0761 2927151</a>. Lieber zu Hause essen? Unsere Gerichte gibt es auch über <a href="${LIEFERANDO}" target="_blank" rel="noopener">Lieferando</a> und <a href="${WOLT}" target="_blank" rel="noopener">Wolt</a> – das Liefergebiet prüfen Sie bitte in der jeweiligen App.</p>`,
      faq: [
        ['Wo liegt das Divan Ocakbaşı in Freiburg?', '<p>Das Restaurant befindet sich in der Bertoldstraße 54, 79098 Freiburg im Breisgau, in der Innenstadt. Vom Hauptbahnhof sind es ca. 270 m, also rund 4 Minuten zu Fuß.</p>'],
        ['Was bedeutet Ocakbaşı?', '<p>Das türkische Wort bedeutet „am Feuer sitzen“. Ein Ocakbaşı ist ein Grillrestaurant, in dem das Essen am offenen Grill zubereitet wird.</p>'],
        ['Wann hat das Restaurant geöffnet?', '<p>Täglich von 11:30 bis 23:30 Uhr. Das Mittagsmenü gibt es von 11:30 bis 16:00 Uhr. An Feiertagen können die Zeiten abweichen.</p>'],
        ['Kann ich einen Tisch reservieren?', '<p>Ja, telefonisch unter <a href="tel:+497612927151">0761 2927151</a>.</p>'],
        ['Ist das Fleisch halal?', '<p>Ja, das Fleisch bei uns ist halal.</p>']
      ]
    },
    en: {
      title: 'Restaurant in Freiburg City Centre: Turkish Grill | Divan Ocakbaşı',
      desc: 'Turkish restaurant in Freiburg city centre: charcoal grill, meze, pide and künefe. Bertoldstraße 54, open daily 11:30–23:30, lunch menu €10.90.',
      eyebrow: 'Restaurant in Freiburg', short: 'Turkish grill cuisine in the city centre – overview',
      h1: 'Restaurant in Freiburg city centre: <em>Turkish grill cuisine at the ocakbaşı</em>',
      lead: 'Divan Ocakbaşı is at Bertoldstraße 54, right in Freiburg’s city centre and only about a 4-minute walk from the main station. On the open charcoal grill – the ocak – we cook köfte, Adana and lamb chops, served with meze to share, fresh pide, bakes from the stone oven and, to finish, a künefe. We are open every day from 11:30 am to 11:30 pm.',
      figAlt: 'Karışık Et Tabağı – mixed grill platter for two at Divan Ocakbaşı in Freiburg',
      body: `
<h2>What to expect at Divan</h2>
<p>“Ocakbaşı” literally means “sitting by the fire”. In Anatolia it is where people gather – around the grill where the meat cooks over the embers. We bring exactly this tradition to Bertoldstraße: real embers, rich spices and heartfelt hospitality.</p>
<p>The meat we serve is halal.</p>
<p>Our menu has more than 200 dishes and drinks – from starters and meze to grill specialities, döner, pide and lahmacun, the saç pan, börek and poğaça, desserts, rakı, wine and beer. The full menu is digital in 15 languages, at the table via QR code or online.</p>
[[fig]]
<h2>Popular dishes</h2>
<ul>
<li><strong>Karışık Et Tabağı</strong> – the mixed grill: lamb skewer, lamb chops, döner meat, meatballs and turkey skewer with rice, garlic yoghurt sauce and salad. Also available as a large platter for two.</li>
<li><strong>Peynirli Sarımsaklı Köfte</strong> – meatballs filled with sheep’s cheese and garlic, served with rice.</li>
<li><strong>İskender Spezial</strong> – döner on fresh sesame bread with tomatoes, garlic yoghurt and tomato sauce.</li>
<li><strong>Karnıyarık</strong> – oven-baked aubergines with a spiced minced-meat filling, tomato sauce and butter rice.</li>
<li><strong>Sebzeli Kiremit</strong> – a vegetable bake from the stone oven.</li>
<li><strong>Künefe</strong> – shredded pastry with melted cheese in syrup, topped with pistachios.</li>
</ul>
<p>Not sure what the names mean? Our guide [[link:glossary|Turkish food explained]] has the answers.</p>
<h2>Lunch in the city centre</h2>
<p>Every day from 11:30 am to 4 pm we offer twenty lunch dishes at €10.90 each, for example saç döner, Ali Nazik or börek. Details: [[link:lunch|Lunch in Freiburg]].</p>
<h2>Location and getting here</h2>
<p>The restaurant is at Bertoldstraße 54, between the main station and the old-town centre. It is only a few minutes on foot to the university, the concert hall and Bertoldsbrunnen:</p>
[[dist:konzert,uni,hbf,bertold,muenster]]
<p>Arriving by train? Read [[link:station|Restaurant near Freiburg train station]]. Visiting the city? Our [[link:visit|tips for eating out in Freiburg]] show distances to the main sights.</p>
[[facts]]
<h2>Reservations and ordering</h2>
<p>Reserve a table by phone on <a href="tel:+497612927151">0761 2927151</a>. Prefer to eat at home? Our dishes are also available via <a href="${LIEFERANDO}" target="_blank" rel="noopener">Lieferando</a> and <a href="${WOLT}" target="_blank" rel="noopener">Wolt</a> – please check the delivery area in the respective app.</p>`,
      faq: [
        ['Where is Divan Ocakbaşı in Freiburg?', '<p>At Bertoldstraße 54, 79098 Freiburg im Breisgau, in the city centre. From the main station it is about 270 m, roughly a 4-minute walk.</p>'],
        ['What does ocakbaşı mean?', '<p>The Turkish word means “sitting by the fire”. An ocakbaşı is a grill restaurant where the food is prepared on an open grill.</p>'],
        ['When is the restaurant open?', '<p>Every day from 11:30 am to 11:30 pm. The lunch menu is served from 11:30 am to 4 pm. Hours may differ on public holidays.</p>'],
        ['Can I book a table?', '<p>Yes, by phone on <a href="tel:+497612927151">0761 2927151</a>.</p>'],
        ['Is the meat halal?', '<p>Yes, the meat we serve is halal.</p>']
      ]
    }
  },

  /* ------------------------------------------------------------------ lunch */
  {
    id: 'lunch', slug: { de: 'mittagstisch-freiburg', en: 'lunch-freiburg' },
    img: { src: 'iskender.jpg', w: 1000, h: 668 },
    de: {
      title: 'Mittagstisch Freiburg: Mittagsmenü 10,90 € | Divan Ocakbaşı',
      desc: 'Mittagstisch in der Freiburger Innenstadt: 20 Mittagsgerichte für je 10,90 €, täglich 11:30–16:00 Uhr. Türkische Küche in der Bertoldstraße 54.',
      eyebrow: 'Mittagstisch in Freiburg', short: 'Mittagsmenü: 20 Gerichte für je 10,90 €',
      h1: 'Mittagstisch in Freiburg: <em>20 Gerichte für 10,90 €</em>',
      lead: 'Von Saç Döner über Ali Nazik bis Börek: Im Divan gibt es täglich von 11:30 bis 16:00 Uhr zwanzig Mittagsgerichte – jedes für 10,90 €. Mitten in der Innenstadt, nur wenige Gehminuten von Universität und Hauptbahnhof.',
      figAlt: 'İskender Spezial – Dönerfleisch auf Sesambrot mit Joghurt- und Tomatensoße im Divan Freiburg',
      body: `
<h2>Das Mittagsmenü im Überblick</h2>
<ul>
<li><strong>Zeit:</strong> täglich von 11:30 bis 16:00 Uhr</li>
<li><strong>Auswahl:</strong> 20 Mittagsgerichte</li>
<li><strong>Preis:</strong> 10,90 € pro Gericht</li>
<li><strong>Hinweis:</strong> An Feiertagen können die Zeiten abweichen – im Zweifel kurz anrufen: <a href="tel:+497612927151">0761 2927151</a>.</li>
</ul>
[[fig]]
<h2>Was steht auf dem Mittagstisch?</h2>
<p>Die Auswahl reicht von Saç Döner über Ali Nazik bis zu Börek. Zur Orientierung:</p>
<ul>
<li><strong>Saç Döner</strong> – ein Dönergericht aus der Saç-Pfanne, der gewölbten Eisenplatte der anatolischen Küche.</li>
<li><strong>Ali Nazik</strong> – klassisch Auberginenpüree mit Knoblauchjoghurt und gebratenem Fleisch, ein Gericht aus Südostanatolien.</li>
<li><strong>Börek</strong> – gefülltes Gebäck aus dünnem Teig.</li>
</ul>
<p>Die aktuelle Auswahl sehen Sie in der <a href="${MENU_URL}" target="_blank" rel="noopener">digitalen Speisekarte</a> oder erfahren Sie telefonisch. Mehr zu den Gerichten: [[link:glossary|Türkische Gerichte erklärt]].</p>
<h2>Mittagspause mitten in der Innenstadt</h2>
<p>Wir liegen in der Bertoldstraße 54 – ideal für die Mittagspause zwischen Vorlesung, Büro, Stadtbummel oder Zugfahrt:</p>
[[dist:uni,hbf,bertold]]
<h2>Mittags- und Abendessen an einem Ort</h2>
<p>Nach dem Mittagsmenü steht die komplette Speisekarte mit mehr als 200 Gerichten und Getränken zur Verfügung; wir haben bis 23:30 Uhr geöffnet. Einen Überblick gibt die Seite [[link:restaurant|Restaurant in der Freiburger Innenstadt]].</p>
[[facts]]`,
      faq: [
        ['Gibt es den Mittagstisch auch am Wochenende?', '<p>Das Mittagsmenü bieten wir täglich von 11:30 bis 16:00 Uhr an. An Feiertagen können die Zeiten abweichen.</p>'],
        ['Was kostet das Mittagsmenü?', '<p>Jedes der 20 Mittagsgerichte kostet 10,90 €.</p>'],
        ['Kann ich zum Mittagessen reservieren?', '<p>Ja, telefonisch unter <a href="tel:+497612927151">0761 2927151</a>.</p>'],
        ['Kann ich das Mittagsmenü auch liefern lassen?', '<p>Auch über <a href="' + LIEFERANDO + '" target="_blank" rel="noopener">Lieferando</a> finden Sie ein Mittagsmenü. Auswahl und Preise können dort abweichen; das Liefergebiet prüfen Sie bitte in der App.</p>']
      ]
    },
    en: {
      title: 'Lunch in Freiburg: Lunch Menu €10.90 | Divan Ocakbaşı',
      desc: 'Lunch in Freiburg city centre: 20 lunch dishes at €10.90 each, daily 11:30 am–4 pm. Turkish cuisine at Bertoldstraße 54.',
      eyebrow: 'Lunch in Freiburg', short: 'Lunch menu: 20 dishes at €10.90 each',
      h1: 'Lunch in Freiburg: <em>20 dishes for €10.90</em>',
      lead: 'From saç döner and Ali Nazik to börek: every day from 11:30 am to 4 pm Divan serves twenty lunch dishes – each for €10.90. Right in the city centre, just a few minutes’ walk from the university and the main station.',
      figAlt: 'İskender Spezial – döner on sesame bread with yoghurt and tomato sauce at Divan Freiburg',
      body: `
<h2>The lunch menu at a glance</h2>
<ul>
<li><strong>Time:</strong> daily from 11:30 am to 4 pm</li>
<li><strong>Choice:</strong> 20 lunch dishes</li>
<li><strong>Price:</strong> €10.90 per dish</li>
<li><strong>Note:</strong> hours may differ on public holidays – if in doubt, call: <a href="tel:+497612927151">0761 2927151</a>.</li>
</ul>
[[fig]]
<h2>What is on the lunch menu?</h2>
<p>The choice ranges from saç döner and Ali Nazik to börek. For orientation:</p>
<ul>
<li><strong>Saç döner</strong> – a döner dish from the saç pan, the domed iron plate of Anatolian cooking.</li>
<li><strong>Ali Nazik</strong> – classically aubergine purée with garlic yoghurt and fried meat, a dish from south-eastern Anatolia.</li>
<li><strong>Börek</strong> – filled pastry made from thin dough.</li>
</ul>
<p>See the current selection in the <a href="${MENU_URL}" target="_blank" rel="noopener">digital menu</a> or ask by phone. More about the dishes: [[link:glossary|Turkish food explained]].</p>
<h2>A lunch break in the middle of the city</h2>
<p>We are at Bertoldstraße 54 – ideal for a lunch break between lectures, the office, a stroll through town or a train journey:</p>
[[dist:uni,hbf,bertold]]
<h2>Lunch and dinner in one place</h2>
<p>After the lunch menu the full menu with more than 200 dishes and drinks is available, and we are open until 11:30 pm. For an overview see [[link:restaurant|Restaurant in Freiburg city centre]].</p>
[[facts]]`,
      faq: [
        ['Is the lunch menu available at the weekend?', '<p>We offer the lunch menu every day from 11:30 am to 4 pm. Hours may differ on public holidays.</p>'],
        ['How much is the lunch menu?', '<p>Each of the 20 lunch dishes costs €10.90.</p>'],
        ['Can I book a table for lunch?', '<p>Yes, by phone on <a href="tel:+497612927151">0761 2927151</a>.</p>'],
        ['Can I get the lunch menu delivered?', '<p>You will also find a lunch menu on <a href="' + LIEFERANDO + '" target="_blank" rel="noopener">Lieferando</a>. Selection and prices may differ there; please check the delivery area in the app.</p>']
      ]
    }
  },

  /* ------------------------------------------------------------------ near the station */
  {
    id: 'station', slug: { de: 'restaurant-hauptbahnhof-freiburg', en: 'restaurant-near-freiburg-train-station' },
    img: { src: 'meze.jpg', w: 1000, h: 668 },
    de: {
      title: 'Restaurant nahe Hauptbahnhof Freiburg: 4 Min. zu Fuß | Divan',
      desc: 'Essen in der Nähe vom Freiburger Hauptbahnhof: Divan Ocakbaşı, Bertoldstraße 54 – ca. 270 m bzw. 4 Gehminuten. Türkische Grillküche, täglich 11:30–23:30 Uhr.',
      eyebrow: 'Nähe Hauptbahnhof', short: 'Nur ca. 270 m vom Hauptbahnhof',
      h1: 'Restaurant in der Nähe vom Hauptbahnhof Freiburg: <em>nur 4 Minuten zu Fuß</em>',
      lead: 'Wer in Freiburg ankommt oder abreist und vorher noch etwas essen möchte: Das Divan Ocakbaşı liegt in der Bertoldstraße 54, nur ca. 270 m vom Hauptbahnhof entfernt – rund 4 Minuten zu Fuß Richtung Innenstadt. Wir haben täglich von 11:30 bis 23:30 Uhr geöffnet.',
      figAlt: 'Karışık Meze – gemischter Vorspeisenteller zum Teilen im Divan Freiburg',
      body: `
<h2>Vom Hauptbahnhof zum Divan</h2>
<p>Die Entfernung vom Hauptbahnhof Freiburg beträgt ca. 270 m Luftlinie, zu Fuß etwa 4 Minuten. Die genaue Route zeigt Ihnen <a href="${ROUTE_HBF}" target="_blank" rel="noopener">Google Maps: zu Fuß vom Hauptbahnhof zum Divan</a>.</p>
[[fig]]
<h2>Essen vor der Abfahrt oder nach der Ankunft</h2>
<p>Ob Mittagessen vor der Weiterreise oder Abendessen nach der Ankunft: Wir haben täglich von 11:30 bis 23:30 Uhr geöffnet, das Mittagsmenü gibt es von 11:30 bis 16:00 Uhr für 10,90 € pro Gericht (siehe [[link:lunch|Mittagstisch Freiburg]]). Die Speisekarte ist digital in 15 Sprachen verfügbar – praktisch für Reisende aus dem Ausland.</p>
<h2>Was in der Nähe liegt</h2>
[[dist:konzert,uni,synagoge,hbf,colombi,bertold]]
<p>Das Konzerthaus Freiburg ist nur ca. 70 m entfernt – passend für ein Essen vor oder nach einer Veranstaltung.</p>
<h2>Lieber im Hotel oder in der Ferienwohnung essen?</h2>
<p>Unsere Gerichte gibt es auch über <a href="${LIEFERANDO}" target="_blank" rel="noopener">Lieferando</a> und <a href="${WOLT}" target="_blank" rel="noopener">Wolt</a>. Ob Ihre Unterkunft im Liefergebiet liegt, sehen Sie in der jeweiligen App.</p>
<h2>Mehr über das Restaurant</h2>
<p>Was uns ausmacht, steht auf der Seite [[link:restaurant|Restaurant in der Freiburger Innenstadt]]. Tipps für Besucher finden Sie unter [[link:visit|Essen gehen in Freiburg]].</p>
[[facts]]`,
      faq: [
        ['Wie weit ist das Divan vom Hauptbahnhof Freiburg entfernt?', '<p>Ca. 270 m Luftlinie, zu Fuß rund 4 Minuten. Die Adresse lautet Bertoldstraße 54, 79098 Freiburg.</p>'],
        ['Bis wann hat das Restaurant geöffnet?', '<p>Täglich bis 23:30 Uhr, ab 11:30 Uhr. An Feiertagen können die Zeiten abweichen.</p>'],
        ['Gibt es die Speisekarte auf Englisch?', '<p>Ja, die digitale Speisekarte gibt es in 15 Sprachen, darunter Englisch, Französisch, Spanisch, Italienisch, Russisch, Chinesisch und Koreanisch.</p>'],
        ['Kann ich vorher reservieren?', '<p>Ja, telefonisch unter <a href="tel:+497612927151">0761 2927151</a>.</p>']
      ]
    },
    en: {
      title: 'Restaurant near Freiburg Train Station: 4 Min. Walk | Divan',
      desc: 'Eat near Freiburg main station: Divan Ocakbaşı, Bertoldstraße 54 – about 270 m, a 4-minute walk. Turkish grill cuisine, open daily 11:30 am–11:30 pm.',
      eyebrow: 'Near the main station', short: 'Only about 270 m from the main station',
      h1: 'Restaurant near Freiburg train station: <em>just a 4-minute walk</em>',
      lead: 'Arriving in or leaving Freiburg and want to eat first? Divan Ocakbaşı is at Bertoldstraße 54, only about 270 m from the main station – roughly a 4-minute walk towards the city centre. We are open every day from 11:30 am to 11:30 pm.',
      figAlt: 'Karışık Meze – mixed starter platter to share at Divan Freiburg',
      body: `
<h2>From the main station to Divan</h2>
<p>The distance from Freiburg main station is about 270 m as the crow flies, around 4 minutes on foot. For the exact route see <a href="${ROUTE_HBF}" target="_blank" rel="noopener">Google Maps: walking from the main station to Divan</a>.</p>
[[fig]]
<h2>Eating before you leave or after you arrive</h2>
<p>Lunch before the next leg of your journey or dinner after arriving: we are open every day from 11:30 am to 11:30 pm, and the lunch menu runs from 11:30 am to 4 pm at €10.90 per dish (see [[link:lunch|Lunch in Freiburg]]). The menu is digital in 15 languages – handy for travellers from abroad.</p>
<h2>What is nearby</h2>
[[dist:konzert,uni,synagoge,hbf,colombi,bertold]]
<p>The Freiburg Concert Hall is only about 70 m away – a good fit for a meal before or after an event.</p>
<h2>Prefer to eat at your hotel or holiday flat?</h2>
<p>Our dishes are also available via <a href="${LIEFERANDO}" target="_blank" rel="noopener">Lieferando</a> and <a href="${WOLT}" target="_blank" rel="noopener">Wolt</a>. Whether your accommodation is within the delivery area is shown in the respective app.</p>
<h2>More about the restaurant</h2>
<p>What we are about is on the page [[link:restaurant|Restaurant in Freiburg city centre]]. Tips for visitors: [[link:visit|Where to eat in Freiburg]].</p>
[[facts]]`,
      faq: [
        ['How far is Divan from Freiburg main station?', '<p>About 270 m as the crow flies, roughly a 4-minute walk. The address is Bertoldstraße 54, 79098 Freiburg.</p>'],
        ['How late is the restaurant open?', '<p>Every day until 11:30 pm, from 11:30 am. Hours may differ on public holidays.</p>'],
        ['Is there a menu in English?', '<p>Yes, the digital menu is available in 15 languages, including English, French, Spanish, Italian, Russian, Chinese and Korean.</p>'],
        ['Can I book in advance?', '<p>Yes, by phone on <a href="tel:+497612927151">0761 2927151</a>.</p>']
      ]
    }
  },

  /* ------------------------------------------------------------------ glossary */
  {
    id: 'glossary', slug: { de: 'tuerkische-gerichte-erklaert', en: 'turkish-food-guide' },
    img: { src: 'koefte-peynirli.jpg', w: 1000, h: 668 },
    de: {
      title: 'Türkische Gerichte erklärt: Adana, İskender, Künefe | Divan',
      desc: 'Was ist Adana, İskender, Karnıyarık oder Künefe? Türkische Gerichte einfach erklärt – von Meze bis Rakı, mit Tipps vom Divan Ocakbaşı in Freiburg.',
      eyebrow: 'Ratgeber', short: 'Adana, İskender, Künefe & Co. einfach erklärt',
      h1: 'Türkische Gerichte erklärt: <em>Was ist Adana, İskender und Künefe?</em>',
      lead: 'Türkische Speisekarten sind voller Begriffe, die man nicht überall kennt. Hier erklären wir die wichtigsten Gerichte – und sagen, was Sie davon im Divan Ocakbaşı in Freiburg finden.',
      figAlt: 'Peynirli Sarımsaklı Köfte – mit Schafskäse und Knoblauch gefüllte Köfte im Divan Freiburg',
      body: `
[[fig]]
<h2>Grill und Fleischgerichte</h2>
<div class="cards">
<div class="card"><h3>Ocakbaşı</h3><p>„Ocak“ ist die Feuerstelle, „baş“ der Platz davor: ein Ocakbaşı ist ein Grillrestaurant, in dem am offenen Grill gegart wird – und man oft direkt am Feuer sitzt.</p><p class="here"><strong>Im Divan:</strong> offener Holzkohlegrill.</p></div>
<div class="card"><h3>Adana Şiş</h3><p>Würziges, oft scharfes Hackfleisch (traditionell vom Lamm) auf einem breiten Spieß über Holzkohle gegrillt. Benannt nach der Stadt Adana im Süden der Türkei.</p><p class="here"><strong>Im Divan:</strong> Adana Şiş vom Holzkohlegrill.</p></div>
<div class="card"><h3>Şiş</h3><p>Das türkische Wort für Spieß: Fleischstücke (Lamm, Huhn, Pute) werden auf einen Spieß gesteckt und gegrillt.</p><p class="here"><strong>Im Divan:</strong> Lammspieß und Putenspieß im Karışık Et Tabağı.</p></div>
<div class="card"><h3>Köfte</h3><p>Gewürzte Hackfleischbällchen oder -röllchen, gegrillt oder gebraten.</p><p class="here"><strong>Im Divan:</strong> Peynirli Sarımsaklı Köfte (mit Schafskäse und Knoblauch gefüllt) und Pilavlı Köfte (mit Reis).</p></div>
<div class="card"><h3>İskender</h3><p>Dönerfleisch auf Brotstücken, mit Tomatensauce und Joghurt serviert – traditionell mit zerlassener Butter. Das Gericht stammt aus Bursa.</p><p class="here"><strong>Im Divan:</strong> İskender Spezial – Dönerfleisch auf frischem Sesambrot mit Tomaten, Knoblauch-Joghurt-Soße und Tomatensoße.</p></div>
<div class="card"><h3>Karnıyarık</h3><p>„Aufgeschlitzter Bauch“: eine Aubergine wird längs eingeschnitten und mit Hackfleisch, Zwiebeln und Tomaten gefüllt.</p><p class="here"><strong>Im Divan:</strong> ofengebackene Auberginen mit würziger Hackfleischfüllung, Tomatensoße und Butterreis.</p></div>
<div class="card"><h3>Ali Nazik</h3><p>Auberginenpüree mit Knoblauchjoghurt, darauf gebratenes Fleisch – ein Klassiker aus Südostanatolien.</p><p class="here"><strong>Im Divan:</strong> auf dem Mittagsmenü.</p></div>
<div class="card"><h3>Saç</h3><p>Die Saç ist eine gewölbte Eisenplatte bzw. Pfanne. Saç-Gerichte werden darauf zubereitet und heiß serviert.</p><p class="here"><strong>Im Divan:</strong> Saç-Pfanne auf der Karte, Saç Döner im Mittagsmenü.</p></div>
</div>
<h2>Vorspeisen, Ofengerichte und Gebäck</h2>
<div class="cards">
<div class="card"><h3>Meze</h3><p>Kleine Vorspeisen, die man sich in der Mitte des Tisches teilt – kalt oder warm, oft zusammen mit Rakı.</p><p class="here"><strong>Im Divan:</strong> Karışık Meze, klein oder groß für zwei Personen.</p></div>
<div class="card"><h3>Kiremit</h3><p>Das türkische Wort für Dachziegel; Kiremit-Gerichte sind Aufläufe aus dem Steinofen.</p><p class="here"><strong>Im Divan:</strong> Sebzeli Kiremit – Gemüseauflauf mit Kartoffeln, Auberginen, Zucchini, Blumenkohl, Paprika, Tomaten und Knoblauch.</p></div>
<div class="card"><h3>Pide</h3><p>Ein längliches Fladenbrot in Schiffchenform, belegt oder gefüllt und im Steinofen gebacken.</p><p class="here"><strong>Im Divan:</strong> Pide, zum Beispiel Peynirli Pide mit Käse.</p></div>
<div class="card"><h3>Lahmacun</h3><p>Dünner Teigfladen mit würzigem Hackfleischbelag, oft „türkische Pizza“ genannt. Man rollt ihn gern mit Salat und Zitrone auf.</p><p class="here"><strong>Im Divan:</strong> Pide & Lahmacun auf der Karte.</p></div>
<div class="card"><h3>Börek & Poğaça</h3><p>Börek ist gefülltes Gebäck aus dünnem Teig (etwa mit Käse, Spinat oder Fleisch). Poğaça ist ein weiches, herzhaftes Teiggebäck.</p><p class="here"><strong>Im Divan:</strong> frisch gebackene Börek und Poğaça.</p></div>
</div>
<h2>Dessert und Getränke</h2>
<div class="cards">
<div class="card"><h3>Künefe</h3><p>Feine Teigfäden (Kadayıf) mit geschmolzenem Käse, in Sirup getränkt und mit Pistazien bestreut – am besten warm. Die Süßspeise stammt aus dem Süden der Türkei.</p><p class="here"><strong>Im Divan:</strong> Künefe mit Pistazien.</p></div>
<div class="card"><h3>Ayran</h3><p>Ein erfrischendes Joghurtgetränk aus Joghurt, Wasser und Salz – ein klassischer Begleiter zu Gegrilltem.</p><p class="here"><strong>Im Divan:</strong> hausgemachter Ayran.</p></div>
<div class="card"><h3>Rakı</h3><p>Ein Anisbrand, der meist mit Wasser verdünnt wird und dabei milchig weiß wird. Er wird traditionell zu Meze getrunken.</p><p class="here"><strong>Im Divan:</strong> Rakı, Wein und Bier auf der Getränkekarte.</p></div>
</div>
<h2>Tipps für den ersten Besuch</h2>
<ul>
<li>Möchten Sie mehrere Spezialitäten probieren? Der <strong>Karışık Et Tabağı</strong> vereint Lammspieß, Lammkoteletts, Dönerfleisch, Köfte und Putenspieß – auf Wunsch als große Platte für zwei.</li>
<li>Bestellen Sie <strong>Meze zum Teilen</strong> vorab, so kommt jeder zum Probieren.</li>
<li>Zum Abschluss passt ein <strong>Künefe</strong> – oder ein Glas Rakı.</li>
</ul>
<p>Die komplette Karte mit mehr als 200 Gerichten und Getränken gibt es <a href="${MENU_URL}" target="_blank" rel="noopener">digital in 15 Sprachen</a>. Alle Infos zum Restaurant: [[link:restaurant|Restaurant in der Freiburger Innenstadt]].</p>`,
      faq: [
        ['Ist türkisches Essen scharf?', '<p>Das hängt vom Gericht ab. Adana ist traditionell würzig-scharf, viele andere Gerichte sind mild gewürzt. Bei Fragen zur Schärfe sprechen Sie uns bitte an.</p>'],
        ['Welches Gericht eignet sich für den ersten Besuch?', '<p>Der Karışık Et Tabağı (gemischter Grillteller) bietet einen Querschnitt, dazu passen Meze zum Teilen.</p>'],
        ['Was bedeutet Karnıyarık?', '<p>„Aufgeschlitzter Bauch“: eine mit Hackfleisch gefüllte Aubergine.</p>'],
        ['Was ist der Unterschied zwischen Pide und Lahmacun?', '<p>Pide ist ein dickeres, belegtes Fladenbrot in Schiffchenform. Lahmacun ist ein dünner Teigfladen mit würzigem Hackfleisch.</p>']
      ]
    },
    en: {
      title: 'Turkish Food Explained: Adana, İskender, Künefe | Divan',
      desc: 'What is Adana, İskender, karnıyarık or künefe? Turkish dishes explained simply – from meze to rakı, with tips from Divan Ocakbaşı in Freiburg.',
      eyebrow: 'Guide', short: 'Adana, İskender, künefe & co. explained',
      h1: 'Turkish food explained: <em>what are Adana, İskender and künefe?</em>',
      lead: 'Turkish menus are full of terms not everyone knows. Here we explain the most important dishes – and tell you what you can find of them at Divan Ocakbaşı in Freiburg.',
      figAlt: 'Peynirli Sarımsaklı Köfte – köfte filled with sheep’s cheese and garlic at Divan Freiburg',
      body: `
[[fig]]
<h2>Grill and meat dishes</h2>
<div class="cards">
<div class="card"><h3>Ocakbaşı</h3><p>“Ocak” is the hearth, “baş” the place in front of it: an ocakbaşı is a grill restaurant where food is cooked on an open grill – and guests often sit right at the fire.</p><p class="here"><strong>At Divan:</strong> an open charcoal grill.</p></div>
<div class="card"><h3>Adana şiş</h3><p>Spiced, often hot minced meat (traditionally lamb) grilled over charcoal on a wide skewer. Named after the city of Adana in southern Turkey.</p><p class="here"><strong>At Divan:</strong> Adana şiş from the charcoal grill.</p></div>
<div class="card"><h3>Şiş</h3><p>The Turkish word for skewer: pieces of meat (lamb, chicken, turkey) are threaded on a skewer and grilled.</p><p class="here"><strong>At Divan:</strong> lamb skewer and turkey skewer in the Karışık Et Tabağı.</p></div>
<div class="card"><h3>Köfte</h3><p>Spiced meatballs or patties, grilled or fried.</p><p class="here"><strong>At Divan:</strong> Peynirli Sarımsaklı Köfte (filled with sheep’s cheese and garlic) and Pilavlı Köfte (with rice).</p></div>
<div class="card"><h3>İskender</h3><p>Döner meat on pieces of bread, served with tomato sauce and yoghurt – traditionally with melted butter. The dish comes from Bursa.</p><p class="here"><strong>At Divan:</strong> İskender Spezial – döner on fresh sesame bread with tomatoes, garlic yoghurt and tomato sauce.</p></div>
<div class="card"><h3>Karnıyarık</h3><p>“Split belly”: an aubergine is cut open lengthways and filled with minced meat, onions and tomatoes.</p><p class="here"><strong>At Divan:</strong> oven-baked aubergines with a spiced minced-meat filling, tomato sauce and butter rice.</p></div>
<div class="card"><h3>Ali Nazik</h3><p>Aubergine purée with garlic yoghurt topped with fried meat – a classic from south-eastern Anatolia.</p><p class="here"><strong>At Divan:</strong> on the lunch menu.</p></div>
<div class="card"><h3>Saç</h3><p>A saç is a domed iron plate or pan. Saç dishes are prepared on it and served hot.</p><p class="here"><strong>At Divan:</strong> saç pan on the menu, saç döner on the lunch menu.</p></div>
</div>
<h2>Starters, oven dishes and pastries</h2>
<div class="cards">
<div class="card"><h3>Meze</h3><p>Small starters shared in the middle of the table – cold or warm, often enjoyed with rakı.</p><p class="here"><strong>At Divan:</strong> Karışık Meze, small or large for two.</p></div>
<div class="card"><h3>Kiremit</h3><p>The Turkish word for roof tile; kiremit dishes are bakes from the stone oven.</p><p class="here"><strong>At Divan:</strong> Sebzeli Kiremit – vegetable bake with potatoes, aubergines, courgettes, cauliflower, peppers, tomatoes and garlic.</p></div>
<div class="card"><h3>Pide</h3><p>An oblong, boat-shaped flatbread, topped or filled and baked in the stone oven.</p><p class="here"><strong>At Divan:</strong> pide, for example Peynirli Pide with cheese.</p></div>
<div class="card"><h3>Lahmacun</h3><p>A thin dough base with a spiced minced-meat topping, often called “Turkish pizza”. Often rolled up with salad and lemon.</p><p class="here"><strong>At Divan:</strong> Pide & lahmacun on the menu.</p></div>
<div class="card"><h3>Börek & poğaça</h3><p>Börek is filled pastry made from thin dough (for example with cheese, spinach or meat). Poğaça is a soft savoury bun.</p><p class="here"><strong>At Divan:</strong> freshly baked börek and poğaça.</p></div>
</div>
<h2>Dessert and drinks</h2>
<div class="cards">
<div class="card"><h3>Künefe</h3><p>Fine shredded pastry (kadayıf) with melted cheese, soaked in syrup and sprinkled with pistachios – best served warm. The dessert comes from the south of Turkey.</p><p class="here"><strong>At Divan:</strong> künefe with pistachios.</p></div>
<div class="card"><h3>Ayran</h3><p>A refreshing drink made of yoghurt, water and salt – a classic companion to grilled food.</p><p class="here"><strong>At Divan:</strong> homemade ayran.</p></div>
<div class="card"><h3>Rakı</h3><p>An aniseed spirit usually diluted with water, which turns it milky white. Traditionally drunk with meze.</p><p class="here"><strong>At Divan:</strong> rakı, wine and beer on the drinks menu.</p></div>
</div>
<h2>Tips for your first visit</h2>
<ul>
<li>Want to try several specialities? The <strong>Karışık Et Tabağı</strong> combines lamb skewer, lamb chops, döner meat, köfte and turkey skewer – also available as a large platter for two.</li>
<li>Order <strong>meze to share</strong> first, so everyone gets a taste.</li>
<li>To finish, a <strong>künefe</strong> – or a glass of rakı.</li>
</ul>
<p>The full menu with more than 200 dishes and drinks is available <a href="${MENU_URL}" target="_blank" rel="noopener">digitally in 15 languages</a>. All about the restaurant: [[link:restaurant|Restaurant in Freiburg city centre]].</p>`,
      faq: [
        ['Is Turkish food spicy?', '<p>It depends on the dish. Adana is traditionally hot and spicy, many other dishes are mildly seasoned. If you have questions about spice levels, please ask us.</p>'],
        ['Which dish is good for a first visit?', '<p>The Karışık Et Tabağı (mixed grill platter) offers a cross-section, and meze to share go well with it.</p>'],
        ['What does karnıyarık mean?', '<p>“Split belly”: an aubergine filled with minced meat.</p>'],
        ['What is the difference between pide and lahmacun?', '<p>Pide is a thicker, topped flatbread in boat shape. Lahmacun is a thin dough base with spiced minced meat.</p>']
      ]
    }
  },

  /* ------------------------------------------------------------------ visitors */
  {
    id: 'visit', slug: { de: 'essen-gehen-freiburg', en: 'where-to-eat-in-freiburg' },
    img: { src: 'kiremit.jpg', w: 1000, h: 668 },
    de: {
      title: 'Essen gehen in Freiburg: Tipps für Besucher | Divan Ocakbaşı',
      desc: 'Wo in Freiburg essen? Tipps für Besucher: türkische Grillküche in der Innenstadt, Entfernungen zu Münster, Bahnhof und Uni, geöffnet bis 23:30 Uhr.',
      eyebrow: 'Tipps für Besucher', short: 'Entfernungen zu Münster, Bahnhof & Co.',
      h1: 'Essen gehen in Freiburg: <em>Tipps für Besucher</em>',
      lead: 'Freiburg ist kompakt – vieles lässt sich zu Fuß erreichen. Das Divan Ocakbaşı in der Bertoldstraße 54 liegt zwischen Hauptbahnhof und Altstadtzentrum. Hier sehen Sie, wie weit es von den bekanntesten Sehenswürdigkeiten ist.',
      figAlt: 'Sebzeli Kiremit – Gemüseauflauf aus dem Steinofen im Divan Freiburg',
      body: `
<h2>Hunger nach dem Sightseeing?</h2>
<p>Zwischen Münster, Martinstor und Schlossberg kommt man in Freiburg schnell auf viele Schritte. Gut zu wissen, wo man danach etwas Warmes bekommt: Wir haben täglich von 11:30 bis 23:30 Uhr geöffnet, mittags gibt es das Mittagsmenü für 10,90 €.</p>
[[fig]]
<h2>Entfernungen zu Sehenswürdigkeiten</h2>
[[dist:bertold,martin,rathaus,muenster,augustiner,schwaben,schlossberg]]
<h2>Ein Vorschlag für einen Tag in Freiburg</h2>
<ul>
<li><strong>Vormittag:</strong> Münster und Rathausplatz erkunden (ca. 8–12 Gehminuten vom Divan).</li>
<li><strong>Mittag:</strong> Mittagsmenü im Divan, 11:30–16:00 Uhr ([[link:lunch|Mittagstisch Freiburg]]).</li>
<li><strong>Nachmittag:</strong> Martinstor, Schwabentor und Schlossberg (Talstation der Schlossbergbahn ca. 17 Gehminuten).</li>
<li><strong>Abend:</strong> Abendessen und Künefe zum Abschluss – wir haben bis 23:30 Uhr geöffnet.</li>
</ul>
<h2>Türkische Küche für Neugierige</h2>
<p>Neben der badischen Küche lohnt sich ein Blick auf die Anatolische: Grillgerichte vom Holzkohlegrill, Meze zum Teilen, Pide und Börek. Was sich hinter den Namen verbirgt, erklärt der Ratgeber [[link:glossary|Türkische Gerichte erklärt]]. Die Speisekarte gibt es digital in 15 Sprachen – auch auf Englisch, Französisch, Spanisch, Italienisch, Russisch, Chinesisch und Koreanisch.</p>
<h2>Praktisch für Reisende</h2>
<ul>
<li>Vom Hauptbahnhof ca. 270 m, rund 4 Minuten zu Fuß ([[link:station|Restaurant nahe Hauptbahnhof]]).</li>
<li>Das Konzerthaus Freiburg ist nur ca. 70 m entfernt.</li>
<li>Telefonische Reservierung: <a href="tel:+497612927151">0761 2927151</a>.</li>
<li>Lieferung ins Hotel oder in die Ferienwohnung über <a href="${LIEFERANDO}" target="_blank" rel="noopener">Lieferando</a> oder <a href="${WOLT}" target="_blank" rel="noopener">Wolt</a> (Liefergebiet in der App prüfen).</li>
</ul>
[[facts]]`,
      faq: [
        ['Wo kann ich in Freiburg abends noch essen gehen?', '<p>Wir haben täglich bis 23:30 Uhr geöffnet. Die Adresse ist Bertoldstraße 54, 79098 Freiburg.</p>'],
        ['Wie weit ist das Divan vom Freiburger Münster entfernt?', '<p>Ca. 710 m Luftlinie, zu Fuß rund 12 Minuten.</p>'],
        ['Gibt es eine Speisekarte auf Englisch?', '<p>Ja, die digitale Speisekarte gibt es in 15 Sprachen, darunter Englisch.</p>'],
        ['Muss ich reservieren?', '<p>Reservierungen nehmen wir telefonisch unter <a href="tel:+497612927151">0761 2927151</a> an.</p>']
      ]
    },
    en: {
      title: 'Where to Eat in Freiburg: Tips for Visitors | Divan Ocakbaşı',
      desc: 'Where to eat in Freiburg? Tips for visitors: Turkish grill cuisine in the city centre, distances to the Minster, station and university, open until 11:30 pm.',
      eyebrow: 'Tips for visitors', short: 'Distances to the Minster, station & more',
      h1: 'Where to eat in Freiburg: <em>tips for visitors</em>',
      lead: 'Freiburg is compact – much of it is within walking distance. Divan Ocakbaşı at Bertoldstraße 54 sits between the main station and the old-town centre. Here is how far it is to the best-known sights.',
      figAlt: 'Sebzeli Kiremit – vegetable bake from the stone oven at Divan Freiburg',
      body: `
<h2>Hungry after sightseeing?</h2>
<p>Between the Minster, the Martinstor and the Schlossberg you soon clock up the steps in Freiburg. Good to know where to get something warm afterwards: we are open every day from 11:30 am to 11:30 pm, with a lunch menu at €10.90.</p>
[[fig]]
<h2>Distances to the sights</h2>
[[dist:bertold,martin,rathaus,muenster,augustiner,schwaben,schlossberg]]
<h2>One way to spend a day in Freiburg</h2>
<ul>
<li><strong>Morning:</strong> explore the Minster and Rathausplatz (about 8–12 minutes on foot from Divan).</li>
<li><strong>Lunch:</strong> the lunch menu at Divan, 11:30 am–4 pm ([[link:lunch|Lunch in Freiburg]]).</li>
<li><strong>Afternoon:</strong> Martinstor, Schwabentor and the Schlossberg (the Schlossbergbahn valley station is about 17 minutes on foot).</li>
<li><strong>Evening:</strong> dinner and a künefe to finish – we are open until 11:30 pm.</li>
</ul>
<h2>Turkish food for the curious</h2>
<p>Besides Baden cuisine, Anatolian food is worth a try: grill dishes from the charcoal grill, meze to share, pide and börek. The guide [[link:glossary|Turkish food explained]] tells you what the names mean. The menu is digital in 15 languages – including English, French, Spanish, Italian, Russian, Chinese and Korean.</p>
<h2>Practical for travellers</h2>
<ul>
<li>About 270 m from the main station, roughly 4 minutes on foot ([[link:station|Restaurant near the main station]]).</li>
<li>The Freiburg Concert Hall is only about 70 m away.</li>
<li>Table reservations by phone: <a href="tel:+497612927151">0761 2927151</a>.</li>
<li>Delivery to your hotel or holiday flat via <a href="${LIEFERANDO}" target="_blank" rel="noopener">Lieferando</a> or <a href="${WOLT}" target="_blank" rel="noopener">Wolt</a> (check the delivery area in the app).</li>
</ul>
[[facts]]`,
      faq: [
        ['Where can I eat out in Freiburg in the evening?', '<p>We are open every day until 11:30 pm. The address is Bertoldstraße 54, 79098 Freiburg.</p>'],
        ['How far is Divan from Freiburg Minster?', '<p>About 710 m as the crow flies, roughly a 12-minute walk.</p>'],
        ['Is there a menu in English?', '<p>Yes, the digital menu is available in 15 languages, including English.</p>'],
        ['Do I need to book?', '<p>We take reservations by phone on <a href="tel:+497612927151">0761 2927151</a>.</p>']
      ]
    }
  },

  /* ------------------------------------------------------------------ FAQ */
  {
    id: 'faq', slug: { de: 'faq', en: 'faq' },
    img: null,
    de: {
      title: 'FAQ: Häufige Fragen zum Divan Ocakbaşı Freiburg',
      desc: 'Öffnungszeiten, Reservierung, Mittagsmenü, Lage, Speisekarte in 15 Sprachen und Lieferung: Antworten auf häufige Fragen zum Divan Ocakbaşı in Freiburg.',
      eyebrow: 'FAQ', short: 'Öffnungszeiten, Reservierung, Lieferung & mehr',
      h1: 'Häufige Fragen zum <em>Divan Ocakbaşı</em>',
      lead: 'Öffnungszeiten, Reservierung, Mittagsmenü, Lage und Lieferung – hier finden Sie die Antworten auf die häufigsten Fragen. Weitere Fragen beantworten wir gern telefonisch unter 0761 2927151.',
      figAlt: '',
      body: `[[facts]]`,
      faq: [
        ['Wo liegt das Divan Ocakbaşı?', '<p>Bertoldstraße 54, 79098 Freiburg im Breisgau, in der Innenstadt – ca. 270 m (rund 4 Minuten zu Fuß) vom Hauptbahnhof. Mehr: <a href="../restaurant-hauptbahnhof-freiburg/">Restaurant nahe Hauptbahnhof</a>.</p>'],
        ['Wie sind die Öffnungszeiten?', '<p>Täglich von 11:30 bis 23:30 Uhr. An Feiertagen können die Zeiten abweichen.</p>'],
        ['Wie kann ich einen Tisch reservieren?', '<p>Telefonisch unter <a href="tel:+497612927151">0761 2927151</a>.</p>'],
        ['Gibt es einen Mittagstisch?', '<p>Ja: täglich von 11:30 bis 16:00 Uhr zwanzig Mittagsgerichte für je 10,90 €. Mehr: <a href="../mittagstisch-freiburg/">Mittagstisch Freiburg</a>.</p>'],
        ['Was bedeutet Ocakbaşı?', '<p>„Am Feuer sitzen“: ein Grillrestaurant, in dem das Essen am offenen Grill zubereitet wird. Bei uns ist das ein Holzkohlegrill.</p>'],
        ['Ist das Fleisch halal?', '<p>Ja, das Fleisch bei uns ist halal.</p>'],
        ['Welche Gerichte gibt es?','<p>Mehr als 200 Gerichte und Getränke: Vorspeisen und Meze, Grillspezialitäten, orientalische Spezialitäten, Döner Kebab, Aufläufe aus dem Steinofen, Saç-Pfanne, Pide und Lahmacun, Börek und Poğaça, Desserts sowie Rakı, Wein und Bier. Eine Erklärung der Begriffe finden Sie im Ratgeber <a href="../tuerkische-gerichte-erklaert/">Türkische Gerichte erklärt</a>.</p>'],
        ['Gibt es die Speisekarte in anderen Sprachen?', '<p>Ja, die <a href="' + MENU_URL + '" target="_blank" rel="noopener">digitale Speisekarte</a> gibt es in 15 Sprachen: Arabisch, Chinesisch, Deutsch, Englisch, Französisch, Griechisch, Hindi, Italienisch, Koreanisch, Kurdisch, Persisch, Russisch, Spanisch, Türkisch und Urdu. Am Tisch rufen Sie sie per QR-Code auf.</p>'],
        ['Welche vegetarischen Gerichte gibt es?', '<p>Dazu zählen zum Beispiel der Gemüseauflauf Sebzeli Kiremit aus dem Steinofen und verschiedene Meze. Ob ein Gericht vegetarisch ist, klären Sie bitte vor der Bestellung mit uns: <a href="tel:+497612927151">0761 2927151</a>.</p>'],
        ['Kann ich Essen liefern lassen?', '<p>Ja, über <a href="' + LIEFERANDO + '" target="_blank" rel="noopener">Lieferando</a> und <a href="' + WOLT + '" target="_blank" rel="noopener">Wolt</a>. Das Liefergebiet und die verfügbaren Gerichte sehen Sie in der jeweiligen App.</p>'],
        ['Gibt es Ayran, Rakı, Wein und Bier?', '<p>Ja: Ayran gibt es hausgemacht, dazu Rakı, Wein und Bier.</p>'],
        ['Was kann ich als Dessert bestellen?', '<p>Zum Beispiel Künefe: Teigfäden mit geschmolzenem Käse in Sirup, mit Pistazien.</p>'],
        ['Wo kann ich Fragen zu Zutaten und Allergenen klären?', '<p>Bitte rufen Sie uns an oder fragen Sie vor Ort: <a href="tel:+497612927151">0761 2927151</a>. Verbindliche Angaben zu Zutaten können wir hier nicht machen.</p>']
      ]
    },
    en: {
      title: 'FAQ: Frequently Asked Questions about Divan Ocakbaşı Freiburg',
      desc: 'Opening hours, reservations, lunch menu, location, menu in 15 languages and delivery: answers to common questions about Divan Ocakbaşı in Freiburg.',
      eyebrow: 'FAQ', short: 'Opening hours, reservations, delivery & more',
      h1: 'Frequently asked questions about <em>Divan Ocakbaşı</em>',
      lead: 'Opening hours, reservations, lunch menu, location and delivery – answers to the most common questions. We are happy to answer more by phone on 0761 2927151.',
      figAlt: '',
      body: `[[facts]]`,
      faq: [
        ['Where is Divan Ocakbaşı?', '<p>Bertoldstraße 54, 79098 Freiburg im Breisgau, in the city centre – about 270 m (roughly a 4-minute walk) from the main station. More: <a href="../restaurant-near-freiburg-train-station/">Restaurant near Freiburg train station</a>.</p>'],
        ['What are the opening hours?', '<p>Every day from 11:30 am to 11:30 pm. Hours may differ on public holidays.</p>'],
        ['How can I book a table?', '<p>By phone on <a href="tel:+497612927151">0761 2927151</a>.</p>'],
        ['Is there a lunch menu?', '<p>Yes: every day from 11:30 am to 4 pm, twenty lunch dishes at €10.90 each. More: <a href="../lunch-freiburg/">Lunch in Freiburg</a>.</p>'],
        ['What does ocakbaşı mean?', '<p>“Sitting by the fire”: a grill restaurant where food is prepared on an open grill. At our place that is a charcoal grill.</p>'],
        ['Is the meat halal?', '<p>Yes, the meat we serve is halal.</p>'],
        ['What dishes are there?','<p>More than 200 dishes and drinks: starters and meze, grill specialities, oriental specialities, döner kebab, bakes from the stone oven, the saç pan, pide and lahmacun, börek and poğaça, desserts, plus rakı, wine and beer. The guide <a href="../turkish-food-guide/">Turkish food explained</a> explains the terms.</p>'],
        ['Is the menu available in other languages?', '<p>Yes, the <a href="' + MENU_URL + '" target="_blank" rel="noopener">digital menu</a> is available in 15 languages: Arabic, Chinese, English, French, German, Greek, Hindi, Italian, Korean, Kurdish, Persian, Russian, Spanish, Turkish and Urdu. At the table, open it via QR code.</p>'],
        ['What vegetarian dishes are there?', '<p>These include, for example, the vegetable bake Sebzeli Kiremit from the stone oven and various meze. Please check with us before ordering whether a dish is vegetarian: <a href="tel:+497612927151">0761 2927151</a>.</p>'],
        ['Can I have food delivered?', '<p>Yes, via <a href="' + LIEFERANDO + '" target="_blank" rel="noopener">Lieferando</a> and <a href="' + WOLT + '" target="_blank" rel="noopener">Wolt</a>. The delivery area and available dishes are shown in the respective app.</p>'],
        ['Are there ayran, rakı, wine and beer?', '<p>Yes: ayran is homemade, and there are also rakı, wine and beer.</p>'],
        ['What can I order for dessert?', '<p>For example künefe: shredded pastry with melted cheese in syrup, topped with pistachios.</p>'],
        ['Where can I ask about ingredients and allergens?', '<p>Please call us or ask on site: <a href="tel:+497612927151">0761 2927151</a>. We cannot give binding information about ingredients here.</p>']
      ]
    }
  }
];

module.exports = { SITE, TEL, MENU_URL, LIEFERANDO, WOLT, ROUTE, ROUTE_HBF, INSTAGRAM, GOOGLE_MAPS, GEO, BUILT, DIST, T, pages };
