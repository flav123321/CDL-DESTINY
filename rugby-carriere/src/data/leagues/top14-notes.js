// Notes estimées (il n'existe pas de note officielle), âges approximatifs en 2026 et postes précis
// pour les joueurs connus. Format : 'Nom': [note, âge, poste?]. Postes : PG PD TA 2L 3L N8 DM DO CE AI AR.
// Les joueurs absents de cette liste reçoivent une note et un âge générés selon le prestige du club.
export const NOTABLES = {
  // Toulouse
  'Antoine Dupont': [93, 29], 'Romain Ntamack': [89, 27], 'Thomas Ramos': [87, 31, 'AR'], 'Blair Kinghorn': [85, 29, 'AR'],
  'Ange Capuozzo': [84, 27], 'Matthis Lebel': [82, 27], 'Juan Cruz Mallia': [81, 30], 'Teddy Thomas': [76, 33],
  'Pierre-Louis Barassi': [80, 28], 'Santiago Chocobares': [81, 27], 'Tommaso Menoncello': [86, 24], 'Kalvin Gourgues': [79, 20],
  'Paul Graou': [79, 27], 'François Cros': [85, 32], 'Anthony Jelonch': [84, 30], 'Alexandre Roumat': [84, 29],
  'Jack Willis': [85, 29], 'Théo Ntamack': [80, 23, 'N8'], 'Mathis Castro-Ferreira': [77, 22], 'Thibaud Flament': [87, 29],
  'Emmanuel Meafou': [88, 28], 'Joshua Brennan': [78, 27], 'Julien Marchand': [86, 31], 'Peato Mauvaka': [88, 29],
  'Cyril Baille': [86, 33, 'PG'], 'Dorian Aldegheri': [81, 33, 'PD'], 'Rodrigue Neti': [82, 24, 'PG'], 'Georges-Henri Colombe': [83, 28, 'PD'],
  'Joel Merkler': [80, 27, 'PD'], "David Ainu'u": [77, 26, 'PD'], 'Tomas Rapetti': [73, 21, 'PD'], 'Paul Mallez': [72, 24, 'PG'],
  // Bordeaux-Bègles
  'Louis Bielle-Biarrey': [91, 23], 'Damian Penaud': [88, 29], 'Romain Buros': [80, 26, 'AR'], 'Matthieu Jalibert': [88, 28],
  'Maxime Lucu': [84, 33], 'Martin Page-Relo': [80, 27], 'Yoram Moefana': [84, 26], 'Nicolas Depoortere': [84, 24],
  'Dan Du Plessis': [79, 24], 'Rohan Janse Van Rensburg': [78, 32], 'Tom Willis': [85, 27, 'N8'], 'Cameron Woki': [85, 28],
  'Jean-Luc Du Preez': [79, 31], 'Marko Gazzotti': [80, 21], 'Tiaan Jacobs': [77, 27], 'Cyril Cazeaux': [82, 29],
  'Adam Coleman': [81, 35], 'Alex Moon': [80, 25], 'Gaëtan Barlot': [83, 29], 'Jefferson Poirot': [78, 33, 'PG'],
  'Ben Tameifuna': [81, 35, 'PD'], 'Carlü Sadie': [80, 30, 'PD'], 'Sipili Falatea': [78, 29, 'PD'], 'Lasha Pkhakadze': [75, 26, 'PG'],
  'Salesi Rayasi': [78, 27], 'Arthur Retière': [76, 28], 'Hugo Reus': [74, 23],
  // Toulon
  'Charles Ollivon': [85, 33], 'Lewis Ludlam': [80, 31], 'Zach Mercer': [82, 28, 'N8'], 'Junior Kpoku': [75, 23],
  'David Ribbans': [80, 30], 'Judicaël Cancoriet': [78, 30], 'Swan Rebbadj': [77, 27], 'Baptiste Serin': [82, 32],
  'Ben White': [80, 28], 'Tomas Albornoz': [80, 29], 'Mateo Garcia': [74, 23], 'Melvyn Jaminet': [82, 27, 'AR'],
  'Gabin Villière': [82, 30], 'Mathis Ferté': [79, 21, 'AR'], 'Gaël Fickou': [83, 32], 'Huw Jones': [83, 32],
  'Juan Ignacio Brex': [80, 33], 'Antoine Frisch': [80, 29], 'Kyle Sinckler': [83, 33, 'PD'], 'Rabah Slimani': [74, 37, 'PD'],
  'Beka Gigashvili': [82, 32, 'PG'], 'Dany Priso': [76, 32, 'PG'], 'Jean-Baptiste Gros': [80, 27, 'PG'], 'Teddy Baubigny': [79, 25],
  'Gianmarco Lucchesi': [79, 25], 'Apete Narogo': [76, 27], 'Mikheili Shioshvili': [70, 20],
  // Clermont
  'Baptiste Jauneau': [82, 24], 'Baptiste Germain': [76, 24], 'Harry Plummer': [80, 28], 'Bautista Delguy': [78, 30],
  'Etene Nanaï-Seturo': [79, 28], 'AJ Lam': [77, 28, 'AR'], 'Alivereti Raka': [79, 31], 'Léon Darricarrère': [75, 22],
  'Marcos Kremer': [85, 29], 'Killian Tixeront': [77, 24], 'Pita-Gus Sowakula': [80, 31, 'N8'], 'Thibaud Lanen': [77, 29],
  'Darcy Swain': [80, 29], 'Etienne Fourcade': [76, 27], 'Giorgi Akhaladze': [76, 27, 'PD'], 'Régis Montagne': [74, 28, 'PD'],
  'Cristian Ojovan': [72, 28, 'PG'], 'Giorgi Dzmanashvili': [72, 26, 'PG'],
  // Castres
  'Geoffrey Palis': [77, 35, 'AR'], 'Santiago Arata': [81, 29], 'Louis Le Brun': [75, 28], 'Jack Goodhue': [80, 31],
  'Vilimoni Botitu': [76, 28], 'Hamish Watson': [82, 35], 'Mathieu Babillot': [78, 34, 'N8'], "Dalton Papali'i": [80, 29],
  'Tom Staniforth': [80, 30], 'Levan Chilachava': [76, 35, 'PD'], 'Quentin Walcker': [73, 33, 'PG'], 'Pierre Colonna': [77, 31],
  'Will Collier': [76, 35, 'PD'], 'Rémy Baget': [75, 25],
  // La Rochelle
  'Grégory Alldritt': [87, 29, 'N8'], 'Oscar Jegou': [84, 23], 'Paul Boudehent': [82, 26], 'Levani Botia': [80, 37],
  'Will Skelton': [84, 34], 'Thomas Lavault': [81, 28], 'Salmaan Moerat': [81, 28], 'Jonathan Danty': [82, 34],
  'David Kriel': [79, 27], 'Antoine Hastoy': [79, 29], 'Ben Healy': [79, 27], 'Nolann Le Garrec': [83, 24],
  'Thomas Berjon': [75, 24], 'Dillyn Leyds': [79, 32], 'Davit Niniashvili': [82, 24, 'AR'], 'Jack Nowell': [77, 33],
  'Pierre Bourgarit': [80, 28], 'Tolu Latu': [77, 33], 'Louis Penverne': [77, 29, 'PG'], 'Sione Ahio': [77, 28, 'PD'],
  'Alexandre Kaddouri': [72, 23, 'PD'], 'Aleksandre Kuntelia': [72, 24, 'PG'],
  // Racing 92
  'Max Spring': [78, 26, 'AR'], 'Vinaya Habosi': [79, 28], 'Josua Tuisova': [83, 32], 'Joseph Manu': [84, 30],
  'Sam James': [76, 32], 'Paul Costes': [79, 28], 'Antoine Gibert': [78, 29], 'Geronimo Prisciantelli': [76, 26],
  'Léo Carbonneau': [80, 25], 'Maxime Machenaud': [74, 37], 'Jordan Joseph': [77, 27, 'N8'], 'Ibrahim Diallo': [75, 27],
  'Romain Taofifenua': [77, 36], 'Demba Bamba': [82, 28, 'PD'], 'Taniela Tupou': [83, 30, 'PD'], 'Hassane Kolingar': [79, 29, 'PG'],
  'Guram Gogichashvili': [80, 27, 'PG'], 'Janick Tarrit': [76, 27],
  // Stade Français
  'Léo Barré': [85, 24, 'AR'], 'Rufus McLean': [79, 27], 'Peniasi Dakuwaqa': [76, 29], 'Louis Carbonel': [77, 27],
  'Ihaia West': [79, 35], 'Tawera Kerr-Barlow': [76, 36], 'Sekou Macalou': [82, 31], 'Mathieu Hirigoyen': [77, 25],
  'Tanginoa Halaifonua': [76, 30, 'N8'], 'Paul Gabrillagues': [79, 32], 'Giacomo Nicotera': [79, 26], 'Lucas Peyresblanques': [76, 27],
  'Paul Alo-Emile': [77, 34, 'PD'], 'Moses Alo-Emile': [75, 29, 'PD'], 'Giorgi Melikidze': [75, 27, 'PG'], 'Jack Iscaro': [73, 28, 'PG'],
  'Tani Vili': [77, 27], 'Jeremy Ward': [76, 30], 'Yoan Tanga': [77, 29],
  // Pau
  'Théo Attissogbe': [85, 22], 'Aaron Grandidier-Nkanang': [79, 24], 'Grégoire Arfeuil': [77, 23], 'Jack Maddocks': [75, 29, 'AR'],
  'Rodrigo Marta': [78, 31], 'Joe Simmonds': [79, 29], 'Thibault Daubagna': [77, 32], 'Gonzalo Garcia': [79, 26],
  'Facundo Isa': [81, 33, 'N8'], 'Santiago Grondona': [79, 27], 'Beka Gorgadze': [78, 29], 'Bastien Vergnes-Taillefer': [76, 29],
  'Hugo Auradou': [84, 23], 'Julian Montoya': [83, 33], 'Thomas Laclayat': [78, 26, 'PG'], 'Guram Papidze': [76, 26, 'PD'],
  'Siate Tokolahi': [76, 32, 'PD'], 'Lekso Kaulashvili': [73, 26, 'PG'], 'Emilien Gailleton': [81, 23], 'Tumua Manu': [76, 29],
  // Bayonne
  'Manu Tuilagi': [80, 35], 'Federico Mori': [78, 26], 'Mateo Carreras': [80, 27], 'Madosh Tambwe': [79, 28],
  'Cheikh Tiberghien': [74, 28, 'AR'], 'Joris Segonds': [75, 29], 'Rob Du Preez': [77, 33], 'Herschel Jantjies': [77, 30],
  'Rodrigo Bruni': [80, 33, 'N8'], 'Baptiste Héguy': [77, 27], 'Rob Leota': [77, 29], 'Arthur Iturria': [76, 32],
  'Killian Géraci': [77, 27], 'Facundo Bosch': [74, 34], 'Lucas Martin': [76, 28], 'Tevita Tatafu': [77, 30, 'PD'],
  'Ignacio Calles': [74, 29, 'PG'], 'Luke Tagi': [72, 29, 'PG'], 'Léo Coly': [76, 27],
  // Lyon
  'Baptiste Couilloud': [80, 29], 'Sanele Nohamba': [76, 26], 'Léo Berdeu': [77, 25], 'Paddy Jackson': [74, 34],
  'Jiuta Wainiqolo': [81, 27], 'Ethan Dumortier': [80, 27], 'Monty Ioane': [80, 31], 'Iosefo Masi': [76, 28],
  'Sam Simmonds': [80, 32, 'N8'], 'Dylan Cretin': [79, 29], 'Mickaël Guillard': [81, 28], 'Camille Chat': [79, 30],
  'Guillaume Marchand': [78, 27], 'Thomas Gallo': [82, 28, 'PG'], 'Hamza Kaabeche': [72, 28, 'PD'], 'Irakli Aptsiauri': [72, 27, 'PG'],
  'Opeti Helu': [72, 26, 'PD'], 'Adrien Séguret': [75, 30],
  // Montpellier
  'Stuart Hogg': [76, 34, 'AR'], 'Tom Banks': [80, 32, 'AR'], 'Lennox Anyanwu': [76, 28], 'Arthur Vincent': [80, 27],
  'Dimitri Delibes': [77, 25], 'Adam Hastings': [76, 30], 'Domingo Miotti': [78, 30], 'Ali Price': [78, 33],
  'Sébastien Bézy': [74, 34], 'Langi Gleeson': [79, 25, 'N8'], 'Alexandre Bécognée': [79, 29], 'Yacouba Camara': [78, 32],
  'Lenni Nouchi': [79, 24], 'Billy Vunipola': [75, 33, 'N8'], 'Bastien Chalureau': [79, 30], 'Adam Beard': [79, 31],
  'Florian Verhaeghe': [75, 29], 'Christopher Tolofua': [79, 32], 'Mohamed Haouas': [78, 32, 'PD'], 'Reda Wardi': [80, 30, 'PG'],
  'Wilfrid Hounkpatin': [71, 39, 'PD'], 'Luka Japaridze': [73, 24, 'PG'],
  // Perpignan
  'Paolo Garbisi': [82, 26], 'Benjamin Urdapilleta': [71, 40], 'Jake McIntyre': [74, 30], 'Tom Ecochard': [75, 28],
  'Luke McGrath': [75, 34], 'Sevu Reece': [81, 29], 'Tristan Tedder': [76, 27, 'AR'], 'Jeronimo De la Fuente': [75, 35],
  'Braydon Ennor': [76, 29], 'Peceli Yato': [79, 33, 'N8'], 'Jacobus Van Tonder': [76, 27], 'Joaquin Oviedo': [75, 27],
  'Lachlan Swinton': [76, 29], 'Jonny Gray': [79, 32], 'Mathieu Tanguy': [75, 29], 'Posolo Tuilagi': [76, 21],
  'Ignacio Ruiz': [76, 27], 'Pietro Ceccarelli': [78, 33, 'PD'], 'Marco Riccioni': [79, 31, 'PD'], 'Enzo Forletta': [74, 30, 'PG'],
  'Cedate Gomes Sa': [72, 37, 'PD'], 'Giorgi Tetrashvili': [77, 26, 'PG'], 'Bruce Devaux': [72, 27, 'PG'],
  // Vannes
  'Murray Taulagi': [79, 27], 'Anthony Bouthier': [72, 34, 'AR'], 'Joe Jonas': [74, 26], 'Clovis Le Bail': [79, 30],
  'Simi Kuruvoli': [76, 28], 'Maxime Lafage': [72, 31], 'Matias Alemanno': [79, 35], 'Francisco Gorrissen': [75, 26],
  'Sione Kalamafoni': [73, 38, 'N8'], 'Juan Bautista Pedemonte': [74, 25], 'Sione Mafileo': [73, 35, 'PD'],
  'Santiago Medrano': [76, 30, 'PD'], 'Giorgi Beria': [74, 30, 'PG'], 'Ugo Boniface': [72, 25, 'PG'], 'Dave Cherry': [75, 35],
};
