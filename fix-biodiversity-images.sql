-- ============================================================
-- Fix biodiversity image_url values
-- Run this in Supabase SQL Editor to update broken image links
-- Uses official Wikimedia Special:Redirect/file stable permalinks
-- ============================================================

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Indian_Leopard.jpg&width=480'
  WHERE name = 'Indian Leopard';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Peacock_Plumage.jpg&width=480'
  WHERE name = 'Indian Peafowl';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Indian_flying_fox_(Pteropus_medius)_Bhatti_Mines.jpg&width=480'
  WHERE name = 'Indian Flying Fox';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Ratufa_indica_(Bhadra,_2006).jpg&width=480'
  WHERE name = 'Indian Giant Squirrel';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Bonnet_macaque_(Macaca_radiata)_Photograph_By_Shantanu_Kuveskar.jpg&width=480'
  WHERE name = 'Bonnet Macaque';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Indian_Rock_Python.jpg&width=480'
  WHERE name = 'Indian Rock Python';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Painted_Stork_(Mycteria_leucocephala)_at_Bharatpur_I_IMG_5673.jpg&width=480'
  WHERE name = 'Painted Stork';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Crocodylus_palustris_1.jpg&width=480'
  WHERE name = 'Mugger Crocodile';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Varanus_bengalensis_2.jpg&width=480'
  WHERE name = 'Common Indian Monitor';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Pycnonotus_gularis_-_Goa.jpg&width=480'
  WHERE name = 'Flame-throated Bulbul';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Ficus_benghalensis_-_Indian_Botanic_Garden_-_Howrah_2012-01-29_1692.JPG&width=480'
  WHERE name = 'Banyan Tree';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Neem_(Azadirachta_indica)_in_Hyderabad_W_IMG_6976.jpg&width=480'
  WHERE name = 'Neem Tree';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Ficus_religiosa_Bo.jpg&width=480'
  WHERE name = 'Peepal Tree';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Gulmohar_(Delonix_regia)_flowers_W_IMG_6879.jpg&width=480'
  WHERE name = 'Gulmohar';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Strobilanthes_callosa_at_Munnar.jpg&width=480'
  WHERE name = 'Karvi (Strobilanthes)';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Terminalia_arjuna_at_Surajkund_Faridabad_2013.jpg&width=480'
  WHERE name = 'Arjuna Tree';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Thespesia_populnea_flowers.jpg&width=480'
  WHERE name = 'Indian Tulip';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Saraca_asoca_flowers.jpg&width=480'
  WHERE name = 'Ashoka Tree';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Dendrocalamus_strictus_-_Bangalore.jpg&width=480'
  WHERE name = 'Bamboo (Male Bamboo)';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Jacaranda_mimosifolia_in_flower.jpg&width=480'
  WHERE name = 'Jacaranda';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Saussurea_obvallata_var._obvallata.jpg&width=480'
  WHERE name = 'Brahma Kamal (Night lotus)';

UPDATE biodiversity SET image_url = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Samanea_saman_pod.jpg&width=480'
  WHERE name = 'Rain Tree (Monkey Pod)';
